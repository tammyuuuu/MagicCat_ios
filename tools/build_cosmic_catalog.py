"""Normalize the supplied source; explicit fixes fill its nine missing English entries."""
import ctypes
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reading-data/cosmic-source.txt'
GROUPS = [('earth', '地', 'EARTH', 20), ('water', '水', 'WATER', 19),
          ('fire', '火', 'FIRE', 21), ('wind', '风', 'WIND', 23),
          ('sound', '音', 'SOUND', 18), ('light', '光', 'LIGHT', 17),
          ('rainbow', '虹', 'RAINBOW', 22)]

def simplified(value):
    dest = ctypes.create_unicode_buffer(len(value) * 2 + 1)
    ctypes.windll.kernel32.LCMapStringEx('zh-CN', 0x02000000, value, len(value), dest, len(dest), None, None, 0)
    return dest.value.replace('於', '于')

def build():
    original = SOURCE.read_text('utf-8-sig')
    output = ROOT / 'output/cosmic-redesign'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'original-text.txt').write_text(original, 'utf-8')
    text = re.sub(r'(?<=[a-zA-Z.])(?=[\u4e00-\u9fff])', '\n', original)
    text = text.replace('@', '\n')
    blocks = re.split(r'(?:●\s*)?[地水火风音光虹] (?:EARTH|WATER|FIRE|WIND|SOUND|LIGHT|RAINBOW)[^\n]*', text)[1:]
    assert len(blocks) == 7
    cards = []
    fallbacks = []
    for group, block in zip(GROUPS, blocks):
        key, zh, en, count = group
        pairs = []
        for line in block.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.search('[\u4e00-\u9fff]', line):
                pairs.append({'zh': simplified(line), 'en': ''})
            else:
                assert pairs, line
                pairs[-1]['en'] = (pairs[-1]['en'] + ' ' + line).strip()
        assert len(pairs) == count, (key, len(pairs), count)
        for number, pair in enumerate(pairs, 1):
            index = len(cards)
            if not pair['en']:
                fallbacks.append(index)
            cards.append({'id': index, 'element': key, 'elementZh': zh, 'elementEn': en,
                          'number': number, 'count': count, **pair})
    # Correct obvious source/OCR English typos without changing any Chinese message.
    fixes = {3: 'Giving and receiving are equally important.', 12: 'Allow yourself to relax without feeling guilty.',
             36: 'You attract abundance by focusing on doing the things you love.',
             40: 'Face it with positivity and optimism.', 41: "Do not give up. Keep moving forward.",
             69: 'Your mission is to carry on my love for you.',
             78: 'Arrange a journey for yourself to discover and experience life beyond the everyday.',
             100: 'Forgive the actions and words that hurt you, making room for loving messages to enter your life.',
             109: 'See the uniqueness of every being through the eyes of love.'}
    for index, value in fixes.items():
        cards[index]['en'] = value
    cards[101]['en'] = 'Trust your intuition.'
    cards[139]['en'] = 'Be of service to others and you will be surprised by the positive energy returned to you.'
    cards[31]['zh'] = cards[31]['zh'].replace('完全全地', '完完全全地')
    for card in cards:
        card['en'] = card['en'].replace('earth..', 'earth.').replace('litsten', 'listen').replace('bee reborn', 'be reborn').replace('of property.', 'of properly.')
        assert card['en'], card['id']
    (ROOT / 'reading-data/cosmic.json').write_text(json.dumps(cards, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print(json.dumps({'count': len(cards), 'groups': [(x[0], x[3]) for x in GROUPS], 'missingEnglishRecovered': fallbacks}))

if __name__ == '__main__':
    build()
