import os
from pathlib import Path
from cryptography.fernet import Fernet

TEST_DIR=Path(__file__).parent/".tmp"
TEST_DIR.mkdir(exist_ok=True)
os.environ["DATA_DIR"]=str(TEST_DIR)
os.environ["DATABASE_PATH"]=str(TEST_DIR/"test.db")
os.environ["DATA_ENCRYPTION_KEY"]=Fernet.generate_key().decode()
os.environ["ADMIN_TOKEN"]="test-admin-token"
os.environ["ENVIRONMENT"]="test"

from fastapi.testclient import TestClient
from app.main import app


def candidate_payload():
    return {"website_confirm":"","first_name":"Test","last_name":"Candidate","email":"candidate@example.com","phone":None,"state":"ID","city":"Boise","zip_code":None,"release_status":"released","availability_date":None,"remote_ok":True,"relocation_ok":True,"role_interests":"operations, technology","skills":"inventory, excel, team leadership","pathways":"ancillary, remote, relocation","min_hourly_wage":20,"needs":"training","notes":"test","consent_matching":True,"consent_contact":True,"privacy_acknowledgment":True}


def employer_payload():
    return {"website_confirm":"","org_name":"Test Employer","website":"https://example.org","first_name":"Test","last_name":"Employer","title":"COO","email":"employer@example.com","phone":None,"state":"CA","org_type":"ancillary","employee_count":"10_49","roles_per_quarter":2,"states_hiring":"CA, ID","pathways":"ancillary, remote","wage_transparency":True,"no_blanket_ban":True,"fair_chance_process":True,"outcome_reporting":True,"candidate_privacy":True,"advancement_commitment":True,"public_name_consent":False,"notes":"test"}


def test_end_to_end_workflow():
    db=TEST_DIR/"test.db"
    if db.exists(): db.unlink()
    with TestClient(app) as client:
        assert client.get("/api/health").status_code==200
        metrics=client.get("/api/public/metrics").json()
        assert metrics["actual"]["career_starts"]==0

        candidate=client.post("/api/intake/candidate",json=candidate_payload())
        assert candidate.status_code==201

        employer=client.post("/api/intake/employer",json=employer_payload())
        assert employer.status_code==201
        employer_id=employer.json()["id"]

        job={"website_confirm":"","employer_id":employer_id,"org_name":"Test Employer","contact_name":"Test Employer","email":"employer@example.com","phone":None,"title":"Remote Operations Coordinator","city":None,"state":"CA","remote":True,"relocation_support":False,"pathway":"remote","employment_type":"full_time","wage_min":24,"wage_max":30,"salary_period":"hour","benefits":"health, PTO","skills":"inventory, excel","role_interests":"operations, technology","description":"Coordinate inventory reporting, vendor documentation, and operating workflows for an ancillary cannabis technology business.","licensing_notes":"Non-plant-touching; legal review required.","background_process":"Post-offer individualized review tied to duties and applicable law.","compact_acknowledgment":True}
        job_response=client.post("/api/intake/job",json=job)
        assert job_response.status_code==201
        job_id=job_response.json()["id"]

        headers={"Authorization":"Bearer test-admin-token"}
        assert client.post(f"/api/admin/employers/{employer_id}/verify",headers=headers,json={"status":"verified","note":"test"}).status_code==200
        publish=client.post(f"/api/admin/jobs/{job_id}/publish",headers=headers,json={"expires_at":"2030-01-01","licensing_notes":"reviewed"})
        assert publish.status_code==200
        assert publish.json()["matches_refreshed"]==1

        jobs=client.get("/api/public/jobs").json()
        assert jobs["count"]==1
        overview=client.get("/api/admin/overview",headers=headers).json()
        assert overview["metrics"]["actual"]["matches"]==1
        assert overview["metrics"]["actual"]["open_jobs"]==1


def extract_candidate_access(url: str) -> str:
    from urllib.parse import urlparse, parse_qs
    fragment = parse_qs(urlparse(url).fragment)
    return fragment["access"][0]


def completed_profile_payload():
    return {
        "display_name": "Test C.",
        "identity_mode": "first_initial",
        "headline": "Operations leader focused on dependable systems",
        "about": "I build reliable workflows, train teams, and take ownership of results.",
        "work_history": "Led inventory counts, trained new team members, and maintained daily operating reports.",
        "goals_12_month": "Secure a stable full-time operations role, complete a credential, and increase income.",
        "ambition_3_year": "Manage a team, mentor other returning citizens, and build equity in a business.",
        "strengths": ["reliable", "calm under pressure", "systems thinker"],
        "skills": ["inventory", "excel", "team leadership"],
        "role_interests": ["operations", "technology"],
        "certifications": ["OSHA 10"],
        "training_interests": ["project management"],
        "portfolio_links": ["https://example.org/work"],
        "preferred_locations": ["Remote", "California"],
        "schedule_preferences": ["Full time"],
        "languages": ["English"],
        "visibility": "public",
        "search_discovery": False,
        "story_consent": False,
        "public_profile_consent": True,
    }


def test_mobility_passport_and_public_profile():
    db = TEST_DIR / "test.db"
    if db.exists():
        db.unlink()
    with TestClient(app) as client:
        created = client.post("/api/intake/candidate", json=candidate_payload())
        assert created.status_code == 201
        access = extract_candidate_access(created.json()["profile_portal_url"])
        candidate_headers = {"Authorization": f"Bearer {access}"}

        initial = client.get("/api/candidate/profile", headers=candidate_headers)
        assert initial.status_code == 200
        assert initial.json()["profile"]["visibility"] == "private"

        saved = client.put("/api/candidate/profile", headers=candidate_headers, json=completed_profile_payload())
        assert saved.status_code == 200
        assert saved.json()["completion"] >= 50
        submitted = client.post("/api/candidate/profile/submit", headers=candidate_headers, json={"acknowledgment": True})
        assert submitted.status_code == 200

        admin_headers = {"Authorization": "Bearer test-admin-token"}
        profiles = client.get("/api/admin/submissions/profiles", headers=admin_headers).json()["items"]
        assert len(profiles) == 1
        profile_id = profiles[0]["id"]
        moderated = client.post(
            f"/api/admin/profiles/{profile_id}/moderate",
            headers=admin_headers,
            json={"status": "published", "note": "Verified skills-first profile."},
        )
        assert moderated.status_code == 200

        public = client.get("/api/public/talent")
        assert public.status_code == 200
        assert public.json()["count"] == 1
        person = public.json()["items"][0]
        assert person["display_name"] == "Test C."
        forbidden = {"email", "phone", "zip_code", "release_status", "needs", "conviction"}
        assert forbidden.isdisjoint(person.keys())
        detail = client.get(f"/api/public/talent/{person['slug']}")
        assert detail.status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get(f"/talent/{person['slug']}").status_code == 200


def test_registry_two_reviewer_gate_and_correction_channel():
    db = TEST_DIR / "test.db"
    if db.exists():
        db.unlink()
    admin_headers = {"Authorization": "Bearer test-admin-token"}
    with TestClient(app) as client:
        draft = client.post(
            "/api/admin/registry",
            headers=admin_headers,
            json={
                "display_name": "Test Person",
                "jurisdiction": "Federal",
                "state": "FED",
                "agency_identifier": "TEST-001",
                "custody_status": "incarcerated",
                "cannabis_classification": "cannabis_only",
                "violence_screen_statement": "No violent offense was identified in the current commitment records reviewed as of 2026-06-18.",
                "confidence": "confirmed",
                "last_verified_at": "2026-06-18",
                "projected_release_date": "2028-01-01",
                "release_date": None,
                "profile_consent": False,
            },
        )
        assert draft.status_code == 201, draft.text
        rid = draft.json()["id"]

        sources = [
            {
                "source_type": "judgment",
                "title": "Operative judgment",
                "url": "https://example.gov/judgment",
                "obtained_at": "2026-06-18",
                "last_checked_at": "2026-06-18",
                "supports_fields": ["identity", "counts", "sentence"],
                "checksum": "sha256:test1",
                "public_safe": True,
                "notes": "Primary source",
            },
            {
                "source_type": "agency_locator",
                "title": "Agency custody locator",
                "url": "https://example.gov/locator",
                "obtained_at": "2026-06-18",
                "last_checked_at": "2026-06-18",
                "supports_fields": ["custody", "release"],
                "checksum": "sha256:test2",
                "public_safe": True,
                "notes": None,
            },
        ]
        for source in sources:
            response = client.post(f"/api/admin/registry/{rid}/sources", headers=admin_headers, json=source)
            assert response.status_code == 201, response.text

        for reviewer in ("reviewer-a", "reviewer-b"):
            review = client.post(
                f"/api/admin/registry/{rid}/reviews",
                headers=admin_headers,
                json={
                    "reviewer_id": reviewer,
                    "decision": "approve",
                    "identity_confirmed": True,
                    "current_custody_confirmed": True,
                    "cannabis_attribution_confirmed": True,
                    "all_current_counts_reviewed": True,
                    "violence_screen_complete": True,
                    "release_status_checked": True,
                    "note": "Independent approval",
                },
            )
            assert review.status_code == 201, review.text

        published = client.post(
            f"/api/admin/registry/{rid}/publish",
            headers=admin_headers,
            json={"acknowledgment": True},
        )
        assert published.status_code == 200, published.text
        public = client.get(f"/api/public/registry/{rid}")
        assert public.status_code == 200
        assert len(public.json()["sources"]) == 2

        correction = client.post(
            "/api/intake/correction",
            json={
                "website_confirm": "",
                "correction_type": "registry",
                "registry_id": rid,
                "profile_slug": None,
                "name": "Test Reviewer",
                "email": "reviewer@example.org",
                "relationship": "researcher",
                "detail": "The projected release date should be reviewed against a newer official source.",
                "source_links": ["https://example.gov/new-source"],
                "contact_consent": True,
                "accuracy_acknowledgment": True,
            },
        )
        assert correction.status_code == 201
        analytics = client.get("/api/public/analytics")
        assert analytics.status_code == 200
        assert analytics.json()["registry_by_custody_status"][0]["count"] == 1
