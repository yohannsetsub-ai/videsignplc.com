"""Build the static website without a JavaScript toolchain: python script/build.py."""
from pathlib import Path
import shutil
import re

root = Path(__file__).resolve().parent.parent
output = root / 'dist'
# Only clear this generated output after verifying it resolves inside the project.
assert output.resolve() == root / 'dist' and not output.is_symlink()
if output.exists():
    shutil.rmtree(output)
output.mkdir(exist_ok=True)
shutil.copy2(root / 'index.html', output / 'index.html')
shutil.copytree(root / 'css', output / 'css')
# Ship referenced images only; unused originals need not slow down deployment.
references = (root / 'index.html').read_text(encoding='utf-8') + (root / 'script/data.js').read_text(encoding='utf-8')
images = set(re.findall(r'(images/[^"\n]+\.(?:webp|png|jpg))', references))
for name in sorted(images):
    source = root / name
    if not source.is_file():
        continue  # Preserve legacy absolute social metadata without fabricating assets.
    destination = output / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
(output / 'script').mkdir(exist_ok=True)
for name in ('script.js', 'data.js'):
    shutil.copy2(root / 'script' / name, output / 'script' / name)
print(f'Static site built at {output}')
