# CragLink Power — Pass 17 Deployment Notes

## Best path
Upload the complete folder contents from the ZIP:

- `index.html`
- `styles.css`
- `script.js`
- `config.js`
- `/assets`
- all supporting pages
- `robots.txt`, `sitemap.xml`, `_headers`, `_redirects`, `netlify.toml`

## If publishing breaks
Use `index-standalone.html` as the homepage. It contains embedded CSS, JavaScript, config, and core images.

## Forms
Current form behavior:
- If deployed on Netlify, Netlify Forms can capture submissions.
- If you use another backend, edit `config.js` and set `formEndpoint`.
- In local/static preview, the site also stores the latest leads in browser localStorage so the flow can be tested.

## Live QA
Before real traffic:
- Submit each form and confirm the lead reaches the backend.
- Click every header/footer link.
- Test the founder modal, search modal, mobile drawer, Escape key, and close buttons.
- Check mobile Safari and Chrome specifically.
