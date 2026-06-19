# Deploy to `zsend/AzroTest`

Publishing replaces the current Pages site at `https://zsend.github.io/AzroTest/`. Preserve the current version first.

## 1. Clone and preserve

```bash
git clone https://github.com/zsend/AzroTest.git
cd AzroTest
git tag azro-before-justice-grows-2026-06-19
git push origin azro-before-justice-grows-2026-06-19
git switch -c justice-grows-proof-launch
```

## 2. Replace the working tree

Extract the release ZIP. Copy its **contents** into the cloned repository root while preserving `.git/`.

```bash
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
rsync -a /PATH/TO/Justice-Grows-Proof-Layer-AzroTest/ ./
```

Confirm:

```text
index.html
proof.html
config.js
assets/
.github/workflows/pages.yml
.nojekyll
```

## 3. Validate locally

```bash
python scripts/check_release.py
python -m http.server 8080
```

Open `http://localhost:8080/` and confirm the preview banner is visible.

## 4. Commit and merge

```bash
git add -A
git commit -m "Launch Justice Grows proof layer"
git push -u origin justice-grows-proof-launch
```

Open a pull request. Confirm no `.env`, database, private key, access token, evidence document, or real personal information is present. Merge into the default branch.

## 5. Enable Pages

1. Open **Settings → Pages**.
2. Select **GitHub Actions** under **Build and deployment**.
3. Open **Actions → Deploy Justice Grows to GitHub Pages**.
4. Wait for build and deploy to pass.
5. Open the Pages URL and hard-refresh.

## Test console

Open `/ops.html` and use `pilot-admin`. Use fictional information only.

## Rollback

```bash
git switch main
git reset --hard azro-before-justice-grows-2026-06-19
git push --force-with-lease origin main
```

Replace `main` with the repository’s actual default branch where necessary.
