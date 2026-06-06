# CragLink Power — Pass 18 QA Report

## Scope
Pass 18 focuses on launch safety and publish reliability. It does not change the visual direction; it hardens the current real-component site for deployment.

## Completed
- Added a fully optimized social preview image: `assets/og-cover.jpg` at 1200×630, replacing the heavier PNG reference in HTML metadata.
- Added canonical URL placeholders to HTML pages so the final domain can be swapped in once chosen.
- Added Twitter/X large-card metadata.
- Added `_headers` for Netlify-style security and caching headers.
- Rebuilt `_redirects` with cleaner routes and a 404 fallback.
- Updated `robots.txt` and `sitemap.xml` with final-domain placeholders.
- Reworked `config.js` so production host, form endpoint, and analytics IDs are centralized.
- Re-ran local asset/link reference checks; missing local file count: **0**.
- Re-ran JavaScript syntax checks on `script.js` and `config.js`; both passed.

## Remaining launch actions
1. Replace `YOUR-DOMAIN.com` in `config.js`, `sitemap.xml`, canonical tags, and `robots.txt`.
2. Choose form backend: Netlify Forms, Formspree, HubSpot, Shopify, Tally, Make/Zapier, or a custom endpoint.
3. Add analytics IDs if desired.
4. Run one final live-device check after publishing: iPhone Safari, Android Chrome, desktop Chrome, desktop Safari.

## Recommendation
Use the split build for normal production hosting. Use `index-standalone.html` only if the host keeps breaking asset paths.
