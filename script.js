
(function(){
  const y=document.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear();
  const btn=document.querySelector('[data-nav-toggle]'); const nav=document.querySelector('[data-site-nav]');
  if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open));});}
  const links=[...document.querySelectorAll('[data-rail-target]')];
  const sections=links.map(a=>document.getElementById(a.dataset.railTarget)).filter(Boolean);
  if('IntersectionObserver' in window && links.length){
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){links.forEach(l=>l.classList.toggle('is-active',l.dataset.railTarget===e.target.id));}});},{threshold:.35});
    sections.forEach(s=>obs.observe(s));
  }
})();
