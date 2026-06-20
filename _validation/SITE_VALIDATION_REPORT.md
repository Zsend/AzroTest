# A Right For All — Final v20 Validation Report

## Result

**PASS — the test build is ready for GitHub Pages deployment, and the production build is technically ready for publication.**

## Build scope

- HTML pages: **20**
- Local file references checked: **1,022**
- Internal anchor references checked: **112**
- Public letter PDFs: **21**
- Letter preview images: **21**
- Readable letter excerpts: **9**
- Documentary tablet evidence: preserved
- Complete Unusual Thinkers Challenge: preserved

## Static integrity

Passed with:

- **0** missing local files
- **0** broken internal anchors
- **0** duplicate HTML IDs
- **0** unlabeled form controls
- **0** images missing alt text or explicit dimensions
- **0** CSS parse errors
- **0** JavaScript syntax errors
- **0** public identity references for the anonymized writer
- **0** extractable text in the anonymized public PDF

## Responsive and browser QA

Browser validation used headless Chromium against the actual packaged files.

Tested:

- Home, Letters, The Free Floor, The Bridge, The Minds We Miss, and Evidence at **320px, 390px, 768px, and 1440px**
- Unusual Thinkers Challenge at **320px, 390px, 768px, 1024px, and 1440px**
- About, Sustainability, The Long Game, 404, and all nine excerpt pages at **390px and 1440px**

Passed with:

- **0** horizontal-overflow failures
- **0** broken or undecodable images
- **0** browser-console errors
- **0** uncaught page errors
- mobile navigation opening, closing, and Escape-key behavior working
- reduced-motion mode exposing all content without animation traps

## Visual system

Confirmed:

- one consistent spacing and typography rhythm across pages
- larger, consistently separated editorial labels
- balanced card padding and grid gaps
- no orphan information-rail cells
- exact 4×2 Bridge resource grid on desktop
- responsive rail collapse on tablet and mobile
- vertically centered paired cards where one side is shorter
- no artificial card heights creating unexplained empty space
- tapered and softly faded blue edge accents
- readable maximum line lengths for policy and evidence copy
- stacked handwritten-letter presentation restored on Home and Letters
- responsive AVIF/WebP image delivery with JPEG fallback
- above-the-fold letter imagery prioritized to avoid visible loading flicker

## Challenge behavior

Confirmed:

- the left narrative progresses first
- the right mission panel remains sticky while the left sequence moves
- the right panel releases naturally when the left sequence reaches its bottom
- the left side has no internal scrollbar
- mobile and tablet layouts revert to normal document flow
- Challenge answers autosave locally in the browser
- packet preview updates correctly
- Markdown export works
- JSON export works
- saved fields and selected track persist after reload

## Safety anonymization

One writer is published as **Name withheld**.

The public source was rebuilt as a destructive, image-only redaction:

- identifying name and signature regions are removed from the public pixels
- the PDF contains no OCR or extractable text layer
- no unredacted public file is included
- preview JPEG, WebP, and AVIF files were regenerated from the redacted source
- public HTML, metadata, file names, and text assets contain no identifying reference

## Variant posture

### GitHub Pages test build

- Target: `https://zsend.github.io/AzroTest/`
- Search indexing: blocked
- Manifest scope: `/AzroTest/`
- Production `CNAME`: not included

### Production build

- Target metadata: `https://arightforall.com/`
- Search indexing: enabled
- Manifest scope: `/`
- `CNAME`: not included, so the domain will not be connected automatically

## Public contact

`hello.arightforall@gmail.com`

Create and test this inbox before sharing the site so every contact and Challenge-submission route works.
