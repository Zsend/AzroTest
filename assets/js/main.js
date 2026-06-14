(function(){
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');
  if(toggle && links){ toggle.addEventListener('click', () => links.classList.toggle('open')); }
  const forms = document.querySelectorAll('[data-static-form]');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const msg = form.querySelector('[data-form-message]');
      if(msg){ msg.textContent = 'This static demo form is not connected yet. Replace the form action with your waitlist, CRM, or email endpoint before publishing.'; }
    });
  });
})();
