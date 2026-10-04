"""Install approved card images with compact mobile WebP encoding."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
mapping = json.loads(Path(sys.argv[1]).read_text('utf-8'))
backup = Path(sys.argv[2])
backup.mkdir(parents=True, exist_ok=True)
folder = ROOT / '图片' / '万象字卡'
sizes = []
sheet = Image.new('RGB', (6 * 240, 7 * 264), '#eeeeee')
draw = ImageDraw.Draw(sheet)
for index, (number, source) in enumerate(sorted(mapping.items(), key=lambda item: int(item[0]))):
    target = folder / f'{number}.webp'
    if not (backup / target.name).exists():
        shutil.copy2(target, backup / target.name)
    image = Image.open(source).convert('RGB').resize((800, 800), Image.Resampling.LANCZOS)
    quality = 90
    while True:
        image.save(target, 'WEBP', quality=quality, method=6)
        if target.stat().st_size <= 200 * 1024 or quality <= 65:
            break
        quality -= 5
    assert Image.open(target).size == (800, 800)
    assert target.stat().st_size <= 200 * 1024
    sizes.append(target.stat().st_size)
    thumbnail = image.resize((240, 240), Image.Resampling.LANCZOS)
    x, y = index % 6 * 240, index // 6 * 264
    sheet.paste(thumbnail, (x, y))
    draw.text((x + 5, y + 242), number, fill='black')
sheet.save(backup / 'contact-sheet.jpg', quality=90)
print(json.dumps({'count': len(sizes), 'total_bytes': sum(sizes), 'max_bytes': max(sizes), 'backup': str(backup)}, ensure_ascii=False))
