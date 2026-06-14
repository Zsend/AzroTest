# Reserve Standard v199 — Customer-ready proof/page-flow refinement

Date: 2026-06-14

## Use

Publish `ReserveStandard_v199_customer_ready_navigation_proof_spacing_2026-06-14.zip` as the current Reserve Standard site package.

## Supersedes

- v198 proof spacing candidate
- v197 proof responsive candidate
- v196 TradingView link/proof polish candidate
- v195 proof page polish candidate
- v194 access-code restoration candidate
- v193 private-access clean candidate

## Changes from v198

1. Removed the proof hero pills (`Model vs weekly auto-buy`, `Extra BTC`, `Extra sats`) because the concepts belong in the explanatory copy, not as clutter in the hero.
2. Reworked the weekly budget range block into a cleaner premium card using `$20–$5,000/week` and supporting copy, avoiding chip wrapping and uneven lines.
3. Rebuilt the future scenario area as responsive brand-consistent scenario cards; no broken scenario table layout remains.
4. Added page-scoped spacing refinements for Proof and Get Set Up pages so sections/cards breathe consistently across desktop, tablet, and mobile.
5. Converted top navigation `Why now` and `Framework` from homepage anchor jumps to dedicated pages: `why-now.html` and `framework.html`.
6. Added `Why now` and `Framework` to footer resource navigation.
7. Preserved the restored access-code verifier and site gate behavior.
8. Preserved the TradingView script button on `get-set-up.html`.

## Not changed

- No access-code/verifier change.
- No `site-config.js` change.
- No gate logic change.
- No form endpoint change.
- No public founding-price or launch-discount language.
- No unsupported historical proof numbers added.
- No performance guarantee language added.

## QA

- JavaScript syntax checks passed for `gate.js`, `script.js`, `contact.js`, and `site-config.js`.
- Internal local links and asset references verified.
- No remaining `index.html#why-now` or `index.html#framework` primary-nav jumps.
- Responsive render harness checked Proof, Get Set Up, Why Now, Framework, and Index at 390, 768, 1024, 1440, and 1920 px with no horizontal overflow detected.
- ZIP integrity passed.

## Post-publish checklist

1. Confirm the existing access code still works.
2. Check `/proof.html` hero: no clutter pills.
3. Check `/proof.html` budget card: `$20–$5,000/week` displays cleanly.
4. Check `/proof.html` scenario cards on desktop and mobile.
5. Check `/get-set-up.html` TradingView script button.
6. Check `/why-now.html` and `/framework.html` load from navigation.
7. Confirm all CTAs still route correctly.
8. Confirm no public founding-price / launch-discount language appears.
9. Confirm no unsupported proof numbers appear.
