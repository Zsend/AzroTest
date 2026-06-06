# CragLink Power — Pass 16 Launch Handoff

This package includes a normal split static build and a one-file standalone fallback.

## Recommended publish path
Upload the full folder contents: `index.html`, `styles.css`, `script.js`, `config.js`, `/assets`, and supporting pages.

## Fallback publish path
If your host strips assets or paths break, publish `index-standalone.html` as `index.html`. It embeds the homepage CSS, JS, and primary images in one file.

## Forms
Netlify Forms are supported out of the box. For another backend, set `formEndpoint` in `config.js`.

## Before live traffic
Replace `https://example.com` in `robots.txt` and `sitemap.xml` with the real domain.
