# Reserve Standard site package V67

This is the current publish-ready static site build.

## Publish rule
Replace the entire contents of your GitHub Pages repo/subdirectory with this package.
Do not mix these files with older CSS, JS, or assets.

## What is locked in this pass
- final homepage closing-card alignment
- scroll-linked top progress rail with subtle progress head
- premium interaction polish for buttons, footer links, final cards, forms, and focus states
- band-card motion contained so it cannot create horizontal overflow
- final shared footer alignment and spacing
- premium contained footer panel using the same column rhythm as the site cards
- launch-audit mobile containment fixes for proof tables, proof chart, footer, and CTA buttons
- chapter rail kept out of the content field on laptop-width screens
- exact approved editorial serif on display surfaces
- Inter for system / UI text
- calmer, sharper institutional scroll system
- chapter rail with live section progress
- subtle hero depth / grid parallax
- section-by-section focus motion with restrained surface lift
- proof chart line-draw and sweep animation
- sticky proof / review / brief side surfaces on large screens
- responsive collapse tuning and reduced-motion safety rules


## v61 final polish
- Top progress rail now starts at the calibrated “Why this matters now” baseline instead of zero.
- Progress rail still reaches 100% exactly at the bottom of the site.
- Progress head remains subtly visible on first paint for a more intentional premium finish.
- Progress baseline recalibrates after load and font/layout settling.


## v62 polish
- Scroll progress rail keeps the calibrated warm-start fill, but now uses a soft terminal fade cap so the moving edge reads smooth instead of cut off.

## v63 final polish
- Private access gate upgraded to match the premium site system instead of feeling like a separate utility screen.
- Mobile navigation now opens with a restrained transition instead of an abrupt display swap.
- Form fields now have clearer focus tactility, autocomplete hints, and reserved textarea height.
- Header/footer imagery now includes dimensions/decoding hints to reduce layout shift and improve perceived performance.
- Internal HTML routes use light-touch intent prefetch on hover/focus.
- Added Safari backdrop-filter support, stable scrollbar gutter, and subtle desktop scrollbar styling.
- Removed non-production preview artifacts from the publish package so the shipped directory contains only production site files and production assets.

## v64/v65 framework-card correction
- Restored the Asset / Problem / System cards to the original scroll-driven fade/slide behavior.
- Preserved page-level overflow containment so the animation does not create horizontal scrolling.

## v66 institutional finish
- Added final typography, surface, header, mobile-nav, prefetch, and accessibility refinements while preserving content and routes.

## v68 closing-card motion restoration
- Operator Materials and Next Step cards now use the same direct scroll-driven inline motion model as the original Asset / Problem / System framework cards.
- The cards fade from zero opacity, drift in from the right, unblur, and scale-settle by scroll position instead of using a one-time reveal class.
- The sequence is staggered so Operator Materials lands first and Next Step follows.
- The cards keep responsive stacked layouts, preserve hover polish after landing, and avoid horizontal overflow.

