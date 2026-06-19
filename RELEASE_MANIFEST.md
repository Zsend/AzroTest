# Justice Grows release manifest

**Release:** `2026.06.19-proof-layer.6`  
**Target:** `https://zsend.github.io/AzroTest/`  
**Mode:** Browser-local public acceptance test  
**Default records:** Zero people, employers, jobs, registry records, claim findings, placements, and outcomes

## Product thesis

**Claims are signals. Outcomes are proof.**

Zero is rendered as a verified baseline, not a broken job board. Public credit is earned through a visible progression from employer application to policy verification, paid role, candidate-approved introduction, candidate-confirmed start, retention, and mobility.

## Included surfaces

- Responsive proof-first mission website
- Public employer and outcome ledger
- Public industry-claim findings ledger
- Candidate intake and private Mobility Passport
- Candidate-authored skills, work, goals, ambition, and portfolio
- Optional moderated public talent profiles
- Fair Chance Employer Compact including separate story-rights protection
- Paid-role review and publication
- Skills-first matching and candidate-controlled introductions
- Candidate-confirmed starts, retention, and mobility
- Cannabis-custody referral and evidence registry
- Two-source, authoritative-source, two-reviewer publication gate
- Coverage, funnels, actuals-versus-targets, exports, corrections, and responsive operations console
- Methodology, privacy, terms, 404, manifest, sitemap, icons, and social card
- PostgreSQL production schema and OpenAPI 3.1 build contract

## Design verification

- Unified spacing and type scale
- Balanced cards, forms, controls, and section rhythm
- 44-pixel minimum primary touch targets
- Visible keyboard focus states
- No page-level horizontal overflow at 1440 × 1000 or 390 × 844
- Responsive public site, proof ledger, Passport, and operations console

## Automated acceptance result

`ACCEPTANCE_TEST_REPORT.json` records **50 of 50 passing checks** with zero JavaScript page errors, including:

- Fresh verified-zero state
- Candidate UI intake and 100% Passport completion
- Public-profile consent and moderation
- Sensitive-field exclusion from public talent
- Mandatory employer story-rights commitment
- Employer verification before job publication
- 100% fictional skills-first match
- Candidate-controlled introduction
- Candidate-confirmed start, 180-day retention, and promotion
- Mobility-verified employer proof level
- Private industry-claim lead
- Evidence-note and right-of-reply publication gates
- Registry publication blocked before evidence and reviewer requirements
- Registry publication permitted after two sources and two complete independent approvals
- Correct public metrics and responsive layouts

## Publication boundary

This release is ready for GitHub Pages acceptance testing with fictional data. It is not approved for real sensitive-data collection while `config.js` uses `mode: "local"`. Real operations require the secure data plane and all blocking controls in `GO_LIVE_CHECKLIST.md`.
