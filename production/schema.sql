-- Justice Grows production schema
-- PostgreSQL 15+; sensitive payloads should be envelope-encrypted before storage.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  public_name text,
  website text,
  state char(2),
  organization_type text NOT NULL,
  public_attribution_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject text NOT NULL UNIQUE,
  email_hash text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','disabled')),
  mfa_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('candidate_navigator','employer_reviewer','registry_reviewer','claim_reviewer','correction_manager','security_admin','system_admin','auditor')),
  jurisdiction text NOT NULL DEFAULT '*',
  granted_by uuid REFERENCES app_users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (user_id, role, jurisdiction)
);

CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pii_ciphertext bytea NOT NULL,
  pii_key_version text NOT NULL,
  state char(2) NOT NULL,
  release_status text NOT NULL,
  availability_date date,
  remote_ok boolean NOT NULL DEFAULT false,
  relocation_ok boolean NOT NULL DEFAULT false,
  minimum_hourly_wage numeric(10,2),
  match_consent boolean NOT NULL DEFAULT false,
  contact_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','active','paused','withdrawn','deleted')),
  source text NOT NULL DEFAULT 'self_intake',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  identity_mode text NOT NULL DEFAULT 'first_initial' CHECK (identity_mode IN ('first_name','first_initial','alias')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','coalition','public')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','published','changes_requested','paused','withdrawn')),
  private_ciphertext bytea NOT NULL,
  private_key_version text NOT NULL,
  public_snapshot jsonb,
  public_consent_at timestamptz,
  search_discovery boolean NOT NULL DEFAULT false,
  pending_review boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (visibility <> 'public' OR public_consent_at IS NOT NULL)
);

CREATE TABLE profile_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  private_ciphertext bytea NOT NULL,
  public_snapshot jsonb,
  submitted_by uuid REFERENCES app_users(id),
  moderation_status text NOT NULL CHECK (moderation_status IN ('draft','submitted','approved','changes_requested','rejected','superseded')),
  moderation_note text,
  moderated_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz,
  UNIQUE(profile_id, version_no)
);

CREATE TABLE consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('contact','matching','public_profile','search_discovery','story_interest','story_license','employer_introduction','outcome_confirmation','data_retention')),
  policy_version text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision boolean NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('candidate','authorized_representative','operator')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  contact_ciphertext bytea NOT NULL,
  contact_key_version text NOT NULL,
  executive_sponsor text NOT NULL,
  compact_version text NOT NULL,
  compact_signed_at timestamptz NOT NULL,
  story_rights_commitment boolean NOT NULL,
  wage_transparency boolean NOT NULL,
  no_blanket_ban boolean NOT NULL,
  fair_chance_process boolean NOT NULL,
  candidate_privacy boolean NOT NULL,
  outcome_reporting boolean NOT NULL,
  advancement_commitment boolean NOT NULL,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','reviewing','verified','proven','paused','rejected','withdrawn')),
  verified_at timestamptz,
  verified_by uuid REFERENCES app_users(id),
  verification_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('verified','proven') OR verified_at IS NOT NULL)
);

CREATE TABLE employer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES app_users(id),
  policy_version text NOT NULL,
  checklist jsonb NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve','hold','reject')),
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES employers(id),
  title text NOT NULL,
  city text,
  state char(2) NOT NULL,
  remote boolean NOT NULL DEFAULT false,
  relocation_support boolean NOT NULL DEFAULT false,
  pathway text NOT NULL CHECK (pathway IN ('regulated','ancillary','remote','hemp','relocation','training')),
  employment_type text NOT NULL,
  wage_min numeric(12,2) NOT NULL,
  wage_max numeric(12,2),
  salary_period text NOT NULL CHECK (salary_period IN ('hour','year','project')),
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  role_interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text NOT NULL,
  background_process text NOT NULL,
  licensing_note text,
  manager_reference text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','review','published','paused','filled','expired','withdrawn','rejected')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (wage_max IS NULL OR wage_max >= wage_min),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE job_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES app_users(id),
  checklist jsonb NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve','hold','reject')),
  licensing_review text,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id),
  job_id uuid NOT NULL REFERENCES jobs(id),
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  score_version text NOT NULL,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  blockers jsonb NOT NULL DEFAULT '[]'::jsonb,
  stage text NOT NULL DEFAULT 'suggested' CHECK (stage IN ('suggested','candidate_review','candidate_consented','employer_review','introduced','interview','offer','started','retained_90','retained_180','retained_365','declined','withdrawn','closed')),
  candidate_consent boolean NOT NULL DEFAULT false,
  employer_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

CREATE TABLE match_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('candidate','employer','operator')),
  actor_id uuid,
  decision text NOT NULL,
  note_ciphertext bytea,
  key_version text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outcome_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('started','retained_30','retained_90','retained_180','retained_365','raise','promotion','credential','equity','ownership','separation')),
  occurred_at date NOT NULL,
  wage numeric(12,2),
  salary_period text CHECK (salary_period IS NULL OR salary_period IN ('hour','year','project')),
  candidate_confirmed boolean NOT NULL DEFAULT false,
  candidate_confirmed_at timestamptz,
  employer_confirmed boolean NOT NULL DEFAULT false,
  employer_confirmed_at timestamptz,
  note_ciphertext bytea,
  key_version text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (event_type = 'separation' OR candidate_confirmed = true)
);

CREATE TABLE industry_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  company_name text NOT NULL,
  claim_url text NOT NULL,
  claim_type text NOT NULL,
  observed_at date,
  claim_summary text NOT NULL,
  submitter_ciphertext bytea,
  submitter_key_version text,
  status text NOT NULL DEFAULT 'research_lead' CHECK (status IN ('research_lead','reviewing','right_of_reply','verified_role','verified_outcome','closed_no_evidence','closed_no_finding','closed_duplicate','withdrawn')),
  public boolean NOT NULL DEFAULT false,
  evidence_note text,
  right_of_reply_status text NOT NULL DEFAULT 'not_started' CHECK (right_of_reply_status IN ('not_started','sent','received','declined','expired','not_applicable')),
  reviewer_id uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (public = false OR status IN ('verified_role','verified_outcome','closed_no_evidence')),
  CHECK (public = false OR length(coalesce(evidence_note,'')) >= 30),
  CHECK (public = false OR right_of_reply_status IN ('received','declined','expired','not_applicable'))
);

CREATE TABLE claim_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES industry_claims(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  source_type text NOT NULL,
  captured_at timestamptz NOT NULL,
  content_hash text,
  evidence_summary text NOT NULL,
  public_safe boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE claim_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES industry_claims(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  sent_at timestamptz,
  response_received_at timestamptz,
  response_ciphertext bytea,
  key_version text,
  public_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE registry_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_ciphertext bytea NOT NULL,
  subject_key_version text NOT NULL,
  display_name text,
  jurisdiction text NOT NULL,
  state text,
  agency_identifier_hash text,
  custody_status text NOT NULL,
  cannabis_classification text NOT NULL CHECK (cannabis_classification IN ('cannabis_only','cannabis_primary','cannabis_linked_review')),
  violence_screen_statement text NOT NULL,
  confidence text NOT NULL CHECK (confidence IN ('confirmed','supported','provisional','disputed')),
  source_count integer NOT NULL DEFAULT 0,
  last_verified_at date NOT NULL,
  projected_release_date date,
  release_date date,
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','review','published','paused','withdrawn')),
  public_interest_basis text,
  profile_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (publication_status <> 'published' OR confidence IN ('confirmed','supported'))
);

CREATE TABLE registry_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid NOT NULL REFERENCES registry_records(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  title text NOT NULL,
  public_url text,
  evidence_object_key text,
  obtained_at date NOT NULL,
  last_checked_at timestamptz NOT NULL,
  supports_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_hash text,
  public_safe boolean NOT NULL DEFAULT false,
  note_ciphertext bytea,
  key_version text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE registry_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid NOT NULL REFERENCES registry_records(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES app_users(id),
  decision text NOT NULL CHECK (decision IN ('approve','hold','reject')),
  identity_confirmed boolean NOT NULL,
  current_custody_confirmed boolean NOT NULL,
  cannabis_attribution_confirmed boolean NOT NULL,
  all_current_counts_reviewed boolean NOT NULL,
  violence_screen_complete boolean NOT NULL,
  release_status_checked boolean NOT NULL,
  note_ciphertext bytea,
  key_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(registry_id, reviewer_id)
);

CREATE TABLE correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  correction_type text NOT NULL,
  contact_ciphertext bytea NOT NULL,
  contact_key_version text NOT NULL,
  detail_ciphertext bytea NOT NULL,
  detail_key_version text NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  severity text NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal','high','critical')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','triage','investigating','field_frozen','resolved','rejected','withdrawn')),
  assigned_to uuid REFERENCES app_users(id),
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  request_id text,
  ip_hash text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX candidates_status_idx ON candidates(status);
CREATE INDEX profiles_public_idx ON candidate_profiles(status, visibility) WHERE public_snapshot IS NOT NULL;
CREATE INDEX employers_status_idx ON employers(status);
CREATE INDEX jobs_public_idx ON jobs(status, expires_at);
CREATE INDEX matches_candidate_idx ON matches(candidate_id, stage);
CREATE INDEX matches_job_idx ON matches(job_id, stage);
CREATE INDEX outcomes_match_idx ON outcome_events(match_id, event_type);
CREATE INDEX claims_public_idx ON industry_claims(public, status);
CREATE INDEX registry_public_idx ON registry_records(publication_status, last_verified_at);
CREATE INDEX registry_sources_idx ON registry_sources(registry_id);
CREATE INDEX registry_reviews_idx ON registry_reviews(registry_id);
CREATE INDEX corrections_status_idx ON correction_requests(status, severity);
CREATE INDEX audit_entity_idx ON audit_events(entity_type, entity_id, created_at DESC);

-- Public application views should be implemented with explicit allowlists.
-- Never expose candidates.pii_ciphertext, profile private ciphertext, employer contacts,
-- claim submitters/replies, registry subject/evidence ciphertext, reviewer identities, or internal notes.
