(function(){
  const yearNodes = document.querySelectorAll('[data-year]');
  yearNodes.forEach(n => n.textContent = new Date().getFullYear());

  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if(navToggle && nav){
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const form = document.getElementById('review-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const business = (data.get('business') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const website = (data.get('website') || '').toString().trim();
      const industry = (data.get('industry') || '').toString().trim();
      const surplus = (data.get('surplus') || '').toString().trim();
      const objective = (data.get('objective') || '').toString().trim();
      const status = form.querySelector('.form-status');

      if(!name || !business || !email){
        if(status) status.textContent = 'Please complete your name, business, and email before continuing.';
        return;
      }

      const to = (window.RS_CONFIG && window.RS_CONFIG.reviewInbox) ? window.RS_CONFIG.reviewInbox : 'review@reservestandard.com';
      const subject = `Bitcoin Treasury Review — ${business}`;
      const body = [
        'Reserve Standard — Bitcoin Treasury Review Request',
        '',
        `Name: ${name}`,
        `Business: ${business}`,
        `Email: ${email}`,
        `Website: ${website || 'N/A'}`,
        `Industry: ${industry || 'N/A'}`,
        `Monthly treasury range: ${surplus || 'N/A'}`,
        '',
        'Main objective / current treasury challenge:',
        objective || 'N/A',
        '',
        'Submitted from the Reserve Standard site.'
      ].join('\n');

      const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
      if(status) status.textContent = 'Opening your email client now. If nothing happens, use the direct email link below the form.';
    });
  }
})();
