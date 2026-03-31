# AZRO Bitcoin Reserve Program site — hybrid white business build

This bundle is the business-ready hybrid version: original AZRO-style header, cleaner white page system, and business-first reserve positioning.

## Main files
- `index.html` — homepage
- `style.css` — layout and styling
- `script.js` — mobile nav, active nav state, CTA tracking hooks, static application form mailto flow
- `assets/` — logo, favicons, OG card, and product visuals
- `pdfs/` — reserve brief plus privacy / risk / terms

## Editable items
- Contact email is set in:
  - `index.html` form `data-contact-email`
  - direct email links
- Header CTAs:
  - `Reserve brief` opens the packet PDF
  - `Reserve review` scrolls to the application section
- Form behavior:
  - static by default
  - opens a pre-filled email draft to `support@azrosystems.com`
  - replace with a real scheduler or backend submit later if desired

## Legacy route handling
Old route names (`about.html`, `products.html`, `pricing.html`, etc.) redirect to the new homepage anchors so stale links can collapse back to the business site.

## Suggested next live upgrades
1. Replace the mailto form with a real submission endpoint or scheduling link.
2. Connect analytics events to Plausible or GA.
3. Add real client proof or case studies once available.
