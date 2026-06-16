(function(){
  const sidebar=document.querySelector('aside.sidebar');
  const shell=document.querySelector('.shell');
  const main=document.querySelector('main');
  if(!sidebar||!shell||!main) return;
  sidebar.querySelectorAll('.brand, nav a, .stat, .progress, .toolbar > *').forEach((el,i)=>{el.classList.add('challenge-left-lead'); el.style.transitionDelay=(Math.min(i,10)*55)+'ms';});
  const showLeft=()=>{
    sidebar.querySelectorAll('.challenge-left-lead').forEach(el=>el.classList.add('is-visible'));
  };
  const update=()=>{
    const rect=shell.getBoundingClientRect();
    const start=window.scrollY + rect.top;
    const viewport=window.innerHeight || 1;
    const leadDistance=Math.max(380, Math.min(760, sidebar.offsetHeight*.72));
    const raw=(window.scrollY - start + viewport*.22)/leadDistance;
    const release=Math.max(0, Math.min(1, (raw-.18)/.82));
    document.documentElement.style.setProperty('--challenge-right-release', release.toFixed(3));
    if(raw>.02) showLeft();
  };
  update(); addEventListener('scroll', update, {passive:true}); addEventListener('resize', update);
  setTimeout(showLeft,250);
})();
