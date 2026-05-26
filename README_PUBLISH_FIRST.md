# Reserve Standard site package V81

This is the final customer-ready static site build generated from the v80 launch build, with the founder-approved scroll-card choreography restored and the private access gate focus treatment refined.

## Publish rule
Replace the entire contents of your static hosting directory with this package. Do not merge these files with older CSS, JS, HTML, or assets.

## What changed in V81
- Restored the Operator Materials / Next Step scroll-scrub behavior so it is not flattened by reduced-motion system settings.
- Preserved the approved v79 closing-card timing model: Operator Materials loads deliberately, pauses, then Next Step lands at the target reading position.
- Preserved the Asset / Problem / System scroll-card behavior.
- Refined the private access-code input focus state so it is clear and accessible without the heavy double halo shown in the prior build.
- Softened the global focus treatment slightly while keeping a visible keyboard-accessible state.
- Cache-busted CSS, JS, and gate references to v81.
- Preserved production SEO cleanup for reservestandard.com: canonical URLs, Open Graph URLs, sitemap, and robots.txt.
- Preserved mobile safe-area handling, manifest paths, premium footer, progress rail, private gate, PDFs, routes, review form, and all site copy.

## Before publish
If the production domain is not `https://reservestandard.com`, replace that domain in `sitemap.xml` and the canonical / Open Graph metadata in each HTML file before deploying.
