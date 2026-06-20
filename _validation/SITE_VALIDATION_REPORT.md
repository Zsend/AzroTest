# A Right For All — v17 Final Validation Report

Date: 2026-06-20

## Deliverables

- GitHub Pages test build for `https://zsend.github.io/AzroTest/`
- Future production build for `https://arightforall.com/`

## Final design work

- Replaced button-like metadata pills with quiet editorial information rails.
- Standardized section spacing, card padding, grid gaps, typography, line height, radii, and card height behavior.
- Increased small body and card text for easier reading.
- Rebalanced the Home hero, proof cards, documentary evidence card, coalition cards, Challenge preview, Challenge work cards, and archive cards.
- Reduced unnecessary empty height in the Challenge introduction while preserving the left-first sticky sequence.
- Preserved the existing motion and interaction model; no continuous image parallax or blur-heavy effects were added.

## Image performance

- The documentary hero image uses responsive AVIF and WebP files with a JPEG fallback.
- The primary hero image is preloaded and carries fixed dimensions and an aspect ratio to prevent layout shift.
- Letter previews use responsive AVIF/WebP sources and stable JPEG fallbacks.
- Archive previews below the fold load lazily with asynchronous decoding and low fetch priority.
- Public image transforms that previously risked visual jitter remain disabled.

## Writer-safety redaction

- One writer who remains in custody is now shown as `Name withheld`.
- The public preview and two-page public PDF were rasterized and irreversibly redacted at the identifying name/signature locations.
- The public build contains no old public filename, HTML attribution, alt text, or metadata exposing that identity.
- The unredacted source is not included in either public ZIP.
- The letters and privacy pages clearly explain that one writer is anonymized for safety.

## Static integrity

Validated independently on both builds:

- HTML pages: **20**
- Local references checked: **972**
- Internal anchor references checked: **112**
- Missing local files: **0**
- Broken anchors: **0**
- Duplicate element IDs: **0**
- Images missing alt text or dimensions: **0**
- Form controls missing labels: **0**
- CSS parser errors: **0**
- JavaScript syntax errors: **0**
- Public letter PDFs: **21**
- Public letter previews: **21**
- Readable excerpt pages: **9**

## Responsive and visual QA

A local headless-Chromium rendering harness was used to inspect the Home, Letters, Free Floor, Bridge, Minds We Miss, Challenge, Evidence, and About pages at representative desktop, tablet, and mobile widths. Key page sections were also captured and visually reviewed.

Results:

- Horizontal overflow failures: **0**
- Missing rendered images in the visual harness: **0**
- Home metadata rails remain balanced at desktop and collapse into clear single-column rows on small screens.
- Home proof cards, horizon cards, coalition cards, and Challenge cards retain equal grid rhythm.
- Challenge metadata is visibly informational rather than button-like.
- The Challenge page keeps its desktop left-first narrative sequence and removes sticky behavior on smaller screens.
- Mobile buttons stack cleanly and remain touch-friendly.

## Build posture

### AzroTest build

- Configured for `/AzroTest/`
- Search indexing blocked
- No `CNAME`
- Uses `hello.arightforall@gmail.com`

### Production build

- Canonical/social metadata points to `arightforall.com`
- Search indexing allowed
- No bundled `CNAME`; the domain must be connected deliberately later
- Uses `hello.arightforall@gmail.com`

## Final boundary

The packages are technically ready to deploy. Public launch remains a founder decision. The initiative should continue to avoid nonprofit, tax-deductibility, approved-pilot, vendor, facility, partner, or measured-impact claims until those facts exist.
