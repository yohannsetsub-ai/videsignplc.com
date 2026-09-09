# VI Designs — editing your website

To add a project, upload your photographs and edit **two files**:

- **`index.html`**: the project card visitors click.
- **`script/data.js`**: its title, description and gallery photographs.

No image aliases, size manifests, image generator or package installation is required.

## Add a project

### 1. Add your photographs

Create a folder such as `images/gallery/large/new-project/` and put your photographs there. WebP or JPG files are fine. Short filenames without spaces are easiest to manage.

### 2. Add the project in `script/data.js`

Copy an existing project block, give it a new number, and edit the details. For example, add this before the final closing `};`:

```js
work16: {
  title: 'My new office project',
  description: 'A short description of this project.',
  images: [
    'images/gallery/large/new-project/01.webp',
    'images/gallery/large/new-project/02.webp',
  ],
},
```

Keep a comma between project blocks. The first image is the main project photo; list the other photos in the order you want them shown.

### 3. Add its card in `index.html`

Find `<div class="grid-work">` and add your card alongside the existing cards:

```html
<a class="grid-work-item" href="#work-16" data-category="Office">
  <img
    src="images/gallery/large/new-project/01.webp"
    alt=""
    width="1600"
    height="1000"
    loading="lazy"
    decoding="async"
  >
  <span class="project-category">Office</span>
  <h2 class="work-title">My new office project</h2>
</a>
```

Use the actual image width and height. The card's `#work-16` must match `work16` in `data.js`. Use **Office**, **Residential** or **Hospitality** for both the category attribute and label. Card order controls portfolio order and previous/next project navigation.

Use the project's first photo as its card image. If you copy an existing card, update or remove its old `srcset` as well as changing `src`.

## Optional smaller photographs

A plain image path is enough. Existing projects use this expanded form to retain their faster-loading images:

```js
{
  src: 'images/gallery/large/new-project/01.webp',
  preview: 'images/gallery/medium/new-project/01.webp',
  small: 'images/gallery/small/new-project/01.webp',
  thumbnail: 'images/gallery/thumbnail/new-project/01.webp',
}
```

`src` is the full-screen photograph. The other three paths are optional: `preview` is the regular gallery image, `small` is the mobile image, and `thumbnail` is the tiny gallery preview. Only include paths for files you actually have. Every path is explicit; the website does not guess filenames or require matching folders.

You can mix plain paths and expanded photo entries in one project's `images` list. Photos reused by different projects can point directly to the same file.

## Other edits

| File | What you can change |
| --- | --- |
| `index.html` | Services, team, contact details, social links and portfolio cards |
| `script/data.js` | Project titles, descriptions and photographs |
| `css/styles.css` | Colors, fonts, spacing and mobile layout |
| `script/script.js` | Navigation, filters, animations and the contact form |
| `script/gallery.js` | Image viewer, keyboard controls and optional smaller images |
| `CNAME` | Your website domain; keep this file |
| `robots.txt`, `sitemap.xml` | Search crawler information |

You do not need to edit the last two JavaScript files when adding projects. The contact form opens a draft email addressed to `info@videsignsplc.com`.

## Preview and publish

Open the project through a local web server, such as your editor's Live Server. If Python is available, run this from the website folder:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000` and refresh after editing. Do not open the HTML directly with a `file://` address, because browser JavaScript modules need a web server.

The website works directly from its HTML, CSS, JavaScript and images. The optional local command `python script/build.py` creates a clean `dist/` copy for publishing and checks for missing files. That helper is ignored by Git and is not required to add projects or run the site.

`WEBTEMP/` contains unused website assets and old script backups. It is not used by the website. Local development tools and working files remain outside it. Git includes the website, this README and `CNAME`; it ignores local tools and backups.
