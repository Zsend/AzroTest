
(function(){
  const navToggle = document.querySelector('[data-nav-toggle]');
  const siteNav = document.querySelector('[data-site-nav]');
  if(navToggle && siteNav){
    navToggle.addEventListener('click', ()=>{
      const open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    siteNav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
    }));
  }

  const yearNodes = document.querySelectorAll('[data-year]');
  yearNodes.forEach(n=>n.textContent = new Date().getFullYear());

  const cfgEmail = (window.RS_CONFIG && window.RS_CONFIG.reviewInbox) || 'review@reservestandard.com';
  const reviewForm = document.querySelector('#review-form');
  if(reviewForm){
    reviewForm.addEventListener('submit', function(e){
      e.preventDefault();
      const fd = new FormData(reviewForm);
      const get = k => (fd.get(k) || '').toString().trim();
      const name = get('name');
      const business = get('business');
      const email = get('email');
      const industry = get('industry');
      const surplus = get('surplus');
      const objective = get('objective');
      const website = get('website');
      const subject = `Bitcoin Treasury Review — ${business || 'Reserve Standard Inquiry'}`;
      const lines = [
        'Bitcoin Treasury Review Request',
        '',
        `Name: ${name || '-'}`,
        `Business: ${business || '-'}`,
        `Email: ${email || '-'}`,
        `Website: ${website || '-'}`,
        `Industry: ${industry || '-'}`,
        `Monthly surplus / treasury range: ${surplus || '-'}`,
        '',
        'Main objective / current treasury challenge:',
        objective || '-'
      ];
      const mailto = `mailto:${encodeURIComponent(cfgEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      window.location.href = mailto;
      const status = document.querySelector('.form-status');
      if(status){
        status.textContent = `If your email app did not open, send your request directly to ${cfgEmail}.`;
      }
    });
  }
})();
