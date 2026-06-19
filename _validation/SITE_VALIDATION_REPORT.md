# A Right For All — Final Public Site Validation Report

Build: public site v12.0  
Validated: 2026-06-18

## Scope

The final static site includes the movement homepage, letters archive, nine typed letter-excerpt pages, the Free Floor standard, The Minds We Miss, sustainability, national-scale strategy, evidence, the Unusual Thinkers Challenge, and a custom 404 page.

## Responsive browser audit

Playwright checks were run at:

- 1440 × 1000
- 1024 × 768
- 390 × 844

Across the eight core public pages:

- horizontal overflow: 0
- missing local targets: 0
- missing internal anchors: 0
- browser console errors: 0
- unlabeled form fields: 0
- images missing alt text: 0
- mobile menu test: passed

## Motion and sticky behavior

- the Advisor / Professional Input section begins unrevealed and transitions to fully visible when scrolled into view;
- all four right-side contribution cards reveal correctly;
- the Unusual Thinkers first phase lets the left cards move through the viewport while the right mission panel remains sticky;
- the left challenge flow has no internal scrollbar;
- the second challenge phase keeps the Challenge Map sticky while the right-side work packet scrolls;
- reduced-motion preferences disable animations and parallax.

## Challenge functionality

The challenge logic was tested with browser-like local storage:

- track selection reveals two track-specific prompts;
- candidate and problem-judgment answers populate the packet preview;
- Markdown and JSON export handlers are present;
- all question fields have associated labels;
- live production uses browser local storage only; no answer is sent by the static site.

## Static production audit

Eighteen HTML pages were checked for:

- duplicate IDs;
- broken local assets;
- broken anchor links;
- missing descriptions and viewports;
- missing canonical links, except the intentionally no-index 404;
- images without explicit dimensions;
- images without alternative text;
- form fields without labels;
- external new-tab links without `noopener`;
- missing site CSS or JavaScript.

All checks passed.

## Performance and deployment hardening

- hero evidence image preloaded and served in WebP with JPEG fallback;
- secondary images use async decoding and lazy loading where appropriate;
- explicit image dimensions reduce layout shift;
- system fonts avoid external font blocking;
- canonical links, Open Graph metadata, Twitter metadata, JSON-LD, sitemap, robots, manifest, icons, and GitHub Pages CNAME are included;
- site is static and does not require a server-side runtime.

## Evidence preservation

- 21 original letter PDFs
- 21 letter preview images
- 9 typed letter-excerpt pages
- founder-provided tablet evidence images

## Launch boundary

The package is technically deployable. Public launch still requires the founder’s final approval and completion of the project’s rights, privacy, provenance, and legal review for names, letters, PDFs, excerpts, and the founder-provided image.
