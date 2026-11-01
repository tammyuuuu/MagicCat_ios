"""Validate and atomically install the rendered portrait cards after review."""
import json
import os
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / '图片/宇宙力量卡/cards'
source = ROOT / 'output/cosmic-redesign/cards'
files = [source / f'{i}.webp' for i in range(140)]
files.append(ROOT / '图片/宇宙力量卡/design/back.webp')
for file in files:
    with Image.open(file) as image:
        assert image.size == (1024, 1536), file
for file in files:
    dest = target / file.name
    temporary = target / (file.name + '.new')
    if file.name == 'back.webp':
        with Image.open(file) as image:
            image.save(temporary, 'WEBP', quality=80, method=6)
    else:
        shutil.copyfile(file, temporary)
    os.replace(temporary, dest)
print(json.dumps({'installed': len(files), 'bytes': sum(p.stat().st_size for p in target.glob('*.webp'))}))
