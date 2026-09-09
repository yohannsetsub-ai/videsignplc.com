"""Check responsive image dimensions, public packaging, and archive exclusion.

Run after building: python tests/assets.py
Requires the development Pillow dependency in script/requirements.txt.
"""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'script'))
from PIL import Image
from build import public_files, local_asset
from optimize_images import gallery_sources, variant_path, VARIANTS
from image_assets import resolve_image, read_aliases


def main():
    originals = gallery_sources()
    original_bytes = thumbnail_bytes = small_bytes = medium_bytes = 0
    for source in originals:
        with Image.open(ROOT / resolve_image(source)) as original:
            original_size = original.size
        original_bytes += (ROOT / resolve_image(source)).stat().st_size
        for size, width in VARIANTS.items():
            variant = ROOT / resolve_image(variant_path(source, size))
            with Image.open(variant) as image:
                assert image.width == min(width, original_size[0]), variant
                assert abs(image.width / image.height - original_size[0] / original_size[1]) < 0.03, variant
            assert variant.is_file()
        thumbnail_bytes += (ROOT / resolve_image(variant_path(source, 'thumbnail'))).stat().st_size
        small_bytes += (ROOT / resolve_image(variant_path(source, 'small'))).stat().st_size
        medium_bytes += (ROOT / resolve_image(variant_path(source, 'medium'))).stat().st_size

    expected = {path.relative_to(ROOT).as_posix() for path in public_files()}
    actual = {path.relative_to(ROOT / 'dist').as_posix() for path in (ROOT / 'dist').rglob('*') if path.is_file()}
    assert expected == actual, 'The build must contain exactly the public file set'
    assert not any(path.startswith(('WEBTEMP/', 'archive/', '.tmp/', 'tests/', 'exports/')) for path in actual)
    assert not any(path.endswith(('.py', '.woff')) for path in actual)
    for duplicate, keeper in read_aliases().items():
        assert not (ROOT / duplicate).exists(), duplicate
        assert keeper in actual, keeper
    assert (ROOT / 'WEBTEMP/exports/VI-Designs-Logo.svg').is_file(), 'Preserve the standalone logo export'
    for path in ('../outside.webp', 'images/missing.webp'):
        try:
            local_asset(path)
        except ValueError:
            pass
        else:
            raise AssertionError(f'The build accepted an invalid asset: {path}')

    manifest = ROOT / 'WEBTEMP/archive/manifest.json'
    if manifest.exists():
        for record in json.loads(manifest.read_text(encoding='utf-8')):
            backup = ROOT / record['archive']
            assert backup.is_file() and backup.stat().st_size == record['bytes'], backup
    print(f'PASS: {len(originals)} originals, {len(originals) * 3} correctly sized variants, public files, build guards and archived backups.')
    print(json.dumps({'original_gallery_bytes': original_bytes, 'thumbnail_bytes': thumbnail_bytes,
                      'small_gallery_bytes': small_bytes, 'medium_gallery_bytes': medium_bytes}))


if __name__ == '__main__':
    main()
