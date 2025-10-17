/*! AZRO v37b helper — instant autoplay for videos + TV/YT/Vimeo iframes */
(()=>{ 
  const playV = v => { try{ v.muted = true; v.playsInline = true; v.autoplay = true; const p=v.play(); if(p&&p.catch)p.catch(()=>{});}catch(e){} };
  const sel = 'video[autoplay], .azro-video video, .modal__media video';
  const init = (root=document)=>{ root.querySelectorAll(sel).forEach(playV); };
  init(); document.addEventListener('azro:modal:open', e=>init(e.target));
})();