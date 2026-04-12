# A Right For All — GitHub Pages publish-ready package

This package is set up for a fast GitHub Pages deploy.

## What makes this package safe for testing now

- all site files are at the **top level** of the package
- all internal links are **relative**, so the site works on a GitHub Pages repo URL
- there is **no active `CNAME` file** yet in the test package
- `.nojekyll` is included

## Important

GitHub Pages does **not** deploy a ZIP file directly. You must **unzip this package first**, then upload or commit the **contents** of the folder into the repository root.

## Fast publish steps

1. Create or open your GitHub repository for the site.
2. Make the repository **public** if you are using GitHub Free.
3. Unzip this package on your computer.
4. Upload the **contents** of the unzipped folder to the **repo root**. Do **not** upload the ZIP itself.
5. In GitHub, open **Settings → Pages**.
6. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
7. Set **Branch** to `main` and **Folder** to `/ (root)`.
8. Save and wait for the Pages URL to appear.

## Included pages

- `/` homepage
- `/letters/` letter archive
- `/sources/` evidence and public-record sources
- `/unusual-thinkers/` challenge page

## Live dependency

The join flow currently opens a drafted email to **hello@arightforall.com**.

## Later, when the real domain is ready

Use the custom-domain package or rename `CNAME.example` to `CNAME` and set the contents to `arightforall.com`.
