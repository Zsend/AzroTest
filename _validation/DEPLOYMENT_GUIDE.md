# A Right For All — v17 Deployment Guide

## Contact email

Create and verify:

`hello.arightforall@gmail.com`

Both builds already use this address.

## GitHub Pages test deployment

Target URL:

`https://zsend.github.io/AzroTest/`

1. Extract `A_Right_For_All_AzroTest_Final_v17.zip`.
2. Upload the **contents inside the ZIP** directly to the root of the `zsend/AzroTest` GitHub Pages branch.
3. Commit the changes and wait for GitHub Pages to rebuild.
4. Hard-refresh the URL.
5. Test Home, Letters, the redacted `Name withheld` letter, the Free Floor, The Bridge, The Minds We Miss, Challenge export, mobile navigation, and email links.

The test build blocks search indexing and includes no `CNAME`.

## Future production deployment

1. Use `A_Right_For_All_Public_Initiative_Final_v17.zip`.
2. Confirm the contact inbox is working.
3. Complete final founder review of the public evidence and copy.
4. Configure the custom domain deliberately through the chosen host.
5. Add the host-generated `CNAME` only when you are ready to connect `arightforall.com`.
6. Confirm HTTPS, then enable and submit the production sitemap.

The production package does not connect the domain automatically.
