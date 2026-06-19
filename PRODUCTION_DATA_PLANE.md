# Production data plane

## Architecture

GitHub Pages remains the public static frontend. Real data must flow to a separately deployed, access-controlled API.

```text
GitHub Pages frontend
        |
        | HTTPS + strict CORS
        v
API gateway / WAF / rate limiting
        |
        v
Application API
  |        |         |
  |        |         +-- background jobs / source monitors
  |        +------------ encrypted object storage for evidence
  +--------------------- managed PostgreSQL
        |
        +-- identity provider, MFA, RBAC, audit log, alerts
```

## Recommended production components

- Static frontend: GitHub Pages or equivalent CDN
- API: containerized FastAPI/Node service or managed edge functions
- Database: managed PostgreSQL with point-in-time recovery
- Evidence storage: private encrypted object storage with short-lived signed URLs
- Authentication: named operator accounts, MFA, SSO where practical, role-based access
- Secrets: managed KMS/secret vault; never repository variables or browser storage
- Queue: managed task queue for source checks, notifications, exports, and retries
- Monitoring: structured logs, error tracking, uptime checks, security alerts, immutable audit events
- Email/SMS: transactional provider with consent, suppression, and delivery logging
- Bot controls: CAPTCHA, rate limits, abuse detection, attachment scanning

## Security boundaries

Separate at least four data domains:

1. **Public:** approved jobs, public talent snapshots, aggregate metrics, employer proof, neutral claim findings, minimized registry fields
2. **Candidate private:** identity, contact, work preferences, private Passport, introduction decisions, support needs
3. **Evidence restricted:** court and corrections documents, commitment analysis, claim research, reviewer notes, corrections
4. **Operations:** user accounts, roles, audit events, incident records, exports, legal holds

Conviction and custody fields must never be returned through employer-facing match endpoints. Employers receive a candidate only after candidate consent and staff pathway review.

## Environment configuration

When the API is operational, copy `config.production.example.js` to `config.js` and set:

```js
mode: "remote",
apiBase: "https://api.YOUR-DOMAIN.example",
siteUrl: "https://YOUR-DOMAIN.example/",
showLocalModeWarning: false
```

The remote API must implement `API_CONTRACT.md`, enforce server-side validation, and return only the fields authorized for the caller.

## Non-negotiable launch controls

- Encryption in transit and at rest
- Named accounts and MFA; no shared admin token
- Least privilege and periodic access review
- Centralized append-only audit log
- Database backups and tested restoration
- Data retention and deletion workflow
- Consent versioning and withdrawal
- Candidate identity verification appropriate to risk
- Two-reviewer registry publication enforced server-side
- Right-of-reply workflow enforced server-side
- Candidate confirmation required for public outcomes
- Field-level provenance for registry claims
- Immediate profile hide and record pause controls
- Security, privacy, employment, publication, and cannabis-regulatory review
- Incident response and high-risk correction staffing

## Deployment sequence

1. Deploy an empty staging database and API.
2. Run contract, authorization, abuse, accessibility, and recovery tests.
3. Connect a staging copy of the frontend using remote mode.
4. Complete a fictional end-to-end workflow with named operator accounts.
5. Complete legal, privacy, and security sign-off.
6. Pilot with a small consented cohort and no public registry names.
7. Measure reviewer disagreement, correction time, employer response, and candidate experience.
8. Open public intake only after operational service levels are consistently met.

## Production service levels

- High-risk privacy or identity issue acknowledged within 4 hours; field paused immediately when credible
- Other correction requests acknowledged within 1 business day
- Employer role reviewed before publication and rechecked at expiration
- Public employer proof refreshed after every verified event
- Registry status checked on a source-specific cadence and visibly timestamped
- Candidate profile hide effective immediately
- Security incident triage available at all times once real sensitive data is accepted
