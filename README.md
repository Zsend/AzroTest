# Reserve Standard site — final publish-ready build

This build keeps the cleaner white business design and adds a true desktop chapter-scroll system.

## What changed
- Desktop now uses a dedicated scroll viewport under the header.
- One wheel or trackpad gesture advances one full section and auto-locks on the next chapter.
- Each major homepage section is tuned to fit the desktop viewport more cleanly.
- The application section is simplified so it feels lighter and fits the chapter layout better.
- Reserve Standard / Reserve Standard LLC branding stays consistent across the homepage and support pages.
- Live domain assumptions are still unset.

## Before publish
Update these placeholders everywhere they appear:
- `your-domain.com`
- `hello@your-domain.com`
- `CNAME.example` → rename to `CNAME` once your final domain is known

## Main files
- `index.html` — homepage
- `style.css` — visual system and desktop chapter-scroll styling
- `script.js` — chapter scroll logic, navigation handling, and form mailto flow
- `standard-brief.html` — branded brief page

## Notes
- Desktop chapter mode turns on at wider desktop breakpoints and falls back to normal scrolling on smaller screens and reduced-motion environments.
- The application form is still a pre-filled email flow, not a backend form submission.
