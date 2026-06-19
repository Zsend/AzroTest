(function(){
  'use strict';
  const CONTACT='hello.arightforall@gmail.com';
  const doc=document.documentElement;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuBtn=document.querySelector('.menu-toggle');
  const mobile=document.getElementById('mobile-menu');
  if(menuBtn&&mobile){
    const close=()=>{menuBtn.setAttribute('aria-expanded','false');mobile.hidden=true;document.body.classList.remove('menu-open');};
    menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')==='true';menuBtn.setAttribute('aria-expanded',String(!open));mobile.hidden=open;document.body.classList.toggle('menu-open',!open);});
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  const groups=['.hero-proof','.story-stream','.help-stream','.grid-2','.grid-3','.grid-4','.source-grid','.method-grid','.letter-grid','.archive-grid','.mission-pair','.coalition-grid','.micro-grid','.problem-grid','.track-grid','.challenge-content'];
  groups.forEach(selector=>document.querySelectorAll(selector).forEach(group=>[...group.children].forEach((el,index)=>{if(el.matches('[data-reveal]')&&!el.dataset.delay)el.dataset.delay=String(Math.min(index*75,300));})));
  const revealEls=[...document.querySelectorAll('[data-reveal]')];
  if(reduce)revealEls.forEach(el=>el.classList.add('is-visible'));
  else{const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}}),{threshold:.1,rootMargin:'0px 0px -10% 0px'});revealEls.forEach(el=>{if(el.dataset.delay)el.style.setProperty('--delay',`${el.dataset.delay}ms`);io.observe(el);});}
  let ticking=false;const update=()=>{ticking=false;const max=doc.scrollHeight-doc.clientHeight;doc.style.setProperty('--progress',max>0?`${Math.max(0,Math.min(100,(scrollY/max)*100))}%`:'0%');if(!reduce)document.querySelectorAll('[data-parallax]').forEach(el=>{const r=el.getBoundingClientRect(),vh=innerHeight||1,p=Math.max(-1,Math.min(1,(vh/2-(r.top+r.height/2))/vh));el.style.setProperty('--parallax',`${p*14}px`);});};const requestUpdate=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};update();addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',requestUpdate);
  document.querySelectorAll('[data-copy-pledge]').forEach(btn=>btn.addEventListener('click',async()=>{const text='I believe time taken should not be time wasted. I support free GED prep and basic wellness on every correctional tablet.';try{await navigator.clipboard.writeText(text);btn.textContent='Pledge copied';setTimeout(()=>btn.textContent='Copy the pledge',1800);}catch(e){window.prompt('Copy the pledge:',text);}}));
  document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',async()=>{const data={title:'A Right For All',text:'Human potential is not disposable. The free section should teach.',url:location.href};if(navigator.share){try{await navigator.share(data);}catch(e){}}else{try{await navigator.clipboard.writeText(location.href);btn.textContent='Link copied';setTimeout(()=>btn.textContent='Share this page',1800);}catch(e){}}}));
  const form=document.getElementById('helpForm');if(form)form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),lines=['Name: '+(fd.get('name')||'—'),'Email: '+(fd.get('email')||'—'),'How I can help: '+(fd.get('role')||'—'),'','What I can move:',''+(fd.get('note')||'—')];location.href='mailto:'+CONTACT+'?subject='+encodeURIComponent('Help build A Right For All')+'&body='+encodeURIComponent(lines.join('\n'));});
  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>{const select=document.getElementById('role');if(select){select.value=btn.dataset.role||'';select.focus();}}));
})();
