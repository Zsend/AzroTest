
(function(){
  const navToggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('#site-nav');
  if(navToggle&&nav){
    navToggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded',String(open));
    });
  }
  document.querySelectorAll('[data-year]').forEach(el=>{el.textContent=new Date().getFullYear();});
  const modal=document.querySelector('#trial-modal');
  const openers=document.querySelectorAll('[data-trial-open]');
  const close=document.querySelector('[data-modal-close]');
  openers.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault(); if(modal){modal.classList.add('is-open');}}));
  if(close) close.addEventListener('click',()=>modal.classList.remove('is-open'));
  if(modal) modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('is-open');});
})();
