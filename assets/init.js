document.documentElement.classList.add("js");
window.setTimeout(() => {
  if (!document.documentElement.classList.contains("app-ready")) {
    document.documentElement.classList.add("reveal-fallback");
  }
}, 2000);
