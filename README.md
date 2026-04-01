# AZRO Bitcoin Reserve Program — auto-scroll final

This bundle is the publish-ready AZRO business site.

## Included
- `index.html` — main homepage
- `style.css` — full site styling
- `script.js` — guided chapter scroll, navigation state, CTA tracking hooks, and static form mailto flow
- `assets/` — logo, favicon, dashboard/product visuals, and OG image
- `pdfs/` — reserve brief, risk disclosure, privacy policy, terms
- `btc/`, `business/`, `reserve/`, `legacy/` — simple redirect routes back to the homepage
- `robots.txt`, `sitemap.xml`

## Key behavior
- Desktop-only guided scroll on large screens with a fine pointer
- One wheel / trackpad gesture advances to the next chapter and auto-settles the viewport cleanly
- Arrow keys, Page Up/Down, Home, and End also step through chapters
- Mobile and smaller screens fall back to normal scrolling
- Reduced-motion users fall back to normal scrolling

## Form behavior
The application form is static and opens a prefilled email draft to `support@azrosystems.com`.

## Deployment
Upload the full folder contents to your web root so `index.html`, `style.css`, `script.js`, `assets/`, and `pdfs/` stay in the same relative structure.
