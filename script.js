(() => {
  const layer = document.getElementById('modalLayer');
  const kicker = document.getElementById('modalKicker');
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');
  const leadForm = document.getElementById('leadForm');
  const quickLinks = document.getElementById('quickLinks');
  const toast = document.getElementById('toast');
  const art = document.querySelector('.art-frame');

  const copy = {
    reserve: {
      kicker: 'Founder access',
      title: 'Join the founder list.',
      text: 'Get prototype updates, launch pricing, and field testing opportunities.',
      form: true,
      links: false
    },
    search: {
      kicker: 'Quick navigation',
      title: 'Find what matters.',
      text: 'Jump to the core CragLink sections without losing the approved design.',
      form: false,
      links: true
    },
    about: {
      kicker: 'About CragLink Power',
      title: 'DC-native basecamp power.',
      text: 'CragLink Power is a founder-stage concept for a purpose-built Starlink Mini power system: solar-ready, vehicle-charge ready, field-tested, and designed for serious outdoor use.',
      form: true,
      links: false
    },
    architecture: {
      kicker: 'System architecture',
      title: 'Built around the use case.',
      text: 'The product concept is a 100Ah-class LiFePO4 basecamp power box with solar recovery, vehicle charge input, fused DC wiring, and a clean Starlink Mini output.',
      form: true,
      links: false
    },
    menu: {
      kicker: 'Menu',
      title: 'Explore CragLink.',
      text: 'Choose a section or join founder updates.',
      form: false,
      links: true
    }
  };

  function openModal(type = 'reserve') {
    const c = copy[type] || copy.reserve;
    kicker.textContent = c.kicker;
    title.textContent = c.title;
    text.textContent = c.text;
    leadForm.hidden = !c.form;
    quickLinks.hidden = !c.links;
    layer.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const focusTarget = c.form ? leadForm.querySelector('input[type="email"]') : quickLinks.querySelector('button, a');
      focusTarget?.focus();
    }, 40);
  }
  function closeModal() {
    layer.hidden = true;
    document.body.style.overflow = '';
  }
  function scrollToPercent(percent) {
    const p = Number(percent);
    if (!Number.isFinite(p) || !art) return;
    const top = art.getBoundingClientRect().top + window.scrollY + (art.offsetHeight * p) - 28;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener) {
      event.preventDefault();
      openModal(opener.dataset.open || 'reserve');
      return;
    }
    const scroller = event.target.closest('[data-scroll]');
    if (scroller) {
      event.preventDefault();
      closeModal();
      scrollToPercent(scroller.dataset.scroll);
      return;
    }
    if (event.target.closest('[data-close]')) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !layer.hidden) closeModal();
  });

  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      // When published to Netlify, remove preventDefault if you want native Netlify form posting.
      // This keeps the static prototype feeling complete in local/GitHub Pages previews.
      if (!location.hostname.includes('netlify.app')) {
        event.preventDefault();
        closeModal();
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 3600);
        form.reset();
      }
    });
  });
})();
