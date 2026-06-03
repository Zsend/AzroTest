Reserve Standard v155 — GitHub Pages publish-ready final

Publish instructions:
1. Upload the full unzipped folder contents to the GitHub Pages repository root.
2. Commit and push.
3. Wait for GitHub Pages to rebuild.
4. Hard refresh / clear browser cache so style.min.css?v=155, script.js?v=155, gate.js?v=155, and site-config.js?v=155 load.

What changed in v155:
- Added mobile edge-overscroll hardening so pull-down gestures at the top do not drag the whole page down and expose a white browser canvas.
- Added root/html/body background and overscroll-behavior hardening for browsers that support native overscroll control.
- Built from the approved v154/v149 visual baseline.
- Added final scroll-jump hardening, same-page reload prevention, viewport-anchored layout refreshes, and idle login tracking while preserving the approved visual baseline.
- Benchmark Lens chart replay remains a true one-way-per-visible-visit model.
- The chart cannot visibly undraw/reverse while any part of it is on screen.
- When the visitor scrolls past the chart, it stays complete offscreen so upward scrolling never reveals a reverse draw.
- It resets invisibly only after the chart is fully below the viewport again.
- The next downward pass then grows from the beginning again.
- Login tracking is now GitHub Pages-friendly with an external Google Apps Script / Google Sheet endpoint.
- Netlify-specific tracking was removed from the site.

Login tracking setup:
- See GITHUB_PAGES_LOGIN_TRACKING_SETUP.txt.
- Paste the Google Apps Script Web App URL into site-config.js as loginTrackerEndpoint.
- Visit ?rs_owner=RS-OWNER-2026-8K4M once from your own browser to mark it as the owner device.

Important:
- The gate is a lightweight private-release gate, not true authentication.
- GitHub Pages cannot securely identify users or store analytics by itself because it is static hosting.
- For customer identity, billing identity, or durable per-user accounts, use a real backend/auth provider later.
