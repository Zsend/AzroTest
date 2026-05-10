# Reserve Standard Founding Access Site

Purpose: first stealth/founding-access website for reservestandard.com.

## What this package includes
- Public noindex homepage
- Founding access request form
- Approved-user setup guide at `/access/`
- Private Model Track Record placeholder at `/track-record/`
- Privacy, risk, terms, and 404 pages
- Static CSS/JS only
- No external assets or dependencies

## Before launch
1. Replace `access@reservestandard.com` in `assets/js/config.js` if needed.
2. Replace `formEndpoint` in `assets/js/config.js` with a real form endpoint, or leave mailto fallback.
3. Add Cloudflare Access or another access control system for:
   - `/access/*`
   - `/track-record/*`
4. Keep `robots.txt` and `noindex,nofollow` during stealth.
5. Remove noindex only after the founder decides to scale.

## Recommended deploy
Cloudflare Pages or Netlify. If using Cloudflare, use Cloudflare Access for private pages.

## Replace later
- Text seal can be replaced with official wordmark / monogram assets once available.
- Legal pages should be reviewed by counsel before paid public launch.
