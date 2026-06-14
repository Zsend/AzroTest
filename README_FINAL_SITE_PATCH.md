# AZRO Final Brand-Preserving Site Patch

Date: 2026-06-14

## What this is

This is a brand-preserving final site patch built from the actual AZRO current/WIP HTML shell available in the system.

It does not invent a new visual system.

It preserves the current AZRO CSS/JS/asset references by using absolute `https://azrosystems.com/...` URLs so the package renders correctly when opened locally and when overlaid onto the live site root.

## Added pages

- `proof.html`
- `benchmark.html`
- `proof-archive.html`

## Updated routing

- `Proof` now points to `proof.html`.
- `Resources` points to `resources.html`.
- `resources.html` includes a proof-system section linking to the proof hub, BTC benchmark, and proof archive.

## Existing pages included

- `index.html`
- `philosophy.html`
- `products.html`
- `features.html`
- `pricing.html`
- `resources.html`
- `support.html`
- `about.html`
- `contact.html`
- `404.html`

## Deployment instruction

Upload these files to the existing AZRO site root. Do not delete the current asset folders, CSS, JS, PDFs, images, or videos. This patch depends on the current AZRO site assets already present at azrosystems.com.

## Proof entry policy

The benchmark and archive pages use safe placeholders for the first public entry. Do not invent numbers. Add the first real weekly proof entry only after the internal proof record is created and founder-approved.

## QA

See `QA_REPORT.json`.

Current generated QA status: pass.
