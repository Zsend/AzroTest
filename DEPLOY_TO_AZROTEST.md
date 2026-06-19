# Deploy to `zsend/AzroTest`

Publishing this release replaces the current site at `https://zsend.github.io/AzroTest/`. Preserve the current version first.

## 1. Clone and preserve

```bash
git clone https://github.com/zsend/AzroTest.git
cd AzroTest
git tag azro-before-justice-grows-2026-06-19
git push origin azro-before-justice-grows-2026-06-19
git switch -c justice-grows-launch
```

## 2. Replace the working tree

Extract the downloaded ZIP. Copy its **contents** into the cloned repository root while preserving `.git/`.

macOS or Linux:

```bash
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
rsync -a /PATH/TO/Justice-Grows-AzroTest-Ready-to-Publish/ ./
```

Keep this test configuration:

```js
mode: "local"
siteUrl: "https://zsend.github.io/AzroTest/"
```

## 3. Commit, review, and merge

```bash
git add -A
git commit -m "Launch Justice Grows"
git push -u origin justice-grows-launch
```

Open a pull request. Confirm no `.env`, database, private key, access token, source document, or real personal information is present. Merge into the default branch.

## 4. Enable Pages

1. Open **Settings → Pages**.
2. Choose **GitHub Actions** under **Build and deployment**.
3. Open **Actions → Deploy Justice Grows to GitHub Pages**.
4. Wait for both jobs to pass.
5. Open the Pages URL and hard-refresh.

## 5. Acceptance test

1. Confirm the dark preview strip is visible.
2. Submit a fictional candidate and save the private Passport link.
3. Open `ops.html`; enter `pilot-admin`.
4. Moderate the Passport.
5. Submit and verify a fictional employer.
6. Submit and publish a fictional paid role.
7. Confirm the candidate receives a skills-first match.
8. Create a fictional registry draft.
9. Confirm publication fails before two sources and two complete independent reviews.
10. Add the required evidence and reviews; publish the record.
11. Confirm public metrics and charts update.
12. Reset browser data from the operations console.

## Rollback

```bash
git switch main
git reset --hard azro-before-justice-grows-2026-06-19
git push --force-with-lease origin main
```

Use the repository's actual default-branch name when it is not `main`.
