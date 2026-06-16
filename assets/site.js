
(function(){
  const acc = document.querySelectorAll('.accordion-item');
  acc.forEach((item, idx) => {
    const btn = item.querySelector('.accordion-button');
    if(!btn) return;
    btn.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.querySelectorAll('[data-progress]').forEach(box => {
    const key = 'progress:' + box.getAttribute('data-progress');
    const inputs = box.querySelectorAll('input[type="checkbox"]');
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    inputs.forEach((input, i) => {
      input.checked = !!saved[i];
      input.addEventListener('change', () => {
        const next = {};
        inputs.forEach((x, j) => next[j] = x.checked);
        localStorage.setItem(key, JSON.stringify(next));
        update();
      });
    });
    const meter = box.querySelector('[data-meter]');
    function update(){
      if(!meter) return;
      const count = Array.from(inputs).filter(x => x.checked).length;
      meter.textContent = count + ' / ' + inputs.length + ' complete';
    }
    update();
  });
})();
