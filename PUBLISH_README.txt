Reserve Standard v149 — GitHub Pages customer-ready final

Publish instructions:
1. Upload the full unzipped folder contents to the GitHub Pages repository root.
2. Commit and push.
3. Wait for GitHub Pages to rebuild.
4. Hard refresh / clear browser cache so style.css?v=149, script.js?v=149, and gate.js?v=149 load.

What changed in v149:
- Benchmark Lens chart replay is now a true one-way-per-visible-visit model.
- The chart cannot visibly undraw/reverse while any part of it is on screen.
- Once the chart is fully off screen, it resets invisibly.
- When the visitor scrolls down to it again, it grows again.
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
