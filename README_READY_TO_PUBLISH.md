# AZRO Ready-to-Publish Site v3.8 — Institutional Proof System

Date: 2026-06-14

## Source

Built from uploaded WIP site:

`AZRO-main-AzroTest-preview-v3_6-proof-flow-final (2).zip`

## What changed

This final package keeps the existing AZRO brand/site shell and adds the proof system required for the long-term moat:

- `proof.html` — institutional proof hub
- `benchmark.html` — BTC model versus weekly auto-buy benchmark
- `proof-archive.html` — versioned proof ledger
- `xrp-proof.html` — XRP proof framework without revealing trigger logic
- `reserve-records.html` — Customer Reserve Records and Annual Reserve Value Reports framework

It also initializes public-safe proof data files:

- `proof-ledger/benchmark/model-vs-weekly-autobuy.csv`
- `proof-ledger/xrp/xrp-public-cycle-record.csv`
- `proof-ledger/customer-records/customer-reserve-record-schema.json`
- `proof-ledger/annual-reports/annual-reserve-value-report-template.json`

## Public/private boundary

Public pages may show:
- model vs weekly auto-buy framework;
- extra BTC / extra sats fields after approved forward entries exist;
- live forward status;
- versioned proof ledger context;
- customer reserve-record/report framework;
- independent-review roadmap.

Public pages must not show:
- Pine source;
- thresholds;
- formulas;
- trigger logic;
- exact timing recipes;
- raw chart exports;
- internal proof files;
- customer/private material;
- dense examples that help recreate the model.

## Customer-ready cleanup

Legacy/intermediate old-version PDFs were removed from the public package to reduce customer confusion and reverse-engineering surface. Current v1.1.1 / v1.4.4 docs and legal/support files remain.

Removed PDF count: 105

## QA

See `AZRO_FINAL_SITE_QA_REPORT.json`.

Generated QA status: PASS

## Deployment

Upload the contents of this folder to the site root.

Do not upload the outer folder as a nested directory.

Keep `CNAME` and `.nojekyll`.


## Final QA snapshot

- Missing internal links: 0
- Missing internal assets: 0
- Preview/noarchive hits: 0
- Customer pages left noindex: 0
- Strict claim flags: 0
- Logic-leak flags: 0
