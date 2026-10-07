"""Match Noir paper tones to the existing back, preserving dark/color detail."""
import json
import shutil
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / '图片' / '四境塔罗'
OUT = ROOT / 'output' / 'noir-color'
BACKUP = OUT / 'originals'

def paper(array):
    rgb = array[..., :3].astype(float)
    h, w = rgb.shape[:2]
    border = np.zeros((h, w), bool)
    border[:max(1, h // 25)] = True
    border[-max(1, h // 25):] = True
    border[:, :max(1, w // 25)] = True
    border[:, -max(1, w // 25):] = True
    mask = border & (rgb.min(2) > 215) & (np.ptp(rgb, axis=2) < 35)
    if array.shape[2] == 4:
        mask &= array[..., 3] > 250
    pixels = rgb[mask]
    bins, counts = np.unique((pixels // 4).astype(int), axis=0, return_counts=True)
    dominant = bins[counts.argmax()]
    selected = pixels[np.all((pixels // 4).astype(int) == dominant, axis=1)]
    return np.median(selected, axis=0)

def main():
    apply = '--apply' in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    target = paper(np.asarray(Image.open(FOLDER / 'back-noir.webp').convert('RGBA')))
    files = sorted(FOLDER.glob('front-*-noir*.webp'))
    records = []
    sheet = Image.new('RGB', (8 * 160, 10 * 282), '#ddd8d0')
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(files):
        original = BACKUP / path.name
        source_path = original if original.exists() else path
        image = Image.open(source_path).convert('RGBA')
        a = np.asarray(image).copy()
        source = paper(a)
        rgb = a[..., :3].astype(float)
        distance = np.max(np.abs(rgb - source), axis=2)
        # Full correction near the paper tone; feather smoothly into shading.
        weight = np.clip((32 - distance) / 24, 0, 1)
        weight = weight * weight * (3 - 2 * weight)
        weight *= (rgb.min(2) > 210) & (np.ptp(rgb, axis=2) < 35) & (a[..., 3] > 250)
        changed = np.rint(np.clip(rgb + weight[..., None] * (target - source), 0, 255)).astype(np.uint8)
        result = a.copy()
        result[..., :3] = changed
        assert np.array_equal(result[..., 3], a[..., 3])
        assert np.array_equal(result[..., :3][rgb.min(2) <= 210], a[..., :3][rgb.min(2) <= 210])
        if apply:
            BACKUP.mkdir(parents=True, exist_ok=True)
            if not original.exists():
                shutil.copy2(path, original)
            Image.fromarray(result).save(path, 'WEBP', lossless=True, method=4)
            check = np.asarray(Image.open(path).convert('RGBA'))
            assert np.array_equal(check, result)
        before = image.convert('RGB').resize((80, 130))
        after = Image.fromarray(result).convert('RGB').resize((80, 130))
        x, y = index % 8 * 160, index // 8 * 282
        sheet.paste(before, (x, y))
        sheet.paste(after, (x + 80, y))
        draw.text((x + 3, y + 132), path.stem.replace('front-', '').replace('-noir', ''), fill='black')
        # Larger corrected thumbnail beneath each before/after pair.
        sheet.paste(Image.fromarray(result).convert('RGB').resize((80, 130)), (x + 40, y + 150))
        records.append({'file': path.name, 'before_rgb': source.tolist(), 'after_rgb': paper(result).tolist(), 'target_rgb': target.tolist(), 'changed_pixels': int(np.any(changed != a[..., :3], axis=2).sum())})
    sheet.save(OUT / 'comparison.jpg', quality=95)
    (OUT / 'report.json').write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'apply': apply, 'cards': len(records), 'target_rgb': target.tolist(), 'before_range': np.ptp(np.array([r['before_rgb'] for r in records]), axis=0).tolist(), 'after_range': np.ptp(np.array([r['after_rgb'] for r in records]), axis=0).tolist()}, ensure_ascii=False))

if __name__ == '__main__':
    main()
