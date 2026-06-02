Reserve Standard v151 — production performance final

Publish instructions:
1. Upload the full unzipped folder contents to the GitHub Pages repository root.
2. Commit and push.
3. Wait for GitHub Pages to rebuild.
4. Hard refresh / clear browser cache so style.min.css?v=151, script.js?v=151, and gate.js?v=151 load.

What changed in v151:
- Removed the external Google Fonts dependency from all HTML pages to eliminate render-blocking third-party font CSS and font-swap layout jank on GitHub Pages.
- Moved the site to a native premium font stack for faster first paint and more stable rendering across mobile/desktop.
- Reduced homepage scroll work to one primary scroll listener plus one animation frame pipeline.
- Folded the Benchmark chart, editorial rails, Framework card motion, and closing-card motion into the primary scroll frame instead of separate scroll listeners competing during mobile scroll.
- Removed expensive mobile scroll-frame blur from card entrances; mobile motion now uses transform + opacity for smoother compositing.
- Releases will-change after animated cards land so the browser does not keep unnecessary GPU layers alive.
- Preserved the approved chart rule: it never visibly reverses while on screen, stays complete when scrolling back up from below, resets only after it is fully below the viewport, then replays on the next downward pass.
- Preserved the approved footer rhythm, footer logo placement, system cards, Proof energy card, Benchmark Lens layout, rails, gate behavior, and GitHub Pages login tracking setup.

Login tracking setup:
- See GITHUB_PAGES_LOGIN_TRACKING_SETUP.txt.
- Paste the Google Apps Script Web App URL into site-config.js as loginTrackerEndpoint.
- Visit ?rs_owner=RS-OWNER-2026-8K4M once from your own browser to mark it as the owner device.

Important:
- The gate is a lightweight private-release gate, not true authentication.
- GitHub Pages cannot securely identify users or store analytics by itself because it is static hosting.
- For customer identity, billing identity, or durable per-user accounts, use a real backend/auth provider later.
