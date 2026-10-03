"""Build the optional offline deck inventory after adding or replacing artwork."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build():
    groups = []
    for line in (ROOT / 'decks.js').read_text('utf-8').splitlines():
        if 'cardCount:' not in line:
            continue
        name = re.search(r"name: '([^']+)'", line).group(1)
        folder = re.search(r"path: '([^']+)'", line).group(1)
        count = int(re.search(r'cardCount: (\d+)', line).group(1))
        start = int(re.search(r'startAt: (\d+)', line).group(1))
        extension = re.search(r"format: '([^']+)'", line).group(1)
        back = re.search(r"back: '([^']+)'", line)
        files = [f'{folder}/{i}.{extension}' for i in range(start, start + count)]
        files.append(f'{folder}/back.{back.group(1) if back else extension}')
        groups.append({'id': str(len(groups)), 'name': name, 'files': files})
    text = (ROOT / 'reading_ios.html').read_text('utf-8')
    urls = set(re.findall(r"图片/四境塔罗/[^\s\"'<>)]*\.webp", text))
    for theme, name in [('mystic', '星紫'), ('noir', '黑白'), ('parchment', '珐琅'), ('dopamine', '雾糖')]:
        files = sorted(url for url in urls if re.search(rf'-{theme}(?:-v\d+)?\.webp$', url))
        groups.append({'id': theme, 'name': f'四境塔罗 · {name}', 'files': files})
    for group in groups:
        entries = []
        for url in group['files']:
            data = (ROOT / url).read_bytes()
            entries.append({'url': url, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        if not entries:
            raise ValueError(f'Empty deck: {group["name"]}')
        group['files'] = entries
        group['bytes'] = sum(entry['bytes'] for entry in entries)
    (ROOT / 'offline-library.json').write_text(json.dumps(groups, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print(f'{len(groups)} offline decks, {sum(len(g["files"]) for g in groups)} images')

if __name__ == '__main__':
    build()
