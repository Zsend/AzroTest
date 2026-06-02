# PowerStream modern website prototype

This package is a customer-facing static front-end redesign for PowerStream Technology. It is built as a deployable single-page website with modern information architecture, responsive design, accessible markup, SEO metadata, JSON-LD organization schema, lightweight JavaScript, and no external runtime dependencies.

## Files

- `index.html` — customer-facing page and content structure
- `styles.css` — responsive visual system and layout
- `script.js` — navigation, catalog filtering, scroll reveal, and project brief copy helper
- `robots.txt` — baseline crawler configuration
- `sitemap.xml` — single-page sitemap placeholder for deployment at `https://www.powerstream.com/`
- `sources.md` — factual source notes used to avoid inventing claims
- `deployment-checklist.md` — production-readiness checklist

## What this redesign changes

The legacy site has substantial technical value, but the current customer path is fragmented across many product and resource pages. This redesign creates a clean front door that routes visitors by job-to-be-done:

1. Find a stock part.
2. Modify a stock product when needed.
3. Start a custom engineering conversation.
4. Use technical resources to specify correctly.

The design avoids unsupported claims such as certifications, lead times, warranty promises, customer logos, ISO status, or ecommerce guarantees that were not present in the reviewed source pages.

## Deployment notes

This is front-end ready. Before replacing the live homepage, PowerStream should connect or confirm the following:

- Live search behavior, if the existing `search-site.htm` page remains the search endpoint.
- Cart and product-detail flow, if this becomes the new site-wide header.
- Contact form or CRM endpoint, if PowerStream wants the project brief to submit directly rather than copy to clipboard.
- Legal review of footer copyright year, life-support language, avionics disclaimer, shipping copy, and policy links.
- Any current pricing, inventory, certifications, and product-specific specifications should remain controlled by the live product catalog.

## Local preview

Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` from this folder.
