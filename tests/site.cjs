// Exercise the actual ES modules in a simulated DOM, including delayed imports.
// This checks behavior; it is not a browser or visual performance measurement.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { HtmlValidate } = require('html-validate');

const html = fs.readFileSync('index.html', 'utf8');
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function createSite(initialHash = '') {
  const dom = new JSDOM(html, {
    url: `https://www.videsignsplc.com/${initialHash}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  const motion = {
    matches: false,
    addEventListener(type, callback) {
      this.onChange = callback;
    },
  };
  w.matchMedia = (query) =>
    query.includes('reduced-motion') ? motion : { matches: false, addEventListener() {} };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.scrollTo = function () {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event('close'));
  };
  const animations = [];
  w.HTMLElement.prototype.animate = function () {
    const animation = {
      canceled: false,
      cancel() {
        this.canceled = true;
      },
    };
    animations.push(animation);
    return animation;
  };

  const modules = new Map();
  const imports = [];
  const network = { wait: null, fail: false };
  async function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename);
    const module = new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), {
      context: dom.getInternalVMContext(),
      identifier: filename,
      importModuleDynamically: async (specifier, parent) => {
        imports.push(specifier);
        if (network.wait) await network.wait;
        if (network.fail) throw new Error('Simulated network failure');
        const child = await load(path.resolve(path.dirname(parent.identifier), specifier));
        await child.evaluate();
        return child;
      },
    });
    const linked = module
      .link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier)))
      .then(() => module);
    modules.set(filename, linked);
    return linked;
  }
  await (await load('script/script.js')).evaluate();
  await tick();
  const $ = (selector) => w.document.querySelector(selector);
  async function route(hash) {
    w.history.replaceState(null, '', hash);
    w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    await tick();
  }
  function visible(id) {
    assert.deepEqual(
      [...w.document.querySelectorAll('.content-section')]
        .filter((section) => !section.hidden)
        .map((section) => section.id),
      [id],
    );
  }
  function key(element, value) {
    element.dispatchEvent(
      new w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    );
  }
  return { dom, w, $, route, visible, key, imports, network, animations, motion, load };
}

async function main() {
  const site = await createSite();
  const { dom, w, $, route, visible, key, imports, network, animations, motion } = site;
  visible('home');
  assert.equal(imports.length, 0, 'The home page does not download the project catalog or gallery');
  assert.ok(
    $('#viewer-image').getAttribute('src').startsWith('data:'),
    'The empty viewer makes no image request',
  );
  assert.equal(animations.length, 2);
  await route('#work');
  visible('work');
  assert.equal(imports.length, 0, 'Portfolio filters do not need the gallery module');
  $('[data-filter="Residential"]').click();
  assert.equal($('#project-count').textContent, '3 projects');
  $('#project-search').value = 'yared';
  $('#project-search').dispatchEvent(new w.Event('input'));
  assert.equal($('#project-count').textContent, '1 project');
  $('#project-search').value = 'nonexistent';
  $('#project-search').dispatchEvent(new w.Event('input'));
  assert.equal($('#empty-projects').hidden, false);
  $('#reset-filters').click();
  assert.equal($('#project-count').textContent, '15 projects');

  // A late gallery response must not override a subsequent navigation.
  let release;
  network.wait = new Promise((resolve) => {
    release = resolve;
  });
  await route('#work-1');
  assert.equal($('#route-status').hidden, false);
  await route('#people');
  release();
  network.wait = null;
  await tick();
  visible('people');
  assert.equal($('#route-status').hidden, true);

  network.fail = true;
  await route('#work-2');
  visible('people');
  assert.equal($('#retry-route').hidden, false);
  network.fail = false;
  $('#retry-route').click();
  await tick();
  visible('work-detail');
  assert.equal($('#route-status').hidden, true);

  for (const card of w.document.querySelectorAll('.grid-work-item')) {
    await route(card.hash);
    visible('work-detail');
    assert.ok($('#work-title').textContent.length > 3);
    assert.equal($('nav [aria-current]').hash, '#work');
    assert.equal($('#gallery-thumbnails').firstChild.getAttribute('aria-pressed'), 'true');
    for (const image of w.document.querySelectorAll('#gallery-thumbnails img')) {
      assert.ok(image.getAttribute('src').startsWith('images/gallery/thumbnail/'));
      assert.ok(fs.existsSync(image.getAttribute('src')));
    }
    assert.ok($('#gallery-image').getAttribute('src').startsWith('images/gallery/medium/'));
    for (const candidate of $('#gallery-image').srcset.split(', ')) {
      assert.match(candidate, /^\S+ \d+w$/, 'Each srcset URL encodes spaces before its width');
    }
    const previous = $('#previous-project').hash;
    await route($('#next-project').hash);
    assert.equal(
      $('#previous-project').hash,
      card.hash,
      'Project navigation preserves portfolio order',
    );
    assert.ok(previous.startsWith('#work-'));
  }

  await route('#work-1');
  key($('#work-images-slideshow'), 'End');
  assert.equal($('#gallery-status').textContent, 'Image 13 / 13');
  $('.gallery-next').click();
  assert.equal($('#gallery-status').textContent, 'Image 1 / 13');
  $('.gallery-prev').click();
  assert.equal($('#gallery-status').textContent, 'Image 13 / 13');
  $('#gallery-thumbnails').children[2].click();
  $('#expand-image').click();
  assert.equal($('#image-viewer').open, true);
  assert.ok(
    $('#viewer-image').getAttribute('src').startsWith('images/gallery/large/'),
    'Full screen retains the original image',
  );
  key($('#image-viewer'), 'ArrowRight');
  assert.equal($('#viewer-status').textContent, 'Image 4 / 13');
  await route('#work');
  assert.equal($('#image-viewer').open, false);
  assert.equal(w.document.body.classList.contains('viewer-open'), false);

  $('#burger-menu').click();
  assert.equal($('#burger-menu').getAttribute('aria-expanded'), 'true');
  key($('#burger-menu'), 'Escape');
  assert.equal($('#burger-menu').getAttribute('aria-expanded'), 'false');
  await route('#people');
  await route('#contact');
  visible('people');
  assert.equal(w.document.activeElement.id, 'contact-heading');
  await route('#invalid');
  visible('home');

  await route('#work-1');
  const animationCount = animations.length;
  await route('#work-2');
  assert.equal(animations.length, animationCount + 2);
  await route('#work-2');
  assert.equal(animations.length, animationCount + 2);
  motion.matches = true;
  motion.onChange();
  assert.ok(animations.every((animation) => animation.canceled));
  await route('#people');
  assert.equal(animations.length, animationCount + 2);

  assert.equal($('#contact-form').checkValidity(), false);
  $('#first-name').value = 'Ada';
  $('#email').value = 'ada@example.com';
  $('#message').value = 'A new office';
  assert.equal($('#contact-form').checkValidity(), true);
  for (const field of w.document.querySelectorAll('input, textarea')) {
    assert.ok($(`label[for="${field.id}"]`));
  }
  const ids = [...w.document.querySelectorAll('[id]')].map((element) => element.id);
  assert.equal(new Set(ids).size, ids.length);

  const canonical = `https://${fs.readFileSync('CNAME', 'utf8').trim()}/`;
  assert.equal($('link[rel="canonical"]').href, canonical);
  assert.equal($('meta[property="og:url"]').content, canonical);
  const schema = JSON.parse($('script[type="application/ld+json"]').textContent);
  assert.equal(schema['@type'], 'LocalBusiness');
  assert.equal(schema.email, 'info@videsignsplc.com');
  assert.equal(schema.url, canonical);
  assert.ok(fs.readFileSync('sitemap.xml', 'utf8').includes(`<loc>${canonical}</loc>`));
  assert.ok(fs.readFileSync('robots.txt', 'utf8').includes(`${canonical}sitemap.xml`));
  assert.equal(w.document.querySelectorAll('meta[property="og:site_name"]').length, 1);
  for (const name of ['og:image', 'twitter:image']) {
    const image = $(`meta[property="${name}"], meta[name="${name}"]`);
    assert.ok(fs.existsSync(new URL(image.content).pathname.slice(1)));
  }

  const validator = new HtmlValidate({
    extends: ['html-validate:recommended'],
    rules: {
      'void-style': 'off',
      'doctype-style': 'off',
      'no-trailing-whitespace': 'off',
      'long-title': 'off',
      'no-inline-style': 'off',
      'prefer-native-element': 'off',
      'no-autofocus': 'off',
      'wcag/h32': 'off',
      'tel-non-breaking': 'off',
    },
  });
  const result = await validator.validateString(html);
  assert.ok(
    result.valid,
    result.results
      .flatMap((item) => item.messages)
      .map((message) => `${message.line}: ${message.ruleId}: ${message.message}`)
      .join('\n'),
  );
  dom.window.close();

  const deepLink = await createSite('#work-15');
  deepLink.visible('work-detail');
  assert.ok(deepLink.$('#work-link a').href.startsWith('https://'));
  deepLink.dom.window.close();
  console.log(
    'PASS: lazy imports, slow/failed navigation and retry, all 15 projects, responsive image paths, gallery controls, filters, mobile menu, reduced motion, form constraints, SEO and HTML.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
