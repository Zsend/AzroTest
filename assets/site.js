
(function(){
  const data = window.ARFA_LETTERS || [];
  const byId = Object.fromEntries(data.map(item => [item.id, item]));

  function iconArrow(){ return '→'; }

  function renderFeatured(containerId, limit){
    const container = document.getElementById(containerId);
    if(!container) return;
    const items = data.filter(item => item.featured).slice(0, limit || 8);
    container.innerHTML = items.map(item => `
      <button class="letter-card" type="button" aria-haspopup="dialog" data-open-letter="${item.id}">
        <div class="letter-thumb">
          <img src="${item.thumb}" alt="First page preview of a handwritten inmate letter from ${item.full}." loading="lazy" />
        </div>
        <div class="letter-content">
          <blockquote>${item.quote.replace(/^“|”$/g,'')}</blockquote>
          <div class="letter-meta"><strong>${item.display}</strong> · ${item.context}</div>
          <span class="letter-link">Read typed excerpt ${iconArrow()}</span>
        </div>
      </button>
    `).join('');
  }

  function renderArchive(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = data.map(item => `
      <article class="archive-card">
        <img src="${item.thumb}" alt="First page preview of the original letter from ${item.full}." loading="lazy" />
        <h3>${item.display}</h3>
        <p>${item.featured ? 'Featured excerpt available, plus the original handwritten scan.' : 'Original handwritten letter of support from inside the Idaho system.'}</p>
        <div class="archive-actions">
          ${item.featured ? `<button class="pill-link" type="button" data-open-letter="${item.id}">Read typed excerpt</button>` : ``}
          <a class="pill-link" href="${item.pdf}" target="_blank" rel="noopener">Open original PDF</a>
        </div>
      </article>
    `).join('');
  }

  function setupDialog(){
    const dialog = document.getElementById('letter-dialog');
    if(!dialog) return;
    const title = dialog.querySelector('[data-letter-title]');
    const kicker = dialog.querySelector('[data-letter-kicker]');
    const image = dialog.querySelector('[data-letter-image]');
    const quote = dialog.querySelector('[data-letter-quote]');
    const summary = dialog.querySelector('[data-letter-summary]');
    const transcript = dialog.querySelector('[data-letter-transcript]');
    const pdf = dialog.querySelector('[data-letter-pdf]');
    const close = dialog.querySelector('[data-close-letter]');

    function openLetter(id){
      const item = byId[id];
      if(!item) return;
      title.textContent = item.full;
      kicker.textContent = item.context;
      image.src = item.preview;
      image.alt = `Preview of the original handwritten letter from ${item.full}.`;
      quote.innerHTML = `<p>${item.quote}</p>`;
      summary.innerHTML = item.excerpt_html || '';
      transcript.innerHTML = item.transcript_html ? `<div class="dialog-copy"><h4 class="section-label" style="margin-top:0">Typed excerpt from the original letter</h4>${item.transcript_html}</div>` : '';
      pdf.href = item.pdf;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open-letter]');
      if(trigger){
        openLetter(trigger.getAttribute('data-open-letter'));
      }
      if(event.target === dialog){
        dialog.close();
      }
    });
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const clickedInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if(!clickedInDialog){ dialog.close(); }
    });
    dialog.addEventListener('close', ()=>{ document.documentElement.style.overflow=''; });
    close?.addEventListener('click', ()=> dialog.close());
  }

  function setupIntentLinks(){
    document.querySelectorAll('[data-intent]').forEach(btn => {
      btn.addEventListener('click', () => {
        const intent = btn.getAttribute('data-intent');
        const select = document.getElementById('interest-type');
        if(select && intent){
          select.value = intent;
        }
      });
    });
  }

  function setupMailForm(){
    const form = document.getElementById('get-involved-form');
    if(!form) return;
    const status = document.getElementById('form-status');
    const emailTarget = form.getAttribute('data-email') || 'hello@arightforall.com';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const intent = (fd.get('intent') || '').toString().trim();
      const message = (fd.get('message') || '').toString().trim();
      const organization = (fd.get('organization') || '').toString().trim();

      const subject = `[A Right For All] ${intent || 'Get involved'}${name ? ' — ' + name : ''}`;
      const body = [
        `Name: ${name || 'Not provided'}`,
        `Email: ${email || 'Not provided'}`,
        `Organization: ${organization || 'Not provided'}`,
        `Interest: ${intent || 'Not provided'}`,
        '',
        'Message:',
        message || '(No message included)'
      ].join('\n');

      const mailto = `mailto:${encodeURIComponent(emailTarget)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;

      if(navigator.clipboard){
        navigator.clipboard.writeText(body).catch(()=>{});
      }
      if(status){
        status.innerHTML = `Your email draft should open now. If nothing happens, email <a class="inline-link" href="mailto:${emailTarget}">${emailTarget}</a> and paste your message.`;
      }
    });
  }

  function setYear(){
    const el = document.getElementById('year');
    if(el) el.textContent = new Date().getFullYear();
  }

  renderFeatured('featured-letters', 8);
  renderArchive('archive-letters');
  setupDialog();
  setupIntentLinks();
  setupMailForm();
  setYear();
})();
