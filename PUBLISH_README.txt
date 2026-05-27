Reserve Standard — v96 Final Customer-Ready Build

Production domain assumed: https://reservestandard.com

This build is based on v94 and applies the final mobile/design repair pass:
- Mobile matrix/comparison section rebuilt into clean stacked cards with no clipped text.
- Light-surface body copy and table text darkened for consistent, expert color hierarchy.
- Bitcoin matrix row uses green as a signal, not blanket text color.
- Mobile/tablet scroll-entry card motion is contained and vertical-safe to prevent horizontal panning.
- Desktop scroll-entry motion remains intact.
- Process connector timing completes while the four-card row is still visible.
- Private gate viewport is locked to prevent white-bottom overscroll on mobile.
- Private gate unlock resets the customer to the top of the site.
- Header mark uses SVG for sharper rendering; mobile logo/menu sizing refined.
- CSS/JS/gate cache-busting updated to v96.

Publish notes:
1. Upload the contents of this folder to the hosting root.
2. Replace the previous site completely; do not merge old files into this build.
3. Purge CDN/host cache after upload so v96 CSS/JS/gate files are served.
4. Test the live site in a fresh incognito window using the access code.
5. Confirm: private gate, top scroll position after unlock, mobile header/menu, section anchor landing, comparison cards, process connector, card scroll reveals, review form mailto behavior, PDFs, footer links, sitemap, and robots.txt.
6. Submit /sitemap.xml only when public discovery is intended.

Core production files: index.html, brief.html, review.html, risk-disclosure.html, privacy-policy.html, terms-of-service.html, 404.html, style.css, script.js, gate.js, site-config.js, robots.txt, sitemap.xml, site.webmanifest, assets/.


V96 final repair: mobile matrix rebuilt as clean editorial cards; body text contrast system tightened; process connector reaches final card earlier; private gate/mobile header stability hardened.
