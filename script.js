// Virtue Climbing — interactive background + neon timing
// No trackers, no external deps.

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("Canvas container not found");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    console.error("2D canvas context not available");
    return;
  }

  const reduceMotionMQ = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reduceMotion = !!reduceMotionMQ?.matches;

  let cw = 1;
  let ch = 1;
  let mouseX = 0;
  let mouseY = 0;
  let dynamicActive = false;
  let rafPending = false;

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function resizeCanvas() {
    cw = window.innerWidth || 1;
    ch = window.innerHeight || 1;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    // Draw in CSS pixels for consistent math.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  }

  function getTieDyeBackground(x, y) {
    x = clamp(x, 0, cw);
    y = clamp(y, 0, ch);

    const hue = (x / cw) * 360;
    const saturation = clamp((y / ch) * 100, 0, 100);
    const lightness = 50 + Math.sin(x * 0.05) * 20;

    const radius = cw / 2;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    gradient.addColorStop(
      0.25,
      `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`
    );
    gradient.addColorStop(
      0.5,
      `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness - 10}%)`
    );
    gradient.addColorStop(
      0.75,
      `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness - 15}%)`
    );
    gradient.addColorStop(
      1,
      `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`
    );
    return gradient;
  }

  function draw() {
    if (document.hidden) return;

    if (!dynamicActive || reduceMotion) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);
      return;
    }

    ctx.fillStyle = getTieDyeBackground(mouseX, mouseY);
    ctx.fillRect(0, 0, cw, ch);
  }

  function scheduleDraw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      draw();
    });
  }

  function getClientPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (typeof e.clientX === "number" && typeof e.clientY === "number") {
      return { x: e.clientX, y: e.clientY };
    }
    return null;
  }

  function activateDynamic(e) {
    if (reduceMotion) return;

    const p = getClientPoint(e);
    if (!p) return;

    mouseX = p.x;
    mouseY = p.y;
    dynamicActive = true;
    scheduleDraw();
  }

  function deactivateDynamic() {
    if (!dynamicActive) return;
    dynamicActive = false;
    scheduleDraw();
  }

  // Initial render + sizing
  resizeCanvas();

  // Resize handling
  window.addEventListener(
    "resize",
    () => {
      resizeCanvas();
      scheduleDraw();
    },
    { passive: true }
  );

  // Dynamic background events
  container.addEventListener("mousemove", activateDynamic);
  window.addEventListener("mouseup", deactivateDynamic);

  // Touch (passive so scrolling is never blocked)
  container.addEventListener("touchstart", activateDynamic, { passive: true });
  container.addEventListener("touchmove", activateDynamic, { passive: true });
  window.addEventListener("touchend", deactivateDynamic, { passive: true });

  // If user switches tabs, redraw once when they return
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    scheduleDraw();
  });

  // Respect reduced-motion changes live
  reduceMotionMQ?.addEventListener?.("change", (e) => {
    reduceMotion = !!e.matches;
    dynamicActive = false;
    scheduleDraw();
  });

  // Neon: keep the original "flicker" intro, then switch to smooth pulsing.
  const logoContainer = document.querySelector(".logo-container");
  window.setTimeout(() => {
    logoContainer?.classList.add("pulsing");
  }, 3000);
});
