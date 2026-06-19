# Testing

## Automated release check

```bash
python scripts/check_release.py
```

This checks required files, local links, unique IDs, image alt attributes, JavaScript syntax, empty default state, GitHub Pages configuration, and common secret/runtime files.

## Verified end-to-end path

The current release passed the complete browser-local workflow documented in `ACCEPTANCE_TEST_REPORT.json`: candidate intake, Passport, public-profile review, employer verification, paid role, matching, candidate consent, outcome tracking, registry evidence, independent reviews, publication gate, and public metrics.

## Manual test

Use the 12-step acceptance path in `DEPLOY_TO_AZROTEST.md`. Use fictional information only.
