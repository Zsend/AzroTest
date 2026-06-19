# Testing

## Release validation

```bash
python scripts/check_release.py
```

The validator checks required files, local links, unique IDs, image alt text, JavaScript syntax, empty default state, GitHub Pages configuration, proof-page publication, and common secret/runtime files.

## Browser acceptance

The release passed 50 end-to-end checks. Results are in `ACCEPTANCE_TEST_REPORT.json`.

Coverage includes:

- Verified-zero public state
- Candidate, employer, job, claim, and registry workflows
- Candidate-owned Passport and separate story rights
- Moderated public talent snapshot
- Employer and job proof gates
- Skills-first matching and candidate consent
- Candidate-confirmed start, retention, and mobility
- Industry-claim evidence and right-of-reply gates
- Two-source/two-reviewer registry gate
- Metrics, public ledgers, operations console, JavaScript errors, and desktop/mobile overflow

The acceptance script is `scripts/acceptance_test.py`. It requires Python Playwright and Chromium and must be run against a local HTTP server. It creates only fictional browser-local records.
