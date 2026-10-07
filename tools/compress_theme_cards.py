"""Encode the current, corrected theme cards within a strict 200,000-byte cap."""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
import argparse
import time
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / '图片' / '四境塔罗'
THEMES = ('mystic', 'noir', 'parchment', 'dopamine')
LIMIT = 200_000
TARGET_SIZE = None

def compress(path):
    original_bytes = path.stat().st_size
    with Image.open(path) as source:
        image = source.copy()
    if TARGET_SIZE and image.size != TARGET_SIZE:
        image = image.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        resized = True
    else:
        resized = False
    if original_bytes <= LIMIT and not resized:
        return {'file': path.name, 'before_bytes': original_bytes, 'bytes': original_bytes, 'quality': None, 'size': list(image.size)}
    quality = 90
    def encode(q):
        stream = BytesIO()
        image.save(stream, 'WEBP', quality=q, method=4)
        return stream.getvalue()
    data = encode(quality)
    if len(data) > LIMIT:
        low, high = 1, 89
        best = None
        while low <= high:
            mid = (low + high) // 2
            candidate = encode(mid)
            if len(candidate) <= LIMIT:
                quality, best = mid, candidate
                low = mid + 1
            else:
                high = mid - 1
        if best is None:
            raise RuntimeError(f'Cannot fit {path.name} without resizing')
        data = best
    with Image.open(BytesIO(data)) as check:
        assert check.size == image.size
        check.load()
    assert len(data) <= LIMIT
    temporary = path.with_suffix('.webp.tmp')
    temporary.write_bytes(data)
    for attempt in range(10):
        try:
            temporary.replace(path)
            break
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(0.3)
    return {'file': path.name, 'before_bytes': original_bytes, 'bytes': len(data), 'quality': quality, 'size': list(image.size)}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--size', nargs=2, type=int, metavar=('WIDTH', 'HEIGHT'))
    args = parser.parse_args()
    if args.size:
        TARGET_SIZE = tuple(args.size)
    paths = sorted(p for p in FOLDER.glob('*.webp') if any(p.name.startswith(('front-', 'back-')) and (f'-{t}.' in p.name or f'-{t}-' in p.name) for t in THEMES))
    out = ROOT / 'output' / 'theme-color'
    out.mkdir(parents=True, exist_ok=True)
    records = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        for record in executor.map(compress, paths):
            records.append(record)
            if len(records) % 40 == 0:
                print(f'Compressed {len(records)}/{len(paths)}', flush=True)
    (out / 'compression-report.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'count': len(records), 'max_bytes': max(r['bytes'] for r in records), 'total_MB': round(sum(r['bytes'] for r in records) / 1e6, 2), 'min_quality': min((r['quality'] for r in records if r['quality'] is not None), default=None)}, ensure_ascii=False), flush=True)
