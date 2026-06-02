Reserve Standard v150 — GitHub Pages performance-hardened final

Publish instructions:
1. Upload the full unzipped folder contents to the GitHub Pages repository root.
2. Commit and push.
3. Wait for GitHub Pages to rebuild.
4. Hard refresh / clear browser cache so style.min.css?v=150, script.js?v=150, and gate.js?v=150 load.

What changed in v150:
- Consolidated the accumulated scroll engines so the page does less work while scrolling.
- Added a minified production stylesheet for faster GitHub Pages delivery while keeping the readable source CSS in the package.
- Benchmark Lens chart now never reverses while visible or when scrolling back up from below it.
- The chart resets only after it is fully below the viewport again, then replays on the next downward pass.
- Footer rhythm was tightened without reintroducing the oversized top air.
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
