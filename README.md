# Justice Grows

**Freedom. Work. Ownership.**

Justice Grows is a working controlled-pilot platform built around one operating thesis:

> The industry should hire the people prohibition punished.

It combines two deliberately separate systems:

1. **A source-linked public registry** of verified cannabis-linked custody and release monitoring.
2. **A private, candidate-controlled career network** connecting justice-impacted talent with accountable employers across regulated cannabis, ancillary businesses, remote roles, lawful hemp pathways, training, relocation, advancement, and ownership.

A fresh deployment contains **no fabricated people, employers, jobs, placements, or impact**. Public metrics are computed from reviewed database records and start at zero. Targets are labeled separately.

## Working product

### Public site

- Responsive mission, operating model, and impact dashboard
- Live charts for the candidate funnel, roles, employer types, coverage, registry status, and outcomes
- Public jobs from approved roles only
- Public registry records only after a source and two-reviewer publication gate
- Opt-in public talent profiles containing candidate-approved professional information only
- Verified-employer directory and status tiers
- 51-jurisdiction coverage and State Access Engine
- Dedicated correction and dispute channel
- Privacy-threshold suppression for small talent cohorts

### Candidate Mobility Passport

- Secure private profile after intake
- Skills, formal and informal work, accomplishments, certifications, training, work samples, preferred roles, compensation floor, schedule, location, remote/relocation preferences, 12-month goals, and three-year ambitions
- Private, coalition-only, or public visibility
- Separate public-profile consent and moderation
- Candidate review of every suggested match
- Candidate-approved introductions
- Public hide, withdrawal, correction, and secure-link rotation
- No conviction detail in employer discovery or match scoring

### Employer coalition

- Fair Chance Employer Compact at intake
- Verification and manager/policy review workflow
- Real-role requirement with compensation, duties, manager, pathway, and growth plan
- Job-publication gate
- Pledged, Verified, and Proven accountability model
- Interview, offer, start, retention, wage, advancement, complaint, and status tracking

### Registry operations

- Private draft records
- Source metadata, supported fields, checksums, retrieval dates, and public-safe flags
- Independent reviewer checklist
- Enforced two-reviewer publication gate
- Current custody/release taxonomy
- Candidate/career system separation
- Correction intake and audit events

### Operations console

- Authenticated queues for candidates, Passports, employers, jobs, cases, partners, matches, corrections, and registry research
- Profile moderation
- Employer verification and job approval
- Match-stage management
- Registry source, review, publication, and status workflow
- CSV exports

## Run locally

```bash
cd justice-grows
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ADMIN_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
./scripts/run_local.sh
```

Open:

- Public site: `http://127.0.0.1:8000`
- Candidate Passport: `http://127.0.0.1:8000/profile`
- Operations console: `http://127.0.0.1:8000/admin`
- Development API docs: `http://127.0.0.1:8000/api/docs`

The development server creates `data/.dev_encryption_key`. Never commit or copy that key into production.

## Run with Docker

```bash
cp .env.example .env
python scripts/generate_key.py
python -c "import secrets; print(secrets.token_urlsafe(48))"
# Put both values into .env, then:
docker compose up -d --build
```

Run the smoke test:

```bash
python scripts/smoke_test.py http://127.0.0.1:8000
```

## Tests

```bash
pytest -q
```

The automated suite covers:

- Candidate, employer, job approval, and match creation
- Mobility Passport save, submit, moderation, public-safe snapshot, and routes
- Registry draft, two independent source records, two independent reviewers, publication, correction intake, and analytics

## What “working” means

The code is wired end to end. It can accept real intakes, create private Passports, approve employers and jobs, generate skills-first match suggestions, publish candidate-approved talent snapshots, maintain source-linked registry records, and produce live analytics.

Software cannot manufacture authoritative national records or committed jobs. Before real public launch, the operating organization still must acquire corrections/court data, verify each commitment, recruit employers with actual paid roles, complete jurisdiction-specific legal review, staff navigator/reviewer queues, and deploy production security infrastructure.

## Production boundary

This repository is appropriate for a **controlled pilot or private beta**. Before unrestricted national production, replace:

- SQLite with managed Postgres
- One shared admin bearer token with named SSO/MFA users
- Process-local rate limiting with managed distributed controls
- Local field key with KMS envelope encryption and rotation
- Local-only source metadata with encrypted object storage and malware scanning
- Direct synchronous workflows with queue workers and connector services
- Basic logging with centralized immutable audit/security monitoring

See:

- `docs/PRODUCTION_LAUNCH_CHECKLIST.md`
- `docs/PRODUCTION_ARCHITECTURE.md`
- `docs/DATA_AND_VERIFICATION_STANDARD.md`
- `docs/CANDIDATE_MOBILITY_PASSPORT.md`
- `docs/EMPLOYER_DEMAND_ENGINE.md`
- `docs/STATE_ACCESS_ENGINE.md`
- `docs/SECURITY_PRIVACY_AND_HIRING_COMPLIANCE.md`

## Core legal and ethical boundary

The registry and career network must never become one employer-screening database.

- A registry record does not create a candidate profile.
- Employers cannot browse candidates by conviction.
- Matching uses skills, roles, location, schedule, remote/relocation preference, pathway, and compensation.
- Conviction information is not a score feature.
- Candidate identity is introduced only after candidate consent.
- Any post-offer history process remains the employer's legal responsibility.
- No candidate fee, pay-to-remove record, named-person data sale, or conviction-targeted bulk export.

## Repository map

```text
app/main.py                       FastAPI app, schema, encryption, matching, APIs
app/static/index.html             Public responsive site and live dashboards
app/static/profile.html           Secure candidate Mobility Passport
app/static/talent.html            Candidate-approved public talent profile
app/static/admin.html             Pilot operations console
app/static/assets/mark.svg        Brand mark
scripts/                          Local run, keys, backups, imports, smoke test
imports/                          Registry, jobs, employer-pipeline, and role templates
docs/                             Mission, operating, verification, legal, demand, and launch system
deploy/                           Controlled-pilot deployment guidance
previews/                         Browser-rendered desktop and mobile previews
```

## Working-name notice

“Justice Grows” is a working brand. Complete trademark, domain, nonprofit-name, and state charitable-registration clearance before public fundraising or national launch.
