# A Right For All — GitHub Pages Test Build

This package is configured for the temporary test URL:

`https://zsend.github.io/AzroTest/`

## Important

Deploying this package to the root of the `zsend/AzroTest` GitHub Pages source will replace the site currently shown at that URL. This test build intentionally:

- removes the production `CNAME`;
- points canonical and social metadata to `https://zsend.github.io/AzroTest/`;
- uses `/AzroTest/` as the web-app manifest scope/start URL;
- includes `.nojekyll`;
- blocks search indexing with `noindex` metadata and `robots.txt`;
- keeps all public site pages, letters, PDFs, previews, scripts, and assets.

## Deploy with the GitHub website

1. Back up or commit the current contents of the `AzroTest` repository.
2. Extract this ZIP.
3. Upload **the extracted contents**, not the enclosing folder, to the branch/folder configured in **Settings → Pages**.
4. Commit the changes.
5. Wait for the Pages deployment to finish, then open `https://zsend.github.io/AzroTest/`.
6. Hard-refresh the browser if an older site is cached.

## Git command path

Copy the extracted contents into the repository root, then run:

```bash
git add -A
git commit -m "Deploy A Right For All test site"
git push
```

No build step or server runtime is required.
