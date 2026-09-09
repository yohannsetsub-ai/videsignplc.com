# VI Designs website

A static HTML, CSS and JavaScript portfolio. No framework, runtime packages, database, or external font service is required. The existing Caviar Dreams font, logo, layout and interactions are preserved.

## Unused website files

`WEBTEMP/` contains only website assets that are not used on the page: `archive/` holds old images, fonts and original card-image backups, and `exports/` holds your standalone logo export. Development tools and working files remain in their existing locations outside `WEBTEMP/`.

The active website files stay in `index.html`, `css/`, `images/` and `script/`. The public build excludes `WEBTEMP/` entirely.

## Build and preview

```sh
python script/build.py
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Rebuild after edits. Publish **only `dist/`**, which excludes backups, development tools and tests. Use an HTTP server; opening `index.html` directly does not support ES modules.

The build validates every referenced image and font before replacing the previous output. A missing gallery variant means you need to run the image command below.

## Where to make changes

| File or folder                       | What it controls                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `index.html`                         | Page text, team, services, portfolio cards, contact details, social links and SEO metadata                |
| `css/styles.css`                     | Design, with labeled sections for navigation, studio, team, portfolio, gallery, footer and mobile layouts |
| `css/fonts/CaviarDreams/`            | The original local regular and bold fonts                                                                 |
| `script/script.js`                   | Navigation, transitions, search, filters and contact form                                                 |
| `script/gallery.js`                  | Project images, thumbnails, keyboard/swipe controls and full-screen viewer                                |
| `script/data.js`                     | Project titles, descriptions, original image paths and virtual-tour links                                 |
| `script/image-paths.js`              | Paths and responsive image selection                                                                      |
| `script/optimize_images.py`          | Generates smaller gallery copies from the original photographs                                            |
| `script/image-sizes.js`              | Generated dimensions; do not edit manually                                                                |
| `images/gallery/large/`                      | Full-screen originals, retained at their existing quality                                                 |
| `images/gallery/`                    | Generated thumbnail, small and medium display copies, plus full-size originals in large/                                                       |
| `script/image-aliases.js`             | Generated map allowing identical image paths to share one physical file |
| `script/image_assets.py`              | Moves exact duplicate images into WEBTEMP and maintains the shared paths |
| `WEBTEMP/exports/VI-Designs-Logo.svg`        | Your standalone logo file, separate from the website                                                      |
| `CNAME`, `robots.txt`, `sitemap.xml` | Public domain and search crawler information                                                              |

For colors, start with `:root` at the top of `styles.css`. The logo orange is `#f68b1f`; SVG icon files also contain this fill color. Keep both in sync if the brand changes. The hero cut calculation is documented beside its `ResizeObserver` in `script.js`.

## Add or change a project

1. Add its full-size WebP photographs under `images/gallery/large/`.
2. Add or edit its entry in `script/data.js`, keeping image paths inside quotes.
3. Add or edit the matching card in `index.html`. Its `href="#work-16"` must match a `work16` data entry. Cards also set the project navigation order. Use `Office`, `Residential` or `Hospitality` for `data-category`.
4. Use the first gallery image as the card cover. Point its `src` at that image's small display copy and its `srcset` at the small and medium copies, using actual widths. If a generated path is listed in `script/image-aliases.js`, use the retained path. There is no separate `works-thumbnail` folder.
5. Generate the display images, then build:

```sh
python -m pip install -r script/requirements.txt
python script/optimize_images.py
python script/build.py
```

Pillow is used only for development. Generated images and the dimension file are kept with the source so ordinary builds need only Python. The image script skips unchanged photographs and never crops or upscales them. Small and medium gallery variants are capped at 768 and 1440 pixels; thumbnails at 192 pixels. Full-screen viewing loads the original only when needed.

## Local archive

`WEBTEMP/archive/` holds unused images, obsolete font files and original portfolio-card backups. It is ignored by Git and excluded from the public build. Its `manifest.json` records original paths, backup paths, sizes and reasons. Restore a file by copying it back to the original path.

`duplicate-images/` contains byte-identical copies that now share one active file. `portfolio-thumbnails/` contains the former separate portfolio covers; every card now reuses its project's first gallery image. The different display sizes that are still needed remain in `images/gallery/`.

Run `python script/image_assets.py` to consolidate exact duplicates after adding images. The image optimizer also does this automatically. Keep `script/image-aliases.js` with the website: it is used by the gallery and build, and prevents archived paths from becoming broken image requests.

Ignored files stay on this computer; a fresh clone will not contain the archive. Moving previously tracked assets appears as deletions in Git, while their local backups remain safe. Git history is unchanged.

## Checks and formatting

Node is optional and is used only for development checks:

```sh
npm ci
npm test
npm run format:check
python tests/assets.py
```

Use `npm run format` for consistent indentation. The JavaScript tests cover real modules in a simulated DOM: lazy loading, slow navigation, retry, all current projects, gallery controls, filters, menu, reduced motion, form constraints and metadata. The Python check verifies image dimensions, backups and public output. These checks do not measure browser rendering or real network speed.

## SEO and contact

The canonical domain follows `CNAME`: `https://www.videsignsplc.com/`. If the domain changes, update the canonical, structured data, sharing URLs, robots file and sitemap together. The site includes a description and LocalBusiness structured data with existing contact details. Sharing metadata uses the existing PNG logo.

Existing `#work-1` links continue to work. They are sections of one website document, so the sitemap lists the homepage only. Separately indexed project pages would require a future move to real page URLs and static project HTML. Search rankings and live loading scores have not been measured here.

The contact form prepares an email to `info@videsignsplc.com` in the visitor's email application. It does not send or store messages on a server. Mailbox provisioning and delivery are managed separately by the domain's email provider.
