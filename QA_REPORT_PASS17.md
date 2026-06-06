# CragLink Power — Pass 17 QA Report

## Scope
Pass 17 focuses on launch-readiness rather than a visual redesign. It keeps the real-component site direction: no screenshot overlays, no stamped-on buttons, and no fake interaction layers.

## Completed
- Cleaned duplicated document declarations in the HTML.
- Added a Pass 17 polish layer for focus states, form statuses, mobile action stability, and autofill styling.
- Confirmed local HTML link and asset references with `QA_ASSET_LINK_CHECK_PASS17.txt`.
- Added `vercel.json`, `.htaccess`, `_headers`, `netlify.toml`, `robots.txt`, `sitemap.xml`, and a 404 page for common hosts.
- Rebuilt the standalone one-file homepage with embedded CSS, JavaScript, config, and image assets.
- Kept the split production build for normal hosting and the standalone page as the safer fallback.
- Removed unconfirmed “Designed in the USA” wording from the homepage.

## Remaining launch actions
1. Replace placeholder domain values in `sitemap.xml` after the final domain is chosen.
2. Connect `config.js` to a real form endpoint or deploy on Netlify Forms.
3. Add analytics IDs after you choose GA4, Meta Pixel, or another stack.
4. Run one live-device check on iPhone Safari, Android Chrome, desktop Chrome, and desktop Safari.

## Recommended publish path
Use the split build for production if you are publishing the whole folder. Use `index-standalone.html` only if your host keeps breaking asset paths.
