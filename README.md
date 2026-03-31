# AZRO Bitcoin Reserve Program site bundle

This bundle is a lightweight static launch site built for the AZRO Bitcoin Reserve Program.

## Included
- `index.html` — one-page business-first launch site
- `style.css` / `script.js` — layout, responsive behavior, CTA tracking hooks, and mailto form logic
- `assets/` — selected brand and product visuals plus a new OG image
- `pdfs/azro-bitcoin-reserve-program-brief.pdf` — copied from the supplied customer packet
- `pdfs/risk-disclosure.pdf`, `pdfs/privacy-policy.pdf`, `pdfs/terms-of-service.pdf`
- `CNAME`, `robots.txt`, `sitemap.xml`, `404.html`

## Before publishing
1. Confirm the contact email is correct in `index.html` and `script.js`.
2. Replace the static mailto form with Formspree, Netlify Forms, or your preferred backend when ready.
3. Add your analytics script if you use Plausible or Google Analytics. CTA hooks are already present via `data-track` attributes.
4. Decide whether to keep the current PDF brief public or replace it with a tighter launch PDF.
5. If you want a calendar booking flow, replace the main CTA links with your scheduling URL.

## Deployment
Open `index.html` locally for review, then deploy the full folder to your static host.
