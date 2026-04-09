# A Right For All site package

Files:
- `index.html` — homepage
- `letters.html` — featured excerpts + full original letter archive
- `assets/` — CSS, JS, images, OG image, letter thumbnails
- `letters/` — original PDF letters

## Publish checklist
1. Point `arightforall.com` at your hosting provider.
2. Upload the full contents of this folder.
3. Make sure `hello@arightforall.com` exists before launch.
4. If you want form submissions to go somewhere other than email, swap the form handling in `assets/site.js`.

## Current form behavior
The site currently opens a prefilled email draft to `hello@arightforall.com`.
That keeps the static site publishable today without needing a backend.

## Notes on the letters
Featured letters include typed excerpts for readability.
The full set of original handwritten PDFs is included in `/letters/`.
