# Publish Justice Grows to AzroTest

This folder is the complete GitHub Pages release for:

`https://zsend.github.io/AzroTest/`

## Fastest path

1. Back up the current `zsend/AzroTest` repository.
2. Copy **everything in this folder** into the repository root. Keep the repository's `.git/` folder.
3. Commit and push to the default branch.
4. In GitHub, open **Settings → Pages → Build and deployment** and choose **GitHub Actions**.
5. Wait for **Deploy Justice Grows to GitHub Pages** to pass.
6. Open the Pages URL and hard-refresh.

## Test access

Open `ops.html` and use:

`pilot-admin`

The dark preview strip means the site is in browser-only test mode. Use fictional information only. Test records stay in that browser and can be reset from the operations console.

## Real data

Do not collect real candidate, custody, legal-document, employer-contact, correction, or release data in browser-only mode. Real shared data requires the separately deployed secure API and database described in `GO_LIVE_CHECKLIST.md`.
