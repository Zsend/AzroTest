# A Right For All — v16 Validation Report

Date: 2026-06-20

## Builds

- Production initiative build: configured for a future `https://arightforall.com/` deployment.
- GitHub Pages test build: configured for `https://zsend.github.io/AzroTest/`.

## Brand and content

- Final movement architecture is present: **The Free Floor**, **The Bridge**, **The Minds We Miss**, and **Unusual Thinkers**.
- The first demand remains clear: free GED preparation and basic wellness wherever correctional tablets are used.
- The larger product vision is clearly labeled as future direction rather than a deployed product.
- The site states that A Right For All is an independent public-interest initiative in development.
- No nonprofit, tax-exempt, approved-pilot, partner, vendor, facility-adoption, or measured-impact status is claimed.
- All public references to AI were removed.
- Contact routes use `hello.arightforall@gmail.com`.

## Static integrity

Validated on both builds:

- HTML pages: **20**
- Local file references checked: **971**
- Internal anchor references checked: **79**
- Missing local files: **0**
- Broken anchors: **0**
- Duplicate IDs: **0**
- Images missing alt text or dimensions: **0**
- Form controls missing labels: **0**
- CSS parser errors: **0**
- JavaScript syntax errors: **0**
- Old v15 cache references: **0**
- Old domain-email references: **0**
- Production or test `CNAME` files: **0**

## Evidence preservation

- Original letter PDFs: **21**
- Letter preview images: **21**
- Readable excerpt pages: **9**
- Documentary tablet evidence and responsive image formats preserved.

## Responsive QA

Representative pages tested at viewport widths:

- 320 px
- 390 px
- 768 px
- 1024 px
- 1440 px

Pages tested:

- Home
- The Free Floor
- The Bridge
- The Minds We Miss
- Unusual Thinkers Challenge

Result: **zero horizontal-overflow failures and zero browser-console errors** in the test harness.

## Motion and interaction QA

- Hero animation completed successfully.
- Home Help Build sticky/reveal sequence activated on scroll.
- Mobile menu opened and updated accessibility state correctly.
- Challenge desktop sequence held the right mission panel at a stable sticky position while the left narrative advanced.
- Challenge track selection generated the two expected work-sample prompts.
- Challenge packet preview updated from entered candidate information.
- Reduced-motion CSS fallback remains in place.

## Test-build safety

The AzroTest build:

- uses the `/AzroTest/` manifest scope and start URL;
- points canonical/social URLs to the GitHub Pages test path;
- blocks search indexing with `noindex` and `robots.txt`;
- contains no production `CNAME`.

## Production-build posture

The production build:

- points canonical/social URLs to `arightforall.com`;
- allows indexing;
- contains no `CNAME`, so it will not connect the domain automatically;
- is technically deployable after founder approval and the final evidence/privacy/provenance check.
