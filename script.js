(() => {
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // ORIGINAL Virtue background (tie-dye radial gradient)
  // - Starts dark, “activates” on first pointer movement (like your original site)
  // - Hue driven by X position
  // - Saturation driven by Y position
  // - Lightness has an X-based wave
  // ---------------------------------------------------------
  const canvas = document.getElementById('bg-canvas');

  if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    if (ctx) {
      let w = 0;
      let h = 0;
      let dpr = 1;
      let renderScale = 1;

      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      // Match the “black until you interact” behavior of the original.
      let activated = false;

      let animating = false;
      let rafId = 0;

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

      const fillDark = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
      };

      const setSize = () => {
        const cssW = Math.max(1, window.innerWidth || 1);
        const cssH = Math.max(1, window.innerHeight || 1);

        w = cssW;
        h = cssH;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Soft gradients look great even when rendered slightly under native resolution.
        // This keeps the “original” look but helps performance on very large displays.
        const maxSide = Math.max(cssW, cssH);
        renderScale = maxSide > 1800 ? 0.85 : 1;

        canvas.width = Math.floor(cssW * dpr * renderScale);
        canvas.height = Math.floor(cssH * dpr * renderScale);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        ctx.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
        ctx.imageSmoothingEnabled = true;

        // Initialize around center so the first activation looks intentional.
        if (!targetX && !targetY) {
          targetX = cssW * 0.5;
          targetY = cssH * 0.44;
          currentX = targetX;
          currentY = targetY;
        } else {
          targetX = clamp(targetX, 0, cssW);
          targetY = clamp(targetY, 0, cssH);
          currentX = clamp(currentX, 0, cssW);
          currentY = clamp(currentY, 0, cssH);
        }

        if (!activated) {
          fillDark();
        } else {
          draw(currentX, currentY);
        }
      };

      const getTieDyeBackground = (x, y) => {
        x = clamp(x, 0, w || 1);
        y = clamp(y, 0, h || 1);

        const hue = (x / (w || 1)) * 360;
        const saturation = clamp((y / (h || 1)) * 100, 0, 100);

        // Original “wavy” lightness feel
        const lightness = 50 + Math.sin(x * 0.05) * 20;

        // Original used width/2.
        const radius = (w || 1) / 2;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        gradient.addColorStop(0.25, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 5}%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness - 10}%)`);
        gradient.addColorStop(0.75, `hsl(${(hue + 180) % 360}, ${saturation}%, ${lightness - 15}%)`);
        gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`);
        return gradient;
      };

      const draw = (x, y) => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = getTieDyeBackground(x, y);
        ctx.fillRect(0, 0, w, h);
      };

      const startAnimation = () => {
        if (prefersReducedMotion) return;
        if (animating) return;
        animating = true;

        const step = () => {
          if (!activated) {
            animating = false;
            rafId = 0;
            return;
          }

          // Smooth pointer follow (premium feel), but keep the original look.
          const ease = 0.14;
          currentX += (targetX - currentX) * ease;
          currentY += (targetY - currentY) * ease;

          draw(currentX, currentY);

          const dx = Math.abs(targetX - currentX);
          const dy = Math.abs(targetY - currentY);

          // Stop animating when settled (saves battery/CPU).
          if (dx < 0.12 && dy < 0.12) {
            animating = false;
            rafId = 0;
            return;
          }

          rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
      };

      const updateTargetFromEvent = (e) => {
        const point = e.touches && e.touches.length ? e.touches[0] : e;
        if (!point || typeof point.clientX !== 'number' || typeof point.clientY !== 'number') return;

        if (!activated) {
          activated = true;
        }

        targetX = clamp(point.clientX, 0, w);
        targetY = clamp(point.clientY, 0, h);

        if (prefersReducedMotion) {
          currentX = targetX;
          currentY = targetY;
          draw(currentX, currentY);
          return;
        }

        startAnimation();
      };

      window.addEventListener('pointermove', updateTargetFromEvent, { passive: true });
      window.addEventListener('touchmove', updateTargetFromEvent, { passive: true });
      window.addEventListener('resize', setSize, { passive: true });

      // Pause any in-flight animation if tab is hidden.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = 0;
          animating = false;
        }
      });

      setSize();
    }
  }

  // -----------------------------
  // Form UX polish
  // -----------------------------
  const form = document.getElementById('subscribe-form');
  const emailInput = document.getElementById('email');
  const joinBtn = document.getElementById('join-btn');
  const errorEl = document.getElementById('form-error');

  const setError = (msg) => {
    if (!errorEl) return;

    if (!msg) {
      errorEl.textContent = '';
      errorEl.hidden = true;
      if (emailInput) emailInput.removeAttribute('aria-invalid');
      return;
    }

    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (emailInput) emailInput.setAttribute('aria-invalid', 'true');
  };

  if (emailInput) {
    emailInput.addEventListener('input', () => setError(''));
  }

  if (form && emailInput && joinBtn) {
    form.addEventListener('submit', (e) => {
      const email = (emailInput.value || '').trim();
      emailInput.value = email;

      const valid = email.length > 0 && emailInput.checkValidity();
      if (!valid) {
        e.preventDefault();
        setError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      setError('');
      joinBtn.disabled = true;
      joinBtn.textContent = 'Joining…';
      form.setAttribute('aria-busy', 'true');
    });

    // Optional “Contact” link (only shown if we can safely infer your email address).
    const contactLink = document.getElementById('contact-link');
    if (contactLink) {
      try {
        const action = form.getAttribute('action') || '';
        const match = action.match(/formsubmit\.co\/([^/?#]+)/i);
        const inferred = match ? decodeURIComponent(match[1]) : '';
        const looksReal = inferred.includes('@') && !/your_receiving_email|example\.com/i.test(inferred);

        if (looksReal) {
          contactLink.href = `mailto:${inferred}`;
          contactLink.hidden = false;
        }
      } catch (_) {
        // no-op
      }
    }
  }
})();
