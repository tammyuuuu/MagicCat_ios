"""Convert all project PNG files to direct WebP URLs. Requires Pillow.
Originals are retained until the separate verified archive step.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
state_path = ROOT / 'webp-state.json'
state = json.loads(state_path.read_text('utf-8')) if state_path.exists() else {}
plan = []
changed = 0
for path in sorted(ROOT.rglob('*.png')):
    if '.git' in path.parts:
        continue
    source = path.relative_to(ROOT).as_posix()
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    record = state.get(source)
    target = ROOT / record['target'] if record else path.with_suffix('.webp')
    if not record and target.exists():
        target = path.with_name(path.stem + '-from-png.webp')
        if target.exists():
            raise RuntimeError(f'Output collision: {target}')
    if not record or record['sha256'] != digest or not target.exists():
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image)
            image.save(target, 'WEBP', quality=90, method=6)
        with Image.open(target) as result:
            result.verify()
        changed += 1
    state[source] = {'target': target.relative_to(ROOT).as_posix(), 'sha256': digest}
    plan.append({'relative': source, 'sha256': digest})
for page in ROOT.iterdir():
    if page.suffix not in {'.html', '.css', '.js', '.json'} or page.name in {'webp-state.json', 'png-archive-plan.json', 'pwa-art.js'}:
        continue
    content = page.read_text('utf-8')
    updated = content
    for original, record in state.items():
        updated = updated.replace(original, record['target'])
    if page.suffix in {'.html', '.json'}:
        updated = updated.replace('image/png', 'image/webp')
    if updated != content:
        page.write_text(updated, 'utf-8')
state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(ROOT / 'png-archive-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(ROOT / 'pwa-art.js').write_text('self.PWA_ART = {};\n', 'utf-8')
print(f'{len(plan)} PNG originals ready to archive; {changed} WebP files regenerated')
from build_offline_library import build
build()
