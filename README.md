# Reserve Standard LLC — publish-ready site

This bundle is the final static site for **Reserve Standard LLC**.

## Included
- `index.html` — homepage with desktop guided chapter auto-scroll
- `style.css` — full site styles
- `script.js` — guided chapter navigation, rail sync, nav behavior, and form mailto flow
- `brief.html` — Standard Brief page
- `legal/` — privacy, risk, and terms pages
- `assets/` — brand mark, favicon set, dashboard/process/proof images, OG card
- `llc/`, `standard/`, `reserve-standard/`, `business/`, `program/` — redirect routes
- `404.html`, `robots.txt`

## Guided scroll behavior
On desktop layouts, one wheel or trackpad scroll gesture advances exactly one section and auto-locks on the next chapter.

Guided mode turns on when all of these are true:
- viewport width is at least 1120px
- viewport height is at least 740px
- pointer is `fine`
- reduced motion is not enabled

On smaller screens and touch-first devices, the site falls back to normal scrolling.

## Before publish
Update these values if needed:
- contact email in `index.html` and `brief.html` (`hello@reservestandard.com`)
- OG card or favicon assets if you want different branding exports

## Deploy
Upload the full folder contents to your static host.
