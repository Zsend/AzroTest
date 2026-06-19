# Frontend API contract

All endpoints are relative to `apiBase`. Production uses HTTPS, JSON, server-side authorization, request IDs, rate limits, and structured errors.

## Public read endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/public/metrics` | Actual outcomes, separate 12-month targets, timestamp, disclosure |
| GET | `/api/public/coverage` | Jurisdiction coverage and freshness |
| GET | `/api/public/jobs` | Published, unexpired, verified paid roles |
| GET | `/api/public/talent` | Candidate-approved moderated snapshots only |
| GET | `/api/public/talent/{slug}` | One candidate-approved public snapshot |
| GET | `/api/public/employers` | Opt-in employer proof ledger |
| GET | `/api/public/claims` | Completed neutral claim findings only |
| GET | `/api/public/registry` | Minimized published registry fields only |
| GET | `/api/public/talent-insights` | Privacy-thresholded aggregate demand/supply insights |

## Public intake endpoints

| Method | Path | Required protection |
|---|---|---|
| POST | `/api/intake/candidate` | CAPTCHA, rate limit, consent version, encryption |
| POST | `/api/intake/employer` | Signatory identity, compact version, rate limit |
| POST | `/api/intake/job` | Employer linkage, compensation and role validation |
| POST | `/api/intake/case` | Restricted queue; no automatic publication |
| POST | `/api/intake/claim` | HTTPS public source; private research lead only |
| POST | `/api/intake/correction` | Priority routing and immediate freeze capability |
| POST | `/api/intake/partner` | Contact consent and spam controls |

## Candidate endpoints

Candidate endpoints require a real authenticated session or a short-lived, revocable capability token. Never place long-lived production access secrets in URL fragments.

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/api/candidate/profile` | Read and update private Mobility Passport |
| POST | `/api/candidate/profile/submit` | Submit current version for moderation |
| POST | `/api/candidate/profile/hide` | Immediately remove public snapshot |
| POST | `/api/candidate/profile/rotate-key` | Revoke prior capability and issue replacement |
| GET | `/api/candidate/matches` | Candidate’s private skills-first opportunities |
| POST | `/api/candidate/matches/{id}/decision` | Candidate approves or declines introduction |

## Operator endpoints

Operator endpoints require named accounts, MFA, least privilege, and audit logging.

- `/api/admin/overview`
- `/api/admin/submissions/{queue}`
- `/api/admin/profiles/{id}/moderate`
- `/api/admin/employers/{id}/verify`
- `/api/admin/jobs/{id}/publish`
- `/api/admin/matches/{id}/stage`
- `/api/admin/matches/{id}/outcomes`
- `/api/admin/claims/{id}/status`
- `/api/admin/registry`
- `/api/admin/registry/{id}/sources`
- `/api/admin/registry/{id}/reviews`
- `/api/admin/registry/{id}/publish`
- `/api/admin/corrections/{id}/status`
- `/api/admin/export/{queue}.csv`

## Required server-side invariants

1. An employer cannot publish a job before verification.
2. A public profile requires separate candidate consent and staff moderation.
3. Story interest is never treated as publication consent.
4. A candidate introduction requires candidate approval.
5. Public starts, retention, and mobility require candidate confirmation.
6. Retention or mobility cannot precede a verified start.
7. A public claim finding requires a final disposition, specific evidence note, and completed right of reply.
8. A registry record requires supported/confirmed confidence, two sources, one authoritative source, two distinct complete approvals, and no unresolved hold/reject.
9. Public endpoints return no private contact, conviction, custody-document, reviewer, or internal-note fields.
10. Every mutation writes an immutable audit event.
