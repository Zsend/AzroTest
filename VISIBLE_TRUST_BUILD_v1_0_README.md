# AZRO visible trust build v1.0

This build makes Proof Shield, Brand Trust Standards, and the public ledger visibly discoverable from the homepage, the primary navigation, and the Proof/resources page.

## What changed from v0.9

- Added top-nav links: Proof Shield and Standards.
- Added a visible homepage trust section with links to:
  - proof-shield.html
  - brand-standards.html
  - proof-ledger/index.json
- Added a visible Trust System block near the top of resources.html.
- Preserved the preview/production split:
  - Preview build keeps noindex/noarchive and no CNAME.
  - Production build keeps CNAME and production canonical/social URLs.

## Deployment

Copy the contents of the extracted folder into the appropriate GitHub Pages repository root.
Do not upload private ledgers, salts, raw alerts, Pine/source files, reviewer notes, or legal notes to any public repo.
