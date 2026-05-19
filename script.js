const photos = [
  { file: '01-IMG_7974.jpg', tags: ['favorites'], caption: 'Outdoor doodle portrait' },
  { file: '02-IMG_6934.jpg', tags: [], caption: 'Indoor doodle portrait' },
  { file: '03-IMG_4312.jpg', tags: [], caption: 'Cozy puppy photo' },
  { file: '04-IMG_4313.jpg', tags: [], caption: 'Puppy close-up' },
  { file: '05-IMG_3714.jpg', tags: ['favorites'], caption: 'Doodle sitting indoors' },
  { file: '06-IMG_6935.jpg', tags: ['favorites'], caption: 'Garden portrait' },
  { file: '07-IMG_7311.jpg', tags: ['favorites'], caption: 'Happy outdoor portrait' },
  { file: '08-IMG_2451.jpg', tags: [], caption: 'Relaxed doodle photo' },
  { file: '09-IMG_4570.jpg', tags: [], caption: 'Resting doodle' },
  { file: '10-IMG_4310.jpg', tags: [], caption: 'Puppy update image' },
  { file: '11-IMG_8817.jpg', tags: [], caption: 'Doodle in a hoodie' },
  { file: '12-IMG_8741-2.jpg', tags: [], caption: 'Playful close-up' },
  { file: '13-IMG_2372.jpg', tags: [], caption: 'Indoor portrait' },
  { file: '14-IMG_5546.jpg', tags: [], caption: 'Curly doodle portrait' },
  { file: '15-IMG_6932.jpg', tags: [], caption: 'Puppy in a hoodie' },
  { file: '16-IMG_7234.jpg', tags: [], caption: 'Couch photo' },
  { file: '17-IMG_6933.jpg', tags: [], caption: 'Puppy with hat' },
  { file: '18-IMG_5545.jpg', tags: ['favorites'], caption: 'Happy doodle close-up' },
  { file: '19-IMG_3479.jpg', tags: [], caption: 'Photo update screenshot' },
  { file: '20-IMG_2217.jpg', tags: ['favorites'], caption: 'Flower garden portrait' },
  { file: '21-IMG_6192.jpg', tags: ['parents', 'favorites'], caption: 'Finn — planned dad' },
  { file: '22-IMG_7337.jpg', tags: ['parents', 'favorites'], caption: 'Willow — planned mom' },
  { file: '23-IMG_1332.jpg', tags: [], caption: 'Relaxing at home' },
  { file: '24-IMG_7985.jpg', tags: ['favorites'], caption: 'Outdoor portrait' },
  { file: '25-IMG_6229.jpg', tags: [], caption: 'Doodle portrait' },
  { file: '26-IMG_8165.jpg', tags: [], caption: 'Trail portrait' },
  { file: '27-IMG_9611.jpg', tags: ['favorites'], caption: 'Scenic outdoor portrait' },
  { file: '28-IMG_8351.jpg', tags: [], caption: 'Outdoor adventure photo' },
  { file: '29-IMG_8701.jpg', tags: [], caption: 'Cozy doodle photo' },
  { file: '30-IMG_1279.jpg', tags: [], caption: 'Puppy portrait' },
  { file: '31-IMG_1255.jpg', tags: [], caption: 'Wrapped puppy photo' },
  { file: '32-IMG_2213.jpg', tags: ['favorites'], caption: 'Garden portrait' },
  { file: '33-IMG_4282.jpg', tags: [], caption: 'Playful indoor photo' },
  { file: '34-IMG_1487.jpg', tags: [], caption: 'Resting puppy' },
  { file: '35-IMG_3820.jpg', tags: [], caption: 'Playful doodle close-up' },
  { file: '36-IMG_1281.jpg', tags: [], caption: 'Doodle close-up' },
  { file: '37-IMG_7314.jpg', tags: [], caption: 'Outdoor close-up' },
  { file: '38-IMG_4666.jpg', tags: [], caption: 'Family photo' },
  { file: '39-IMG_8700.jpg', tags: [], caption: 'Cozy doodle photo' },
  { file: '40-IMG_1274.jpg', tags: [], caption: 'Puppy hoodie photo' },
  { file: '41-IMG_7313.jpg', tags: ['favorites'], caption: 'Outdoor smile' },
  { file: '42-IMG_7978.jpg', tags: ['favorites'], caption: 'Outdoor portrait' },
  { file: '43-IMG_1286.jpg', tags: [], caption: 'Puppy in shopping cart' },
  { file: '44-IMG_8567.jpg', tags: [], caption: 'Trail photo' },
  { file: '45-IMG_7995.jpg', tags: [], caption: 'Car portrait' },
  { file: '46-IMG_3608.jpg', tags: [], caption: 'Car photo' },
  { file: '47-IMG_3521.jpg', tags: [], caption: 'Doodle with toy' },
  { file: '48-IMG_8706.jpg', tags: [], caption: 'Cozy portrait' },
  { file: '49-IMG_6431.jpg', tags: [], caption: 'Couch photo' },
  { file: '50-IMG_2370.jpg', tags: [], caption: 'Indoor portrait' },
  { file: '51-IMG_7980.jpg', tags: ['favorites'], caption: 'Outdoor smile portrait' }
];

const galleryGrid = document.getElementById('galleryGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const closeBtn = document.querySelector('.lightbox-close');
const prevBtn = document.querySelector('.lightbox-prev');
const nextBtn = document.querySelector('.lightbox-next');
let activePhotos = photos;
let activeIndex = 0;

function renderGallery(filter = 'all') {
  activePhotos = filter === 'all' ? photos : photos.filter(photo => photo.tags.includes(filter));
  galleryGrid.innerHTML = '';
  activePhotos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.className = 'gallery-item';
    button.type = 'button';
    button.setAttribute('aria-label', `Open photo: ${photo.caption}`);
    button.innerHTML = `<img loading="lazy" src="assets/thumbs/${photo.file}" alt="${photo.caption}">`;
    button.addEventListener('click', () => openLightbox(index));
    galleryGrid.appendChild(button);
  });
}

function openLightbox(index) {
  activeIndex = index;
  const photo = activePhotos[activeIndex];
  lightboxImg.src = `assets/photos/${photo.file}`;
  lightboxImg.alt = photo.caption;
  lightboxCaption.textContent = `${photo.caption} (${activeIndex + 1} of ${activePhotos.length})`;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

function stepLightbox(direction) {
  activeIndex = (activeIndex + direction + activePhotos.length) % activePhotos.length;
  openLightbox(activeIndex);
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    renderGallery(button.dataset.filter);
  });
});

closeBtn.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', () => stepLightbox(-1));
nextBtn.addEventListener('click', () => stepLightbox(1));
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', event => {
  if (!lightbox.classList.contains('open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') stepLightbox(-1);
  if (event.key === 'ArrowRight') stepLightbox(1);
});

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
navToggle.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open');
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

renderGallery();
