"""Build the static website: python script/build.py.

Only public HTML, styles, browser scripts and referenced assets enter dist.
No Node installation is needed to build or serve the website.
"""

from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import re
import shutil
from image_assets import resolve_image

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"
GALLERY_SIZES = ("thumbnail", "small", "medium")


class AssetLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("img", "script") and attrs.get("src"):
            self.paths.add(attrs["src"])
        if tag == 'img' and attrs.get('srcset'):
            self.paths.update(candidate.strip().split()[0] for candidate in attrs['srcset'].split(','))
        if tag == 'meta' and (attrs.get('property') == 'og:image' or attrs.get('name') == 'twitter:image'):
            self.paths.add(urlsplit(attrs['content']).path)
        if tag == "link" and attrs.get("rel") != "canonical":
            self.paths.add(attrs["href"])


def local_asset(path, relative_to=ROOT):
    """Resolve a public reference and reject missing or out-of-project files."""
    url = urlsplit(path)
    if url.scheme or url.netloc or not url.path:
        return None
    source = (ROOT / unquote(url.path.lstrip("/")) if url.path.startswith("/")
              else relative_to / unquote(url.path)).resolve()
    if not source.is_relative_to(ROOT) or not source.is_file():
        raise ValueError(f"Missing or unsafe asset: {path}")
    return source


def public_files():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = AssetLinks()
    parser.feed(html)
    files = {ROOT / name for name in ("index.html", "robots.txt", "sitemap.xml", "CNAME")}
    files.update(filter(None, (local_asset(path) for path in parser.paths)))

    for stylesheet in (ROOT / "css").rglob("*.css"):
        files.add(stylesheet)
        for path in re.findall(r'url\([\"\']?([^\)\"\']+)', stylesheet.read_text(encoding="utf-8")):
            asset = local_asset(path, stylesheet.parent)
            if asset:
                files.add(asset)

    # Only browser modules belong in the public script directory.
    scripts = list((ROOT / "script").glob("*.js"))
    files.update(scripts)
    references = "\n".join(path.read_text(encoding="utf-8") for path in scripts if path.name != 'image-aliases.js')
    for path in set(re.findall(r'(images/[^\"\'\n]+\.(?:webp|png|jpg|svg))', references)):
        files.add(local_asset(resolve_image(path)))
        if path.startswith("images/gallery/large/"):
            for size in GALLERY_SIZES:
                files.add(local_asset(resolve_image(path.replace("images/gallery/large/", f"images/gallery/{size}/", 1))))

    for path in files:
        if not path.is_file():
            raise ValueError(f"Missing public file: {path.relative_to(ROOT)}")
    return files


def main():
    # Validate everything BEFORE clearing the previous successful output.
    files = public_files()
    if OUTPUT.resolve() != ROOT / "dist" or OUTPUT.is_symlink():
        raise ValueError("Refusing to replace an unsafe build directory")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    for source in sorted(files):
        destination = OUTPUT / source.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    size = sum(path.stat().st_size for path in files)
    print(f"Built {len(files)} public files ({size / 1_000_000:.2f} MB) in dist/")


if __name__ == "__main__":
    main()
