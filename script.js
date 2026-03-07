
const header = document.querySelector('.site-header');
const menu = document.querySelector('.menu');
if(menu){
  menu.addEventListener('click', ()=>{
    header.classList.toggle('open');
  });
}
