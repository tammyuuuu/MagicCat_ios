"""Normalize each theme's background against its own back, retaining shading."""
import argparse
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / '图片' / '四境塔罗'
THEMES = ('mystic', 'parchment', 'dopamine')

def background(a):
    h, w = a.shape[:2]
    border = np.zeros((h, w), bool)
    border[:h // 25] = border[-h // 25:] = True
    border[:, :w // 25] = border[:, -w // 25:] = True
    pixels = a[..., :3][border & (a[..., 3] > 250)].astype(np.int32)
    q = pixels // 4
    codes = q[:, 0] * 4096 + q[:, 1] * 64 + q[:, 2]
    bins, counts = np.unique(codes, return_counts=True)
    return np.median(pixels[codes == bins[counts.argmax()]], axis=0)

def run(theme, apply):
    out = ROOT / 'output' / (theme + '-color')
    backup = out / 'originals'
    out.mkdir(parents=True, exist_ok=True)
    target = background(np.asarray(Image.open(FOLDER / f'back-{theme}.webp').convert('RGBA')))
    paths = sorted(FOLDER.glob(f'front-*-{theme}*.webp'))
    sheet = Image.new('RGB', (8 * 200, 10 * 180), '#ddd8d0')
    draw = ImageDraw.Draw(sheet)
    records = []
    for i, path in enumerate(paths):
        original = backup / path.name
        image = Image.open(original if original.exists() else path).convert('RGBA')
        a = np.asarray(image).copy()
        source = background(a)
        rgb = a[..., :3].astype(np.float32)
        distance = np.max(np.abs(rgb - source), axis=2)
        weight = np.clip((28 - distance) / 20, 0, 1)
        weight = weight * weight * (3 - 2 * weight)
        weight *= a[..., 3] > 250
        result = a.copy()
        result[..., :3] = np.rint(np.clip(rgb + weight[..., None] * (target - source), 0, 255)).astype(np.uint8)
        untouched = weight == 0
        assert np.array_equal(result[untouched], a[untouched])
        assert np.array_equal(result[..., 3], a[..., 3])
        if apply:
            backup.mkdir(parents=True, exist_ok=True)
            if not original.exists():
                shutil.copy2(path, original)
            Image.fromarray(result).save(path, 'WEBP', lossless=True, method=4)
            assert np.array_equal(np.asarray(Image.open(path).convert('RGBA')), result)
        x, y = i % 8 * 200, i // 8 * 180
        sheet.paste(image.convert('RGB').resize((100, 160)), (x, y))
        sheet.paste(Image.fromarray(result).convert('RGB').resize((100, 160)), (x + 100, y))
        draw.text((x + 2, y + 163), path.stem.replace('front-', '').replace('-' + theme, ''), fill='black')
        records.append({'file': path.name, 'before_rgb': source.tolist(), 'after_rgb': background(result).tolist(), 'target_rgb': target.tolist(), 'changed_pixels': int(np.any(a != result, axis=2).sum()), 'untouched_pixels': int(untouched.sum())})
    sheet.save(out / 'comparison.jpg', quality=95)
    (out / 'report.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'theme': theme, 'applied': apply, 'count': len(records), 'target': target.tolist(), 'before_max_error': max(max(abs(np.array(r['before_rgb']) - target)) for r in records), 'after_max_error': max(max(abs(np.array(r['after_rgb']) - target)) for r in records)}, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--theme', choices=THEMES)
    args = parser.parse_args()
    for theme in (args.theme,) if args.theme else THEMES:
        run(theme, args.apply)
