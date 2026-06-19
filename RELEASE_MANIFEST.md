# Justice Grows release manifest

**Release:** `2026.06.18-github-pages.2`  
**Target:** `https://zsend.github.io/AzroTest/`  
**Publication mode:** Browser-local GitHub Pages acceptance test  
**Default records:** Zero people, zero employers, zero jobs, zero registry records, zero placements

## Release purpose

This package is the publishable test release for Justice Grows: a consent-based cannabis justice registry and career-mobility platform built around the mission **Freedom. Work. Ownership.**

The public test site exercises the complete product workflow without collecting data on a shared server. All test records stay in one browser profile and must be fictional.

## Included product surfaces

- Responsive mission and operating-model homepage
- Actual-versus-target impact dashboard, funnel, coverage views, and privacy-suppressed talent insights
- Candidate intake and candidate-owned Mobility Passport
- Optional public skills, work, goals, ambitions, and portfolio profile
- Employer Fair Chance Compact application and verification workflow
- Paid-role intake, review, publication, expiration, and job board
- Skills-first matching that excludes conviction detail from scoring
- Candidate-controlled introduction decisions
- Private custody/case referral intake
- Registry drafts, source provenance, six required verification checks, and two-distinct-reviewer publication gate
- Release/status monitoring fields and public freshness statements
- Correction, dispute, partner, outcome, CSV export, and reset workflows
- Browser-test operations console
- Privacy, methodology, terms, 404, PWA manifest, social image, icons, sitemap, and robots controls
- Separately deployable FastAPI controlled-pilot backend
- National data, employer, privacy, legal, verification, and launch playbooks

## Acceptance evidence

The release was checked on June 18, 2026.

- `python scripts/check_release.py`: **passed**
  - 19 required public files
  - 9 HTML pages, local links, unique IDs, images, and inline/external JavaScript
  - correct `/AzroTest/` configuration
  - empty browser database
  - no runtime database, private key, or environment file
- `pytest -q` in `backend/`: **3 passed**
- Headless Chromium acceptance workflow: **passed**
  - candidate intake and Passport completion
  - separate public-profile consent and staff moderation
  - employer application and verification
  - paid-role publication
  - skills-first match score: 97 in the fictional acceptance case
  - premature registry publication correctly rejected with HTTP 409
  - two documented sources and two complete, distinct reviews required before publication
  - public talent, jobs, registry, metrics, Passport, operations console, desktop, and mobile surfaces rendered successfully
- Desktop Mobility Passport regression fixed: mobile-only navigation is hidden from the desktop grid.

See `BROWSER_TEST_REPORT.json` and `previews/` for the generated acceptance artifacts. Those fictional test artifacts are not copied into the GitHub Pages deployment.

## Publication boundary

The GitHub Pages build is safe only for public testing with fictional information. GitHub Pages cannot run the included FastAPI service. Real candidate, custody, employer-contact, correction, or legal-document intake requires the separately deployed production data plane and every blocking control in `GO_LIVE_CHECKLIST.md`.

The included backend is a controlled-pilot implementation, not the final national-scale security architecture. National production requires managed PostgreSQL, named operator accounts, SSO/MFA, KMS-backed encryption, durable queues, restricted source-document storage, centralized security logging, tested recovery and incident response, counsel-approved policies, trained reviewers and navigators, and staffed high-risk corrections.

## Deployment behavior

`.github/workflows/pages.yml` validates the repository and publishes only the approved public frontend files into the Pages artifact. It excludes `backend/`, `docs/`, `templates/`, tests, previews, and operational materials.

Read `DEPLOY_TO_AZROTEST.md` before replacing the current site. Preserve and tag the existing AzroTest release first.
