# A Right For All — Final v20 Deployment Guide

## 1. Create the public email first

Create and test:

`hello.arightforall@gmail.com`

Send a test message to it and confirm replies work before publishing either package.

## 2. Deploy the GitHub Pages test build

Target:

`https://zsend.github.io/AzroTest/`

Steps:

1. Back up or commit the current `zsend/AzroTest` repository.
2. Extract `A_Right_For_All_AzroTest_Final_v20.zip`.
3. Upload the **contents inside the ZIP** to the root of the GitHub Pages branch. Do not upload an enclosing folder.
4. Commit the files and wait for GitHub Pages to rebuild.
5. Open the test URL in a private window or hard-refresh the page.
6. Test Home, Letters, the Name withheld letter and PDF, The Free Floor, The Bridge, The Minds We Miss, Evidence, the Challenge, mobile navigation, forms, and email links.

The test build remains `noindex` and contains no `CNAME`.

## 3. Publish the production build later

Package:

`A_Right_For_All_Public_Initiative_Final_v20.zip`

This package is prepared for `https://arightforall.com/`, but it does not include a `CNAME` and will not connect the domain automatically.

When ready:

1. Upload the extracted contents to the production publishing root.
2. Configure the custom domain through GitHub Pages or the chosen host.
3. Confirm HTTPS and canonical redirects.
4. Verify `robots.txt`, `sitemap.xml`, social preview metadata, and the contact email.
5. Perform a final live-device check before announcing the URL broadly.

## 4. Final live checklist

- public email receives and sends messages
- all navigation links work
- all 21 letter PDFs open
- all letter images load smoothly
- Name withheld remains fully anonymous
- Challenge autosave and exports work
- no horizontal scrolling on phone or tablet
- social sharing preview shows the correct card
- test site remains blocked from indexing until broad launch approval
