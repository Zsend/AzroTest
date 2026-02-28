document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("canvas-container");
  if (!container) return;

  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let dynamicActive = false;
  let mouseX = 0, mouseY = 0;
  let pending = false;
  let idleTimer = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!dynamicActive) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(n, max));
  }

  function getTieDyeBackground(x, y) {
    const cw = canvas.width || 1;
    const ch = canvas.height || 1;
    x = clamp(x, 0, cw);
    y = clamp(y, 0, ch);

    const hue = (x / cw) * 360;
    const saturation = clamp((y / ch) * 100, 0, 100);
    const lightness = 50 + (Math.sin(x * 0.05) * 20);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, cw / 2);
    gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness - 10}%)`);
    gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness - 15}%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`);
    return gradient;
  }

  function draw() {
    if (!dynamicActive) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.fillStyle = getTieDyeBackground(mouseX, mouseY);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function scheduleDraw() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }

  function readPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (typeof e.clientX === "number" && typeof e.clientY === "number") {
      return { x: e.clientX, y: e.clientY };
    }
    return null;
  }

  function handleMove(e) {
    const p = readPoint(e);
    if (!p) return;
    mouseX = p.x;
    mouseY = p.y;
    dynamicActive = true;
    scheduleDraw();

    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      dynamicActive = false;
      scheduleDraw();
    }, 220);
  }

  function handleEnd() {
    if (idleTimer) window.clearTimeout(idleTimer);
    dynamicActive = false;
    scheduleDraw();
  }

  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    scheduleDraw();
  }, { passive: true });

  container.addEventListener("mousemove", handleMove);
  container.addEventListener("touchstart", handleMove, { passive: true });
  container.addEventListener("touchmove", handleMove, { passive: true });

  window.addEventListener("mouseup", handleEnd);
  window.addEventListener("touchend", handleEnd, { passive: true });

  const logoContainer = document.querySelector(".logo-container");
  setTimeout(() => {
    if (logoContainer) logoContainer.classList.add("pulsing");
  }, 3000);
});
