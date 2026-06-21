(function(){
  'use strict';

  const CONTACT='hello.arightforall@gmail.com';
  const doc=document.documentElement;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile navigation */
  const menuBtn=document.querySelector('.menu-toggle');
  const mobile=document.getElementById('mobile-menu');
  if(menuBtn&&mobile){
    const close=()=>{
      menuBtn.setAttribute('aria-expanded','false');
      mobile.hidden=true;
      document.body.classList.remove('menu-open');
    };
    menuBtn.addEventListener('click',()=>{
      const open=menuBtn.getAttribute('aria-expanded')==='true';
      menuBtn.setAttribute('aria-expanded',String(!open));
      mobile.hidden=open;
      document.body.classList.toggle('menu-open',!open);
    });
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }

  /* Stagger related cards without creating multiple motion systems. */
  const groups=[
    '.hero-proof','.story-stream','.help-stream','.grid-2','.grid-3','.grid-4',
    '.source-grid','.method-grid','.letter-grid','.archive-grid','.mission-pair',
    '.coalition-grid','.micro-grid','.problem-grid','.track-grid','.challenge-content',
    '.letter-preview-grid','.letter-evidence-secondary'
  ];
  groups.forEach(selector=>{
    document.querySelectorAll(selector).forEach(group=>{
      [...group.children].forEach((el,index)=>{
        if(el.matches('[data-reveal]')&&!el.dataset.delay){
          el.dataset.delay=String(Math.min(index*70,280));
        }
      });
    });
  });

  /* Reveal once, then release compositor resources. */
  const revealEls=[...document.querySelectorAll('[data-reveal]')];
  if(reduce){
    revealEls.forEach(el=>el.classList.add('is-visible'));
  }else{
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },{threshold:.11,rootMargin:'0px 0px -8% 0px'});
    const revealNow=el=>{
      if(el.classList.contains('is-visible'))return;
      el.classList.add('is-visible');
      io.unobserve(el);
    };
    revealEls.forEach(el=>{
      if(el.dataset.delay)el.style.setProperty('--delay',`${el.dataset.delay}ms`);
      io.observe(el);
    });
    /* Fail-safe for fast scrolling, anchor jumps, and restored browser positions. */
    let revealTick=false;
    const revealPassed=()=>{
      revealTick=false;
      const cutoff=innerHeight*1.08;
      revealEls.forEach(el=>{
        if(el.classList.contains('is-visible'))return;
        const r=el.getBoundingClientRect();
        if(r.top<cutoff || r.bottom<0)revealNow(el);
      });
    };
    const requestReveal=()=>{
      if(!revealTick){revealTick=true;requestAnimationFrame(revealPassed);}
    };
    revealPassed();
    addEventListener('scroll',requestReveal,{passive:true});
    addEventListener('resize',requestReveal);
    addEventListener('pageshow',requestReveal);
    setTimeout(revealPassed,180);
  }

  /* Reading progress only — no continuous element transforms. */
  let ticking=false;
  const updateProgress=()=>{
    ticking=false;
    const max=doc.scrollHeight-doc.clientHeight;
    const pct=max>0?Math.max(0,Math.min(100,(scrollY/max)*100)):0;
    doc.style.setProperty('--progress',`${pct}%`);
  };
  const requestProgress=()=>{
    if(!ticking){ticking=true;requestAnimationFrame(updateProgress);}
  };
  updateProgress();
  addEventListener('scroll',requestProgress,{passive:true});
  addEventListener('resize',requestProgress);

  /* Challenge scrollspy. */
  const challengeLinks=[...document.querySelectorAll('.challenge-index a[href^="#"]')];
  if(challengeLinks.length){
    const sections=challengeLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const spy=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      challengeLinks.forEach(link=>{
        const active=link.getAttribute('href')==='#'+visible.target.id;
        link.classList.toggle('is-current',active);
        if(active)link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current');
      });
    },{rootMargin:'-20% 0px -65% 0px',threshold:[0,.2,.5]});
    sections.forEach(section=>spy.observe(section));
  }

  document.querySelectorAll('[data-copy-pledge]').forEach(btn=>btn.addEventListener('click',async()=>{
    const text='I believe time taken should not be time wasted. Wherever correctional tablets are used, every person should receive free GED preparation, basic wellness, accessible design, and preparation for release.';
    try{
      await navigator.clipboard.writeText(text);
      btn.textContent='Pledge copied';
      setTimeout(()=>btn.textContent='Copy the pledge',1800);
    }catch(e){window.prompt('Copy the pledge:',text);}
  }));

  document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',async()=>{
    const data={title:'A Right For All',text:'Human potential is not disposable. The free section should teach.',url:location.href};
    if(navigator.share){
      try{await navigator.share(data);}catch(e){}
    }else{
      try{
        await navigator.clipboard.writeText(location.href);
        btn.textContent='Link copied';
        setTimeout(()=>btn.textContent='Share this page',1800);
      }catch(e){}
    }
  }));

  const form=document.getElementById('helpForm');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const lines=[
        'Name: '+(fd.get('name')||'—'),
        'Email: '+(fd.get('email')||'—'),
        'How I can help: '+(fd.get('role')||'—'),
        '',
        'What I can move:',
        ''+(fd.get('note')||'—')
      ];
      location.href='mailto:'+CONTACT+'?subject='+encodeURIComponent('Help build A Right For All')+'&body='+encodeURIComponent(lines.join('\n'));
    });
  }

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>{
    const select=document.getElementById('role');
    if(select){select.value=btn.dataset.role||'';select.focus();}
  }));
})();
