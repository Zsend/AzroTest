(() => {
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // Dynamic background (high-quality canvas “tie-dye” gradient)
  // ---------------------------------------------------------
  const canvas = document.getElementById('bg-canvas');

  if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    if (ctx) {
      let w = 0;
      let h = 0;

      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      let dpr = 1;
      let renderScale = 1;

      let rafId = 0;
      let running = true;
      let lastFrame = 0;

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const wrapHue = (hue) => ((hue % 360) + 360) % 360;
      const hsla = (hue, s, l, a) => `hsla(${wrapHue(hue)}, ${s}%, ${l}%, ${a})`;

      const setSize = () => {
        const cssW = Math.max(1, window.innerWidth || 1);
        const cssH = Math.max(1, window.innerHeight || 1);

        w = cssW;
        h = cssH;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Render slightly lower resolution on very large screens for efficiency.
        // The background is intentionally soft, so the visual difference is minimal.
        const maxSide = Math.max(cssW, cssH);
        renderScale = maxSide > 1600 ? 0.75 : 1;

        canvas.width = Math.floor(cssW * dpr * renderScale);
        canvas.height = Math.floor(cssH * dpr * renderScale);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        ctx.setTransform(dpr * renderScale, 0, 0, dpr * renderScale, 0, 0);
        ctx.imageSmoothingEnabled = true;

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

        draw(performance.now());
      };

      const draw = (ms) => {
        const t = ms * 0.001;

        // Smooth-follow pointer (slightly slower feels more premium)
        const ease = prefersReducedMotion ? 1 : 0.08;
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        const nx = currentX / (w || 1);
        const ny = currentY / (h || 1);

        const baseHue = (nx * 360 + t * 10) % 360;
        const sat = 80 + ny * 10;
        const light = 56 - ny * 6;

        // Base
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#05060a';
        ctx.fillRect(0, 0, w, h);

        // Subtle dark wash (prevents “true black” banding on some displays)
        const wash = ctx.createLinearGradient(0, 0, w, h);
        wash.addColorStop(0, hsla(baseHue + 30, 35, 12, 0.55));
        wash.addColorStop(1, hsla(baseHue + 210, 35, 8, 0.55));
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, w, h);

        // Soft, blended blobs
        ctx.globalCompositeOperation = 'screen';
        const maxR = Math.max(w, h);

        const blobs = [
          { amp: 0.10, fx: 0.70, fy: 0.62, ph: 0.0, r: 1.00, hue: baseHue, a: 0.58 },
          { amp: 0.15, fx: 0.48, fy: 0.56, ph: 1.7, r: 0.86, hue: baseHue + 115, a: 0.44 },
          { amp: 0.19, fx: 0.42, fy: 0.40, ph: 2.9, r: 0.78, hue: baseHue + 235, a: 0.36 },
        ];

        for (const b of blobs) {
          const ox = Math.cos(t * b.fx + b.ph) * (maxR * b.amp);
          const oy = Math.sin(t * b.fy + b.ph) * (maxR * b.amp);
          const cx = currentX + ox;
          const cy = currentY + oy;
          const r = maxR * b.r;

          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, hsla(b.hue, sat, light, b.a));
          g.addColorStop(0.28, hsla(b.hue + 55, sat, light - 5, b.a * 0.55));
          g.addColorStop(0.62, hsla(b.hue + 135, sat, light - 12, b.a * 0.24));
          g.addColorStop(1, hsla(b.hue + 210, sat, light - 16, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }

        // Stabilizing corner glow for composition
        const corner = ctx.createRadialGradient(w * 0.18, h * 0.22, 0, w * 0.18, h * 0.22, maxR * 0.95);
        corner.addColorStop(0, hsla(baseHue + 300, 80, 60, 0.18));
        corner.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = corner;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'source-over';
      };

      const tick = (ms) => {
        if (!running) return;

        const fps = prefersReducedMotion ? 6 : 30;
        const minDelta = 1000 / fps;

        if (!lastFrame || (ms - lastFrame) >= (minDelta - 0.5)) {
          lastFrame = ms;
          draw(ms);
        }

        rafId = requestAnimationFrame(tick);
      };

      const updateTargetFromEvent = (e) => {
        const point = e.touches && e.touches.length ? e.touches[0] : e;
        if (!point || typeof point.clientX !== 'number' || typeof point.clientY !== 'number') return;

        targetX = clamp(point.clientX, 0, w);
        targetY = clamp(point.clientY, 0, h);

        // In reduced-motion mode, update on interaction but don't animate constantly.
        if (prefersReducedMotion) {
          draw(performance.now());
        }
      };

      window.addEventListener('pointermove', updateTargetFromEvent, { passive: true });
      window.addEventListener('touchmove', updateTargetFromEvent, { passive: true });
      window.addEventListener('resize', setSize, { passive: true });

      // Pause when tab is hidden (saves battery + avoids wasted work).
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = 0;
        } else {
          running = true;
          lastFrame = 0;
          rafId = requestAnimationFrame(tick);
        }
      });

      setSize();

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(tick);
      }
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
