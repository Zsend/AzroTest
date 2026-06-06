# CragLink Power — Pass 18 Deployment Notes

## Fastest safe publish path
Upload the entire folder contents from the ZIP to your host.

Required files:
- `index.html`
- `styles.css`
- `script.js`
- `config.js`
- `/assets`
- `field-team.html`
- `legal.html`
- `privacy.html`
- `success.html`
- `404.html`
- `_headers`
- `_redirects`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

## Domain replacement
Replace `YOUR-DOMAIN.com` in:
- `config.js`
- `sitemap.xml`
- `robots.txt`
- all `<link rel="canonical">` values in HTML

## Forms
The forms are ready for three modes:

1. **Netlify Forms:** deploy the folder to Netlify and keep the form attributes as-is.
2. **Endpoint mode:** paste your endpoint into `config.js` as `formEndpoint`.
3. **Local preview:** submissions simulate success so buttons and flows can be tested before backend setup.

## Pre-traffic QA
- Submit every form and confirm the lead is captured.
- Click each primary CTA and nav item.
- Test the founder modal, search modal, Escape key, close buttons, and mobile menu.
- Confirm all pages load: home, Field Team, legal, privacy, success, 404.
- Check iPhone Safari and Android Chrome.
