(function(){
  const nav=document.querySelector('.nav');
  const btn=document.querySelector('.mobile-toggle');
  if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
  document.querySelectorAll('[data-copy]').forEach(el=>{
    el.addEventListener('click',async()=>{
      const text=el.getAttribute('data-copy');
      try{await navigator.clipboard.writeText(text);el.textContent='Copied';setTimeout(()=>el.textContent='Copy',1300);}catch(e){el.textContent='Copy failed';}
    })
  })
})();
