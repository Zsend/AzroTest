(() => {
  const modalLayer = document.getElementById('modalLayer');
  const modalTitle = document.getElementById('modalTitle');
  const modalKicker = document.getElementById('modalKicker');
  const modalText = document.getElementById('modalText');
  const modalLinks = document.getElementById('modalLinks');
  const leadForm = document.getElementById('leadForm');
  const toast = document.getElementById('toast');
  const stage = document.getElementById('siteArtwork');

  const modalCopy = {
    reserve: {
      kicker: 'Founder access',
      title: 'Join the CragLink founder list.',
      text: 'Get prototype updates, launch pricing, and early field-testing opportunities for the DC-native Starlink Mini basecamp power system.',
      links: false
    },
    search: {
      kicker: 'Quick navigation',
      title: 'Where do you want to go?',
      text: 'Jump to the product architecture, field stories, founder list, or support information.',
      links: true
    },
    support: {
      kicker: 'Support',
      title: 'Need the right setup?',
      text: 'Join the founder list and tell us your vehicle, Starlink Mini use case, solar needs, and trip style. We will use the data to shape the launch kit.',
      links: false
    },
    about: {
      kicker: 'About CragLink',
      title: 'Built for basecamp internet power.',
      text: 'CragLink Power is a founder-stage concept for a premium outdoor power system: climber-tested, DC-native, solar-ready, vehicle-charge-ready, and designed to remove the power-station tax.',
      links: false
    },
    architecture: {
      kicker: 'Basecamp power architecture',
      title: 'A cleaner power path for Starlink Mini.',
      text: 'The target architecture is simple: 100Ah-class LiFePO4 storage, solar input, vehicle-charge-ready DC input, and a stable DC output for Starlink Mini. Fewer adapters. Less waste. More runtime.',
      links: false
    },
    menu: {
      kicker: 'Menu',
      title: 'Explore CragLink Power.',
      text: 'Use the quick links below or join the founder list for launch updates.',
      links: true
    }
  };

  function artScrollTo(ratio) {
    const rect = stage.getBoundingClientRect();
    const target = window.scrollY + rect.top + rect.height * ratio - window.innerHeight * 0.16;
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }

  function scrollName(name) {
    const map = { systems: 0.42, architecture: 0.56, footer: 0.80, top: 0 };
    artScrollTo(map[name] ?? 0.5);
  }

  function openModal(type = 'reserve') {
    const copy = modalCopy[type] || modalCopy.reserve;
    modalKicker.textContent = copy.kicker;
    modalTitle.textContent = copy.title;
    modalText.textContent = copy.text;
    modalLinks.hidden = !copy.links;
    leadForm.hidden = copy.links && type !== 'menu' ? true : false;
    if (type === 'menu') leadForm.hidden = false;
    modalLayer.hidden = false;
    document.body.style.overflow = 'hidden';
    const first = modalLayer.querySelector('button, a, input, select');
    setTimeout(() => first?.focus(), 50);
  }

  function closeModal() {
    modalLayer.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open]');
    if (open) {
      event.preventDefault();
      openModal(open.dataset.open);
      return;
    }

    const scroll = event.target.closest('[data-scroll]');
    if (scroll) {
      event.preventDefault();
      closeModal();
      scrollName(scroll.dataset.scroll);
      return;
    }

    if (event.target.matches('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modalLayer.hidden) closeModal();
  });

  leadForm?.addEventListener('submit', (event) => {
    const email = leadForm.querySelector('input[type="email"]');
    if (!email.checkValidity()) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(leadForm).entries());
    const leads = JSON.parse(localStorage.getItem('craglinkFounderLeads') || '[]');
    leads.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('craglinkFounderLeads', JSON.stringify(leads));
    leadForm.reset();
    closeModal();
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 3200);
  });
})();
