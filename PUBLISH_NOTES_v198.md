# Reserve Standard v198 — final proof spacing + responsive polish

Date: 2026-06-14
Package: `ReserveStandard_v198_final_customer_ready_spacing_proof_2026-06-14.zip`

## Status

Customer-ready publish candidate. Supersedes v197.

## What changed from v197

- Rebuilt the future-scenario proof section from a table-style matrix into responsive, brand-consistent scenario cards.
- Removed the broken scenario-table behavior shown in review screenshots.
- Reworked the private-access pricing note into a balanced card so text is not smashed against adjacent sections.
- Added proof-page spacing rules for consistent vertical rhythm between headings, copy, cards, notes, pricing, proof sections, and final CTA.
- Preserved the cleaner single weekly budget range: `$20–$5,000/week`.
- Added responsive spacing and card behavior for desktop, tablet, and mobile widths.
- Kept the TradingView script button on `get-set-up.html` from v196.
- Preserved v197 access-code behavior and did not change `site-config.js`.

## What did not change

- No access-code change.
- No `site-config.js` change.
- No gate logic change.
- No form endpoint change.
- No pricing change.
- No unsupported proof numbers added.
- No public founding price or public discount language added.
- No redesign of the stable site foundation.

## QA performed

- JavaScript syntax checks passed for `gate.js`, `script.js`, `contact.js`, and `site-config.js`.
- Internal links and asset references resolve.
- `site-config.js` is identical to v197.
- Proof page rendered via an inline browser harness at 390, 768, 1024, 1440, and 1920px for layout inspection.
- ZIP integrity test passed.
- SHA256 checksum generated.

## Publish instruction

Upload `ReserveStandard_v198_final_customer_ready_spacing_proof_2026-06-14.zip` to the existing Cloudflare Pages project as a new production deployment.

After publish, check:

1. Old access code works.
2. `/proof.html` spacing, scenario cards, pricing note, and mobile layout are clean.
3. `/get-set-up.html` still includes the TradingView script button.
4. Request-access CTAs work.
5. No public founding-price or unsupported proof-number language appears.

