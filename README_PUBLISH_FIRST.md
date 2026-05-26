# Reserve Standard site package V82

This is the final customer-ready static site build generated from the v81 launch package, with the final motion-direction, proof-legibility, footer-balance, and private-gate focus refinements applied.

## Publish rule
Replace the entire contents of your static hosting directory with this package. Do not merge these files with older CSS, JS, HTML, or assets.

## What changed in V82
- Made the scroll-loaded cards behave more professionally: Asset / Problem / System and Operator Materials / Next Step now reveal as the customer scrolls down, then keep their furthest loaded state instead of reversing/unloading when the customer scrolls back up.
- Preserved the approved closing-card timing: Operator Materials loads deliberately, pauses, then Next Step lands at the target reading position.
- Improved the dark proof-section seam so “03 Outcome quality” has clearer, higher-quality contrast on the navy surface.
- Balanced the footer columns by keeping Resources and Contact to four useful lines each; proposal and FAQ remain available in the Operator Materials card.
- Refined the private access-code focus treatment so it is crisp, visible, and less bulky.
- Cache-busted CSS, JS, and gate references to v82.
- Preserved production SEO cleanup for reservestandard.com: canonical URLs, Open Graph URLs, sitemap, and robots.txt.
- Preserved mobile safe-area handling, manifest paths, premium footer, progress rail, private gate, PDFs, routes, review form, and all site copy.

## Before publish
If the production domain is not `https://reservestandard.com`, replace that domain in `sitemap.xml` and the canonical / Open Graph metadata in each HTML file before deploying.
