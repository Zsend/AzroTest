from __future__ import annotations

import csv
from collections import Counter
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.request
import uuid
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "app" / "static"
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
DB_PATH = Path(os.getenv("DATABASE_PATH", DATA_DIR / "justice_grows.db"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

POLICY_VERSION = "2026-06-18"
COMPACT_VERSION = "2026-06-18"
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
WEBHOOK_URL = os.getenv("SUBMISSION_WEBHOOK_URL", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
PUBLIC_AGGREGATE_MIN_N = max(3, int(os.getenv("PUBLIC_AGGREGATE_MIN_N", "10")))

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia", "FED": "Federal"
}

ROLE_OPTIONS = {
    "cultivation", "manufacturing", "retail", "distribution", "compliance", "operations", "sales",
    "marketing", "technology", "finance", "construction", "facilities", "security", "logistics",
    "customer_success", "legal_support", "administration", "entrepreneurship", "other"
}
PATHWAYS = {"regulated", "ancillary", "remote", "hemp", "relocation", "training"}
EMPLOYMENT_TYPES = {"full_time", "part_time", "contract", "temporary", "apprenticeship", "internship"}
PROFILE_VISIBILITY = {"private", "coalition", "public"}
PROFILE_IDENTITY_MODES = {"first_name", "first_initial", "alias"}
PROFILE_STATUSES = {"draft", "submitted", "published", "changes_requested", "paused", "withdrawn"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def normalize_state(value: str) -> str:
    state = (value or "").strip().upper()
    if state not in STATE_NAMES or state == "FED":
        raise ValueError("Select a valid U.S. state or the District of Columbia.")
    return state


def normalize_csvish(value: list[str] | str | None, allowed: set[str] | None = None, max_items: int = 30) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        raw = re.split(r"[,;\n]", value)
    else:
        raw = value
    cleaned: list[str] = []
    for item in raw:
        item = re.sub(r"\s+", " ", str(item).strip().lower().replace("-", "_").replace(" ", "_"))
        if not item:
            continue
        if allowed and item not in allowed:
            continue
        if item not in cleaned:
            cleaned.append(item)
        if len(cleaned) >= max_items:
            break
    return cleaned


def normalize_lines(value: list[str] | str | None, max_items: int = 20) -> list[str]:
    """Preserve URLs and human text while deduplicating line/comma separated values."""
    if value is None:
        return []
    raw = re.split(r"[,\n]", value) if isinstance(value, str) else value
    cleaned: list[str] = []
    for item in raw:
        item = re.sub(r"\s+", " ", str(item).strip())
        if not item or item in cleaned:
            continue
        cleaned.append(item[:1000])
        if len(cleaned) >= max_items:
            break
    return cleaned


def make_slug(display_name: str, candidate_id: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", display_name.lower()).strip("-") or "talent"
    return f"{base[:48]}-{candidate_id[-6:]}"


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def valid_public_links(value: list[str] | str | None, max_items: int = 8) -> list[str]:
    links = normalize_lines(value, max_items=max_items)
    output: list[str] = []
    for link in links:
        if not re.match(r"^https://", link, flags=re.IGNORECASE):
            continue
        if len(link) <= 1000:
            output.append(link)
    return output


def get_fernet() -> Fernet:
    key = os.getenv("DATA_ENCRYPTION_KEY", "").strip().encode()
    key_file = DATA_DIR / ".dev_encryption_key"
    if not key:
        if ENVIRONMENT == "production":
            raise RuntimeError("DATA_ENCRYPTION_KEY is required in production.")
        if key_file.exists():
            key = key_file.read_bytes().strip()
        else:
            key = Fernet.generate_key()
            key_file.write_bytes(key)
            try:
                key_file.chmod(0o600)
            except OSError:
                pass
    return Fernet(key)


FERNET = get_fernet()


def encrypt_json(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return FERNET.encrypt(raw).decode("ascii")


def decrypt_json(token: str | None) -> dict[str, Any]:
    if not token:
        return {}
    try:
        return json.loads(FERNET.decrypt(token.encode("ascii")).decode("utf-8"))
    except (InvalidToken, ValueError, json.JSONDecodeError):
        return {"_error": "Unable to decrypt with the active key."}


@contextmanager
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    try:
        yield conn
    finally:
        conn.close()


def json_dump(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def json_load(value: str | None, default: Any) -> Any:
    try:
        return json.loads(value) if value else default
    except json.JSONDecodeError:
        return default


def init_db() -> None:
    schema = """
    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        pii_encrypted TEXT NOT NULL,
        state TEXT NOT NULL,
        release_status TEXT NOT NULL,
        remote_ok INTEGER NOT NULL DEFAULT 0,
        relocation_ok INTEGER NOT NULL DEFAULT 0,
        role_interests TEXT NOT NULL DEFAULT '[]',
        skills TEXT NOT NULL DEFAULT '[]',
        pathways TEXT NOT NULL DEFAULT '[]',
        min_hourly_wage REAL,
        availability_date TEXT,
        needs TEXT NOT NULL DEFAULT '[]',
        consent_matching INTEGER NOT NULL,
        consent_contact INTEGER NOT NULL,
        consent_policy_version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        source TEXT NOT NULL DEFAULT 'self_intake',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        access_token_hash TEXT NOT NULL UNIQUE,
        profile_encrypted TEXT NOT NULL,
        public_snapshot TEXT,
        visibility TEXT NOT NULL DEFAULT 'private',
        identity_mode TEXT NOT NULL DEFAULT 'first_name',
        status TEXT NOT NULL DEFAULT 'draft',
        pending_review INTEGER NOT NULL DEFAULT 0,
        search_discovery INTEGER NOT NULL DEFAULT 0,
        public_consent_at TEXT,
        submitted_at TEXT,
        published_at TEXT,
        moderation_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employers (
        id TEXT PRIMARY KEY,
        org_name TEXT NOT NULL,
        website TEXT,
        state TEXT NOT NULL,
        contact_encrypted TEXT NOT NULL,
        org_type TEXT NOT NULL,
        employee_count TEXT,
        roles_per_quarter INTEGER NOT NULL DEFAULT 0,
        states_hiring TEXT NOT NULL DEFAULT '[]',
        pathways TEXT NOT NULL DEFAULT '[]',
        wage_transparency INTEGER NOT NULL,
        no_blanket_ban INTEGER NOT NULL,
        fair_chance_process INTEGER NOT NULL,
        outcome_reporting INTEGER NOT NULL,
        candidate_privacy INTEGER NOT NULL,
        advancement_commitment INTEGER NOT NULL,
        public_name_consent INTEGER NOT NULL DEFAULT 0,
        compact_version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied',
        verification_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        employer_id TEXT,
        submitted_org_name TEXT NOT NULL,
        contact_encrypted TEXT NOT NULL,
        title TEXT NOT NULL,
        city TEXT,
        state TEXT NOT NULL,
        remote INTEGER NOT NULL DEFAULT 0,
        relocation_support INTEGER NOT NULL DEFAULT 0,
        pathway TEXT NOT NULL,
        employment_type TEXT NOT NULL,
        wage_min REAL NOT NULL,
        wage_max REAL,
        salary_period TEXT NOT NULL DEFAULT 'hour',
        benefits TEXT NOT NULL DEFAULT '[]',
        skills TEXT NOT NULL DEFAULT '[]',
        role_interests TEXT NOT NULL DEFAULT '[]',
        description TEXT NOT NULL,
        licensing_notes TEXT,
        background_process TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        published_at TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employer_id) REFERENCES employers(id)
    );

    CREATE TABLE IF NOT EXISTS case_referrals (
        id TEXT PRIMARY KEY,
        sensitive_encrypted TEXT NOT NULL,
        state TEXT NOT NULL,
        custody_system TEXT NOT NULL,
        cannabis_basis TEXT NOT NULL,
        source_links TEXT NOT NULL DEFAULT '[]',
        relationship TEXT NOT NULL,
        consent_to_contact INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'triage',
        public_record_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        org_name TEXT NOT NULL,
        website TEXT,
        partner_type TEXT NOT NULL,
        state TEXT,
        contact_encrypted TEXT NOT NULL,
        support_offered TEXT NOT NULL DEFAULT '[]',
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        score REAL NOT NULL,
        reasons TEXT NOT NULL DEFAULT '[]',
        blockers TEXT NOT NULL DEFAULT '[]',
        candidate_consent INTEGER NOT NULL DEFAULT 0,
        employer_consent INTEGER NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'suggested',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(candidate_id, job_id),
        FOREIGN KEY(candidate_id) REFERENCES candidates(id),
        FOREIGN KEY(job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS outcomes (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        wage REAL,
        salary_period TEXT,
        occurred_at TEXT NOT NULL,
        notes_encrypted TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(match_id) REFERENCES matches(id)
    );

    CREATE TABLE IF NOT EXISTS public_registry_records (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        jurisdiction TEXT NOT NULL,
        state TEXT,
        agency_identifier TEXT,
        custody_status TEXT NOT NULL,
        cannabis_classification TEXT NOT NULL,
        violence_screen_statement TEXT NOT NULL,
        confidence TEXT NOT NULL,
        source_count INTEGER NOT NULL DEFAULT 0,
        last_verified_at TEXT NOT NULL,
        projected_release_date TEXT,
        release_date TEXT,
        publication_status TEXT NOT NULL DEFAULT 'draft',
        profile_consent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registry_sources (
        id TEXT PRIMARY KEY,
        registry_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT,
        obtained_at TEXT NOT NULL,
        last_checked_at TEXT NOT NULL,
        supports_fields TEXT NOT NULL DEFAULT '[]',
        checksum TEXT,
        public_safe INTEGER NOT NULL DEFAULT 1,
        notes_encrypted TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(registry_id) REFERENCES public_registry_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS registry_reviews (
        id TEXT PRIMARY KEY,
        registry_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        checklist TEXT NOT NULL DEFAULT '{}',
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(registry_id) REFERENCES public_registry_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS correction_requests (
        id TEXT PRIMARY KEY,
        registry_id TEXT,
        profile_slug TEXT,
        correction_type TEXT NOT NULL,
        contact_encrypted TEXT NOT NULL,
        detail TEXT NOT NULL,
        source_links TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'new',
        resolution_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(registry_id) REFERENCES public_registry_records(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS coverage (
        jurisdiction TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        registry_status TEXT NOT NULL,
        career_status TEXT NOT NULL,
        legal_pathway TEXT NOT NULL,
        source_count INTEGER NOT NULL DEFAULT 0,
        freshness TEXT,
        notes TEXT NOT NULL,
        reviewed_at TEXT,
        source_urls TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor TEXT NOT NULL,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        detail TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
    CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(state);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON candidate_profiles(status);
    CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON candidate_profiles(visibility);
    CREATE INDEX IF NOT EXISTS idx_profiles_slug ON candidate_profiles(slug);
    CREATE INDEX IF NOT EXISTS idx_employers_status ON employers(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
    CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches(stage);
    CREATE INDEX IF NOT EXISTS idx_registry_publication ON public_registry_records(publication_status);
    CREATE INDEX IF NOT EXISTS idx_registry_sources_record ON registry_sources(registry_id);
    CREATE INDEX IF NOT EXISTS idx_registry_reviews_record ON registry_reviews(registry_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_status ON correction_requests(status);
    """
    with db() as conn:
        conn.executescript(schema)
        seed_coverage(conn)
        conn.execute(
            """INSERT INTO meta(key,value,updated_at) VALUES(?,?,?)
               ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at""",
            ("schema_version", "2", utc_now()),
        )


def seed_coverage(conn: sqlite3.Connection) -> None:
    now = utc_now()
    records = []
    for code, name in STATE_NAMES.items():
        if code == "FED":
            records.append((
                code, name, "pilot", "national_pathway", "federal_and_ancillary",
                1, None,
                "Federal custody is a priority pilot. Careers support may route to regulated, ancillary, remote, training, or relocation pathways based on the role and governing law.",
                now, json_dump(["https://www.bop.gov/inmateloc/"])
            ))
        elif code == "CA":
            records.append((
                code, name, "priority_pilot", "founding_coalition", "regulated_and_ancillary",
                4, now,
                "Priority launch state. Candidate matching is skills-first and conviction information remains candidate-controlled. Employer workflows are designed around California fair-chance requirements.",
                now, json_dump([
                    "https://www.cannabis.ca.gov/", "https://calcivilrights.ca.gov/fair-chance-act/",
                    "https://www.cdcr.ca.gov/", "https://www.cannabis.ca.gov/cannabis-laws/dcc-regulations/"
                ])
            ))
        elif code == "ID":
            records.append((
                code, name, "research_pilot", "mobility_pathway", "ancillary_remote_hemp_relocation",
                2, now,
                "Mobility pathway pilot. The platform does not assume a local regulated marijuana job is available; it emphasizes lawful ancillary, remote, hemp, training, and opt-in relocation pathways, plus individualized legal-relief review.",
                now, json_dump([
                    "https://sos.idaho.gov/elections/initiatives/", "https://agri.idaho.gov/main/plants/hemp/"
                ])
            ))
        else:
            records.append((
                code, name, "research_queue", "employer_recruiting", "not_yet_reviewed",
                0, None,
                "Jurisdiction-specific custody sources, occupational rules, fair-chance law, and cannabis licensing restrictions have not yet completed legal and operational review.",
                None, "[]"
            ))
    conn.executemany(
        """
        INSERT OR IGNORE INTO coverage(
          jurisdiction,name,registry_status,career_status,legal_pathway,source_count,freshness,notes,reviewed_at,source_urls
        ) VALUES(?,?,?,?,?,?,?,?,?,?)
        """,
        records,
    )


def audit(conn: sqlite3.Connection, actor: str, event_type: str, entity_type: str, entity_id: str, detail: dict[str, Any] | None = None) -> None:
    conn.execute(
        "INSERT INTO audit_events(actor,event_type,entity_type,entity_id,detail,created_at) VALUES(?,?,?,?,?,?)",
        (actor, event_type, entity_type, entity_id, json_dump(detail or {}), utc_now()),
    )


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class HoneypotMixin(StrictModel):
    website_confirm: str = Field(default="", max_length=0)


class CandidateIntake(HoneypotMixin):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    state: str
    city: str | None = Field(default=None, max_length=100)
    zip_code: str | None = Field(default=None, max_length=12)
    release_status: Literal["currently_incarcerated", "released", "community_supervision", "family_advocate", "other"]
    availability_date: str | None = Field(default=None, max_length=20)
    remote_ok: bool = False
    relocation_ok: bool = False
    role_interests: list[str] | str = Field(default_factory=list)
    skills: list[str] | str = Field(default_factory=list)
    pathways: list[str] | str = Field(default_factory=list)
    min_hourly_wage: float | None = Field(default=None, ge=0, le=500)
    needs: list[str] | str = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=4000)
    consent_matching: bool
    consent_contact: bool
    privacy_acknowledgment: bool

    @field_validator("state")
    @classmethod
    def valid_state(cls, value: str) -> str:
        return normalize_state(value)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str | None) -> str | None:
        if not value:
            return None
        value = re.sub(r"[^0-9+(). -]", "", value)
        if len(re.sub(r"\D", "", value)) < 7:
            raise ValueError("Enter a valid phone number or leave it blank.")
        return value


class CandidateProfileUpdate(StrictModel):
    display_name: str = Field(min_length=2, max_length=80)
    identity_mode: Literal["first_name", "first_initial", "alias"] = "first_name"
    headline: str = Field(default="", max_length=160)
    about: str = Field(default="", max_length=2500)
    work_history: str = Field(default="", max_length=6000)
    goals_12_month: str = Field(default="", max_length=1800)
    ambition_3_year: str = Field(default="", max_length=1800)
    strengths: list[str] | str = Field(default_factory=list)
    skills: list[str] | str = Field(default_factory=list)
    role_interests: list[str] | str = Field(default_factory=list)
    certifications: list[str] | str = Field(default_factory=list)
    training_interests: list[str] | str = Field(default_factory=list)
    portfolio_links: list[str] | str = Field(default_factory=list)
    preferred_locations: list[str] | str = Field(default_factory=list)
    schedule_preferences: list[str] | str = Field(default_factory=list)
    languages: list[str] | str = Field(default_factory=list)
    visibility: Literal["private", "coalition", "public"] = "private"
    search_discovery: bool = False
    story_consent: bool = False
    public_profile_consent: bool = False


class CandidateProfileSubmit(StrictModel):
    acknowledgment: bool


class CandidateMatchDecision(StrictModel):
    decision: Literal["interested", "pass"]
    note: str | None = Field(default=None, max_length=1000)


class ProfileModeration(StrictModel):
    status: Literal["published", "changes_requested", "paused"]
    note: str | None = Field(default=None, max_length=2000)


class RegistryDraftInput(StrictModel):
    display_name: str | None = Field(default=None, max_length=180)
    jurisdiction: str = Field(min_length=2, max_length=80)
    state: str | None = Field(default=None, max_length=3)
    agency_identifier: str | None = Field(default=None, max_length=120)
    custody_status: Literal["incarcerated", "release_pending", "released", "transferred", "unknown"]
    cannabis_classification: Literal["cannabis_only", "cannabis_primary", "cannabis_linked_review"]
    violence_screen_statement: str = Field(min_length=30, max_length=3000)
    confidence: Literal["confirmed", "supported", "provisional", "disputed"]
    last_verified_at: str
    projected_release_date: str | None = None
    release_date: str | None = None
    profile_consent: bool = False


class RegistrySourceInput(StrictModel):
    source_type: Literal["judgment", "commitment_record", "agency_locator", "court_docket", "records_extract", "agency_correspondence", "attorney_confirmation", "other"]
    title: str = Field(min_length=3, max_length=300)
    url: str | None = Field(default=None, max_length=1200)
    obtained_at: str
    last_checked_at: str
    supports_fields: list[str] | str = Field(default_factory=list)
    checksum: str | None = Field(default=None, max_length=160)
    public_safe: bool = True
    notes: str | None = Field(default=None, max_length=3000)


class RegistryReviewInput(StrictModel):
    reviewer_id: str = Field(min_length=2, max_length=120)
    decision: Literal["approve", "reject", "hold"]
    identity_confirmed: bool
    current_custody_confirmed: bool
    cannabis_attribution_confirmed: bool
    all_current_counts_reviewed: bool
    violence_screen_complete: bool
    release_status_checked: bool
    note: str | None = Field(default=None, max_length=3000)


class RegistryPublishInput(StrictModel):
    acknowledgment: bool


class CorrectionIntake(HoneypotMixin):
    correction_type: Literal["registry", "talent_profile", "job", "metrics", "privacy", "other"]
    registry_id: str | None = Field(default=None, max_length=80)
    profile_slug: str | None = Field(default=None, max_length=100)
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    relationship: Literal["self", "family", "attorney", "advocate", "agency", "employer", "researcher", "other"]
    detail: str = Field(min_length=30, max_length=8000)
    source_links: list[str] | str = Field(default_factory=list)
    contact_consent: bool
    accuracy_acknowledgment: bool


class EmployerIntake(HoneypotMixin):
    org_name: str = Field(min_length=2, max_length=180)
    website: str | None = Field(default=None, max_length=300)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    state: str
    org_type: Literal["licensed_cannabis", "ancillary", "hemp", "staffing", "training", "union", "other"]
    employee_count: Literal["1_9", "10_49", "50_249", "250_999", "1000_plus", "unknown"]
    roles_per_quarter: int = Field(ge=0, le=10000)
    states_hiring: list[str] | str = Field(default_factory=list)
    pathways: list[str] | str = Field(default_factory=list)
    wage_transparency: bool
    no_blanket_ban: bool
    fair_chance_process: bool
    outcome_reporting: bool
    candidate_privacy: bool
    advancement_commitment: bool
    public_name_consent: bool = False
    notes: str | None = Field(default=None, max_length=4000)

    @field_validator("state")
    @classmethod
    def valid_state(cls, value: str) -> str:
        return normalize_state(value)


class JobIntake(HoneypotMixin):
    employer_id: str | None = Field(default=None, max_length=80)
    org_name: str = Field(min_length=2, max_length=180)
    contact_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    title: str = Field(min_length=2, max_length=180)
    city: str | None = Field(default=None, max_length=100)
    state: str
    remote: bool = False
    relocation_support: bool = False
    pathway: Literal["regulated", "ancillary", "remote", "hemp", "relocation", "training"]
    employment_type: Literal["full_time", "part_time", "contract", "temporary", "apprenticeship", "internship"]
    wage_min: float = Field(ge=0, le=1000000)
    wage_max: float | None = Field(default=None, ge=0, le=1000000)
    salary_period: Literal["hour", "year", "project"] = "hour"
    benefits: list[str] | str = Field(default_factory=list)
    skills: list[str] | str = Field(default_factory=list)
    role_interests: list[str] | str = Field(default_factory=list)
    description: str = Field(min_length=60, max_length=10000)
    licensing_notes: str | None = Field(default=None, max_length=3000)
    background_process: str = Field(min_length=20, max_length=3000)
    compact_acknowledgment: bool

    @field_validator("state")
    @classmethod
    def valid_state(cls, value: str) -> str:
        return normalize_state(value)

    @field_validator("wage_max")
    @classmethod
    def valid_wage_max(cls, value: float | None, info: Any) -> float | None:
        wage_min = info.data.get("wage_min")
        if value is not None and wage_min is not None and value < wage_min:
            raise ValueError("Maximum compensation must be at least the minimum.")
        return value


class CaseReferral(HoneypotMixin):
    person_name: str = Field(min_length=2, max_length=180)
    state: str
    custody_system: Literal["federal", "state_prison", "county_jail", "community_supervision", "unknown"]
    agency_identifier: str | None = Field(default=None, max_length=100)
    relationship: Literal["self", "family", "attorney", "advocate", "researcher", "other"]
    submitter_name: str = Field(min_length=2, max_length=180)
    submitter_email: EmailStr
    submitter_phone: str | None = Field(default=None, max_length=40)
    cannabis_basis: str = Field(min_length=20, max_length=5000)
    source_links: list[str] | str = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=5000)
    consent_to_contact: bool
    accuracy_acknowledgment: bool

    @field_validator("state")
    @classmethod
    def valid_state(cls, value: str) -> str:
        return normalize_state(value)


class PartnerIntake(HoneypotMixin):
    org_name: str = Field(min_length=2, max_length=180)
    website: str | None = Field(default=None, max_length=300)
    partner_type: Literal["legal_aid", "reentry", "training", "workforce", "union", "advocacy", "funding", "research", "other"]
    state: str | None = None
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    support_offered: list[str] | str = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=5000)
    contact_consent: bool

    @field_validator("state")
    @classmethod
    def valid_optional_state(cls, value: str | None) -> str | None:
        return normalize_state(value) if value else None


class JobApproval(StrictModel):
    expires_at: str | None = None
    licensing_notes: str | None = Field(default=None, max_length=3000)


class StatusPatch(StrictModel):
    status: str = Field(min_length=1, max_length=60)
    note: str | None = Field(default=None, max_length=2000)


class RateLimiter:
    def __init__(self, limit: int = 12, window_seconds: int = 3600):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window
        with self._lock:
            hits = [t for t in self._hits.get(key, []) if t >= cutoff]
            if len(hits) >= self.limit:
                raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")
            hits.append(now)
            self._hits[key] = hits


limiter = RateLimiter()


def client_key(request: Request) -> str:
    # Use the ASGI client address only. Uvicorn may replace it from proxy headers
    # when—and only when—the connecting proxy is explicitly trusted. Reading a raw
    # X-Forwarded-For header here would let direct clients bypass rate limits.
    ip = request.client.host if request.client else "unknown"
    return hashlib.sha256(ip.encode()).hexdigest()


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin API is disabled until ADMIN_TOKEN is configured.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required.")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied, ADMIN_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid admin token.")
    return "admin"


def require_candidate(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Candidate access key required.")
    supplied = authorization.removeprefix("Bearer ").strip()
    if len(supplied) < 32:
        raise HTTPException(status_code=403, detail="Invalid candidate access key.")
    with db() as conn:
        row = conn.execute(
            "SELECT id,candidate_id FROM candidate_profiles WHERE access_token_hash=?",
            (token_hash(supplied),),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Invalid candidate access key.")
    return {"profile_id": row["id"], "candidate_id": row["candidate_id"]}


def profile_payload(row: sqlite3.Row) -> dict[str, Any]:
    data = decrypt_json(row["profile_encrypted"])
    return {
        "id": row["id"],
        "candidate_id": row["candidate_id"],
        "slug": row["slug"],
        "visibility": row["visibility"],
        "identity_mode": row["identity_mode"],
        "status": row["status"],
        "pending_review": bool(row["pending_review"]),
        "search_discovery": bool(row["search_discovery"]),
        "submitted_at": row["submitted_at"],
        "published_at": row["published_at"],
        "moderation_notes": row["moderation_notes"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        **data,
    }


def sanitize_profile_snapshot(profile: dict[str, Any], candidate: sqlite3.Row, slug: str) -> dict[str, Any]:
    # Never include email, phone, exact city/ZIP, release status, needs, or conviction information.
    return {
        "slug": slug,
        "display_name": profile.get("display_name", "Justice Grows talent"),
        "headline": profile.get("headline", ""),
        "about": profile.get("about", ""),
        "work_history": profile.get("work_history", ""),
        "goals_12_month": profile.get("goals_12_month", ""),
        "ambition_3_year": profile.get("ambition_3_year", ""),
        "strengths": profile.get("strengths", [])[:12],
        "skills": profile.get("skills", [])[:30],
        "role_interests": profile.get("role_interests", [])[:12],
        "certifications": profile.get("certifications", [])[:20],
        "training_interests": profile.get("training_interests", [])[:12],
        "portfolio_links": profile.get("portfolio_links", [])[:8],
        "preferred_locations": profile.get("preferred_locations", [])[:10],
        "schedule_preferences": profile.get("schedule_preferences", [])[:10],
        "languages": profile.get("languages", [])[:10],
        "state": candidate["state"],
        "remote_ok": bool(candidate["remote_ok"]),
        "relocation_ok": bool(candidate["relocation_ok"]),
        "availability_date": candidate["availability_date"],
        "story_consent": bool(profile.get("story_consent", False)),
    }


def public_profile_completion(profile: dict[str, Any]) -> int:
    weighted = {
        "headline": 10, "about": 15, "work_history": 15, "goals_12_month": 15,
        "ambition_3_year": 10, "skills": 15, "role_interests": 10,
        "strengths": 5, "certifications": 3, "portfolio_links": 2,
    }
    score = 0
    for key, weight in weighted.items():
        value = profile.get(key)
        if isinstance(value, list):
            if value:
                score += weight
        elif value and str(value).strip():
            score += weight
    return min(100, score)


def send_webhook(kind: str, entity_id: str, summary: dict[str, Any]) -> None:
    if not WEBHOOK_URL:
        return
    body = json.dumps({"event": f"{kind}.created", "id": entity_id, "summary": summary, "created_at": utc_now()}).encode()
    request = urllib.request.Request(
        WEBHOOK_URL,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "JusticeGrows/1.0"},
    )
    try:
        urllib.request.urlopen(request, timeout=5).read(1)
    except Exception:
        # Never fail a user submission because a notification integration is unavailable.
        pass


def score_match(candidate: sqlite3.Row, job: sqlite3.Row) -> tuple[float, list[str], list[str]]:
    candidate_roles = set(json_load(candidate["role_interests"], []))
    candidate_skills = set(json_load(candidate["skills"], []))
    candidate_pathways = set(json_load(candidate["pathways"], []))
    job_roles = set(json_load(job["role_interests"], []))
    job_skills = set(json_load(job["skills"], []))

    score = 0.0
    reasons: list[str] = []
    blockers: list[str] = []

    role_overlap = candidate_roles & job_roles
    if role_overlap:
        score += min(35, 15 + 10 * len(role_overlap))
        reasons.append("Role interests align")
    elif candidate_roles and job_roles:
        blockers.append("Role interest needs review")
    else:
        score += 8

    skill_overlap = candidate_skills & job_skills
    if skill_overlap:
        score += min(30, 10 + 5 * len(skill_overlap))
        reasons.append(f"{len(skill_overlap)} skill match" + ("es" if len(skill_overlap) != 1 else ""))
    elif job_skills:
        blockers.append("Required skills need review")
    else:
        score += 10

    if candidate["state"] == job["state"]:
        score += 18
        reasons.append("Same-state opportunity")
    elif job["remote"] and candidate["remote_ok"]:
        score += 18
        reasons.append("Remote preference aligns")
    elif candidate["relocation_ok"] and job["relocation_support"]:
        score += 15
        reasons.append("Relocation support aligns")
    else:
        blockers.append("Location needs review")

    if not candidate_pathways or job["pathway"] in candidate_pathways:
        score += 8
        reasons.append("Career pathway aligns")

    min_wage = candidate["min_hourly_wage"]
    if job["salary_period"] == "hour" and min_wage is not None:
        if job["wage_max"] is not None and job["wage_max"] < min_wage:
            blockers.append("Compensation below stated minimum")
            score -= 25
        elif job["wage_min"] >= min_wage:
            score += 9
            reasons.append("Compensation meets preference")
        else:
            score += 3
    else:
        score += 4

    # This deliberately does not use conviction detail. Eligibility review is a separate human/legal workflow.
    return max(0.0, min(100.0, round(score, 1))), reasons, blockers


def refresh_matches(conn: sqlite3.Connection, candidate_id: str | None = None, job_id: str | None = None) -> int:
    candidate_query = "SELECT * FROM candidates WHERE consent_matching=1 AND status NOT IN ('withdrawn','deleted')"
    job_query = "SELECT * FROM jobs WHERE status='published'"
    candidate_args: tuple[Any, ...] = ()
    job_args: tuple[Any, ...] = ()
    if candidate_id:
        candidate_query += " AND id=?"
        candidate_args = (candidate_id,)
    if job_id:
        job_query += " AND id=?"
        job_args = (job_id,)
    candidates = conn.execute(candidate_query, candidate_args).fetchall()
    jobs = conn.execute(job_query, job_args).fetchall()
    now = utc_now()
    count = 0
    for candidate in candidates:
        for job in jobs:
            score, reasons, blockers = score_match(candidate, job)
            if score < 25:
                continue
            match_id = make_id("mat")
            conn.execute(
                """
                INSERT INTO matches(id,candidate_id,job_id,score,reasons,blockers,stage,created_at,updated_at)
                VALUES(?,?,?,?,?,?, 'suggested', ?, ?)
                ON CONFLICT(candidate_id,job_id) DO UPDATE SET
                  score=excluded.score,reasons=excluded.reasons,blockers=excluded.blockers,updated_at=excluded.updated_at
                """,
                (match_id, candidate["id"], job["id"], score, json_dump(reasons), json_dump(blockers), now, now),
            )
            count += 1
    return count


def public_metrics(conn: sqlite3.Connection) -> dict[str, Any]:
    one = lambda sql, args=(): conn.execute(sql, args).fetchone()[0]
    candidates = one("SELECT COUNT(*) FROM candidates WHERE status NOT IN ('deleted','withdrawn')")
    profiles_submitted = one("SELECT COUNT(*) FROM candidate_profiles WHERE status IN ('submitted','published','changes_requested')")
    public_profiles = one("SELECT COUNT(*) FROM candidate_profiles WHERE status='published' AND visibility='public' AND public_snapshot IS NOT NULL")
    employers_applied = one("SELECT COUNT(*) FROM employers")
    employers_verified = one("SELECT COUNT(*) FROM employers WHERE status IN ('verified','proven')")
    jobs_open = one("SELECT COUNT(*) FROM jobs WHERE status='published'")
    verified_records = one("SELECT COUNT(*) FROM public_registry_records WHERE publication_status='published'")
    release_monitoring = one("SELECT COUNT(*) FROM public_registry_records WHERE publication_status='published' AND custody_status IN ('incarcerated','release_pending')")
    matches = one("SELECT COUNT(*) FROM matches")
    interviews = one("SELECT COUNT(*) FROM matches WHERE stage IN ('interview','offer','started','retained_90','retained_180','retained_365')")
    offers = one("SELECT COUNT(*) FROM matches WHERE stage IN ('offer','started','retained_90','retained_180','retained_365')")
    starts = one("SELECT COUNT(*) FROM matches WHERE stage IN ('started','retained_90','retained_180','retained_365')")
    retained_180 = one("SELECT COUNT(*) FROM matches WHERE stage IN ('retained_180','retained_365')")
    wages = conn.execute(
        """
        SELECT o.wage,o.salary_period FROM outcomes o
        WHERE o.event_type='started' AND o.wage IS NOT NULL
        """
    ).fetchall()
    hourly = [r["wage"] for r in wages if r["salary_period"] == "hour"]
    average_starting_wage = round(sum(hourly) / len(hourly), 2) if hourly else None
    coverage = conn.execute(
        "SELECT registry_status, COUNT(*) AS n FROM coverage GROUP BY registry_status ORDER BY n DESC"
    ).fetchall()
    freshness = conn.execute(
        """SELECT MAX(updated_at) FROM (
               SELECT updated_at FROM jobs
               UNION ALL SELECT updated_at FROM candidates
               UNION ALL SELECT updated_at FROM candidate_profiles
               UNION ALL SELECT updated_at FROM employers
               UNION ALL SELECT updated_at FROM public_registry_records
               UNION ALL SELECT updated_at FROM correction_requests
           )"""
    ).fetchone()[0]
    return {
        "mode": "live",
        "updated_at": freshness or utc_now(),
        "actual": {
            "verified_registry_records": verified_records,
            "release_monitoring": release_monitoring,
            "candidate_intakes": candidates,
            "profiles_submitted": profiles_submitted,
            "public_profiles": public_profiles,
            "employer_applications": employers_applied,
            "verified_employers": employers_verified,
            "open_jobs": jobs_open,
            "matches": matches,
            "interviews": interviews,
            "offers": offers,
            "career_starts": starts,
            "retained_180": retained_180,
            "average_starting_hourly_wage": average_starting_wage,
        },
        "targets_12_month": {
            "verified_registry_records": 250,
            "release_monitoring": 200,
            "candidate_intakes": 500,
            "profiles_submitted": 350,
            "public_profiles": 100,
            "verified_employers": 50,
            "open_jobs": 150,
            "matches": 350,
            "interviews": 200,
            "offers": 125,
            "career_starts": 100,
            "retained_180": 75,
        },
        "coverage": [{"status": r["registry_status"], "count": r["n"]} for r in coverage],
        "disclosure": "All actual metrics are computed from the production database. Targets are labeled separately and are never reported as outcomes."
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Justice Grows Platform API",
    version="1.0.0",
    description="Consent-based registry, fair-chance employer coalition, and skills-first career matching infrastructure.",
    docs_url="/api/docs" if ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
    if ENVIRONMENT == "production":
        csp += "; upgrade-insecure-requests"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = csp
    private_path = request.url.path.startswith(("/admin", "/profile", "/api/admin/", "/api/candidate/"))
    if private_path:
        response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    if request.url.path.startswith("/api/") or private_path:
        response.headers["Cache-Control"] = "no-store"
    return response



@app.get("/api/health")
def health() -> dict[str, Any]:
    with db() as conn:
        conn.execute("SELECT 1").fetchone()
    return {
        "status": "ok",
        "service": "justice-grows",
        "environment": ENVIRONMENT,
        "database": "sqlite",
        "admin_enabled": bool(ADMIN_TOKEN),
        "webhook_enabled": bool(WEBHOOK_URL),
        "time": utc_now(),
    }


@app.get("/api/public/metrics")
def get_metrics() -> dict[str, Any]:
    with db() as conn:
        return public_metrics(conn)


@app.get("/api/public/coverage")
def get_coverage() -> dict[str, Any]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM coverage ORDER BY CASE jurisdiction WHEN 'FED' THEN 0 WHEN 'CA' THEN 1 WHEN 'ID' THEN 2 ELSE 3 END, name").fetchall()
        items = []
        for row in rows:
            item = dict(row)
            item["source_urls"] = json_load(item["source_urls"], [])
            items.append(item)
        return {"items": items, "updated_at": utc_now()}


@app.get("/api/public/jobs")
def get_jobs(state: str | None = None, pathway: str | None = None, remote: bool | None = None) -> dict[str, Any]:
    clauses = ["j.status='published'", "(j.expires_at IS NULL OR j.expires_at >= ?)"]
    args: list[Any] = [utc_now()[:10]]
    if state:
        state = state.upper()
        if state not in STATE_NAMES:
            raise HTTPException(status_code=400, detail="Invalid state.")
        clauses.append("j.state=?")
        args.append(state)
    if pathway:
        if pathway not in PATHWAYS:
            raise HTTPException(status_code=400, detail="Invalid pathway.")
        clauses.append("j.pathway=?")
        args.append(pathway)
    if remote is not None:
        clauses.append("j.remote=?")
        args.append(1 if remote else 0)
    query = f"""
      SELECT j.id,j.title,j.city,j.state,j.remote,j.relocation_support,j.pathway,j.employment_type,
             j.wage_min,j.wage_max,j.salary_period,j.benefits,j.skills,j.description,j.licensing_notes,
             j.published_at,j.expires_at,e.org_name,e.status AS employer_status
      FROM jobs j LEFT JOIN employers e ON e.id=j.employer_id
      WHERE {' AND '.join(clauses)} ORDER BY j.published_at DESC, j.created_at DESC LIMIT 200
    """
    with db() as conn:
        rows = conn.execute(query, args).fetchall()
        items = []
        for row in rows:
            item = dict(row)
            item["org_name"] = item["org_name"] or "Verified employer"
            item["benefits"] = json_load(item["benefits"], [])
            item["skills"] = json_load(item["skills"], [])
            items.append(item)
        return {"items": items, "count": len(items), "updated_at": utc_now()}


@app.get("/api/public/registry")
def get_registry(state: str | None = None) -> dict[str, Any]:
    clauses = ["publication_status='published'"]
    args: list[Any] = []
    if state:
        state = state.upper()
        clauses.append("state=?")
        args.append(state)
    with db() as conn:
        rows = conn.execute(
            f"""
            SELECT id,display_name,jurisdiction,state,custody_status,cannabis_classification,
                   violence_screen_statement,confidence,source_count,last_verified_at,
                   projected_release_date,release_date
            FROM public_registry_records WHERE {' AND '.join(clauses)}
            ORDER BY last_verified_at DESC LIMIT 500
            """,
            args,
        ).fetchall()
        return {"items": [dict(r) for r in rows], "count": len(rows), "updated_at": utc_now()}


@app.get("/api/public/talent")
def get_public_talent(state: str | None = None, role: str | None = None, remote: bool | None = None) -> dict[str, Any]:
    clauses = ["status='published'", "visibility='public'", "public_snapshot IS NOT NULL"]
    args: list[Any] = []
    with db() as conn:
        rows = conn.execute(
            f"SELECT slug,public_snapshot,published_at,updated_at FROM candidate_profiles WHERE {' AND '.join(clauses)} ORDER BY published_at DESC LIMIT 200",
            args,
        ).fetchall()
    items: list[dict[str, Any]] = []
    for row in rows:
        snapshot = json_load(row["public_snapshot"], {})
        if state and snapshot.get("state") != state.upper():
            continue
        if role and role not in snapshot.get("role_interests", []):
            continue
        if remote is not None and bool(snapshot.get("remote_ok")) != remote:
            continue
        snapshot["published_at"] = row["published_at"]
        snapshot["updated_at"] = row["updated_at"]
        items.append(snapshot)
    return {
        "items": items,
        "count": len(items),
        "updated_at": max((i.get("updated_at") or "" for i in items), default=utc_now()),
        "privacy_note": "These candidates affirmatively chose public visibility. Contact details and conviction records are never published in talent profiles.",
    }


@app.get("/api/public/talent/{slug}")
def get_public_talent_profile(slug: str) -> dict[str, Any]:
    with db() as conn:
        row = conn.execute(
            "SELECT public_snapshot,published_at,updated_at FROM candidate_profiles WHERE slug=? AND status='published' AND visibility='public' AND public_snapshot IS NOT NULL",
            (slug,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Public talent profile not found.")
    item = json_load(row["public_snapshot"], {})
    item["published_at"] = row["published_at"]
    item["updated_at"] = row["updated_at"]
    return {"item": item, "privacy_note": "This is a voluntary skills-first profile. Justice Grows does not publish conviction details or direct contact information here."}


@app.get("/api/public/employers")
def get_public_employers() -> dict[str, Any]:
    with db() as conn:
        rows = conn.execute(
            """
            SELECT org_name,website,state,org_type,states_hiring,pathways,status,updated_at
            FROM employers
            WHERE status IN ('verified','proven') AND public_name_consent=1
            ORDER BY CASE status WHEN 'proven' THEN 0 ELSE 1 END, org_name
            """
        ).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        item["states_hiring"] = json_load(item["states_hiring"], [])
        item["pathways"] = json_load(item["pathways"], [])
        items.append(item)
    return {"items": items, "count": len(items), "updated_at": max((x["updated_at"] for x in items), default=utc_now())}


@app.get("/api/public/talent-insights")
def get_talent_insights() -> dict[str, Any]:
    with db() as conn:
        candidates = conn.execute(
            "SELECT state,remote_ok,relocation_ok,role_interests,skills,min_hourly_wage FROM candidates WHERE status NOT IN ('deleted','withdrawn')"
        ).fetchall()
        jobs = conn.execute(
            "SELECT state,remote,relocation_support,role_interests,skills,wage_min,salary_period FROM jobs WHERE status='published' AND (expires_at IS NULL OR expires_at>=?)",
            (utc_now()[:10],),
        ).fetchall()
    total = len(candidates)
    if total < PUBLIC_AGGREGATE_MIN_N:
        return {
            "suppressed": True,
            "minimum_group_size": PUBLIC_AGGREGATE_MIN_N,
            "candidate_count": total,
            "job_count": len(jobs),
            "message": f"Talent breakdowns appear after at least {PUBLIC_AGGREGATE_MIN_N} active candidates, protecting early participants from re-identification.",
            "updated_at": utc_now(),
        }
    candidate_roles: Counter[str] = Counter()
    candidate_skills: Counter[str] = Counter()
    job_roles: Counter[str] = Counter()
    for row in candidates:
        candidate_roles.update(json_load(row["role_interests"], []))
        candidate_skills.update(json_load(row["skills"], []))
    for row in jobs:
        job_roles.update(json_load(row["role_interests"], []))
    role_keys = sorted(set(candidate_roles) | set(job_roles), key=lambda k: (-candidate_roles[k], k))[:12]
    role_gap = [
        {"role": key, "candidates": candidate_roles[key], "open_jobs": job_roles[key]}
        for key in role_keys if candidate_roles[key] >= 3 or job_roles[key] >= 3
    ]
    top_skills = [{"skill": key, "count": count} for key, count in candidate_skills.most_common(12) if count >= 3]
    pay_values = [float(r["min_hourly_wage"]) for r in candidates if r["min_hourly_wage"] is not None]
    return {
        "suppressed": False,
        "minimum_group_size": PUBLIC_AGGREGATE_MIN_N,
        "candidate_count": total,
        "job_count": len(jobs),
        "role_gap": role_gap,
        "top_skills": top_skills,
        "mobility": {
            "remote_ready": sum(bool(r["remote_ok"]) for r in candidates),
            "relocation_open": sum(bool(r["relocation_ok"]) for r in candidates),
            "total": total,
        },
        "average_stated_hourly_floor": round(sum(pay_values) / len(pay_values), 2) if len(pay_values) >= PUBLIC_AGGREGATE_MIN_N else None,
        "updated_at": utc_now(),
        "disclosure": "Small groups are suppressed. Counts describe stated preferences, not guaranteed eligibility or hiring outcomes.",
    }


@app.get("/api/public/analytics")
def get_public_analytics() -> dict[str, Any]:
    """Return chart-ready, database-derived aggregates with explicit privacy safeguards."""
    with db() as conn:
        metrics = public_metrics(conn)
        jobs_by_pathway = conn.execute(
            """SELECT pathway,COUNT(*) AS count FROM jobs
               WHERE status='published' AND (expires_at IS NULL OR expires_at>=?)
               GROUP BY pathway ORDER BY count DESC,pathway""",
            (utc_now()[:10],),
        ).fetchall()
        registry_by_status = conn.execute(
            """SELECT custody_status,COUNT(*) AS count FROM public_registry_records
               WHERE publication_status='published' GROUP BY custody_status ORDER BY count DESC"""
        ).fetchall()
        coverage_by_status = conn.execute(
            "SELECT registry_status,COUNT(*) AS count FROM coverage GROUP BY registry_status ORDER BY count DESC"
        ).fetchall()
        employer_types = conn.execute(
            """SELECT org_type,COUNT(*) AS count FROM employers
               WHERE status IN ('verified','proven') GROUP BY org_type ORDER BY count DESC"""
        ).fetchall()
        outcome_rows = conn.execute(
            """SELECT stage,COUNT(*) AS count FROM matches
               GROUP BY stage ORDER BY count DESC"""
        ).fetchall()

    actual = metrics["actual"]
    funnel = [
        {"stage": "Candidates", "count": actual["candidate_intakes"]},
        {"stage": "Profiles submitted", "count": actual["profiles_submitted"]},
        {"stage": "Matches", "count": actual["matches"]},
        {"stage": "Interviews", "count": actual["interviews"]},
        {"stage": "Offers", "count": actual["offers"]},
        {"stage": "Career starts", "count": actual["career_starts"]},
        {"stage": "Retained 180 days", "count": actual["retained_180"]},
    ]
    return {
        "funnel": funnel,
        "jobs_by_pathway": [dict(row) for row in jobs_by_pathway],
        "registry_by_custody_status": [dict(row) for row in registry_by_status],
        "coverage_by_status": [dict(row) for row in coverage_by_status],
        "verified_employers_by_type": [dict(row) for row in employer_types],
        "match_outcomes": [dict(row) for row in outcome_rows],
        "updated_at": utc_now(),
        "disclosure": "Every value is computed from reviewed database records. Empty charts mean no verified activity—not missing decorative data.",
    }


@app.get("/api/public/registry/{record_id}")
def get_registry_record(record_id: str) -> dict[str, Any]:
    with db() as conn:
        record = conn.execute(
            """SELECT id,display_name,jurisdiction,state,custody_status,cannabis_classification,
                      violence_screen_statement,confidence,source_count,last_verified_at,
                      projected_release_date,release_date
               FROM public_registry_records WHERE id=? AND publication_status='published'""",
            (record_id,),
        ).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Registry record not found.")
        sources = conn.execute(
            "SELECT source_type,title,url,obtained_at,last_checked_at,supports_fields FROM registry_sources WHERE registry_id=? AND public_safe=1 ORDER BY obtained_at DESC",
            (record_id,),
        ).fetchall()
    source_items = []
    for source in sources:
        item = dict(source)
        item["supports_fields"] = json_load(item["supports_fields"], [])
        source_items.append(item)
    return {"item": dict(record), "sources": source_items, "updated_at": record["last_verified_at"]}


@app.post("/api/intake/candidate", status_code=201)
def candidate_intake(payload: CandidateIntake, request: Request) -> dict[str, Any]:
    limiter.check("candidate:" + client_key(request))
    if not payload.privacy_acknowledgment or not payload.consent_contact:
        raise HTTPException(status_code=422, detail="Privacy acknowledgment and contact consent are required.")
    candidate_id = make_id("can")
    profile_id = make_id("pro")
    access_token = secrets.token_urlsafe(48)
    default_display_name = f"{payload.first_name} {payload.last_name[:1]}.".strip()
    profile_slug = make_slug(default_display_name, candidate_id)
    now = utc_now()
    roles = normalize_csvish(payload.role_interests, ROLE_OPTIONS)
    skills = normalize_csvish(payload.skills, max_items=40)
    pathways = normalize_csvish(payload.pathways, PATHWAYS)
    needs = normalize_csvish(payload.needs, max_items=30)
    pii = {
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": str(payload.email).lower(),
        "phone": payload.phone,
        "city": payload.city,
        "zip_code": payload.zip_code,
        "notes": payload.notes,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """
            INSERT INTO candidates(
              id,pii_encrypted,state,release_status,remote_ok,relocation_ok,role_interests,skills,pathways,
              min_hourly_wage,availability_date,needs,consent_matching,consent_contact,consent_policy_version,
              status,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                candidate_id, encrypt_json(pii), payload.state, payload.release_status, int(payload.remote_ok),
                int(payload.relocation_ok), json_dump(roles), json_dump(skills), json_dump(pathways),
                payload.min_hourly_wage, payload.availability_date, json_dump(needs), int(payload.consent_matching),
                int(payload.consent_contact), POLICY_VERSION, "new", now, now,
            ),
        )
        initial_profile = {
            "display_name": default_display_name,
            "headline": "",
            "about": "",
            "work_history": "",
            "goals_12_month": "",
            "ambition_3_year": "",
            "strengths": [],
            "skills": skills,
            "role_interests": roles,
            "certifications": [],
            "training_interests": [],
            "portfolio_links": [],
            "preferred_locations": [],
            "schedule_preferences": [],
            "languages": [],
            "story_consent": False,
        }
        conn.execute(
            """
            INSERT INTO candidate_profiles(
              id,candidate_id,slug,access_token_hash,profile_encrypted,visibility,identity_mode,status,
              pending_review,search_discovery,created_at,updated_at
            ) VALUES(?,?,?,?,?,'private','first_initial','draft',0,0,?,?)
            """,
            (profile_id, candidate_id, profile_slug, token_hash(access_token), encrypt_json(initial_profile), now, now),
        )
        match_count = refresh_matches(conn, candidate_id=candidate_id) if payload.consent_matching else 0
        audit(conn, "public", "candidate.created", "candidate", candidate_id, {"state": payload.state, "match_count": match_count})
        conn.execute("COMMIT")
    send_webhook("candidate", candidate_id, {"state": payload.state, "roles": roles, "match_count": match_count})
    return {
        "id": candidate_id,
        "status": "received",
        "match_suggestions": match_count,
        "profile_id": profile_id,
        "profile_portal_url": f"{PUBLIC_BASE_URL}/profile#access={access_token}",
        "message": "Your private career intake and Mobility Passport are ready. Save the secure profile link now; nothing becomes public without your separate choice and staff review.",
    }


@app.get("/api/candidate/profile")
def candidate_profile(identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    with db() as conn:
        row = conn.execute(
            "SELECT p.*,c.state,c.remote_ok,c.relocation_ok,c.availability_date,c.min_hourly_wage FROM candidate_profiles p JOIN candidates c ON c.id=p.candidate_id WHERE p.id=?",
            (identity["profile_id"],),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")
    profile = profile_payload(row)
    profile.update({
        "state": row["state"],
        "remote_ok": bool(row["remote_ok"]),
        "relocation_ok": bool(row["relocation_ok"]),
        "availability_date": row["availability_date"],
        "min_hourly_wage": row["min_hourly_wage"],
        "completion": public_profile_completion(profile),
        "public_url": f"{PUBLIC_BASE_URL}/talent/{row['slug']}" if row["public_snapshot"] else None,
    })
    return {"profile": profile, "updated_at": row["updated_at"]}


@app.put("/api/candidate/profile")
def update_candidate_profile(payload: CandidateProfileUpdate, identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    if payload.visibility == "public" and not payload.public_profile_consent:
        raise HTTPException(status_code=422, detail="Separate public-profile consent is required for public visibility.")
    if payload.search_discovery and payload.visibility != "public":
        raise HTTPException(status_code=422, detail="Search discovery is available only for public profiles.")
    roles = normalize_csvish(payload.role_interests, ROLE_OPTIONS, max_items=16)
    skills = normalize_csvish(payload.skills, max_items=40)
    profile = {
        "display_name": payload.display_name,
        "headline": re.sub(r"\s+", " ", payload.headline).strip(),
        "about": payload.about.strip(),
        "work_history": payload.work_history.strip(),
        "goals_12_month": payload.goals_12_month.strip(),
        "ambition_3_year": payload.ambition_3_year.strip(),
        "strengths": normalize_lines(payload.strengths, 12),
        "skills": skills,
        "role_interests": roles,
        "certifications": normalize_lines(payload.certifications, 20),
        "training_interests": normalize_lines(payload.training_interests, 15),
        "portfolio_links": valid_public_links(payload.portfolio_links, 8),
        "preferred_locations": normalize_lines(payload.preferred_locations, 12),
        "schedule_preferences": normalize_lines(payload.schedule_preferences, 10),
        "languages": normalize_lines(payload.languages, 10),
        "story_consent": bool(payload.story_consent),
    }
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        current = conn.execute("SELECT * FROM candidate_profiles WHERE id=?", (identity["profile_id"],)).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Candidate profile not found.")
        public_snapshot = current["public_snapshot"]
        published_at = current["published_at"]
        current_status = current["status"]
        pending_review = 1 if current_status == "published" and payload.visibility in {"public", "coalition"} else 0
        next_status = current_status if current_status == "published" and payload.visibility in {"public", "coalition"} else "draft"
        if payload.visibility != "public":
            public_snapshot = None
            published_at = None
            if payload.visibility == "private":
                pending_review = 0
        consent_at = now if payload.visibility == "public" and payload.public_profile_consent else current["public_consent_at"]
        conn.execute(
            """
            UPDATE candidate_profiles SET profile_encrypted=?,visibility=?,identity_mode=?,status=?,pending_review=?,
              search_discovery=?,public_consent_at=?,public_snapshot=?,published_at=?,updated_at=? WHERE id=?
            """,
            (
                encrypt_json(profile), payload.visibility, payload.identity_mode, next_status, pending_review,
                int(payload.search_discovery), consent_at, public_snapshot, published_at, now, identity["profile_id"],
            ),
        )
        conn.execute(
            "UPDATE candidates SET role_interests=?,skills=?,updated_at=? WHERE id=?",
            (json_dump(roles), json_dump(skills), now, identity["candidate_id"]),
        )
        match_count = refresh_matches(conn, candidate_id=identity["candidate_id"])
        audit(conn, "candidate", "profile.updated", "candidate_profile", identity["profile_id"], {"visibility": payload.visibility, "completion": public_profile_completion(profile), "matches_refreshed": match_count})
        conn.execute("COMMIT")
    return {
        "status": "saved",
        "completion": public_profile_completion(profile),
        "pending_review": bool(pending_review),
        "matches_refreshed": match_count,
        "message": "Mobility Passport saved. Public or coalition visibility still requires moderation before a new snapshot is shared.",
    }


@app.post("/api/candidate/profile/submit")
def submit_candidate_profile(payload: CandidateProfileSubmit, identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    if not payload.acknowledgment:
        raise HTTPException(status_code=422, detail="Accuracy and consent acknowledgment is required.")
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT * FROM candidate_profiles WHERE id=?", (identity["profile_id"],)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Candidate profile not found.")
        profile = decrypt_json(row["profile_encrypted"])
        completion = public_profile_completion(profile)
        if completion < 50 or not profile.get("skills") or not profile.get("role_interests"):
            raise HTTPException(status_code=409, detail="Complete at least 50% of the profile, including skills and target roles, before review.")
        if row["visibility"] == "public" and not row["public_consent_at"]:
            raise HTTPException(status_code=409, detail="Public-profile consent is missing.")
        next_status = "published" if row["status"] == "published" else "submitted"
        conn.execute(
            "UPDATE candidate_profiles SET status=?,pending_review=1,submitted_at=?,moderation_notes=NULL,updated_at=? WHERE id=?",
            (next_status, now, now, identity["profile_id"]),
        )
        audit(conn, "candidate", "profile.submitted", "candidate_profile", identity["profile_id"], {"visibility": row["visibility"], "completion": completion})
        conn.execute("COMMIT")
    send_webhook("profile", identity["profile_id"], {"visibility": row["visibility"], "completion": completion})
    return {"status": "submitted", "completion": completion, "message": "Your profile is in the moderation queue. Existing public content, if any, remains unchanged until approval."}


@app.post("/api/candidate/profile/hide")
def hide_candidate_profile(identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            "UPDATE candidate_profiles SET visibility='private',status='draft',pending_review=0,public_snapshot=NULL,published_at=NULL,search_discovery=0,updated_at=? WHERE id=?",
            (now, identity["profile_id"]),
        )
        audit(conn, "candidate", "profile.hidden", "candidate_profile", identity["profile_id"])
        conn.execute("COMMIT")
    return {"status": "private", "message": "The public profile was hidden immediately. Your private Mobility Passport remains available to you."}


@app.post("/api/candidate/profile/rotate-key")
def rotate_candidate_key(identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    raw = secrets.token_urlsafe(48)
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("UPDATE candidate_profiles SET access_token_hash=?,updated_at=? WHERE id=?", (token_hash(raw), utc_now(), identity["profile_id"]))
        audit(conn, "candidate", "profile.key_rotated", "candidate_profile", identity["profile_id"])
        conn.execute("COMMIT")
    return {"profile_portal_url": f"{PUBLIC_BASE_URL}/profile#access={raw}", "message": "Access key rotated. The previous link no longer works."}


@app.get("/api/candidate/matches")
def candidate_matches(identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    with db() as conn:
        rows = conn.execute(
            """
            SELECT m.id,m.score,m.reasons,m.blockers,m.stage,m.candidate_consent,m.updated_at,
                   j.id AS job_id,j.title,j.city,j.state,j.remote,j.relocation_support,j.pathway,j.employment_type,
                   j.wage_min,j.wage_max,j.salary_period,j.benefits,j.skills,j.description,j.licensing_notes,
                   COALESCE(e.org_name,'Verified employer') AS org_name
            FROM matches m JOIN jobs j ON j.id=m.job_id LEFT JOIN employers e ON e.id=j.employer_id
            WHERE m.candidate_id=? AND j.status='published'
            ORDER BY m.score DESC,m.updated_at DESC
            LIMIT 100
            """,
            (identity["candidate_id"],),
        ).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        for key in ("reasons", "blockers", "benefits", "skills"):
            item[key] = json_load(item[key], [])
        item["candidate_consent"] = bool(item["candidate_consent"])
        items.append(item)
    return {"items": items, "count": len(items), "updated_at": utc_now()}


@app.post("/api/candidate/matches/{match_id}/decision")
def candidate_match_decision(match_id: str, payload: CandidateMatchDecision, identity: dict[str, str] = Depends(require_candidate)) -> dict[str, Any]:
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT id FROM matches WHERE id=? AND candidate_id=?", (match_id, identity["candidate_id"])).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Match not found.")
        if payload.decision == "interested":
            stage, consent = "candidate_consented", 1
        else:
            stage, consent = "declined", 0
        conn.execute("UPDATE matches SET stage=?,candidate_consent=?,updated_at=? WHERE id=?", (stage, consent, now, match_id))
        audit(conn, "candidate", "match.decision", "match", match_id, {"decision": payload.decision, "note": payload.note})
        conn.execute("COMMIT")
    return {"id": match_id, "stage": stage, "message": "Interest recorded. Staff will verify the pathway and seek employer consent before any introduction." if consent else "The opportunity was removed from your active path."}


@app.post("/api/intake/employer", status_code=201)
def employer_intake(payload: EmployerIntake, request: Request) -> dict[str, Any]:
    limiter.check("employer:" + client_key(request))
    required = [
        payload.wage_transparency, payload.no_blanket_ban, payload.fair_chance_process,
        payload.outcome_reporting, payload.candidate_privacy, payload.advancement_commitment,
    ]
    if not all(required):
        raise HTTPException(status_code=422, detail="All core Fair Chance Employer Compact commitments are required.")
    states_hiring = []
    for state in normalize_csvish(payload.states_hiring, max_items=51):
        code = state.upper()
        if code in STATE_NAMES and code != "FED":
            states_hiring.append(code)
    if not states_hiring:
        states_hiring = [payload.state]
    pathways = normalize_csvish(payload.pathways, PATHWAYS)
    employer_id = make_id("emp")
    now = utc_now()
    contact = {
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "title": payload.title,
        "email": str(payload.email).lower(),
        "phone": payload.phone,
        "notes": payload.notes,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """
            INSERT INTO employers(
              id,org_name,website,state,contact_encrypted,org_type,employee_count,roles_per_quarter,
              states_hiring,pathways,wage_transparency,no_blanket_ban,fair_chance_process,outcome_reporting,
              candidate_privacy,advancement_commitment,public_name_consent,compact_version,status,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                employer_id, payload.org_name, payload.website, payload.state, encrypt_json(contact), payload.org_type,
                payload.employee_count, payload.roles_per_quarter, json_dump(states_hiring), json_dump(pathways), 1, 1, 1, 1, 1, 1,
                int(payload.public_name_consent), COMPACT_VERSION, "applied", now, now,
            ),
        )
        audit(conn, "public", "employer.applied", "employer", employer_id, {"state": payload.state, "roles_per_quarter": payload.roles_per_quarter})
        conn.execute("COMMIT")
    send_webhook("employer", employer_id, {"org_name": payload.org_name, "state": payload.state, "roles_per_quarter": payload.roles_per_quarter})
    return {
        "id": employer_id,
        "status": "applied",
        "message": "Your founding employer application is saved. Verification includes policy review, a leadership call, and a first-role commitment.",
    }


@app.post("/api/intake/job", status_code=201)
def job_intake(payload: JobIntake, request: Request) -> dict[str, Any]:
    limiter.check("job:" + client_key(request))
    if not payload.compact_acknowledgment:
        raise HTTPException(status_code=422, detail="Employer Compact acknowledgment is required.")
    if payload.salary_period == "hour" and payload.wage_min < 7.25:
        raise HTTPException(status_code=422, detail="Hourly compensation must meet applicable wage law; entries below the federal floor are not accepted.")
    job_id = make_id("job")
    now = utc_now()
    benefits = normalize_csvish(payload.benefits, max_items=30)
    skills = normalize_csvish(payload.skills, max_items=40)
    roles = normalize_csvish(payload.role_interests, ROLE_OPTIONS)
    contact = {"contact_name": payload.contact_name, "email": str(payload.email).lower(), "phone": payload.phone}
    employer_id = payload.employer_id
    with db() as conn:
        if employer_id:
            exists = conn.execute("SELECT 1 FROM employers WHERE id=?", (employer_id,)).fetchone()
            if not exists:
                raise HTTPException(status_code=422, detail="Employer ID was not found. Submit an employer application first or leave it blank.")
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """
            INSERT INTO jobs(
              id,employer_id,submitted_org_name,contact_encrypted,title,city,state,remote,relocation_support,
              pathway,employment_type,wage_min,wage_max,salary_period,benefits,skills,role_interests,description,
              licensing_notes,background_process,status,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                job_id, employer_id, payload.org_name, encrypt_json(contact), payload.title, payload.city, payload.state,
                int(payload.remote), int(payload.relocation_support), payload.pathway, payload.employment_type,
                payload.wage_min, payload.wage_max, payload.salary_period, json_dump(benefits), json_dump(skills),
                json_dump(roles), payload.description, payload.licensing_notes, payload.background_process,
                "submitted", now, now,
            ),
        )
        audit(conn, "public", "job.submitted", "job", job_id, {"state": payload.state, "pathway": payload.pathway})
        conn.execute("COMMIT")
    send_webhook("job", job_id, {"org_name": payload.org_name, "title": payload.title, "state": payload.state})
    return {
        "id": job_id,
        "status": "submitted",
        "message": "The role is saved for verification. Jobs are published only after employer, compensation, licensing, and fair-chance review.",
    }


@app.post("/api/intake/case", status_code=201)
def case_intake(payload: CaseReferral, request: Request) -> dict[str, Any]:
    limiter.check("case:" + client_key(request))
    if not payload.accuracy_acknowledgment:
        raise HTTPException(status_code=422, detail="Accuracy acknowledgment is required.")
    referral_id = make_id("ref")
    now = utc_now()
    links = normalize_lines(payload.source_links, max_items=20)
    sensitive = {
        "person_name": payload.person_name,
        "agency_identifier": payload.agency_identifier,
        "submitter_name": payload.submitter_name,
        "submitter_email": str(payload.submitter_email).lower(),
        "submitter_phone": payload.submitter_phone,
        "notes": payload.notes,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """
            INSERT INTO case_referrals(
              id,sensitive_encrypted,state,custody_system,cannabis_basis,source_links,relationship,
              consent_to_contact,status,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                referral_id, encrypt_json(sensitive), payload.state, payload.custody_system, payload.cannabis_basis,
                json_dump(links), payload.relationship, int(payload.consent_to_contact), "triage", now, now,
            ),
        )
        audit(conn, "public", "case.referred", "case_referral", referral_id, {"state": payload.state, "custody_system": payload.custody_system})
        conn.execute("COMMIT")
    send_webhook("case", referral_id, {"state": payload.state, "custody_system": payload.custody_system})
    return {
        "id": referral_id,
        "status": "triage",
        "message": "The referral is saved in a private review queue. No person is published from a referral alone.",
    }


@app.post("/api/intake/correction", status_code=201)
def correction_intake(payload: CorrectionIntake, request: Request) -> dict[str, Any]:
    limiter.check("correction:" + client_key(request))
    if not payload.contact_consent or not payload.accuracy_acknowledgment:
        raise HTTPException(status_code=422, detail="Contact consent and accuracy acknowledgment are required.")
    links = valid_public_links(payload.source_links, 12)
    correction_id = make_id("cor")
    now = utc_now()
    contact = {
        "name": payload.name,
        "email": str(payload.email).lower(),
        "relationship": payload.relationship,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if payload.registry_id and not conn.execute("SELECT 1 FROM public_registry_records WHERE id=?", (payload.registry_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Registry record not found.")
        conn.execute(
            """
            INSERT INTO correction_requests(
              id,registry_id,profile_slug,correction_type,contact_encrypted,detail,source_links,status,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?)
            """,
            (
                correction_id, payload.registry_id, payload.profile_slug, payload.correction_type,
                encrypt_json(contact), payload.detail, json_dump(links), "new", now, now,
            ),
        )
        audit(conn, "public", "correction.created", "correction_request", correction_id, {"type": payload.correction_type, "registry_id": payload.registry_id})
        conn.execute("COMMIT")
    send_webhook("correction", correction_id, {"type": payload.correction_type, "registry_id": payload.registry_id})
    return {
        "id": correction_id,
        "status": "received",
        "message": "The correction request is in the evidence review queue. Public records are not changed automatically.",
    }


@app.post("/api/intake/partner", status_code=201)
def partner_intake(payload: PartnerIntake, request: Request) -> dict[str, Any]:
    limiter.check("partner:" + client_key(request))
    if not payload.contact_consent:
        raise HTTPException(status_code=422, detail="Contact consent is required.")
    partner_id = make_id("par")
    now = utc_now()
    support = normalize_csvish(payload.support_offered, max_items=30)
    contact = {
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": str(payload.email).lower(),
        "phone": payload.phone,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """
            INSERT INTO partners(id,org_name,website,partner_type,state,contact_encrypted,support_offered,notes,status,created_at,updated_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                partner_id, payload.org_name, payload.website, payload.partner_type, payload.state,
                encrypt_json(contact), json_dump(support), payload.notes, "new", now, now,
            ),
        )
        audit(conn, "public", "partner.created", "partner", partner_id, {"partner_type": payload.partner_type})
        conn.execute("COMMIT")
    send_webhook("partner", partner_id, {"org_name": payload.org_name, "partner_type": payload.partner_type})
    return {"id": partner_id, "status": "received", "message": "Partnership inquiry saved."}


ADMIN_TABLES = {
    "candidates": ("candidates", "created_at"),
    "profiles": ("candidate_profiles", "updated_at"),
    "employers": ("employers", "created_at"),
    "jobs": ("jobs", "created_at"),
    "cases": ("case_referrals", "created_at"),
    "corrections": ("correction_requests", "created_at"),
    "partners": ("partners", "created_at"),
    "matches": ("matches", "created_at"),
    "registry": ("public_registry_records", "updated_at"),
}


def admin_rows(conn: sqlite3.Connection, kind: str, limit: int = 200) -> list[dict[str, Any]]:
    if kind not in ADMIN_TABLES:
        raise HTTPException(status_code=404, detail="Unknown queue.")
    table, order = ADMIN_TABLES[kind]
    if kind == "profiles":
        rows = conn.execute(
            """SELECT p.*,c.state,c.remote_ok,c.relocation_ok,c.availability_date,c.min_hourly_wage
               FROM candidate_profiles p JOIN candidates c ON c.id=p.candidate_id
               ORDER BY p.updated_at DESC LIMIT ?""",
            (min(limit, 1000),),
        ).fetchall()
    else:
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY {order} DESC LIMIT ?", (min(limit, 1000),)).fetchall()
    output: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        for key in list(item):
            if key.endswith("_encrypted"):
                item[key.removesuffix("_encrypted")] = decrypt_json(item.pop(key))
            elif key in {"role_interests", "skills", "pathways", "needs", "states_hiring", "benefits", "source_links", "support_offered", "reasons", "blockers", "supports_fields", "checklist"}:
                item[key] = json_load(item[key], [])
            elif key == "public_snapshot":
                item[key] = json_load(item[key], None)
        if kind == "registry":
            sources = conn.execute(
                "SELECT id,source_type,title,url,obtained_at,last_checked_at,supports_fields,public_safe FROM registry_sources WHERE registry_id=? ORDER BY obtained_at DESC",
                (item["id"],),
            ).fetchall()
            reviews = conn.execute(
                "SELECT id,reviewer_id,decision,checklist,note,created_at FROM registry_reviews WHERE registry_id=? ORDER BY created_at DESC",
                (item["id"],),
            ).fetchall()
            item["sources"] = [{**dict(s), "supports_fields": json_load(s["supports_fields"], [])} for s in sources]
            item["reviews"] = [{**dict(r), "checklist": json_load(r["checklist"], {})} for r in reviews]
        output.append(item)
    return output


@app.get("/api/admin/overview")
def admin_overview(_: str = Depends(require_admin)) -> dict[str, Any]:
    with db() as conn:
        metrics = public_metrics(conn)
        queues = {
            "candidates_new": conn.execute("SELECT COUNT(*) FROM candidates WHERE status='new'").fetchone()[0],
            "profiles_review": conn.execute("SELECT COUNT(*) FROM candidate_profiles WHERE pending_review=1").fetchone()[0],
            "employers_applied": conn.execute("SELECT COUNT(*) FROM employers WHERE status='applied'").fetchone()[0],
            "jobs_submitted": conn.execute("SELECT COUNT(*) FROM jobs WHERE status='submitted'").fetchone()[0],
            "cases_triage": conn.execute("SELECT COUNT(*) FROM case_referrals WHERE status='triage'").fetchone()[0],
            "corrections_new": conn.execute("SELECT COUNT(*) FROM correction_requests WHERE status='new'").fetchone()[0],
            "partners_new": conn.execute("SELECT COUNT(*) FROM partners WHERE status='new'").fetchone()[0],
            "matches_suggested": conn.execute("SELECT COUNT(*) FROM matches WHERE stage='suggested'").fetchone()[0],
        }
        return {"metrics": metrics, "queues": queues, "environment": ENVIRONMENT, "updated_at": utc_now()}


@app.get("/api/admin/submissions/{kind}")
def admin_submissions(kind: str, limit: int = 200, _: str = Depends(require_admin)) -> dict[str, Any]:
    with db() as conn:
        items = admin_rows(conn, kind, limit)
        return {"items": items, "count": len(items), "kind": kind, "updated_at": utc_now()}


@app.get("/api/admin/export/{kind}.csv")
def admin_export(kind: str, _: str = Depends(require_admin)) -> StreamingResponse:
    with db() as conn:
        rows = admin_rows(conn, kind, 1000)
    if not rows:
        fieldnames = ["empty"]
    else:
        fieldnames = sorted({k for row in rows for k in row.keys()})
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: json_dump(v) if isinstance(v, (dict, list)) else v for k, v in row.items()})
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f'attachment; filename="justice-grows-{kind}-{utc_now()[:10]}.csv"'
    return response


@app.post("/api/admin/profiles/{profile_id}/moderate")
def moderate_profile(profile_id: str, patch: ProfileModeration, _: str = Depends(require_admin)) -> dict[str, Any]:
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            """SELECT p.*,c.state,c.remote_ok,c.relocation_ok,c.availability_date,c.min_hourly_wage
               FROM candidate_profiles p JOIN candidates c ON c.id=p.candidate_id WHERE p.id=?""",
            (profile_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Candidate profile not found.")
        profile = decrypt_json(row["profile_encrypted"])
        completion = public_profile_completion(profile)

        if patch.status == "published":
            if not row["pending_review"]:
                raise HTTPException(status_code=409, detail="This profile is not awaiting moderation.")
            if completion < 50 or not profile.get("skills") or not profile.get("role_interests"):
                raise HTTPException(status_code=409, detail="Profile does not meet the publication minimum.")
            if row["visibility"] == "private":
                raise HTTPException(status_code=409, detail="A private profile cannot be published.")
            if row["visibility"] == "public" and not row["public_consent_at"]:
                raise HTTPException(status_code=409, detail="Public-profile consent is missing.")
            snapshot = sanitize_profile_snapshot(profile, row, row["slug"]) if row["visibility"] == "public" else None
            conn.execute(
                """UPDATE candidate_profiles SET status='published',pending_review=0,public_snapshot=?,
                   moderation_notes=?,published_at=COALESCE(published_at,?),updated_at=? WHERE id=?""",
                (json_dump(snapshot) if snapshot else None, patch.note, now, now, profile_id),
            )
            event = "profile.published"
        elif patch.status == "changes_requested":
            # Preserve a previously approved snapshot while edits are corrected; first-time profiles remain private.
            if row["status"] == "published" and row["public_snapshot"]:
                conn.execute(
                    "UPDATE candidate_profiles SET status='published',pending_review=0,moderation_notes=?,updated_at=? WHERE id=?",
                    (patch.note or "Changes requested before the new draft can replace the current public profile.", now, profile_id),
                )
            else:
                conn.execute(
                    "UPDATE candidate_profiles SET status='changes_requested',pending_review=0,public_snapshot=NULL,published_at=NULL,moderation_notes=?,updated_at=? WHERE id=?",
                    (patch.note or "Changes requested before publication.", now, profile_id),
                )
            event = "profile.changes_requested"
        else:
            conn.execute(
                "UPDATE candidate_profiles SET status='paused',pending_review=0,public_snapshot=NULL,published_at=NULL,moderation_notes=?,updated_at=? WHERE id=?",
                (patch.note or "Profile paused by the moderation team.", now, profile_id),
            )
            event = "profile.paused"

        audit(conn, "admin", event, "candidate_profile", profile_id, {"note": patch.note, "completion": completion})
        conn.execute("COMMIT")
    return {"id": profile_id, "status": patch.status, "completion": completion}


@app.post("/api/admin/registry", status_code=201)
def create_registry_draft(payload: RegistryDraftInput, _: str = Depends(require_admin)) -> dict[str, Any]:
    registry_id = make_id("reg")
    now = utc_now()
    state = payload.state.upper() if payload.state else None
    if state and state not in STATE_NAMES:
        raise HTTPException(status_code=422, detail="Invalid state or federal jurisdiction code.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """INSERT INTO public_registry_records(
                 id,display_name,jurisdiction,state,agency_identifier,custody_status,cannabis_classification,
                 violence_screen_statement,confidence,source_count,last_verified_at,projected_release_date,
                 release_date,publication_status,profile_consent,created_at,updated_at
               ) VALUES(?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)""",
            (
                registry_id, payload.display_name, payload.jurisdiction, state, payload.agency_identifier,
                payload.custody_status, payload.cannabis_classification, payload.violence_screen_statement,
                payload.confidence, payload.last_verified_at, payload.projected_release_date,
                payload.release_date, "draft", int(payload.profile_consent), now, now,
            ),
        )
        audit(conn, "admin", "registry.draft_created", "registry", registry_id, {"jurisdiction": payload.jurisdiction})
        conn.execute("COMMIT")
    return {"id": registry_id, "status": "draft", "message": "Draft created. Add sources and two independent reviews before publication."}


@app.post("/api/admin/registry/{registry_id}/sources", status_code=201)
def add_registry_source(registry_id: str, payload: RegistrySourceInput, _: str = Depends(require_admin)) -> dict[str, Any]:
    if payload.url and not re.match(r"^https://", payload.url, flags=re.IGNORECASE):
        raise HTTPException(status_code=422, detail="Evidence links must use HTTPS.")
    source_id = make_id("src")
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM public_registry_records WHERE id=?", (registry_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Registry record not found.")
        conn.execute(
            """INSERT INTO registry_sources(
                 id,registry_id,source_type,title,url,obtained_at,last_checked_at,supports_fields,checksum,
                 public_safe,notes_encrypted,created_at,updated_at
               ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                source_id, registry_id, payload.source_type, payload.title, payload.url, payload.obtained_at,
                payload.last_checked_at, json_dump(normalize_lines(payload.supports_fields, 30)), payload.checksum,
                int(payload.public_safe), encrypt_json({"notes": payload.notes}) if payload.notes else None, now, now,
            ),
        )
        count = conn.execute("SELECT COUNT(*) FROM registry_sources WHERE registry_id=?", (registry_id,)).fetchone()[0]
        conn.execute("UPDATE public_registry_records SET source_count=?,publication_status=CASE WHEN publication_status='draft' THEN 'review' ELSE publication_status END,updated_at=? WHERE id=?", (count, now, registry_id))
        audit(conn, "admin", "registry.source_added", "registry", registry_id, {"source_id": source_id, "source_type": payload.source_type})
        conn.execute("COMMIT")
    return {"id": source_id, "registry_id": registry_id, "source_count": count}


@app.post("/api/admin/registry/{registry_id}/reviews", status_code=201)
def add_registry_review(registry_id: str, payload: RegistryReviewInput, _: str = Depends(require_admin)) -> dict[str, Any]:
    review_id = make_id("rev")
    now = utc_now()
    checklist = {
        "identity_confirmed": payload.identity_confirmed,
        "current_custody_confirmed": payload.current_custody_confirmed,
        "cannabis_attribution_confirmed": payload.cannabis_attribution_confirmed,
        "all_current_counts_reviewed": payload.all_current_counts_reviewed,
        "violence_screen_complete": payload.violence_screen_complete,
        "release_status_checked": payload.release_status_checked,
    }
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM public_registry_records WHERE id=?", (registry_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Registry record not found.")
        # One current decision per reviewer prevents obsolete approvals from being counted.
        conn.execute("DELETE FROM registry_reviews WHERE registry_id=? AND reviewer_id=?", (registry_id, payload.reviewer_id))
        conn.execute(
            "INSERT INTO registry_reviews(id,registry_id,reviewer_id,decision,checklist,note,created_at) VALUES(?,?,?,?,?,?,?)",
            (review_id, registry_id, payload.reviewer_id, payload.decision, json_dump(checklist), payload.note, now),
        )
        audit(conn, "admin", "registry.review_added", "registry", registry_id, {"reviewer_id": payload.reviewer_id, "decision": payload.decision})
        conn.execute("COMMIT")
    return {"id": review_id, "registry_id": registry_id, "decision": payload.decision}


@app.post("/api/admin/registry/{registry_id}/publish")
def publish_registry_record(registry_id: str, payload: RegistryPublishInput, _: str = Depends(require_admin)) -> dict[str, Any]:
    if not payload.acknowledgment:
        raise HTTPException(status_code=422, detail="Publication acknowledgment is required.")
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        record = conn.execute("SELECT * FROM public_registry_records WHERE id=?", (registry_id,)).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Registry record not found.")
        if record["confidence"] not in {"confirmed", "supported"}:
            raise HTTPException(status_code=409, detail="Only confirmed or supported records may be published.")
        sources = conn.execute("SELECT source_type FROM registry_sources WHERE registry_id=?", (registry_id,)).fetchall()
        if len(sources) < 2:
            raise HTTPException(status_code=409, detail="At least two documented sources are required.")
        primary_types = {"judgment", "commitment_record", "court_docket", "records_extract"}
        if not any(source["source_type"] in primary_types for source in sources):
            raise HTTPException(status_code=409, detail="At least one court, commitment, or official records source is required.")
        reviews = conn.execute("SELECT reviewer_id,decision,checklist FROM registry_reviews WHERE registry_id=?", (registry_id,)).fetchall()
        approvals: set[str] = set()
        for review in reviews:
            checks = json_load(review["checklist"], {})
            if review["decision"] == "approve" and checks and all(bool(value) for value in checks.values()):
                approvals.add(review["reviewer_id"])
        if len(approvals) < 2:
            raise HTTPException(status_code=409, detail="Two distinct reviewers must approve every verification check.")
        if any(review["decision"] in {"reject", "hold"} for review in reviews):
            raise HTTPException(status_code=409, detail="Resolve all hold or reject reviews before publication.")
        conn.execute(
            "UPDATE public_registry_records SET publication_status='published',source_count=?,updated_at=? WHERE id=?",
            (len(sources), now, registry_id),
        )
        audit(conn, "admin", "registry.published", "registry", registry_id, {"source_count": len(sources), "reviewer_count": len(approvals)})
        conn.execute("COMMIT")
    return {"id": registry_id, "status": "published", "source_count": len(sources), "approvals": len(approvals)}


@app.post("/api/admin/registry/{registry_id}/status")
def registry_status(registry_id: str, patch: StatusPatch, _: str = Depends(require_admin)) -> dict[str, Any]:
    if patch.status not in {"draft", "review", "paused", "withdrawn"}:
        raise HTTPException(status_code=422, detail="Use the publication endpoint to publish a registry record.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM public_registry_records WHERE id=?", (registry_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Registry record not found.")
        conn.execute("UPDATE public_registry_records SET publication_status=?,updated_at=? WHERE id=?", (patch.status, utc_now(), registry_id))
        audit(conn, "admin", "registry.status", "registry", registry_id, {"status": patch.status, "note": patch.note})
        conn.execute("COMMIT")
    return {"id": registry_id, "status": patch.status}


@app.post("/api/admin/corrections/{correction_id}/status")
def correction_status(correction_id: str, patch: StatusPatch, _: str = Depends(require_admin)) -> dict[str, Any]:
    if patch.status not in {"new", "investigating", "resolved", "rejected", "duplicate"}:
        raise HTTPException(status_code=422, detail="Invalid correction status.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM correction_requests WHERE id=?", (correction_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Correction request not found.")
        conn.execute("UPDATE correction_requests SET status=?,resolution_note=?,updated_at=? WHERE id=?", (patch.status, patch.note, utc_now(), correction_id))
        audit(conn, "admin", "correction.status", "correction_request", correction_id, {"status": patch.status})
        conn.execute("COMMIT")
    return {"id": correction_id, "status": patch.status}


@app.post("/api/admin/employers/{employer_id}/verify")
def verify_employer(employer_id: str, patch: StatusPatch, _: str = Depends(require_admin)) -> dict[str, Any]:
    if patch.status not in {"verified", "proven", "declined", "suspended"}:
        raise HTTPException(status_code=422, detail="Invalid employer status.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT id FROM employers WHERE id=?", (employer_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Employer not found.")
        conn.execute(
            "UPDATE employers SET status=?,verification_notes=?,updated_at=? WHERE id=?",
            (patch.status, patch.note, utc_now(), employer_id),
        )
        audit(conn, "admin", "employer.status", "employer", employer_id, {"status": patch.status, "note": patch.note})
        conn.execute("COMMIT")
    return {"id": employer_id, "status": patch.status}


@app.post("/api/admin/jobs/{job_id}/publish")
def publish_job(job_id: str, patch: JobApproval, _: str = Depends(require_admin)) -> dict[str, Any]:
    now = utc_now()
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        job = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")
        if job["employer_id"]:
            employer = conn.execute("SELECT status FROM employers WHERE id=?", (job["employer_id"],)).fetchone()
            if not employer or employer["status"] not in {"verified", "proven"}:
                raise HTTPException(status_code=409, detail="Employer must be verified before publishing this role.")
        else:
            raise HTTPException(status_code=409, detail="Attach the job to a verified employer before publishing.")
        conn.execute(
            "UPDATE jobs SET status='published',published_at=?,expires_at=?,licensing_notes=COALESCE(?,licensing_notes),updated_at=? WHERE id=?",
            (now, patch.expires_at, patch.licensing_notes, now, job_id),
        )
        count = refresh_matches(conn, job_id=job_id)
        audit(conn, "admin", "job.published", "job", job_id, {"matches_refreshed": count})
        conn.execute("COMMIT")
    return {"id": job_id, "status": "published", "matches_refreshed": count}


@app.post("/api/admin/jobs/{job_id}/status")
def job_status(job_id: str, patch: StatusPatch, _: str = Depends(require_admin)) -> dict[str, Any]:
    if patch.status not in {"submitted", "review", "published", "paused", "closed", "declined"}:
        raise HTTPException(status_code=422, detail="Invalid job status.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM jobs WHERE id=?", (job_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Job not found.")
        conn.execute("UPDATE jobs SET status=?,updated_at=? WHERE id=?", (patch.status, utc_now(), job_id))
        audit(conn, "admin", "job.status", "job", job_id, {"status": patch.status, "note": patch.note})
        conn.execute("COMMIT")
    return {"id": job_id, "status": patch.status}


@app.post("/api/admin/matches/{match_id}/stage")
def match_stage(match_id: str, patch: StatusPatch, _: str = Depends(require_admin)) -> dict[str, Any]:
    allowed = {"suggested", "candidate_review", "candidate_consented", "employer_review", "introduced", "interview", "offer", "started", "retained_90", "retained_180", "retained_365", "declined", "withdrawn"}
    if patch.status not in allowed:
        raise HTTPException(status_code=422, detail="Invalid match stage.")
    with db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if not conn.execute("SELECT 1 FROM matches WHERE id=?", (match_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Match not found.")
        conn.execute("UPDATE matches SET stage=?,updated_at=? WHERE id=?", (patch.status, utc_now(), match_id))
        audit(conn, "admin", "match.stage", "match", match_id, {"stage": patch.status, "note": patch.note})
        conn.execute("COMMIT")
    return {"id": match_id, "stage": patch.status}


@app.get("/manifest.webmanifest")
def manifest() -> FileResponse:
    return FileResponse(STATIC_DIR / "manifest.webmanifest", media_type="application/manifest+json")


@app.get("/robots.txt")
def robots() -> FileResponse:
    return FileResponse(STATIC_DIR / "robots.txt", media_type="text/plain")


@app.get("/sitemap.xml")
def sitemap() -> FileResponse:
    return FileResponse(STATIC_DIR / "sitemap.xml", media_type="application/xml")


@app.get("/admin")
def admin_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin.html")


@app.get("/profile")
def candidate_profile_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "profile.html")


@app.get("/talent/{slug}")
def public_talent_page(slug: str) -> FileResponse:
    # The browser fetches the candidate-approved snapshot by slug; the page itself contains no private data.
    return FileResponse(STATIC_DIR / "talent.html")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
