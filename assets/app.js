
(() => {
  const body = document.body;
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
      body.classList.toggle('menu-open', open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open menu');
        nav.classList.remove('open');
        body.classList.remove('menu-open');
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const process = document.querySelector('[data-process]');
  if (process) {
    const steps = [...process.querySelectorAll('[data-process-step]')];
    const updateProcess = () => {
      const rect = process.getBoundingClientRect();
      const start = window.innerHeight * 0.8;
      const end = window.innerHeight * 0.2;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / Math.max(1, rect.height + start - end)));
      process.style.setProperty('--process-progress', progress.toFixed(3));
      steps.forEach((step, index) => step.classList.toggle('is-active', progress >= index / Math.max(1, steps.length - 1) - 0.03));
    };
    updateProcess();
    window.addEventListener('scroll', updateProcess, { passive: true });
    window.addEventListener('resize', updateProcess);
  }

  const ledger = document.querySelector('[data-impact-ledger]');
  if (ledger) {
    fetch('./assets/impact.json', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Impact data unavailable')))
      .then(data => {
        document.querySelectorAll('[data-impact]').forEach(el => {
          const key = el.getAttribute('data-impact');
          if (Object.prototype.hasOwnProperty.call(data, key)) el.textContent = Number(data[key]).toLocaleString();
        });
        const updated = document.querySelector('[data-impact-updated]');
        if (updated && data.updated) updated.textContent = data.updated;
      })
      .catch(() => {});
  }

  const form = document.querySelector('[data-email-form]');
  if (form) {
    const dialog = document.querySelector('[data-review-dialog]');
    const preview = dialog?.querySelector('[data-message-preview]');
    const mailLink = dialog?.querySelector('[data-mail-link]');
    const copyButton = dialog?.querySelector('[data-copy-message]');
    const status = dialog?.querySelector('[data-copy-status]');
    const closeButton = dialog?.querySelector('[data-dialog-close]');
    let message = '';

    const getMessage = () => {
      const data = new FormData(form);
      const type = form.getAttribute('data-form-type') || 'Connection';
      const lines = [`Prohibition Careers — ${type}`, '', 'This private message was prepared on prohibitioncareers.com.', ''];
      for (const [key, value] of data.entries()) {
        const text = String(value).trim();
        if (text) lines.push(`${key}: ${text}`);
      }
      lines.push('', 'I understand that joining the network does not guarantee contact, referral, interview, or employment.');
      return { subject: `${type} connection — Prohibition Careers`, body: lines.join('\n') };
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const built = getMessage();
      message = built.body;
      if (preview) preview.textContent = message;
      if (mailLink) mailLink.href = `mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(built.subject)}&body=${encodeURIComponent(message)}`;
      if (status) status.textContent = '';
      if (dialog?.showModal) dialog.showModal();
    });

    copyButton?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        if (status) status.textContent = 'Message copied.';
      } catch {
        if (status) status.textContent = 'Copy unavailable. Select the message above and copy it manually.';
      }
    });
    closeButton?.addEventListener('click', () => dialog?.close());
    dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }
})();
