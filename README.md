# AZRO Bitcoin Reserve Program — final publish bundle

This is the final static site bundle for the AZRO Bitcoin Reserve Program.

## What changed

- kept the original dark AZRO Systems header treatment
- preserved the white business-forward canvas
- added a desktop-only guided chapter system
- scroll / wheel / Page Down / arrow navigation advances chapter-by-chapter on large desktop screens
- mobile and smaller screens fall back to normal scrolling
- reduced-motion users fall back to normal scrolling
- added a live right-rail chapter navigator with current chapter state and progress
- preserved the reserve brief, legal PDFs, OG card, legacy route redirects, and static application flow

## Files

- `index.html` — main landing page
- `style.css` — page styling and guided chapter polish
- `script.js` — navigation, guided scroll behavior, CTA tracking hooks, and form mailto flow
- `assets/` — branding and product imagery
- `pdfs/` — reserve brief and legal/resources PDFs

## Notes

- The application form is static. It opens a prefilled email instead of posting to a backend.
- Guided chapters are intentionally desktop-only so the experience stays usable.
- If you later add Calendly, HubSpot, Tally, or a custom form endpoint, replace the current mailto submission path in `script.js`.
