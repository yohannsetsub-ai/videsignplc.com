import { workDetails } from './data.js';

const $ = (selector) => document.querySelector(selector);
const sections = [...document.querySelectorAll('.content-section')];
const cards = [...document.querySelectorAll('.grid-work-item')];
const navigation = $('#primary-navigation');
const menuButton = $('#burger-menu');
const viewer = $('#image-viewer');
const gallery = $('#work-images-slideshow');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 760px)');
let currentWork = null;
let imageIndex = 0;
let filter = 'All';
let lastSection = 'home';
let lastPage = null;
let pageAnimations = [];

function stopPageAnimations() {
    pageAnimations.forEach((animation) => animation.cancel());
    pageAnimations = [];
}

function animatePage(section) {
    stopPageAnimations();
    if (reducedMotion.matches || typeof section.animate !== 'function') return;
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    // A quiet vertical reveal follows the lines and framing of the interiors.
    pageAnimations.push(section.animate([
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 560, easing }));
    const imageFrame = section.querySelector('.gallery-stage, .about-image');
    if (imageFrame) pageAnimations.push(imageFrame.animate([
        { clipPath: 'inset(0 4% 0 4%)' },
        { clipPath: 'inset(0 0 0 0)' }
    ], { duration: 720, easing }));
}

reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stopPageAnimations();
});

document.documentElement.classList.add('js');
$('.work-tools').hidden = false;

function setMenu(open, restoreFocus = false) {
    navigation.classList.toggle('show', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
document.addEventListener('click', (event) => {
    if (!event.target.closest('header')) setMenu(false);
});
document.addEventListener('focusin', (event) => {
    if (!event.target.closest('header')) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));

function renderRoute(moveFocus = true) {
    const hash = window.location.hash.slice(1);
    if (hash === 'main-content' && moveFocus) {
        $('#main-content').focus();
        return;
    }
    const work = /^work-\d+$/.test(hash) ? workDetails[hash.replace('-', '')] : null;
    const section = work ? 'work-detail' : ['home', 'work', 'people', 'contact'].includes(hash) ? hash : 'home';
    const pageKey = work ? hash : section;
    setMenu(false);
    if (viewer.open) viewer.close();
    const visibleSection = section === 'contact' ? lastSection : section;
    sections.forEach((element) => { element.hidden = element.id !== visibleSection; });
    if (work) renderProject(hash, work);
    const activeNav = work ? 'work' : section;
    navigation.querySelectorAll('a').forEach((link) => {
        if (link.hash === `#${activeNav}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    const titles = { home: 'Interior Design & Architecture in Addis Ababa', work: 'Our Work', people: 'Meet the Team', contact: 'Contact' };
    document.title = `VI Designs | ${work ? work.title : titles[section]}`;
    if (section !== 'contact') lastSection = section;
    const heading = section === 'contact' ? $('#contact-heading') : $(`#${section} h1`);
    if (moveFocus && heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
    }
    if (section === 'contact') $('#contact').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    else if (moveFocus) window.scrollTo({ top: 0, behavior: 'instant' });
    if (section !== 'contact') {
        if (pageKey !== lastPage) animatePage(document.getElementById(section));
        lastPage = pageKey;
    } else {
        stopPageAnimations();
    }
}
window.addEventListener('hashchange', () => renderRoute());
// Repeated links must still scroll/focus, even when the hash does not change.
document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === window.location.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        renderRoute();
    }
});

function filterProjects() {
    const query = $('#project-search').value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach((card) => {
        const matches = (filter === 'All' || card.dataset.category === filter) && card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !matches;
        if (matches) count++;
    });
    $('#project-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    $('#empty-projects').hidden = count !== 0;
    document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    filterProjects();
}));
$('#project-search').addEventListener('input', filterProjects);
$('#reset-filters').addEventListener('click', () => {
    filter = 'All';
    $('#project-search').value = '';
    filterProjects();
    $('#project-search').focus();
});

function renderProject(hash, work) {
    currentWork = work;
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
            link.textContent = `${typeof work.link === 'object' && work.link.text ? work.link.text : 'Explore the virtual tour'} ↗ (opens in a new tab)`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'work-link-class';
            meta.append(link);
        }
    }
    const thumbnails = $('#gallery-thumbnails');
    thumbnails.replaceChildren();
    work.images.forEach((source, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Show image ${index + 1} of ${work.images.length}`);
        const image = document.createElement('img');
        image.src = source;
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
}

function showImage(index, scrollThumbnail = true) {
    if (!currentWork || !currentWork.images.length) return;
    imageIndex = (index + currentWork.images.length) % currentWork.images.length;
    const source = currentWork.images[imageIndex];
    const description = `${currentWork.title} — image ${imageIndex + 1} of ${currentWork.images.length}`;
    const image = $('#gallery-image');
    $('#gallery-error').hidden = true;
    image.src = source;
    image.alt = description;
    $('#gallery-status').textContent = `Image ${imageIndex + 1} / ${currentWork.images.length}`;
    if (viewer.open) updateViewer();
    [...$('#gallery-thumbnails').children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === imageIndex)));
    const thumbnails = $('#gallery-thumbnails');
    const active = thumbnails.children[imageIndex];
    // Scroll only the strip; never jump the page to the gallery.
    if (scrollThumbnail && active) thumbnails.scrollTo({ left: active.offsetLeft - thumbnails.clientWidth / 2 + active.clientWidth / 2, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}
$('#gallery-image').addEventListener('error', () => { $('#gallery-error').hidden = false; });
$('#gallery-image').addEventListener('load', () => { $('#gallery-error').hidden = true; });
document.querySelectorAll('.gallery-prev').forEach((button) => button.addEventListener('click', () => showImage(imageIndex - 1)));
document.querySelectorAll('.gallery-next').forEach((button) => button.addEventListener('click', () => showImage(imageIndex + 1)));

function updateViewer() {
    $('#viewer-image').src = currentWork.images[imageIndex];
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
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
    }
});
function galleryKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const actions = { ArrowLeft: imageIndex - 1, ArrowRight: imageIndex + 1, Home: 0, End: currentWork ? currentWork.images.length - 1 : 0 };
    if (Object.hasOwn(actions, event.key)) {
        event.preventDefault();
        showImage(actions[event.key]);
    }
}
gallery.addEventListener('keydown', galleryKeydown);
viewer.addEventListener('keydown', galleryKeydown);
for (const surface of [$('.gallery-stage'), $('.viewer-stage')]) {
    let start = null;
    surface.addEventListener('touchstart', (event) => {
        start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    surface.addEventListener('touchend', (event) => {
        if (!start || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showImage(imageIndex + (dx < 0 ? 1 : -1));
        start = null;
    }, { passive: true });
    surface.addEventListener('touchcancel', () => { start = null; }, { passive: true });
}

$('#contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = `${data.get('first_name').trim()} ${data.get('last_name').trim()}`.trim();
    if (!name || !data.get('message').trim()) {
        $('#contact-status').textContent = 'Please enter your name and a message about your project.';
        return;
    }
    const subject = 'Project enquiry — VI Designs';
    const body = `Name: ${name}\nEmail: ${data.get('email')}\n\n${data.get('message').trim()}`;
    $('#contact-status').textContent = 'Your email draft is ready to open. If your email app does not open, email info@videsignsplc.com directly. Your message is still here to copy.';
    window.location.href = `mailto:info@videsignsplc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

filterProjects();
renderRoute(false);
