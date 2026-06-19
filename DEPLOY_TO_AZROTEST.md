# Deploy Justice Grows to the AzroTest GitHub Pages site

## Read this first

The target Pages address currently serves another site. Publishing Justice Grows from the repository root will replace that experience. Preserve the current version before deployment.

## Recommended deployment: branch, review, then merge

### 1. Clone and preserve the existing site

```bash
git clone https://github.com/zsend/AzroTest.git
cd AzroTest
git tag azro-before-justice-grows-2026-06-18
git push origin azro-before-justice-grows-2026-06-18
git switch -c justice-grows-launch
```

### 2. Replace the working tree with this release

Extract the downloaded Justice Grows ZIP elsewhere, then copy its contents into the cloned repository root. Preserve `.git/` only.

On macOS or Linux:

```bash
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
rsync -a /PATH/TO/justice-grows-azrotest-final/ ./
```

### 3. Review configuration

For public testing, keep:

```js
mode: "local"
siteUrl: "https://zsend.github.io/AzroTest/"
```

This is a browser-only test workspace. Never enter real candidate, custody, employer-contact, or correction data.

### 4. Commit and push the review branch

```bash
git add -A
git commit -m "Launch Justice Grows GitHub Pages test site"
git push -u origin justice-grows-launch
```

Open a pull request and review the Files Changed tab. Confirm that no `.env`, database, development encryption key, private source document, access token, or candidate information is present.

### 5. Merge and enable GitHub Pages

After review, merge the branch into the repository's default branch.

In the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Open **Actions → Deploy Justice Grows to GitHub Pages**.
4. Wait for the deployment job to finish.
5. Open the Pages URL and hard-refresh.

The included workflow publishes only public frontend files. It does not publish `backend/`, `docs/`, `templates/`, tests, or operational secrets.

## Immediate browser test

1. Open the deployed homepage.
2. Confirm the browser-test banner is visible.
3. Submit a fictional candidate profile.
4. Save the private Passport link.
5. Open `ops.html` and sign in with `pilot-admin`.
6. Moderate the Passport.
7. Submit and verify a fictional employer.
8. Submit and publish a fictional paid role.
9. Confirm the role and match suggestion appear.
10. Create a fictional registry draft, add two sources, record two distinct complete reviews, and publish it.
11. Confirm charts and public metrics update without a page build.
12. Reset local test data from the operations console when finished.

The data will be visible only in that browser profile.

## Connect real shared data later

GitHub Pages cannot execute a backend. Deploy the FastAPI service from the complete platform package separately, then change `config.js`:

```js
mode: "remote",
apiBase: "https://YOUR-API-ORIGIN.example",
showLocalModeWarning: false
```

Before doing this, complete every blocking item in `GO_LIVE_CHECKLIST.md` and `docs/PRODUCTION_LAUNCH_CHECKLIST.md`.

## Rollback

To restore the preserved site:

```bash
git switch main
git reset --hard azro-before-justice-grows-2026-06-18
git push --force-with-lease origin main
```

Use the actual default-branch name if it is not `main`. Coordinate force pushes with anyone else working in the repository.
