# Justice Grows release manifest

**Release:** `2026.06.19-github-pages.3`  
**Target:** `https://zsend.github.io/AzroTest/`  
**Mode:** Browser-local public acceptance test  
**Default records:** Zero people, employers, jobs, registry records, placements, and outcomes

## Product surfaces

- Responsive mission and public-impact site
- Candidate intake and private Mobility Passport
- Candidate-approved public skills, work, goals, ambitions, and portfolio profiles
- Fair-chance employer application and verification
- Paid-role review and publication
- Skills-first matching with candidate-controlled introductions
- Cannabis-custody referral and evidence registry
- Source provenance, correction workflow, and two-reviewer publication gate
- Release/status fields, jurisdiction coverage, graphs, funnels, and CSV exports
- Responsive operations console
- Methodology, privacy, terms, 404, manifest, sitemap, icons, and social card

## Design quality pass

- Unified spacing scale across every page
- Readable minimum type sizes on public, candidate, and operator surfaces
- Consistent card padding, border radii, buttons, forms, and section rhythm
- 44-pixel minimum interactive targets
- Keyboard focus states
- No horizontal overflow at tested desktop and mobile widths
- Responsive homepage, Passport, talent profile, operations console, and policy pages

## Verification completed June 19, 2026

- `python scripts/check_release.py`: passed
- JavaScript syntax checks: passed
- Full browser-local workflow: passed
  - candidate intake
  - 100% Passport completion and submission
  - public-profile moderation
  - employer verification
  - paid-role publication
  - 95% fictional skills-first match
  - candidate match consent
  - career-start outcome
  - premature registry publication blocked with HTTP 409
  - publication permitted only after two sources and two distinct complete reviews
  - public metrics, jobs, registry, and admin overview updated correctly
- Page errors in the acceptance run: zero

See `ACCEPTANCE_TEST_REPORT.json` for machine-readable results.

## Publication boundary

The GitHub Pages release is ready for public testing with fictional records. It must not collect real sensitive information while `config.js` uses local mode. Real operations require the secure data plane and every blocking control in `GO_LIVE_CHECKLIST.md`.
