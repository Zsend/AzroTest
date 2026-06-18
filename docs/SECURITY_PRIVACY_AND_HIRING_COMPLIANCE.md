# Security, Privacy, and Hiring Compliance

## Architectural separation

Operate the public registry and private career network as separate security domains in production:

- Separate databases or schemas
- Separate encryption keys
- Separate administrator roles
- No employer-facing join key
- No automatic registry-to-candidate conversion
- Candidate consent before identity introduction
- Restricted linkage table only when the person affirmatively opts in

## Data minimization

Do not collect or publish:

- Social Security number
- Home address
- Exact release destination
- Medical or treatment records
- Immigration status unless a qualified workflow lawfully requires it
- Mugshot
- Family-member details unrelated to service delivery
- Full date of birth in public fields
- Privileged legal communications

## Hiring design

- Candidate profiles are skills-first.
- Conviction details are excluded from the match score.
- Employers do not use Justice Grows as a conviction-screening database.
- Any background report ordered by an employer is handled under the employer’s FCRA and state-law process.
- The platform does not automatically reject candidates.
- Jurisdiction eligibility is decision support and requires human/legal review.
- Automated matching reasons are visible and can be overridden by a case manager.

## Production controls

1. Managed Postgres with encryption, point-in-time recovery, and restricted network access
2. KMS-managed field encryption with rotation and separation of duties
3. SSO/MFA and role-based access
4. Immutable security/audit event stream
5. Object storage with malware scanning and signed access for source documents
6. WAF, rate limits, bot controls, and abuse monitoring
7. Secret manager and deployment identity
8. Central logging, uptime/error monitoring, and alert escalation
9. Dependency, container, and code scanning
10. Annual penetration test plus remediation tracking
11. Incident response and breach-notification decision tree
12. Tested deletion, legal hold, export, correction, and key-rotation procedures

## Pilot limitations in this repository

- SQLite rather than Postgres
- One shared admin bearer token rather than named users/MFA
- Process-local rate limiting rather than distributed limits
- No document upload/object store
- No email verification or magic-link authentication
- No immutable external audit store
- No automated data-retention worker

These limitations are acceptable for controlled internal piloting, not unrestricted national production.

## Legal review checklist

- Federal and state employment discrimination
- FCRA and state consumer-reporting law
- Ban-the-box/fair-chance requirements
- State privacy and data-broker rules
- Cannabis licensing and occupational restrictions
- Public-record republication and correction risk
- Defamation, false light, negligence, and safety
- Nonprofit charitable solicitation and cause marketing
- Accessibility and consumer-protection claims
- Automated employment decision-tool laws
- Cross-state relocation, supervision, and legal-services boundaries
