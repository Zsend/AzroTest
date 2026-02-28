document.addEventListener("DOMContentLoaded", () => {
  // --- CANVAS SETUP ---
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("Canvas container not found");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: false });

  let dynamicActive = false;
  let mouseX = 0;
  let mouseY = 0;
  let cw = 1;
  let ch = 1;
  let rafPending = false;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(n, max));
  }

  function resizeCanvas() {
    cw = window.innerWidth || 1;
    ch = window.innerHeight || 1;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    // Draw in CSS pixels for consistent math.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Keep the current visual state after a resize.
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
    gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness - 10}%)`);
    gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness - 15}%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`);
    return gradient;
  }

  function draw() {
    if (document.hidden) return;

    if (dynamicActive) {
      ctx.fillStyle = getTieDyeBackground(mouseX, mouseY);
    } else {
      ctx.fillStyle = "#000";
    }

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

  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    scheduleDraw();
  });

  // Keep the neon glow always on.
  const logoContainer = document.querySelector(".logo-container");

  // --- DYNAMIC BACKGROUND & GLOW HANDLING ---
  function getClientPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function activateDynamic(e) {
    const { x, y } = getClientPoint(e);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    if (!dynamicActive) {
      dynamicActive = true;
    }

    mouseX = x;
    mouseY = y;
    scheduleDraw();
  }

  function deactivateDynamic() {
    if (!dynamicActive) return;
    dynamicActive = false;
    scheduleDraw();
  }

  // Mouse
  container.addEventListener("mousemove", activateDynamic);
  window.addEventListener("mouseup", deactivateDynamic);

  // Touch (passive so scrolling is never blocked)
  container.addEventListener("touchstart", activateDynamic, { passive: true });
  container.addEventListener("touchmove", activateDynamic, { passive: true });
  window.addEventListener("touchend", deactivateDynamic, { passive: true });

  // Pause redraws when hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    scheduleDraw();
  });

  // --- INITIAL TRANSITION FROM FLICKER TO PULSING ---
  setTimeout(() => {
    logoContainer?.classList.add("pulsing");
  }, 3000);
});
