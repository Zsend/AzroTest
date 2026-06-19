/**
 * Justice Grows GitHub Pages acceptance-test configuration.
 *
 * Local mode stores fictional test data unencrypted in this browser only.
 * Do not collect real candidate, custody, legal, release, or employer-contact data
 * until the secure remote API, database, identity, audit, retention, and incident
 * response controls in the go-live checklist are operating.
 */
window.JG_CONFIG = Object.freeze({
  mode: "local", // "local" | "remote"
  apiBase: "",
  siteUrl: "https://zsend.github.io/AzroTest/",
  siteName: "Justice Grows",
  adminTestToken: "pilot-admin",
  aggregatePrivacyMinimum: 10,
  localStorageKey: "justice_grows_github_pages_v2",
  showLocalModeWarning: true,
  release: "2026.06.19-proof-layer.6"
});
