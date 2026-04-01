# AZRO Bitcoin Reserve Program — world-class guided publish bundle

This is the final static site bundle for the AZRO Bitcoin Reserve Program.

## What changed

- updated the hero to: **Build a stronger business on Bitcoin reserves.**
- kept the original dark **AZRO Systems** header treatment
- kept the cleaner white business-forward canvas
- rebuilt the desktop experience into a **signal-lock chapter system** instead of basic snap scrolling
- wheel / trackpad / Page Down / arrow navigation now advances chapter-by-chapter on large desktop screens
- added **custom animated panel transitions** instead of relying on default browser smooth scroll
- added a **live reserve-flow beam** inside the right-side chapter rail so progress feels like a governed operating system, not a slideshow
- added auto-settle behavior so desktop scrolling resolves cleanly back into the nearest chapter
- mobile and smaller screens fall back to normal scrolling
- reduced-motion users fall back to normal scrolling
- preserved the reserve brief, legal PDFs, OG card, legacy route redirects, and static application flow

## Files

- `index.html` — main landing page
- `style.css` — page styling, chapter system, transition effects, and rail visuals
- `script.js` — navigation, guided magnetic scroll behavior, CTA tracking hooks, and form mailto flow
- `assets/` — branding and product imagery
- `pdfs/` — reserve brief and legal/resources PDFs

## Notes

- The application form is static. It opens a prefilled email instead of posting to a backend.
- Guided chapters are intentionally desktop-only so the experience stays usable.
- If you later add Calendly, HubSpot, Tally, or a custom form endpoint, replace the current mailto submission path in `script.js`.
