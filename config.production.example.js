/** Copy to config.js only after the secure production API is operational. */
window.JG_CONFIG = Object.freeze({
  mode: "remote",
  apiBase: "https://api.your-domain.example",
  siteUrl: "https://YOUR_DOMAIN.example/",
  siteName: "Justice Grows",
  adminTestToken: "",
  aggregatePrivacyMinimum: 10,
  localStorageKey: "justice_grows_github_pages_v2",
  showLocalModeWarning: false,
  release: "2026.06.19-proof-layer.6"
});
