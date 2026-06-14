# Asset slot

This package preserves the original source-site asset expectations, but the raw logo/image binaries are excluded from the SAFE bridge and were not available as raw files in this runtime.

Before deployment, copy the existing approved logo files from the owner vault into this folder, especially:

- `logo-lockup.png`
- optional `favicon.png`
- optional `og-cover.jpg`

The HTML has a text fallback so the site does not break during review, but the fallback is not a replacement for the approved BaseRelay logo asset.
