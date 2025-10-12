/*! AZRO v37b helper — instant autoplay for videos + TV/YT/Vimeo iframes */
(()=>{ 
  const playV = v => { try{ v.muted = true; v.playsInline = true; v.autoplay = true; const p=v.play(); if(p&&p.catch)p.catch(()=>{});}catch(e){} };
  const sel = 'video[autoplay], .azro-video video, .modal__media video';
  const init = (root=document)=>{ root.querySelectorAll(sel).forEach(playV); };
  init(); document.addEventListener('azro:modal:open', e=>init(e.target));
})();
/*! AZRO modal preview helper (scoped) — adds a Preview button if no video is present */
(function(){
  const byId = id => document.getElementById(id);
  const norm = s => (s||'').toLowerCase().replace(/[\u2010-\u2015]/g,'-').replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ').trim();

  function ensurePreview(modal){
    if(!modal || !modal.open) return;
    const mediaBox = modal.querySelector('#fmVideoBox') || modal.querySelector('.azro-modal__media .azro-video');
    if(!mediaBox || mediaBox.querySelector('video,button.azro-preview-btn')) return; // already present

    // Determine video sources from ENRICH (if available) using the modal title
    const titleEl = modal.querySelector('#fmTitle');
    const title = (titleEl && titleEl.textContent) ? titleEl.textContent.trim() : '';
    let sources = [];
    try{
      const NMAP = (()=>{ const m={}; for(const k in (window.ENRICH||{})){ m[norm(k)] = (window.ENRICH||{})[k]; } return m; })();
      const e = NMAP[norm(title)];
      if(e && e.video){ sources = String(e.video).split('|').map(s=>s.trim()).filter(Boolean); }
    }catch(_){}
    if(!sources.length){ sources = ['main.mp4']; } // universal fallback already in site

    // Build the Preview button (scoped styling)
    if(!document.getElementById('azro-preview-btn-style')){
      const st=document.createElement('style'); st.id='azro-preview-btn-style';
      st.textContent = 'dialog#featureModal .azro-modal__media{position:relative}'+
      'dialog#featureModal .azro-preview-btn{position:relative;z-index:5;display:inline-flex;align-items:center;gap:.6rem;cursor:pointer;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.28);padding:.7rem 1.0rem;border-radius:999px;color:#fff;font-weight:700;letter-spacing:.2px;backdrop-filter:blur(2px)}'+
      'dialog#featureModal .azro-preview-btn__icon{display:inline-block;width:0;height:0;border-left:10px solid currentColor;border-top:6px solid transparent;border-bottom:6px solid transparent}'+
      'dialog#featureModal .azro-preview-btn__label{font-size:.95rem}';
      document.head.appendChild(st);
    }
    const btn = document.createElement('button');
    btn.type='button';
    btn.className='azro-preview-btn';
    btn.setAttribute('aria-label','Preview video');
    btn.innerHTML='<span class="azro-preview-btn__icon" aria-hidden="true"></span><span class="azro-preview-btn__label">Preview video</span>';
    mediaBox.innerHTML='';
    mediaBox.appendChild(btn);

    btn.addEventListener('click', ()=>{
      btn.remove();
      const v = document.createElement('video');
      v.className='azro-video__el';
      v.setAttribute('muted',''); v.muted = true;
      v.setAttribute('autoplay',''); v.setAttribute('loop','');
      v.setAttribute('playsinline',''); v.setAttribute('preload','metadata');
      v.setAttribute('controls',''); v.setAttribute('poster','newchart.png');
      sources.forEach(u=>{
        const s=document.createElement('source');
        s.src = String(u).replace(/([^\/]+)$/,(m,b)=>encodeURIComponent(b));
        s.type = /\.mov(\?.*)?$/i.test(u) ? 'video/quicktime' : 'video/mp4';
        v.appendChild(s);
      });
      mediaBox.appendChild(v);
      try{ v.play().catch(()=>{});}catch(_){}
    });
  }

  // Fire on our custom event and also when the feature modal toggles "open"
  document.addEventListener('azro:modal:open', e=>{
    const modal = (e && e.detail && e.detail.modal) ? e.detail.modal : document.getElementById('featureModal');
    try{ ensurePreview(modal); }catch(_){}
  });
  const moTarget = document.getElementById('featureModal');
  if(moTarget){
    new MutationObserver(()=>ensurePreview(moTarget)).observe(moTarget,{attributes:true,attributeFilter:['open']});
  }
})();
