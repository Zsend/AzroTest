# Reserve Standard Founding Site v2

This package is built to work both on a GitHub Pages project URL such as:

`https://zsend.github.io/AzroTest/`

and on a custom domain such as:

`https://reservestandard.com/`

The previous broken version used root-relative paths like `/assets/css/styles.css`. On a GitHub Pages project URL, that points to `https://zsend.github.io/assets/...` instead of `https://zsend.github.io/AzroTest/assets/...`, so CSS and JS did not load. This version uses relative paths.

## Deploy to GitHub Pages

1. Delete the old repo contents or overwrite them.
2. Upload the **contents** of this folder to the repository root. Do not upload the folder itself as a nested folder.
3. Make sure `index.html`, `assets/`, `access/`, and `track-record/` are at the repository root.
4. Commit and wait for GitHub Pages to rebuild.
5. Open `https://zsend.github.io/AzroTest/` and hard-refresh.

## Configure request access

Edit `assets/js/config.js`.

- `accessEmail` defaults to `access@reservestandard.com`.
- `formEndpoint` is blank by default, so the form opens email.
- Add a Tally, Formspark, Formspree, Netlify, or custom endpoint when ready.

## Stealth settings

- `robots.txt` blocks crawlers.
- pages include `noindex,nofollow`.
- `_headers` adds noindex/security headers on platforms that support it.

GitHub Pages does not enforce `_headers`. Cloudflare Pages does.

## Private pages

The `/access/` and `/track-record/` pages are safe placeholders. They do not expose the private TradingView link or detailed setup material.

For real password protection, use Cloudflare Access or another access-control layer. GitHub Pages alone does not password-protect folders.
