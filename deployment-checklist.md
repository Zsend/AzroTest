# Deployment checklist

## Content and legal

- Confirm company name, DBA names, CAGE code, address, phone, and fax.
- Confirm whether copyright should display the current year.
- Confirm whether the life-support and avionics disclaimers should remain in the homepage safety block or only in policy pages.
- Confirm no regulated or approval-specific claim is implied beyond what individual product pages support.
- Confirm shipping language against the latest operational reality.
- Confirm no customer logos, certifications, or performance claims are added without proof.

## Product and ecommerce

- Verify all category URLs still resolve.
- Decide whether product search should use the existing `search-site.htm`, a new search engine, or a commerce platform search.
- Keep pricing, availability, specifications, datasheets, and add-to-cart behavior in a catalog system rather than hard-coded on the homepage.
- Add redirects from legacy high-traffic entry pages only after reviewing search traffic.

## Contact and lead flow

- Decide whether the project brief should remain copy-to-clipboard or submit to a CRM/email endpoint.
- Add spam protection if direct form submission is enabled.
- Route leads by type: stock part, semi-custom modification, custom engineering, consulting, polymer molding, RMA.
- Add office hours if PowerStream wants call expectations on the page.

## Accessibility and QA

- Test keyboard navigation, focus states, skip link, mobile menu, and color contrast.
- Test in current Chrome, Safari, Firefox, Edge, iOS Safari, and Android Chrome.
- Check reduced-motion behavior.
- Run HTML validation and Lighthouse before launch.
- Confirm the page works without JavaScript; core links should remain usable.

## SEO and analytics

- Add final canonical URL after deployment.
- Expand `sitemap.xml` if this becomes a multi-page build.
- Add analytics only after privacy review.
- Preserve or map high-value legacy URLs to avoid search traffic loss.
- Add structured data for individual products only on product pages, not the homepage.
