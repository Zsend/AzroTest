# Reserve Standard site package V80

This is the final launch-ready static site build generated from the v79 visual build.

## Publish rule
Replace the entire contents of your static hosting directory with this package. Do not mix these files with older CSS, JS, HTML, or assets.

## What changed in V80
- Production SEO cleanup for reservestandard.com: canonical URLs, Open Graph URLs, sitemap, and robots.txt.
- Customer-facing pages are indexable; 404 remains noindex.
- Cache-busted CSS/JS references updated to v80.
- Stronger keyboard focus rings and form focus states.
- Higher-contrast small accent text on light surfaces.
- Reduced-motion customers now receive the fully readable static state instead of large scroll-scrub movement.
- Safe-area handling added for modern mobile devices.
- Web manifest includes root start_url/scope and valid favicon asset paths.
- Removed non-production template/demo files from the publish package.
- Private access gate focus and error accessibility improved.

## Locked from prior approved builds
- Feathered scroll progress rail.
- Restored Asset / Problem / System scroll-card behavior.
- Closing Operator Materials / Next Step choreography from the approved v79 timing model.
- Premium footer panel, private access gate, PDF routes, review form, and all site copy.

## Before publish
If the production domain is not `https://reservestandard.com`, replace that domain in `sitemap.xml` and the canonical / Open Graph metadata in each HTML file before deploying.
