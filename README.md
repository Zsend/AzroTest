# Reserve Standard LLC site

This bundle is a static site for the Reserve Standard LLC Bitcoin reserve offer.

## Files
- `index.html` — main one-page site
- `brief.html` — standard brief page
- `style.css` — site styles
- `script.js` — guided desktop scroll + form mailto behavior
- `assets/` — brand mark, OG card, favicon, and product images
- `legal/` — privacy, risk, and terms pages
- `404.html` — redirect to home
- `llc/`, `standard/`, `reserve-standard/`, `business/`, `program/` — simple redirect routes

## Important launch note
The reserve review form opens a prefilled email draft to:

`hello@reservestandard.com`

If your live inbox is different, update that address in:
- `index.html`
- `brief.html`
- `legal/privacy.html`
- `legal/terms.html`

## Guided scroll behavior
On larger desktop layouts, one wheel or trackpad gesture advances exactly one chapter and auto-stops on the next section. Smaller screens fall back to normal scrolling.

## Publish
Upload the contents of this folder to your static host or web server root.
