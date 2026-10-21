from pathlib import Path
from PIL import Image
import re,base64,io,json
root=Path('.');out=root/'图片/玄鸟';out.mkdir(exist_ok=True)
refs={};stats=[]
for p in (root/'output/原图备份/图片/已批准').iterdir():
 if p.suffix=='.png':
  im=Image.open(p);im.thumbnail((768,768) if 'coin' not in p.name else (384,384),Image.Resampling.LANCZOS)
  dst=out/(p.stem+'.webp');im.save(dst,'WEBP',quality=85,method=6)
 elif p.suffix=='.svg':
  text=p.read_text('utf-8')
  def shrink(m):
   im=Image.open(io.BytesIO(base64.b64decode(m[1])));im.thumbnail((768,768),Image.Resampling.LANCZOS)
   buf=io.BytesIO();im.save(buf,'WEBP',quality=86,method=6)
   return 'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
  text=re.sub(r'data:image/png;base64,([A-Za-z0-9+/=\s]+?)(?=["\'])',shrink,text)
  dst=out/(p.stem+'.svg');dst.write_text(text,'utf-8')
 else: continue
 refs['图片/已批准/'+p.name]=dst.as_posix();stats.append((p.name,p.stat().st_size,dst.stat().st_size))
for name in ['bird_ios.html','bird_themes.css','bird_materials.css','wish_themes.css','wish_ios.html']:
 p=root/name;text=p.read_text('utf-8')
 for old,new in refs.items():text=text.replace(old,new)
 p.write_text(text,'utf-8')
print(json.dumps(stats,ensure_ascii=False));print('TOTAL',sum(s[1] for s in stats),sum(s[2] for s in stats))
