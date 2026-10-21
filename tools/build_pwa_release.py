"""Seal the PWA release manifest after changing published code or data."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build(check=False):
    worker = ROOT / 'sw.js'
    source = worker.read_text('utf-8')
    block = source.split('const CORE = [', 1)[1].split('].map(path', 1)[0]
    paths = re.findall(r"'([^']+)'", block)
    paths += [f'reading-data/{pack}.json' for pack in ['waite', 'lenormand', 'theme']]
    hashes = {}
    for path in paths:
        file = ROOT / path.split('?')[0]
        data = file.read_bytes()
        if file.suffix in ['.html', '.js', '.css', '.json']:
            data = data.replace(b'\r\n', b'\n')
        hashes[path] = hashlib.sha256(data).hexdigest()
    template = re.sub(r"const RELEASE_TAG = '[^']*';", "const RELEASE_TAG = '';", source)
    template = re.sub(r'const RELEASE_HASHES = .*?;', 'const RELEASE_HASHES = {};', template)
    tag = hashlib.sha256((template + json.dumps(hashes, sort_keys=True)).encode()).hexdigest()[:16]
    result = re.sub(r"const RELEASE_TAG = '[^']*';", f"const RELEASE_TAG = '{tag}';", source)
    result = re.sub(r'const RELEASE_HASHES = .*?;', lambda _: 'const RELEASE_HASHES = ' + json.dumps(hashes, ensure_ascii=False, separators=(',', ':')) + ';', result)
    if check:
        if result != source:
            raise SystemExit('发布清单已过期，请运行 python tools/build_pwa_release.py')
    else:
        worker.write_text(result, 'utf-8')
    print(f'PWA release {tag}: {len(hashes)} verified resources')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
