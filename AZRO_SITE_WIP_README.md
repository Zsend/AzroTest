# v272 WIP site — 2026-04-20

## Status: WORK IN PROGRESS — not yet live

This is the **v272 site draft** sourced from the founder's chat-generated build:
`AllAzroSystems/chatwithwebsitegoalupdatedraft/AZRO_HANDOFF_CURRENT_SITE_v272_2026-04-20_REDOWNLOAD.zip`

All 186 files extracted (HTML, CSS, JS, PDFs, images, assets).

## Relationship to live canonical

Compared against `outputs/website/azrosystems-live-2026-04-18/`:

- **All 10 HTML pages byte-identical** (index, about, contact, features, philosophy, pricing, products, resources, support, 404)
- **CSS identical** (site-core.css, site-home.css, etc.)
- **2 additional BTC v1.0.7 customer PDFs** added to `pdfs/`:
  - `azro-btc-fit-faq-and-contribution-guide-v1.0.7.pdf`
  - `azro-btc-operating-system-deep-test-report-v1.0.7.pdf`
- Root-level videos ship in a companion zip (`AZRO_HANDOFF_ROOT_VIDEOS_v272_2026-04-20_REDOWNLOAD.zip`) — not included in this folder; live canonical already has the videos.

## What v272 does NOT include that was planned

- **No public weekly BTC benchmark page** — still not built. This remains the highest-leverage next thing per the 2026-04-20 handoff §12.
- **No public proof archive page** — still not built.
- **No dedicated `benchmark.html` or `proof.html`** — the "Proof" nav label still routes to `resources.html` (same as live).

## How to use this folder

This is the working base for the next iteration of the site. When new pages or changes are staged:

1. Edit files here (or copy/modify into a sub-patch folder)
2. QA the changes
3. When ready for live: create a new canonical `outputs/website/azrosystems-live-[YYYY-MM-DD]/` with the merged content
4. Update `CLAUDE.md` immutable-paths pointer
5. Log in `OS.md §16`

## Ready-to-build next

Per the 2026-04-20 handoff §12 and §13:

- **Highest leverage:** build `benchmark.html` inside this shell (don't invent numbers — use real weekly outputs). Keep nav/footer/CSS unchanged.
- **Next:** homepage rewrite around BTC-first proof (content/IA only, no redesign).
- **Next:** add the four missing help pages — `what-happens-after-i-sign-up`, `beginner-tradingview-help`, `common-mistakes`, `support-contact` (which already exists).

## Do not overwrite

- Do not edit the live canonical at `outputs/website/azrosystems-live-2026-04-18/` — it's immutable reference.
- When ready to ship this WIP to live, create a new date-stamped canonical folder rather than overwriting v272-WIP or the 2026-04-18 snapshot.
