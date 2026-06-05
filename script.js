const menuButton = document.querySelector('[data-menu]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const header = document.querySelector('[data-header]');
const modal = document.getElementById('siteModal');
const toast = document.getElementById('toast');
const modalKicker = document.getElementById('modalKicker');
const modalTitle = document.getElementById('modalTitle');
const modalCopy = document.getElementById('modalCopy');
const modalForm = document.getElementById('modalForm');
const modalSearchLinks = document.getElementById('modalSearchLinks');

const encode = (data) => Object.keys(data).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join('&');

function closeMenu(){
  if (!mobileMenu || !menuButton) return;
  mobileMenu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}
if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

const onScroll = () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  if (header) header.classList.toggle('scrolled', y > 64);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 4200);
}

const modalCopyMap = {
  reserve: {
    kicker: 'Founder access',
    title: 'Join the founder list.',
    copy: 'Get prototype updates, early pricing, field-team testing opportunities, and launch availability.'
  },
  search: {
    kicker: 'Quick search',
    title: 'Find the right section.',
    copy: 'Use the navigation to jump to systems, modules, accessories, field proof, support, or founder updates.'
  },
  cart: {
    kicker: 'Shop systems',
    title: 'Checkout opens at launch.',
    copy: 'The site is set up for demand capture now. Join the founder list and connect Shopify, Stripe, or your ecommerce stack when kits are ready.'
  }
};
function openModal(type='reserve'){
  const content = modalCopyMap[type] || modalCopyMap.reserve;
  if(modalKicker) modalKicker.textContent = content.kicker;
  if(modalTitle) modalTitle.textContent = content.title;
  if(modalCopy) modalCopy.textContent = content.copy;
  if(modalForm && modalSearchLinks){
    const isSearch = type === 'search';
    modalForm.hidden = isSearch;
    modalSearchLinks.hidden = !isSearch;
  }
  if(modal){
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if(type === 'search') modal.querySelector('.modal-search-links a')?.focus();
      else modal.querySelector('input[type="email"]')?.focus();
    }, 60);
  }
}
function closeModal(){
  if(modal){
    modal.hidden = true;
    document.body.style.overflow = '';
  }
}

document.querySelectorAll('[data-modal-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', () => openModal(trigger.dataset.modalTrigger));
});
document.querySelectorAll('[data-close-modal]').forEach((trigger) => trigger.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => { if(event.key === 'Escape') closeModal(); });

// Smooth internal anchors + working shop CTA.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    const target = document.querySelector(href);
    if(target){
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if(href === '#reserve' && (link.dataset.track === 'shop-systems' || link.dataset.track === 'explore-system')){
        setTimeout(() => openModal('reserve'), 500);
      }
    }
  });
});

async function submitLeadForm(form){
  const data = Object.fromEntries(new FormData(form).entries());
  data.submitted_at = new Date().toISOString();
  try { localStorage.setItem(`craglink_lead_${Date.now()}`, JSON.stringify(data)); } catch(_) {}
  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(data)
    });
  } catch(_) {}
  form.classList.add('is-sent');
  const button = form.querySelector('button[type="submit"], button');
  if(button) button.innerHTML = 'You are on the list';
  showToast('Founder request captured. Connect Netlify Forms, Tally, HubSpot, Shopify, or Formspree before paid traffic.');
  setTimeout(closeModal, 900);
}

document.querySelectorAll('form').forEach((form) => {
  form.classList.add('js-lead-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = form.querySelector('input[type="email"]');
    if(email && !email.checkValidity()){
      email.reportValidity();
      return;
    }
    submitLeadForm(form);
  });
});
