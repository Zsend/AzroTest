# Justice Grows

**Proof over promises.**

Justice Grows is the independent proof layer for cannabis justice. It connects people harmed by cannabis felony convictions to lawful work and measures what the industry actually delivers: verified roles, candidate-approved introductions, paid starts, retention, advancement, equity, and ownership.

## What is in this release

- Proof-first public website and public employer ledger
- Honest verified-zero state when no role has met the standard
- Candidate-owned Mobility Passport for skills, work, goals, ambition, and portfolio
- Optional moderated public talent profiles
- Fair Chance Employer Compact and paid-role review
- Skills-first matching with candidate control over every introduction
- Candidate-confirmed career-start, retention, and mobility outcomes
- Public industry-claim research queue with evidence review and right of reply
- Source-backed cannabis-custody registry with a two-source, two-reviewer publication gate
- Charts, funnels, targets-versus-actuals, state access, exports, corrections, and audit-ready operations

## Publish to GitHub Pages

Start with `START_HERE.md`. The repository is configured for:

`https://zsend.github.io/AzroTest/`

## Test access

Open `ops.html` and enter:

`pilot-admin`

The visible preview banner means the build is in browser-local acceptance-test mode. Use fictional information only. A fresh browser starts with zero people, zero employers, zero jobs, zero registry records, and zero outcomes.

## Production boundary

GitHub Pages is the public presentation layer. It is not an appropriate data plane for real candidate identities, contact information, custody records, legal documents, or employer evidence. Real operations require the secure remote API, database, identity controls, encryption, review staffing, and legal/security gates specified in `PRODUCTION_DATA_PLANE.md` and `GO_LIVE_CHECKLIST.md`.

## Core documents

- `BRAND_AND_MISSION.md` — brand, narrative, language, and mission
- `PROOF_STANDARD.md` — what earns public credit and what does not
- `PRODUCTION_DATA_PLANE.md` — architecture and production deployment path
- `API_CONTRACT.md` — frontend-to-backend contract
- `LAUNCH_PLAN.md` — first 90 days and Founding 50 × 2 execution
- `ACCEPTANCE_TEST_REPORT.json` — 50 automated end-to-end checks

- `production/schema.sql` — PostgreSQL production data model and proof-gate invariants
- `production/openapi.yaml` — production API contract for public, candidate, and operator clients
