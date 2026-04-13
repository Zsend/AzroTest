# A Right For All — premium GitHub Pages package

This package is set up for the fastest possible GitHub Pages test deploy.

## What makes this package safe for testing now

- all site files are at the **top level** of the package
- all internal links are **relative**, so the site works on a GitHub Pages repo URL
- there is **no active `CNAME` file** yet
- `.nojekyll` is included
- the site is a fully static build with no server requirement

## Important

GitHub Pages does **not** deploy a ZIP file directly. You must **unzip this package first**, then upload or commit the **contents** of the folder into the repository root.

## Fast publish steps

1. Create a GitHub repository for the site.
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
- `/unusual-thinkers/` builder challenge

## Later, when the real domain is ready

Use `CNAME.example` as the template for the real `CNAME` file, or use the custom-domain release ZIP included alongside this package.
