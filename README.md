# Reserve Standard site — final publish-ready build

This build keeps the cleaner white business design and replaces free desktop scrolling with a true locked chapter system.

## What changed
- Desktop now uses a fixed chapter viewport under the header.
- One wheel or trackpad gesture advances one full section and settles cleanly on the next chapter.
- The homepage sections were tightened so each major chapter fits the screen more cleanly.
- A minimal right-side chapter rail makes section state obvious without adding clutter.
- The FAQ now behaves as a single-open accordion so the chapter stays tidy.
- Reserve Standard / Reserve Standard LLC branding stays consistent across the homepage and supporting pages.
- Live domain assumptions are still unset.

## Before publish
Update these placeholders everywhere they appear:
- `your-domain.com`
- `hello@your-domain.com`
- `CNAME.example` → rename to `CNAME` once your final domain is known

## Main files
- `index.html` — homepage
- `style.css` — visual system and locked desktop chapter styling
- `script.js` — chapter navigation, wheel locking, rail state, navigation, and form mailto flow
- `standard-brief.html` — branded brief page

## Notes
- Locked chapter mode turns on at wider desktop breakpoints and falls back to normal scrolling on smaller screens and reduced-motion environments.
- The application form still opens a pre-filled email rather than posting to a backend.
