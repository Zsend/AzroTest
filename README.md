# AZRO Bitcoin Reserve Program — section autostop final

This is the publish-ready AZRO business site build with true desktop chapter autoscroll.

## Included
- `index.html` — main homepage
- `style.css` — full site styling
- `script.js` — guided chapter autoscroll, navigation state, CTA tracking hooks, and static form mailto flow
- `assets/` — logo, favicon, dashboard/product visuals, and OG image
- `pdfs/` — reserve brief, risk disclosure, privacy policy, terms
- `btc/`, `business/`, `reserve/`, `legacy/` — redirect routes back to the homepage
- `robots.txt`, `sitemap.xml`

## Desktop guided behavior
- Large desktop screens with a fine pointer enter guided mode automatically
- One wheel or trackpad scroll gesture advances exactly one chapter
- The viewport then auto-scrolls and stops on the next section boundary
- Arrow keys, Page Up/Down, Home, and End also step chapter-by-chapter
- The right-side reserve rail updates live with the active chapter
- Mobile, smaller screens, and reduced-motion users fall back to normal scrolling

## Form behavior
The application form is static and opens a prefilled email draft to `support@azrosystems.com`.

## Deployment
Upload the full folder contents to your web root so `index.html`, `style.css`, `script.js`, `assets/`, and `pdfs/` stay in the same relative structure.
