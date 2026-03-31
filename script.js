
(function(){
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function track(eventName, props) {
    try {
      if (typeof window.plausible === 'function') window.plausible(eventName, props ? { props } : undefined);
      if (typeof window.gtag === 'function') window.gtag('event', eventName, props || {});
    } catch (err) {
      // noop
    }
  }

  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => {
      track(el.getAttribute('data-track'));
    });
  });

  const form = document.getElementById('application-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const business = (data.get('business') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    if (!name || !business || !email) {
      status.textContent = 'Please add your name, business, and email before creating the application email.';
      return;
    }
    const lines = [
      'AZRO Bitcoin Reserve Program application',
      '',
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${email}`,
      `Role: ${(data.get('role') || '').toString()}`,
      `Monthly reserve budget range: ${(data.get('budget') || '').toString()}`,
      `Bitcoin familiarity: ${(data.get('btc_familiarity') || '').toString()}`,
      `Timeline: ${(data.get('timeline') || '').toString()}`,
      `Current reserve approach: ${(data.get('reserve_approach') || '').toString()}`,
      '',
      'Main objective:',
      (data.get('objective') || '').toString().trim() || '—',
      '',
      'Biggest concern or constraint:',
      (data.get('constraint') || '').toString().trim() || '—',
      '',
      'Submitted from azrosystems.com static Reserve Review form.'
    ];
    const subject = encodeURIComponent(`AZRO Reserve Review — ${business}`);
    const body = encodeURIComponent(lines.join('\n'));
    const emailTarget = form.getAttribute('data-contact-email') || 'support@azrosystems.com';
    const href = `mailto:${emailTarget}?subject=${subject}&body=${body}`;
    window.location.href = href;
    status.textContent = 'Your email app should open with a pre-filled application. If nothing happens, email support@azrosystems.com directly.';
    track('submit_application');
  });
})();
