# AZRO Bitcoin Reserve Program — publish-ready site

This bundle is a static site for the AZRO Bitcoin Reserve Program.

## What is included
- `index.html` — main landing page
- `style.css` — full styling
- `script.js` — navigation, guided desktop scroll, chapter rail, form behavior, CTA tracking hooks
- `assets/` — logos, favicons, product images, OG image
- `pdfs/` — reserve brief, risk disclosure, privacy policy, terms
- redirect pages for legacy routes

## Core behavior
- **Desktop guided scroll** on large screens with fine pointers:
  - section-to-section snap panels
  - wheel / trackpad / arrow-key chapter movement
  - right-side chapter rail with live beam and active state
- **Standard scrolling** on tablets, mobile, and reduced-motion environments
- Static application form that opens a prefilled email draft to `support@azrosystems.com`

## Deploy
Upload the full folder contents to the site root.

## Notes
- The reserve brief currently points to the uploaded customer packet PDF in `pdfs/azro-bitcoin-reserve-program-brief.pdf`.
- CTA tracking hooks are present via `data-track` attributes. If Plausible or Google Analytics is added later, the click events can be captured without rewriting the UI.
- The application form is static and uses `mailto:`. Replace that with a real form endpoint or booking flow when ready.
