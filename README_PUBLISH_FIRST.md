# Reserve Standard site package — v89 stealth-final-with-designer-docs

Built **2026-05-26** from v86 → v87 (stealth posture + v3.2 brand narrative on site) → v88 (matching v31 customer documents via .docx + Pages) → **v89 (v31 PDFs rebuilt via HTML + brand print-CSS + Chrome headless = designer-grade, identical brand language to the site)**. This is the canonical v31 PDF rendering.

## Publish posture: STEALTH

v88 is configured for the private founding-cohort release on the stealth URL `https://zsend.github.io/AzroTest/`. **Not** for `reservestandard.com` directly. Re-point the canonicals and the robots/meta posture before any public launch (see "Switching out of stealth" below).

### Stealth controls in this package

- `<meta name="robots" content="noindex,nofollow,noarchive">` on **every** HTML page
- `robots.txt` blocks all crawlers (`Disallow: /`)
- `sitemap.xml` **removed** (was leaking page list in v86)
- All canonical and Open Graph URLs point to `https://zsend.github.io/AzroTest/`
- Legacy `treasury@reservestandard.com` removed from `site-config.json`
- Stealth access gate (`gate.js`) wired into every page; gate hash matches the founding-cohort access code

## Publish rule

Replace the entire contents of your static hosting directory with this package. Do not merge with older CSS, JS, HTML, or assets.

## What changed v86 → v87 → v88

### v86 → v87 (stealth posture + v3.2 narrative on site)

**Stealth posture (critical fixes — v86 was publicly indexable):**
- Robots meta on every page: `index,follow` → `noindex,nofollow,noarchive`
- `robots.txt`: `Allow: /` → `Disallow: /`
- `sitemap.xml` removed
- Canonical / OG URLs: `https://reservestandard.com/...` → `https://zsend.github.io/AzroTest/...`
- `site-config.json`: legacy `treasury@reservestandard.com` removed

**Brand narrative additions (Brand Canon v1.1 §08 + v3.2 expansions):**
- Why-now copy block: "Purchasing power is the truth"
- Framework "Asset" band card: rewritten to "The hardest asset ever engineered" with "digital money built to beat debasement" + "gold scarce by access, Bitcoin by mathematical law"
- Process step 03: "The discipline starts with the first dollar — always allocate a percentage of every dollar earned, no matter how small"
- **New section "The order is the strategy"** between Proof and Process — three band cards (tax efficiency, balance-sheet strength, continuity)
- **New closing block "The mission"** at the end of Process — vessel/hull/journey framing plus the team-extension line

**Visual consistency:**
- 404 / privacy / terms / risk pages: header lockup unified to the wordmark SVG (was text lockup)

### v87 → v88 → v89 (matching v31 customer documents — final designer-grade rendering)

**v88** replaced v30 with v31 docs rendered via .docx + Pages — content was on-canon but visual presentation read as Word-document, not as a native extension of the site.

**v89** rebuilds the same v31 content via the new canonical pipeline: HTML + print-CSS (mirroring site tokens) + Chrome headless. PDFs now use the actual Inter + Source Serif 4 web fonts from Google Fonts, the exact navy/bone/reserve-green hex values from the site, and a typography rhythm that matches the website. The PDFs visually read as a native extension of the site.

**File sizes (v89 — embedded web fonts):**
- `Reserve_Standard_Customer_Brief_FINAL_v31.pdf` — 4pp, ~408KB
- `Reserve_Standard_Customer_Proposal_FINAL_v31.pdf` — 8pp, ~476KB
- `Reserve_Standard_Customer_FAQ_FINAL_v31.pdf` — 4pp, ~230KB
- `Reserve_Standard_Customer_Packet_FINAL_v31.pdf` — 16pp, ~1.0MB (concat of Brief + Proposal + FAQ)

**v31 documents incorporate (was missing in v30):**
- Compliance line fixed everywhere from "Educational materials" → "Educational market tool — not financial, tax, or legal advice." (BC v1.1 §10 / BC-09 / supersession S-03)
- "A business is judged by what it keeps, not what it earns" as opening hook (BC-04)
- "Treasury crumble" instead of "cash crumble" (BC-05)
- "Bitcoin solves the asset problem. Reserve Standard solves the execution problem" (exact canon)
- "Purchasing power is the truth" (v3.2)
- "The hardest asset ever engineered" + "Gold scarce by access, Bitcoin by mathematical law" (v3.2)
- "The discipline starts with the first dollar — always allocate a percentage" (v3.2)
- "The order is the strategy" + "If the foundation gives way, the wallet stops getting filled" (BC v1.1 §09 / v3.2)
- "Vessel that carries your work / Don't go down with the ship" closing (v3.2)
- Team Reserve doctrine (BC v1.1 §07)
- "Businesses" framing throughout (BC-15 — broadened from "owner-led businesses")

**HTML link updates:**
- All 7 HTML pages: footer + download-grid links updated from `_FINAL_v30.pdf` to `_FINAL_v31.pdf`

**Preserved from v87 / v86:**
- All CSS, script.js, gate.js unchanged
- Layout, color system, motion, chart, footer unchanged
- Gate hash unchanged — still unlocks with `reserve-standard-founders-2026`

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
- Click through to all four PDFs to confirm they download and open cleanly
