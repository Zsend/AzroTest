# Production Architecture

## Design principle

The public registry and private career network are separate products with separate security domains. The platform must never become a conviction-screening database for employers.

## Target topology

```text
Public web/CDN
  ├── Registry API (public, cached, source-linked)
  ├── Jobs and verified-employer API (public, cached)
  └── Talent snapshots (opt-in, public-safe only)

Private application gateway
  ├── Candidate Passport service
  ├── Navigator/case-management service
  ├── Employer and role workflow
  ├── Consent and introduction service
  ├── Match service
  └── Outcomes and grievance service

Research/operations boundary
  ├── Records-request tracker
  ├── Source document vault
  ├── Extraction and offense crosswalk workers
  ├── Identity resolution
  ├── Two-reviewer publication workflow
  └── Release/status monitoring workers

Shared platform services
  ├── Identity provider with MFA
  ├── Event bus/queue
  ├── KMS/secret manager
  ├── Audit/event store
  ├── Object storage and malware scanning
  ├── Observability/security monitoring
  └── Analytics warehouse with privacy controls
```

## Production services

### Public application

- Static assets on a CDN
- Read-only public API behind cache and WAF
- No direct access to restricted candidate, source-document, or reviewer databases
- Strict rate limits, bot detection, and named-person bulk-download controls
- Public corrections channel that writes to a separate intake queue

### Candidate application

- Passwordless magic-link or passkey authentication
- Candidate session revocation and device history
- Field-level encryption for sensitive data
- Visibility and consent ledger
- Export, correction, withdrawal, deletion, and secure-link rotation
- Separate consent events for matching, introduction, public profile, story/media, and relocation

### Employer application

- Verified organization domain and named users
- Role-based access for executive sponsor, recruiter, hiring manager, and reporter
- Compact version acceptance
- Role submission and jurisdiction review
- Candidate introductions only after candidate consent
- No registry search or conviction-based filtering
- Outcome reporting, complaints, and status enforcement

### Registry operations

- Immutable source fingerprint/checksum
- Source type, retrieval time, effective date, and supported fields
- Operative-judgment and sentence-component model
- Offense/statute crosswalk with historical versions
- Current custody episode and release taxonomy
- Independent reviewer identities and decision checklist
- Publication gate enforced in code
- Public change log and restricted full audit history

## Data stores

Use separate managed Postgres databases or at minimum separate clusters/schemas and credentials:

1. **Registry research:** identity resolution, sentence reconstruction, restricted source metadata
2. **Public registry:** only approved public fields and public-safe source references
3. **Career network:** candidate Passport, preferences, consent, services, matches, outcomes
4. **Employer network:** organizations, users, compact, roles, reviews, reporting
5. **Audit/events:** append-only security and business events
6. **Analytics:** de-identified/aggregated reporting with small-cell suppression

Store source documents and candidate uploads in separate encrypted object-storage buckets. Use per-environment and per-domain KMS keys. No employer-facing join key should connect a public registry person to a candidate Passport.

## Core event model

Publish idempotent events such as:

- `candidate.intake_received`
- `passport.updated`
- `passport.visibility_changed`
- `passport.submitted`
- `employer.verified`
- `job.approved`
- `match.suggested`
- `candidate.introduction_approved`
- `interview.confirmed`
- `offer.confirmed`
- `career_start.confirmed`
- `retention.check_completed`
- `registry.source_received`
- `registry.review_completed`
- `registry.record_published`
- `custody.status_changed`
- `correction.opened`
- `correction.resolved`

Events drive notifications, analytics, audit, and workflow. They must not contain unnecessary PII.

## Source connectors

Each jurisdiction adapter implements:

- Authentication/access method
- Stock-file or locator acquisition
- Delta or polling schedule
- Data dictionary and offense mapping
- Raw payload checksum and immutable storage
- Parser version
- Field-level quality checks
- Source freshness and outage status
- Idempotent upsert key
- Human-review queue creation

Do not bypass terms, access controls, robots restrictions, or statutes. Prefer negotiated extracts and records requests to brittle scraping.

## Matching

Production matching should combine:

- O*NET-normalized occupation/skill vectors
- Candidate-stated roles, skills, evidence, preferences, and compensation floor
- Job duties, skills, schedule, location, compensation, and pathway
- Explainable deterministic rules plus optional ranking model

Conviction detail remains excluded. Legal/licensing review runs after a potential match and returns a role-specific status: eligible, likely eligible, counsel review, alternative pathway, not eligible for this role, or unknown. An automated score never makes an adverse employment decision.

## Identity and access

- Workforce SSO with phishing-resistant MFA
- Candidate passkeys or time-limited magic links
- Just-in-time privileged access
- Least-privilege roles: intake, navigator, employer reviewer, registry researcher, independent reviewer, publisher, privacy, security, auditor
- Quarterly access review
- Immediate revocation on separation
- Break-glass access with approval and alerting

## Security controls

- TLS 1.2+ and HSTS
- Managed WAF and distributed rate limiting
- KMS-backed field and object encryption
- Secret manager; no long-lived secrets in code or `.env` in production
- Dependency, container, SAST, and secret scanning
- Malware scanning and content-type validation for uploads
- Centralized logs, SIEM alerts, and immutable audit retention
- Encrypted backups, point-in-time recovery, and restore exercises
- Annual penetration test and remediation SLA
- Incident response, breach analysis, and notification decision tree
- Data retention and deletion worker
- Vendor security review and data-processing agreements

## Reliability targets

- Public read API availability: 99.9%
- Private workflow availability: 99.5% during pilot, 99.9% after scale
- Recovery point objective: 15 minutes
- Recovery time objective: 4 hours
- Critical correction acknowledgment: same day
- Status-source outage alert: 15 minutes
- Near-release known-ID polling: daily or event-triggered
- Standard in-custody status: weekly; stable long sentence: monthly

## Analytics privacy

- Suppress public cohort slices below a configurable minimum, initially 10
- Avoid intersections that permit re-identification
- Separate actual outcomes, pipeline, targets, estimates, and coverage
- Do not expose candidate-level match or failure reasons
- Require consent and governance review for research extracts
- Use differential privacy or stronger statistical disclosure controls for future high-dimensional reporting

## Pilot-to-production migration

The included repository is a controlled-pilot implementation using SQLite and a shared admin token. Before unrestricted launch:

1. Migrate to managed Postgres
2. Replace bearer-token administration with named SSO/MFA users
3. Move encryption to KMS envelope encryption
4. Add object storage and document malware scanning
5. Add queue workers and jurisdiction connector framework
6. Add transactional email/SMS and CRM/case-management integration
7. Add centralized audit and security monitoring
8. Add automated retention/deletion and legal holds
9. Complete threat model, penetration test, accessibility audit, privacy review, and counsel sign-off
10. Run a private pilot and incident/correction tabletop before publication
