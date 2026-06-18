# Justice Grows Release Manifest

**Release date:** June 18, 2026  
**Release class:** Controlled-pilot / private-beta application  
**Working brand:** Justice Grows — Freedom. Work. Ownership.

## Delivered system

- Responsive public mission and live-data site
- Candidate-owned Mobility Passport with skills, work history, goals, ambitions, portfolio, compensation, mobility, visibility, and match decisions
- Candidate-consented public talent pages with no contact, custody, or conviction data
- Fair Chance Employer Coalition intake, verification, real-role approval, and proof tiers
- Skills-first matching that deliberately excludes conviction detail
- Source-linked cannabis-custody registry with two-reviewer publication gate
- Corrections, disputes, status monitoring, analytics, charts, CSV export, and audit events
- Private operations console
- State Access Engine covering 50 states, D.C., and the federal system
- Deployment, data, legal, security, employer-demand, brand, funding, and operating playbooks

## Data integrity at delivery

A fresh deployment contains no fabricated candidates, public profiles, employers, jobs, matches, registry records, placements, or impact outcomes. Live public metrics are computed from the database and start at zero. Twelve-month targets are stored and displayed separately from actuals.

No runtime database, development encryption key, administrator token, or environment-secret file is included in the release package.

## Validation completed

- Python compilation: passed
- Automated API/workflow suite: 3 tests passed
- Production-configuration live smoke test: 9/9 routes passed
- Release-archive extraction and SHA-256 verification: passed
- JavaScript syntax: passed for public site, Passport, talent page, operations console, and self-contained visual preview
- HTML structural audit: no duplicate IDs; every image has an `alt` attribute
- Fresh-production-database assertion: every real activity metric equals zero or null
- Docker Compose YAML parse: passed
- Security-header check: CSP, HSTS in production, private-route `no-store`, private-route `noindex`, and same-origin resource policy present
- Proxy-header hardening: application rate limiting uses the trusted ASGI client address rather than raw client-supplied forwarding headers

## Intentionally not represented as complete

- The application has not been deployed to a public domain from this environment.
- The container image was not built here because Docker is unavailable in the execution environment; Dockerfile and Compose configuration are included and YAML-validated.
- External penetration testing, managed-cloud configuration review, trademark clearance, jurisdiction-by-jurisdiction legal opinions, and WCAG 2.2 AA audit remain launch gates.
- Authoritative national records and committed jobs require the operating organization, records requests, court/corrections verification, employer contracting, reviewers, navigators, counsel, and production infrastructure described in the included plans.

## Primary entry points

- `README.md` — product, local run, boundaries, and repository map
- `justice-grows-static-preview.html` — self-contained visual preview with truthful zero-state data; submissions are intentionally disabled
- `app/main.py` — FastAPI application, schema, encryption, matching, registry, analytics, and APIs
- `app/static/index.html` — public responsive experience
- `app/static/profile.html` — secure Mobility Passport
- `app/static/admin.html` — private operations console
- `docs/PRODUCTION_LAUNCH_CHECKLIST.md` — go/no-go standard
- `docs/EMPLOYER_DEMAND_ENGINE.md` — role-acquisition system
- `docs/CANDIDATE_MOBILITY_PASSPORT.md` — candidate profile and consent standard
- `docs/DATA_AND_VERIFICATION_STANDARD.md` — registry evidence standard
- `docs/PRODUCTION_ARCHITECTURE.md` — national-scale target architecture
