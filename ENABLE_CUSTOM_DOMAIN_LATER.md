# Enable the custom domain later

When you are ready to move from the temporary GitHub Pages URL to `arightforall.com`:

1. In GitHub, open **Settings → Pages** for the site repository.
2. Under **Custom domain**, enter `arightforall.com` and save.
3. Add a file named `CNAME` at the repo root containing only:

```
arightforall.com
```

4. Point your DNS records to GitHub Pages.
5. Wait for GitHub Pages HTTPS to finish provisioning, then turn on **Enforce HTTPS**.
6. Replace the temporary package with the custom-domain-ready package if you prefer.

A custom-domain-ready release ZIP is included alongside the test-ready package.
