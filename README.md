# Justice Grows — AzroTest GitHub Pages release

**Freedom. Work. Ownership.**

This is the repository-ready GitHub Pages acceptance-test release for:

`https://zsend.github.io/AzroTest/`

A clean installation contains zero people, employers, jobs, registry records, placements, and impact outcomes. Browser test mode stores fictional test records only in the current browser's `localStorage`.

## Publish

1. Preserve the existing `zsend/AzroTest` site.
2. Copy every file in this package into the repository root, preserving `.git/`.
3. Commit and push to the default branch.
4. In **Settings → Pages**, select **GitHub Actions**.
5. Wait for **Deploy Justice Grows to GitHub Pages** to pass.

Read `DEPLOY_TO_AZROTEST.md` before publishing.

## Test

Open `ops.html` and use the browser-test token:

`pilot-admin`

Use fictional information only. The browser-test banner must remain visible while `config.js` uses `mode: "local"`.

## Real shared data

GitHub Pages is the public static interface; it cannot run a private database or server-side authentication. Do not collect real sensitive data in browser-local mode. The separately supplied complete platform package contains the controlled-pilot FastAPI service and the production architecture, verification, privacy, employer, and launch playbooks.
