const nav = document.querySelector('.nav');
const toggle = document.querySelector('[data-mobile-toggle]');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

document.querySelectorAll('[data-copy-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

document.querySelectorAll('form[data-lead-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const isStaticPost = form.getAttribute('action') && form.getAttribute('action') !== '#';
    if (isStaticPost) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const leads = JSON.parse(localStorage.getItem('craglink_leads') || '[]');
    leads.push({ ...data, createdAt: new Date().toISOString(), source: location.pathname });
    localStorage.setItem('craglink_leads', JSON.stringify(leads));
    form.reset();
    const success = form.querySelector('.success');
    if (success) success.classList.add('show');
  });
});
