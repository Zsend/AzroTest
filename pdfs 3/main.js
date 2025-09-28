const body  = document.body;
const logo  = document.getElementById('logo');
let timer;

function showForm() {
  body.classList.add('show-form');
}
function hideForm() {
  body.classList.remove('show-form');
}

/* hover / focus (desktop & keyboard) */
logo.addEventListener('pointerenter', showForm);
logo.addEventListener('pointerleave', hideForm);
logo.addEventListener('focus',        showForm);
logo.addEventListener('blur',         hideForm);

/* tap (mobile) */
logo.addEventListener('pointerdown', () => {
  showForm();
  clearTimeout(timer);
  timer = setTimeout(hideForm, 6000);
});
