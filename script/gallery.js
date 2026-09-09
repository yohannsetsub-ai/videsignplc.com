// Project galleries load only after a visitor opens a project.
import { workDetails } from './data.js';

const $ = (selector) => document.querySelector(selector);
const cards = [...document.querySelectorAll('.grid-work-item')];
const viewer = $('#image-viewer');
const gallery = $('#work-images-slideshow');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentWork = null;
let imageIndex = 0;

export function renderProject(hash) {
  const work = workDetails[hash.replace('-', '')];
  // A single path is enough for a new photo. Smaller copies are optional.
  currentWork = {
    ...work,
    images: work.images.map((photo) => (typeof photo === 'string' ? { src: photo } : photo)),
  };
  imageIndex = 0;
  $('#work-title').textContent = work.title;
  $('#work-description').textContent = work.description;
  const meta = $('#work-link');
  meta.replaceChildren();
  if (work.link) {
    const href = typeof work.link === 'string' ? work.link : work.link.href;
    if (/^https?:\/\//i.test(href)) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = `${typeof work.link === 'object' && work.link.text ? work.link.text : 'Explore the virtual tour'} (opens in a new tab)`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'work-link-class';
      meta.append(link);
    }
  }
  const thumbnails = $('#gallery-thumbnails');
  thumbnails.replaceChildren();
  currentWork.images.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show image ${index + 1} of ${work.images.length}`);
    const image = document.createElement('img');
    image.src = photo.thumbnail || photo.preview || photo.src;
    image.alt = '';
    image.width = 85;
    image.height = 60;
    image.loading = 'lazy';
    image.decoding = 'async';
    button.append(image);
    button.addEventListener('click', () => showImage(index));
    thumbnails.append(button);
  });
  const projectIndex = cards.findIndex((card) => card.hash === `#${hash}`);
  $('#previous-project').href = cards[(projectIndex - 1 + cards.length) % cards.length].hash;
  $('#next-project').href = cards[(projectIndex + 1) % cards.length].hash;
  showImage(0, false);
  return work;
}

function showImage(index, scrollThumbnail = true) {
  if (!currentWork || !currentWork.images.length) return;
  imageIndex = (index + currentWork.images.length) % currentWork.images.length;
  const source = currentWork.images[imageIndex];
  const description = `${currentWork.title} — image ${imageIndex + 1} of ${currentWork.images.length}`;
  const image = $('#gallery-image');
  $('#gallery-error').hidden = true;
  $('#gallery-mobile-image').srcset = encodeURI(source.small || source.preview || source.src);
  image.src = source.preview || source.src;
  image.alt = description;
  $('#gallery-status').textContent = `Image ${imageIndex + 1} / ${currentWork.images.length}`;
  if (viewer.open) updateViewer();
  [...$('#gallery-thumbnails').children].forEach((button, index) =>
    button.setAttribute('aria-pressed', String(index === imageIndex)),
  );
  const thumbnails = $('#gallery-thumbnails');
  const active = thumbnails.children[imageIndex];
  // Scroll only the strip; never jump the page to the gallery.
  if (scrollThumbnail && active)
    thumbnails.scrollTo({
      left: active.offsetLeft - thumbnails.clientWidth / 2 + active.clientWidth / 2,
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
}
$('#gallery-image').addEventListener('error', () => {
  $('#gallery-error').hidden = false;
});
$('#gallery-image').addEventListener('load', () => {
  $('#gallery-error').hidden = true;
});
document
  .querySelectorAll('.gallery-prev')
  .forEach((button) => button.addEventListener('click', () => showImage(imageIndex - 1)));
document
  .querySelectorAll('.gallery-next')
  .forEach((button) => button.addEventListener('click', () => showImage(imageIndex + 1)));

// Full-screen viewing retains the original image quality.
function updateViewer() {
  $('#viewer-image').src = currentWork.images[imageIndex].src;
  $('#viewer-image').alt = $('#gallery-image').alt;
  $('#viewer-title').textContent = currentWork.title;
  $('#viewer-status').textContent = $('#gallery-status').textContent;
}
$('#expand-image').addEventListener('click', () => {
  if (!currentWork) return;
  updateViewer();
  viewer.showModal();
  document.body.classList.add('viewer-open');
});
$('#close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => document.body.classList.remove('viewer-open'));
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) {
    const rect = viewer.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      viewer.close();
  }
});
function galleryKeydown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const actions = {
    ArrowLeft: imageIndex - 1,
    ArrowRight: imageIndex + 1,
    Home: 0,
    End: currentWork ? currentWork.images.length - 1 : 0,
  };
  if (Object.hasOwn(actions, event.key)) {
    event.preventDefault();
    showImage(actions[event.key]);
  }
}
gallery.addEventListener('keydown', galleryKeydown);
viewer.addEventListener('keydown', galleryKeydown);
for (const surface of [$('.gallery-stage'), $('.viewer-stage')]) {
  let start = null;
  surface.addEventListener(
    'touchstart',
    (event) => {
      start =
        event.touches.length === 1
          ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
          : null;
    },
    { passive: true },
  );
  surface.addEventListener(
    'touchend',
    (event) => {
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
        showImage(imageIndex + (dx < 0 ? 1 : -1));
      start = null;
    },
    { passive: true },
  );
  surface.addEventListener(
    'touchcancel',
    () => {
      start = null;
    },
    { passive: true },
  );
}
