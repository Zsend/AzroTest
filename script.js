const menuButton = document.querySelector('[data-menu]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const header = document.querySelector('[data-header]');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

let lastScroll = 0;
const onScroll = () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  if (header) header.classList.toggle('scrolled', y > 64);
  lastScroll = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Lightweight form guard for static previews. Production should connect to Netlify/Tally/HubSpot/Shopify/Formspree.
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (window.location.protocol === 'file:') {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"], button');
      if (button) {
        const old = button.innerHTML;
        button.innerHTML = 'Saved locally';
        setTimeout(() => { button.innerHTML = old; }, 1800);
      }
    }
  });
});
