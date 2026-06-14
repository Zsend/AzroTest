# AZRO Brand-Preserving Proof Site Publish Candidate

Date: 2026-06-14

## Status

Publish candidate / proof-site patch candidate.

## What is included

This package includes:

- current AZRO WIP/current-shell HTML pages fetched from the system for:
  - index
  - philosophy
  - products
  - features
  - pricing
  - resources
  - support
- new brand-preserving proof pages:
  - proof.html
  - benchmark.html
  - proof-archive.html
- CNAME
- .nojekyll

## Important limitation

This package does not include binary assets, PDFs, CSS, JavaScript, videos, or images. It preserves references to existing AZRO site assets such as:

- site-core.css
- site-resources.css
- site-home.css
- site-products.css
- site-features.css
- site-pricing.css
- site-philosophy.css
- site-support.css
- script.js
- PDFs/assets/videos/images

For safe deployment, overlay these HTML files onto the current AZRO production site root that already contains the current assets/docs.

Do not use this as a destructive replacement that deletes existing assets.

## Proof doctrine

Show accountability, not secret sauce.

Do not publish any page if it reveals Pine source, thresholds, formulas, trigger logic, exact timing recipes, raw chart exports, internal proof files, proof-facts bodies, customer/private material, or reverse-engineerable examples.

## Final manual QA required

- Open proof.html
- Open benchmark.html
- Open proof-archive.html
- Open resources.html
- Confirm CSS/assets load from current site root
- Confirm pricing/trial links work
- Confirm risk disclosure links work
- Confirm current docs are preserved
- Confirm no old version regression
- Founder final approval required
