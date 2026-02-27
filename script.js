(() => {
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------
  // Background pointer “parallax”
  // -----------------------------
  const bg = document.querySelector('.bg');
  if (bg && !prefersReducedMotion) {
    let targetX = 50;
    let targetY = 44;
    let currentX = targetX;
    let currentY = targetY;
    let rafId = 0;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const schedule = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;

        // Smooth “ease” toward the target so it feels premium.
        const ease = 0.10;
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        bg.style.setProperty('--x', `${currentX.toFixed(2)}%`);
        bg.style.setProperty('--y', `${currentY.toFixed(2)}%`);

        // If we’re still moving, keep animating.
        if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
          schedule();
        }
      });
    };

    const updateTargetFromEvent = (e) => {
      // Pointer events (mouse/pen/touch) — use clientX/Y when available.
      const point = e.touches && e.touches.length ? e.touches[0] : e;
      if (!point || typeof point.clientX !== 'number' || typeof point.clientY !== 'number') return;

      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;

      targetX = clamp((point.clientX / vw) * 100, 0, 100);
      targetY = clamp((point.clientY / vh) * 100, 0, 100);
      schedule();
    };

    window.addEventListener('pointermove', updateTargetFromEvent, { passive: true });
    window.addEventListener('touchmove', updateTargetFromEvent, { passive: true });
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
      // Basic client-side validation (still relies on server-side handling by FormSubmit).
      const email = (emailInput.value || '').trim();
      emailInput.value = email;

      const valid = email.length > 0 && emailInput.checkValidity();
      if (!valid) {
        e.preventDefault();
        setError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      // UI feedback.
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
