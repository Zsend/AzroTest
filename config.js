/**
 * Justice Grows deployment configuration.
 *
 * LOCAL TEST MODE (default)
 * - Runs entirely in the visitor's browser using localStorage.
 * - Lets you test every workflow on GitHub Pages without a server.
 * - Never use local mode for real candidate, custody, or employer data.
 *
 * PRODUCTION API MODE
 * - Set mode to "remote" and apiBase to your deployed API service URL.
 * - The included FastAPI service is the production path.
 */
window.JG_CONFIG = Object.freeze({
  mode: "local", // "local" | "remote"
  apiBase: "",   // Example: https://PROJECT_REF.supabase.co/functions/v1/jg-api
  siteUrl: "https://zsend.github.io/AzroTest/",
  siteName: "Justice Grows",
  adminTestToken: "pilot-admin",
  aggregatePrivacyMinimum: 10,
  localStorageKey: "justice_grows_github_pages_v1",
  showLocalModeWarning: true,
  release: "2026.06.18-github-pages.2"
});
