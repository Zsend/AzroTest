document.addEventListener("DOMContentLoaded", function() {
  // --- CANVAS SETUP ---
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("Canvas container not found");
    return;
  }
  
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  
  let dynamicActive = false;
  let mouseX = 0, mouseY = 0;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!dynamicActive) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  function getTieDyeBackground(x, y) {
    const cw = canvas.width || 1;
    const ch = canvas.height || 1;
    x = Math.max(0, Math.min(x, cw));
    y = Math.max(0, Math.min(y, ch));
    
    const hue = (x / cw) * 360;
    const rawSat = (y / ch) * 100;
    const saturation = Math.max(0, Math.min(rawSat, 100));
    const lightness = 50 + (Math.sin(x * 0.05) * 20);
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, cw / 2);
    gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness - 10}%)`);
    gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness - 15}%)`);
    gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`);
    return gradient;
  }
  
  function animate() {
    if (dynamicActive) {
      const bg = getTieDyeBackground(mouseX, mouseY);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(animate);
  }
  animate();
  
  // --- GLOW TOGGLING FUNCTIONS ---
  const logoContainer = document.querySelector('.logo-container');
  
  function disableGlow() {
    if (logoContainer) {
      logoContainer.classList.remove('pulsing');
      logoContainer.classList.add('no-glow');
    }
  }
  
  function enableGlow() {
    if (logoContainer) {
      logoContainer.classList.remove('no-glow');
      logoContainer.classList.add('pulsing');
      // Optionally, adjust logo image animation delay for a smoother restart:
      const logoImg = logoContainer.querySelector('img');
      if (logoImg) {
        logoImg.style.animationDelay = '0s';
        setTimeout(function() {
          logoImg.style.animationDelay = '0.3s';
        }, 50);
      }
    }
  }
  
  // --- DYNAMIC BACKGROUND & GLOW HANDLING ---
  function handlePointerStart(e) {
    e.preventDefault();
    disableGlow();
    
    let x, y;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    if (isFinite(x) && isFinite(y)) {
      mouseX = x;
      mouseY = y;
      dynamicActive = true;
    }
  }
  
  function handlePointerEnd() {
    dynamicActive = false;
    enableGlow();
  }
  
  container.addEventListener("touchstart", handlePointerStart, { passive: false });
  container.addEventListener("touchmove", handlePointerStart, { passive: false });
  container.addEventListener("mousemove", handlePointerStart);
  window.addEventListener("touchend", handlePointerEnd, { passive: false });
  window.addEventListener("mouseup", handlePointerEnd);
  
  // --- INITIAL TRANSITION FROM FLICKER TO PULSING ---
  setTimeout(() => {
    if (logoContainer && !logoContainer.classList.contains('no-glow')) {
      logoContainer.classList.add('pulsing');
    }
  }, 3000);
});




