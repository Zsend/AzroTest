# Reserve Standard — final publish-ready site

This bundle contains the simplified, branded static site for Reserve Standard / Reserve Standard LLC.

## Included
- homepage (`index.html`)
- reserve brief (`standard-brief.html`)
- privacy policy, risk disclosure, and terms pages
- assets, icons, OG image, redirects, sitemap, and manifest

## Brand + domain placeholders
This build intentionally avoids locking in a live domain.

Update these before publishing:
- `your-domain.com`
- `hello@your-domain.com`
- rename `CNAME.example` to `CNAME` only after the final domain is set

## UX notes
- desktop uses a section snap / auto-settle scroll pattern so each major chapter lands cleanly on screen
- mobile and smaller screens fall back to normal scrolling
- the application flow is static and opens a pre-filled email draft
- the site is optimized for static hosting (GitHub Pages, Netlify, Vercel static output, S3/CloudFront, etc.)
- canonical and OG URLs are relative right now so you can wire the final domain later
