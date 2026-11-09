from render_universe_001 import *
from collections import Counter
from zipfile import ZipFile,ZIP_DEFLATED
cards=json.loads((ROOT/'reading-data/universe-letters.json').read_text('utf-8'))
assert Counter(c['element'] for c in cards)==dict(earth=21,water=21,fire=21,air=21,spirit=36)
dest=OUT/'final-png';dest.mkdir(exist_ok=True)
web=ROOT/'图片/宇宙来信簿';web.mkdir(exist_ok=True)
checks=[]
for c in cards:
 im,check=render(**c)
 assert ''.join(check['chineseLines'])==c['zh']
 assert ' '.join(check['englishLines'])==c['en']
 assert check['bodyTop']>300 and check['bodyBottom']<1150
 im.save(dest/f"{c['number']:03}.png",dpi=(300,300))
 im.save(web/f"{c['number']}.webp",quality=80,method=6)
 checks.append(check)
for page in range(4):
 sheet=Image.new('RGB',(1500,1350),'#eeeae4')
 for j,c in enumerate(cards[page*30:(page+1)*30]):
  thumb=Image.open(dest/f"{c['number']:03}.png");thumb.thumbnail((240,360))
  # 10 columns x 3 rows, enough resolution for composition review.
  thumb.thumbnail((145,218))
  sheet.paste(thumb,((j%10)*150,(j//10)*450))
 sheet.save(OUT/f'overview-{page+1}.jpg',quality=90)
assert all(hashlib.sha256((LIB/f).read_bytes()).hexdigest()==h for f,h in hashes.items())
(OUT/'batch-checks.json').write_text(json.dumps({'count':120,'size':[1024,1536],'backgroundResolution':'native','svgFilesUnchanged':True,'cards':checks},ensure_ascii=False,indent=2),'utf-8')
with ZipFile(OUT/'宇宙来信簿-120张PNG.zip','w',ZIP_DEFLATED) as z:
 for f in sorted(dest.glob('*.png')):z.write(f,f.name)
 z.write(ROOT/'reading-data/universe-letters.json','cards.json')
print('120 PNG + 120 WebP exported; all bounds and content checks passed.')
