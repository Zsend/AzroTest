# AZRO Systems Website

A fast, responsive static site for **AZRO Systems** — featuring the **BTC Engine** and the **XRP Top/Bottom Detector** (invite-only TradingView scripts).

This repo is designed to be **publish-ready now**, with clear placeholders for final Gumroad + TradingView links you’ll drop in right before launch.

## Pages

- `index.html` — Home (high-level intro + access workflow)
- `features.html` — Feature deep-dive (BTC first, then XRP) + bundle CTA
- `pricing.html` — Lifetime + subscription pricing for BTC / XRP / Bundle
- `about.html` — Product philosophy + demos (BTC first) + glossaries
- `resources.html` — Downloads, guides, docs pack, and links
- `404.html` — Custom not-found page

## Pricing (current defaults)

- **BTC Engine**
  - Lifetime: **$2,000**
  - Subscription: **$199/mo**
- **XRP Top/Bottom Detector**
  - Lifetime: **$200**
  - Subscription: **$25/mo**
- **Bundle (BTC + XRP)**
  - Lifetime: **$2,100**
  - Subscription: **$219/mo**

## Where to paste final Gumroad + TradingView links

Right now, purchase buttons intentionally point to the AZRO Gumroad profile so nothing “breaks” while links are pending.

When you’re ready, update these in **`pricing.html`**:

- BTC lifetime button
- BTC subscription button
- XRP lifetime button
- XRP subscription button
- Bundle lifetime button
- Bundle subscription button

Tip: search for `azrosystems.gumroad.com` to find all placeholders quickly.

If you also want a dedicated public TradingView listing link for BTC, add it wherever you want to surface it (Home/Features/Resources) — the current build keeps TradingView access described as invite-only, delivered after Gumroad checkout.

## Local preview

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- All product-ordering is intentionally **BTC-first** site-wide.
- The site is fully static (no build step). Any host (Netlify, Vercel static, Cloudflare Pages, S3, etc.) works.
