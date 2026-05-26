# Reserve Standard site package — v87 stealth-final

Built **2026-05-26** from v86. This package carries the v86 layout and color system **plus** the locked Brand Canon v1.1 narrative additions (v3.2 expansions): "purchasing power is the truth", "hardest asset ever engineered", "discipline starts with the first dollar", "the order is the strategy", and the "vessel that carries your work" close.

## Publish posture: STEALTH

v87 is configured for the private founding-cohort release on the stealth URL `https://zsend.github.io/AzroTest/`. **Not** for `reservestandard.com` directly. Re-point the canonicals and the robots/meta posture before any public launch (see "Switching out of stealth" below).

### Stealth controls in this package

- `<meta name="robots" content="noindex,nofollow,noarchive">` on **every** HTML page
- `robots.txt` blocks all crawlers (`Disallow: /`)
- `sitemap.xml` **removed** (was leaking page list in v86)
- All canonical and Open Graph URLs point to `https://zsend.github.io/AzroTest/`
- Legacy `treasury@reservestandard.com` removed from `site-config.json`
- Stealth access gate (`gate.js`) wired into every page; gate hash matches the founding-cohort access code

## Publish rule

Replace the entire contents of your static hosting directory with this package. Do not merge with older CSS, JS, HTML, or assets.

## What changed in v87 (vs v86)

**Stealth posture (critical fixes — v86 was publicly indexable):**
- Robots meta on every page: `index,follow` → `noindex,nofollow,noarchive`
- `robots.txt`: `Allow: /` → `Disallow: /`
- `sitemap.xml` removed
- Canonical / OG URLs: `https://reservestandard.com/...` → `https://zsend.github.io/AzroTest/...`
- `site-config.json`: legacy `treasury@reservestandard.com` removed (only `review@` retained, per Brand Canon v1.1 §01)

**Brand narrative additions (Brand Canon v1.1 §08 / v3.2 expansions):**
- Why-now copy block: "Purchasing power is the truth" added as a hammer line
- Framework "Asset" band card: H3 strengthened to "The hardest asset ever engineered" with the "digital money built to beat the debasement" + "gold scarce by access, Bitcoin by mathematical law" framing
- Process step 03: "The discipline starts with the first dollar — always allocate a percentage of every dollar earned, no matter how small" added
- **New section "The order is the strategy"** added between Proof and Process — three band cards (tax efficiency, balance-sheet strength, continuity) compressing the canonical Section 09 answer
- **New closing block "The mission"** added at the end of Process — vessel/hull/journey framing plus the team-extension line, closing on the H1

**Visual consistency:**
- 404, privacy, terms, risk pages: header lockup unified — text "Reserve Standard / Bitcoin Treasury Operating System" replaced with the wordmark SVG used on index/brief/review

**Preserved from v86:**
- All v86 layout, color system, motion behavior, sticky scrolls, chart, footer treatment, gate styling
- All v30 customer-doc PDFs and links
- Cache-bust `?v=86` query strings on CSS/JS (no changes to those files in v87)

## Switching out of stealth (later, when reservestandard.com goes live)

When you're ready to leave stealth, do all six in one pass:

1. Restore `<meta name="robots" content="index,follow">` on every page **except** legal pages (keep those `noindex` if you don't want them in search)
2. Restore `robots.txt` to `Allow: /` and add the sitemap reference back
3. Restore `sitemap.xml` (regenerate from current page list)
4. Switch canonical and OG URLs back to `https://reservestandard.com/...`
5. Decide whether to keep the access gate (founder-cohort only) or remove (public)
6. Add a `CNAME` file with `reservestandard.com` so GitHub Pages serves the apex domain

## Before publish (this stealth release)

- Confirm GitHub Pages is serving from this repo's `main` branch root (or `gh-pages` branch — whichever your repo uses)
- Confirm the access code shared with the founding cohort matches the gate hash in `site-config.js` (`80301292...` corresponds to `reserve-standard-founders-2026`)
- Test the gate in a fresh incognito window before sharing the URL with any cohort member
