// Navigation, page transitions, portfolio filters and the contact form.
const $ = (selector) => document.querySelector(selector);
const sections = [...document.querySelectorAll('.content-section')];
const cards = [...document.querySelectorAll('.grid-work-item')];
const navigation = $('#primary-navigation');
const menuButton = $('#burger-menu');
const viewer = $('#image-viewer');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 760px)');
let filter = 'All';
let lastSection = 'home';
let lastPage = null;
let pageAnimations = [];
let routeVersion = 0;

function stopPageAnimations() {
  pageAnimations.forEach((animation) => animation.cancel());
  pageAnimations = [];
}

function animatePage(section) {
  stopPageAnimations();
  if (reducedMotion.matches || typeof section.animate !== 'function') return;
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // A quiet vertical reveal follows the lines and framing of the interiors.
  pageAnimations.push(
    section.animate(
      [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 560, easing },
    ),
  );
  const imageFrame = section.querySelector('.gallery-stage, .about-image');
  if (imageFrame)
    pageAnimations.push(
      imageFrame.animate([{ clipPath: 'inset(0 4% 0 4%)' }, { clipPath: 'inset(0 0 0 0)' }], {
        duration: 720,
        easing,
      }),
    );
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) stopPageAnimations();
});

document.documentElement.classList.add('js');
$('.work-tools').hidden = false;
// Keep the initial view coherent while a project deep link loads its module.
sections.forEach((section) => {
  section.hidden = section.id !== 'home';
});

// A 45-degree cut extending across 40% of the hero image's width.
const heroFrame = $('.about-image');
if ('ResizeObserver' in window) {
  const heroCutObserver = new ResizeObserver(([entry]) => {
    const { width } = entry.contentRect;
    if (!width) return;
    heroFrame.style.setProperty('--corner-cut', `${(width * 0.4).toFixed(2)}px`);
  });
  heroCutObserver.observe(heroFrame);
}

// Mobile navigation
function setMenu(open, restoreFocus = false) {
  navigation.classList.toggle('show', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () =>
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true'),
);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true')
    setMenu(false, true);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('header')) setMenu(false);
});
document.addEventListener('focusin', (event) => {
  if (!event.target.closest('header')) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));

// Hash routes preserve existing project links and page animations.
async function renderRoute(moveFocus = true) {
  // A slow project download must never replace a newer navigation choice.
  const version = ++routeVersion;
  const status = $('#route-status');
  status.hidden = true;
  if (viewer.open) viewer.close();
  const hash = window.location.hash.slice(1);
  if (hash === 'main-content' && moveFocus) {
    $('#main-content').focus();
    return;
  }
  const isProject = cards.some((card) => card.hash === `#${hash}`);
  let work = null;
  if (isProject) {
    setMenu(false);
    $('#route-message').textContent = 'Opening project…';
    $('#retry-route').hidden = true;
    status.hidden = false;
    try {
      const gallery = await import('./gallery.js');
      if (version !== routeVersion) return;
      work = gallery.renderProject(hash);
      status.hidden = true;
    } catch (error) {
      if (version !== routeVersion) return;
      $('#route-message').textContent = 'This project could not load. Please try again.';
      $('#retry-route').hidden = false;
      return;
    }
  }
  const section = work
    ? 'work-detail'
    : ['home', 'work', 'people', 'contact'].includes(hash)
      ? hash
      : 'home';
  const pageKey = work ? hash : section;
  setMenu(false);
  const visibleSection = section === 'contact' ? lastSection : section;
  sections.forEach((element) => {
    element.hidden = element.id !== visibleSection;
  });
  const activeNav = work ? 'work' : section;
  navigation.querySelectorAll('a').forEach((link) => {
    if (link.hash === `#${activeNav}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titles = {
    home: 'Interior Design & Architecture in Addis Ababa',
    work: 'Our Work',
    people: 'Meet the Team',
    contact: 'Contact',
  };
  document.title = `VI Designs | ${work ? work.title : titles[section]}`;
  if (section !== 'contact') lastSection = section;
  const heading = section === 'contact' ? $('#contact-heading') : $(`#${section} h1`);
  if (moveFocus && heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  if (section === 'contact') {
    const contact = $('#contact');
    const headerHeight = $('header').getBoundingClientRect().height;
    contact.style.setProperty('--contact-header-height', `${headerHeight}px`);
    // Measure the actual header instead of adding fixed scroll offsets.
    window.scrollTo({
      top: window.scrollY + contact.getBoundingClientRect().top - headerHeight,
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  } else if (moveFocus) window.scrollTo({ top: 0, behavior: 'instant' });
  if (section !== 'contact') {
    if (pageKey !== lastPage) animatePage(document.getElementById(section));
    lastPage = pageKey;
  } else {
    stopPageAnimations();
  }
}
$('#retry-route').addEventListener('click', () => renderRoute());
window.addEventListener('hashchange', () => renderRoute());
// Repeated links must still scroll/focus, even when the hash does not change.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (
    link &&
    link.hash === window.location.hash &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    renderRoute();
  }
});

// Portfolio search and category filters
function filterProjects() {
  const query = $('#project-search').value.trim().toLocaleLowerCase();
  let count = 0;
  cards.forEach((card) => {
    const matches =
      (filter === 'All' || card.dataset.category === filter) &&
      card.textContent.toLocaleLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) count++;
  });
  $('#project-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
  $('#empty-projects').hidden = count !== 0;
  document
    .querySelectorAll('[data-filter]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter)),
    );
}
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    filterProjects();
  }),
);
$('#project-search').addEventListener('input', filterProjects);
$('#reset-filters').addEventListener('click', () => {
  filter = 'All';
  $('#project-search').value = '';
  filterProjects();
  $('#project-search').focus();
});

// Prepare an email locally; the website does not store contact messages.
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
  $('#contact-status').textContent =
    'Your email draft is ready to open. If your email app does not open, email info@videsignsplc.com directly. Your message is still here to copy.';
  window.location.href = `mailto:info@videsignsplc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

$('.back-to-top').addEventListener('click', () => {
  $('.header-logo a').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});

filterProjects();
renderRoute(false);
