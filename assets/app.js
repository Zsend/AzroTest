(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu=q('[data-menu-toggle]'), nav=q('[data-site-nav]');
  const closeMenu=()=>{if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.classList.remove('menu-open')};
  if(menu&&nav){
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);document.body.classList.toggle('menu-open',open)});
    qa('a',nav).forEach(a=>a.addEventListener('click',closeMenu));
    addEventListener('resize',()=>{if(innerWidth>920)closeMenu()});
    addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  }
  qa('[data-year]').forEach(n=>n.textContent=String(new Date().getFullYear()));
  const reveal=qa('[data-reveal], [data-reveal-group]');
  if(!reduce && 'IntersectionObserver' in window){
    reveal.forEach(n=>n.classList.add(n.hasAttribute('data-reveal-group')?'reveal-group':'reveal-prep'));
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{rootMargin:'0px 0px -6%',threshold:.08});
    reveal.forEach(n=>io.observe(n));
  } else reveal.forEach(n=>n.classList.add('is-visible'));
  const journey=q('[data-journey]'), review=q('[data-context-review]');
  let ticking=false;
  const updateMotion=()=>{
    ticking=false;
    if(review){const r=review.getBoundingClientRect();const p=reduce?.58:clamp((innerHeight*.82-r.top)/Math.max(r.height+innerHeight*.15,1),.12,.88);review.style.setProperty('--review-progress',p.toFixed(3));}
    if(journey){const r=journey.getBoundingClientRect();const p=reduce?1:clamp((innerHeight*.76-r.top)/Math.max(r.height*.76,1));journey.style.setProperty('--journey-progress',p.toFixed(3));const steps=qa('[data-journey-step]',journey);steps.forEach((step,i)=>step.classList.toggle('is-active',p>=i/Math.max(steps.length-1,1)-.035));}
  };
  const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(updateMotion)}};
  if(journey||review){addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);updateMotion()}
  const counters=qa('[data-impact-key]');
  if(counters.length){fetch('./assets/impact.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{counters.forEach(el=>el.textContent=String(Number(data[el.dataset.impactKey]||0)));qa('[data-impact-date]').forEach(el=>el.textContent=data.lastUpdated||'Pilot baseline')}).catch(()=>{})}
  const clean=v=>String(v||'').replace(/\r\n?/g,'\n').trim();
  const formatForm=form=>{const kind=form.dataset.kind||'Connection';const lines=[`PROHIBITION CAREERS — ${kind.toUpperCase()}`,'','This private message was prepared on prohibitioncareers.com.',''];qa('[data-label]',form).forEach(field=>{const value=field.type==='checkbox'?(field.checked?'Yes':'No'):clean(field.value);if(!value)return;lines.push(`${field.dataset.label}:`,value,'')});lines.push('I understand that Prohibition Careers does not guarantee contact, referral, an interview, or employment.');return {subject:`${kind} — Prohibition Careers`,body:lines.join('\n')}};
  qa('[data-email-form]').forEach(form=>{const dialog=q('[data-review-dialog]');if(!dialog)return;const text=q('[data-message-text]',dialog),mail=q('[data-mail-link]',dialog),copy=q('[data-copy-message]',dialog),status=q('[data-copy-status]',dialog);let latest='';form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const msg=formatForm(form);latest=msg.body;text.textContent=msg.body;mail.href=`mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;status.textContent='';dialog.showModal()});copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(latest)}catch{const a=document.createElement('textarea');a.value=latest;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.append(a);a.select();document.execCommand('copy');a.remove()}status.textContent='Message copied.'});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})});
})();