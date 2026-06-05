(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const modal = $('#founder-modal');
  const search = $('#search-modal');
  const openModal = () => { if (modal && typeof modal.showModal === 'function') modal.showModal(); };
  const openSearch = () => { if (search && typeof search.showModal === 'function') search.showModal(); };
  $$('[data-open-modal]').forEach(el => el.addEventListener('click', openModal));
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', () => modal && modal.close()));
  $$('[data-open-search]').forEach(el => el.addEventListener('click', openSearch));
  $$('[data-close-search]').forEach(el => el.addEventListener('click', () => search && search.close()));
  [modal, search].forEach(d => d && d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  const toggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  if(toggle && nav){
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }));
  }

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', evt => {
      const id = link.getAttribute('href');
      if(id.length > 1){
        const target = $(id);
        if(target){ evt.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });

  $$('[data-lead-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const leads = JSON.parse(localStorage.getItem('craglink_leads') || '[]');
      leads.push({...data, ts:new Date().toISOString(), page:location.pathname});
      localStorage.setItem('craglink_leads', JSON.stringify(leads));
      form.reset();
      if(modal && modal.open) modal.close();
      window.location.href = 'success.html';
    });
  });
})();
