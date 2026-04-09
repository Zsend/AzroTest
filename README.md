# A Right For All — GitHub Pages package

This package is ready to publish as a static GitHub Pages site.

## What is included

- `index.html` — homepage
- `404.html` — custom not-found page
- `letters/index.html` — letter archive
- `unusual-thinkers/index.html` — public Unusual Thinkers Challenge
- `letters/excerpts/*.html` — readable typed excerpt pages
- `letters/originals/*.pdf` — original handwritten letters
- `letters/previews/*.jpg` — preview images
- `assets/site.css` — site styles
- `assets/site.js` — simple email-form helper
- `assets/tablet-evidence.jpg` — founder-provided tablet photo
- `assets/og-card.png` — social share card
- `favicon.svg`, `favicon-32.png`, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png`
- `site.webmanifest`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `CNAME`

## Publish to GitHub Pages

1. Create a GitHub repository for the site.
2. Copy **all files from this folder into the repo root**.
3. Commit and push.
4. In GitHub: **Settings → Pages**.
5. Set **Source** to `Deploy from a branch`.
6. Set **Branch** to `main` and **Folder** to `/ (root)`.
7. Save.

## Custom domain

This package already includes a `CNAME` file for `arightforall.com`.

If you are using that domain:
- Keep the `CNAME` file.
- Point the domain DNS to GitHub Pages.

If you are **not** using `arightforall.com` yet:
- Delete the `CNAME` file before publishing.
- Update the canonical and social URLs later if you want them to match another domain.

## Before launch

- Make sure `hello@arightforall.com` exists or forwards to your inbox.
- Confirm you are comfortable publishing the tablet photo and original letters.
- Replace the email-based join flow with a real form backend later if you want submissions without opening an email client.
- Add a donation processor later if you want direct online donations instead of conversation-first donor outreach.


## Unusual Thinkers Challenge

This package now includes a public challenge page at `unusual-thinkers/index.html`.

The internal reviewer scorecard is intentionally **not** included in the public GitHub Pages package, so it does not become public if you use a public repository. Keep that file in your private operating-system pack instead.
