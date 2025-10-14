
/*! About Video Hotfix (scoped, minimal) — v1 */
(function(){
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  onReady(function(){
    var modal = document.getElementById('featureModal') || document.querySelector('dialog.azro-modal');
    if(!modal) return;

    // Ensure media container exists
    var media = modal.querySelector('.azro-modal__media');
    if(!media){
      var sc = modal.querySelector('.azro-modal__scroll') || modal;
      var body = sc.querySelector('.azro-modal__body') || sc;
      media = document.createElement('div');
      media.className = 'azro-modal__media';
      (body || modal).appendChild(media);
    }

    function bestVideo(){
      var candidates = ['main.mp4','newchart.mp4','chart.mp4','videos/main.mp4','videos/newchart.mp4','videos/chart.mp4'];
      // No reliable filesystem access in browser; try the common names used in this site.
      for (var i=0;i<candidates.length;i++){ 
        // We can't check existence without fetching; just return first one and let 404 surface.
        // main.mp4 exists in your bundle; keep it first.
      }
      return candidates[0];
    }

    function ensureVidBox(){
      var dlg = document.querySelector('dialog.azro-vidbox');
      if (!dlg){
        dlg = document.createElement('dialog');
        dlg.className = 'azro-vidbox';
        dlg.innerHTML = '<button class="azro-vidbox__close" aria-label="Close">×</button><div class="azro-vidbox__frame"></div>';
        document.body.appendChild(dlg);
        dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
        dlg.querySelector('.azro-vidbox__close').addEventListener('click', function(){ dlg.close(); });
        dlg.openBox = function(src){
          var frame = dlg.querySelector('.azro-vidbox__frame');
          frame.innerHTML = '';
          var v = document.createElement('video');
          v.className = 'azro-vidbox__video';
          v.setAttribute('autoplay',''); v.autoplay = true;
          v.setAttribute('muted','');   v.muted = true;
          v.setAttribute('loop','');    v.loop = true;
          v.setAttribute('playsinline',''); v.playsInline = true;
          v.setAttribute('controls',''); v.preload = 'auto';
          var s = document.createElement('source'); s.src = String(src);
          s.type = /\.mov(\?.*)?$/i.test(src) ? 'video/quicktime' : 'video/mp4';
          v.appendChild(s);
          frame.appendChild(v);
          try{ v.play().catch(function(){}); }catch(_){}
          try{ dlg.showModal(); }catch(_){}
        };
      }
      return dlg;
    }

    function putVideo(){
      if (!modal.open) return;
      var url = bestVideo();
      media.innerHTML = '';
      var box = document.createElement('div'); box.className = 'azro-video'; media.appendChild(box);

      var v = document.createElement('video');
      v.className = 'azro-video__el';
      v.setAttribute('autoplay',''); v.autoplay = true;
      v.setAttribute('muted','');   v.muted = true;
      v.setAttribute('loop','');    v.loop = true;
      v.setAttribute('playsinline',''); v.playsInline = true;
      v.setAttribute('controls',''); v.preload = 'metadata';
      var s = document.createElement('source'); s.src = String(url);
      s.type = /\.mov(\?.*)?$/i.test(url) ? 'video/quicktime' : 'video/mp4';
      v.appendChild(s);
      box.appendChild(v);
      try{ v.play().catch(function(){}); }catch(_){}

      // Expand button
      var btn = document.createElement('button');
      btn.className = 'azro-video__expand';
      btn.type = 'button';
      btn.setAttribute('aria-label','Preview video');
      btn.textContent = '↗';
      box.appendChild(btn);

      var vb = ensureVidBox();
      var openPrev = function(){ try{ vb.openBox(url); }catch(_){ } };
      btn.addEventListener('click', openPrev, { passive:true });
      v.addEventListener('click', openPrev, { passive:true });
    }

    new MutationObserver(putVideo).observe(modal, { attributes:true, attributeFilter:['open'] });
    if (modal.open) putVideo();
  });
})();
