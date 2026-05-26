# Reserve Standard site package V83

This is the final customer-ready static site build generated from the v82 package, with repeatable downward card reveals, quieter footer typography, and final contrast/color refinements applied.

## Publish rule
Replace the entire contents of your static hosting directory with this package. Do not merge these files with older CSS, JS, HTML, or assets.

## What changed in V83
- Made the scroll-loaded card behavior repeatable and direction-aware: cards reveal while the customer scrolls down, hold their loaded state while scrolling back upward through the visible section, then reset once the customer has moved above the entry window so the reveal can play again on the next downward pass.
- Preserved the approved closing-card choreography: Operator Materials loads deliberately, pauses, then Next Step lands at the target reading position.
- Kept Asset / Problem / System and Operator Materials / Next Step motion tied to scroll position rather than a one-time timer.
- Refined the dark proof-section seam so “03 Outcome quality” reads more clearly on navy while staying on-brand.
- Reduced footer link weight and contrast pressure so Resources and Contact feel more premium, balanced, and editorial instead of overly bold.
- Kept Resources and Contact to four useful lines each; proposal and FAQ remain available in the Operator Materials card where they belong.
- Preserved production SEO cleanup for reservestandard.com: canonical URLs, Open Graph URLs, sitemap, and robots.txt.
- Cache-busted CSS, JS, and gate references to v83.
- Preserved mobile safe-area handling, manifest paths, premium footer, progress rail, private gate, PDFs, routes, review form, and all site copy.

## Before publish
If the production domain is not `https://reservestandard.com`, replace that domain in `sitemap.xml` and the canonical / Open Graph metadata in each HTML file before deploying.
