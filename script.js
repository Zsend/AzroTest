const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu]');
const mobilePanel = document.querySelector('[data-mobile-panel]');

function updateHeader() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 16);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuButton && mobilePanel) {
  menuButton.addEventListener('click', () => {
    const isOpen = mobilePanel.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  mobilePanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobilePanel.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('[data-founder-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      event.preventDefault();
      const success = form.querySelector('[data-success]');
      if (success) success.classList.add('is-visible');
      form.reset();
    }
  });
});

document.querySelectorAll('[data-newsletter]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    const button = form.querySelector('button');
    if (button) {
      const old = button.textContent;
      button.textContent = '✓';
      setTimeout(() => { button.textContent = old; }, 1800);
    }
  });
});
