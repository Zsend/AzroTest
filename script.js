
(function(){
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', function(){
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const form = document.getElementById('review-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const config = window.RS_CONFIG || { reviewEmail: 'review@reservestandard.com' };

    form.addEventListener('submit', function(e){
      e.preventDefault();

      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const business = (fd.get('business') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const website = (fd.get('website') || '').toString().trim();
      const industry = (fd.get('industry') || '').toString().trim();
      const range = (fd.get('surplus') || '').toString().trim();
      const objective = (fd.get('objective') || '').toString().trim();

      if (!name || !business || !email) {
        status.textContent = 'Please fill in name, business, and email before creating the review email.';
        return;
      }

      const lines = [
        'Bitcoin Treasury Review request',
        '',
        'Name: ' + name,
        'Business: ' + business,
        'Email: ' + email,
        website ? 'Website: ' + website : '',
        industry && industry !== 'Choose one' ? 'Industry: ' + industry : '',
        range && range !== 'Choose one' ? 'Monthly treasury range: ' + range : '',
        '',
        'Main objective / current treasury challenge:',
        objective || '(not provided)'
      ].filter(Boolean);

      const subject = encodeURIComponent('Bitcoin Treasury Review — ' + business);
      const body = encodeURIComponent(lines.join('\n'));
      window.location.href = 'mailto:' + encodeURIComponent(config.reviewEmail || 'review@reservestandard.com') + '?subject=' + subject + '&body=' + body;
      status.textContent = 'Your email app should open with the review request prefilled. If it does not, email review@reservestandard.com directly.';
    });
  }
})();
