"""Build the user-approved centerline family and render the actual SVGs for QA."""
from pathlib import Path
import sys, json, io, hashlib, shutil
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.render-deps'))
import resvg_py

W = 1.9
# Centerlines redesigned from the approved V4 style. No outline-stroke patching.
# Tuple: slug, Chinese name, paths, circles (cx, cy, radius).
SPECS = [
 ('aries','白羊座',[
  'M16 27 C16 20 15 8 11 6 C6 3 3 7 5 11 C6 13 9 13 10 11',
  'M16 27 C16 20 17 8 21 6 C26 3 29 7 27 11 C26 13 23 13 22 11'],[]),
 ('taurus','金牛座',['M5 4 C6 10 11 11 16 11 C21 11 26 10 27 4'],[(16,19.5,8.5)]),
 ('gemini','双子座',['M6 4 Q16 8 26 4','M6 28 Q16 24 26 28','M10 5.3 V26.7','M22 5.3 V26.7'],[]),
 ('cancer','巨蟹座',['M5 10 C10 5 22 5 26 11','M27 22 C22 27 10 27 6 21'],[(22,13,4),(10,19,4)]),
 ('leo','狮子座',['M10 22 C14 19 9 13 10 8 C11 2 20 3 21 9 C22 13 18 18 18 23 C18 28 24 29 27 24'],[(6.5,22,3.5)]),
 ('virgo','处女座',[
  'M4 6 Q6 8 6 12 V24','M6 12 C8 5 12 4 12 11 V24',
  'M12 12 C14 5 18 4 18 11 V23 C18 26 19 28 21 29',
  'M18 14 C20 8 23 8 24 13 C26 20 20 25 14 27'],[]),
 ('libra','天秤座',['M4 21 H10 C4 14 9 7 16 7 C23 7 28 14 22 21 H28','M4 27 H28'],[]),
 ('scorpio','天蝎座',[
  'M4 6 Q6 8 6 12 V25','M6 12 C8 5 12 4 12 11 V25',
  'M12 12 C14 5 18 4 18 11 V21 Q18 25 22 25 H27','M23 21 L27 25 L23 29'],[]),
 ('sagittarius','射手座',['M6 26 L26 6','M15 6 H26 V17','M8.5 15.5 L16.5 23.5'],[]),
 ('capricorn','摩羯座',[
  'M4 7 C8 7 9 11 9 21 V22','M9 17 C11 12 13 7 16 5 C18 7 18 10 18 14 V18 C18 23 21 25 25 24 C29 23 29 19 26 18 C22 16 19 22 17 25 Q14 29 11 29'],[]),
 ('aquarius','水瓶座',[
  'M4 13 L9.4 9.4 Q10 9 10.4 9.8 L11.6 12.2 Q12 13 12.7 12.5 L17.4 9.4 Q18 9 18.4 9.8 L19.6 12.2 Q20 13 20.7 12.5 L25.4 9.4 Q26 9 26.4 9.8 L28 13',
  'M4 23 L9.4 19.4 Q10 19 10.4 19.8 L11.6 22.2 Q12 23 12.7 22.5 L17.4 19.4 Q18 19 18.4 19.8 L19.6 22.2 Q20 23 20.7 22.5 L25.4 19.4 Q26 19 26.4 19.8 L28 23'],[]),
 ('pisces','双鱼座',['M7 4 C15 12 15 20 7 28','M25 4 C17 12 17 20 25 28','M5 16 H27'],[]),
 ('sun','太阳',[],[(16,16,10.7)]),
 ('moon','月亮',['M22 4 C9 4 3 18 12 26 C15 28 19 29 23 27 C14 24 12 13 22 4 Z'],[]),
 ('mercury','水星',['M8 4 C8 12 24 12 24 4','M16 23 V29','M11.5 26 H20.5'],[(16,16,6.5)]),
 ('venus','金星',['M16 19 V29','M11 25 H21'],[(16,11.5,7.5)]),
 ('mars','火星',['M18.5 13.5 L27 5','M18 5 H27 V14'],[(12.5,19.5,8.5)]),
 ('jupiter','木星',['M5 12 C5 4 15 3 15 11 C15 17 10 21 5 21 H27','M22 5 V29'],[]),
 ('saturn','土星',['M11 4 V28','M6 8 H19','M11 18 C13 11 23 11 23 18 C23 22 18 25 22 29'],[]),
 ('uranus','天王星',['M6 5 V20','M26 5 V20','M6 12 H26','M16 5 V22'],[(16,25.5,3.5)]),
 ('neptune','海王星',['M16 4 V29','M6 6 V12 C6 22 26 22 26 12 V6','M11 26 H21','M3 9 L6 6 L9 9','M13 7 L16 4 L19 7','M23 9 L26 6 L29 9'],[]),
 ('pluto','冥王星',['M5 12 C5 25 27 25 27 12','M16 22 V29','M11 26 H21'],[(16,10,5)]),
]

def svg_for(spec):
 slug, label, paths, circles = spec
 shapes = ''.join(f'<path d="{d}"/>' for d in paths)
 shapes += ''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y,r in circles)
 if slug == 'sun':
  shapes += '<circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/>'
 return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" '
  f'fill="none" stroke="currentColor" stroke-width="{W}" stroke-linecap="round" '
  f'stroke-linejoin="round" role="img" aria-label="{label}">{shapes}</svg>\n')

def render(svg, size):
 return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg, width=size,
  height=size, style_sheet='svg { color: #303544; }', skip_system_fonts=True))).convert('RGBA')

def main():
 backup=ROOT/'original-svg-backup'
 assert len(list(backup.glob('*.svg'))) == 22
 # Preserve the pre-rollout family separately from the upstream originals.
 previous=ROOT/'pre-centerline-backup'
 previous.mkdir(exist_ok=True)
 for f in ROOT.glob('*.svg'):
  if not (previous/f.name).exists(): shutil.copy2(f,previous/f.name)
 qa=ROOT/'qa-v5';qa.mkdir(exist_ok=True)
 report=[];svgs={}
 for spec in SPECS:
  slug=spec[0];svg=svg_for(spec);svgs[slug]=svg
  ET.fromstring(svg)
  (ROOT/(slug+'.svg')).write_text(svg,encoding='utf-8')
  for size in (16,24,32):
   im=render(svg,size);box=im.getchannel('A').getbbox()
   assert box and box[0]>0 and box[1]>0 and box[2]<size and box[3]<size, (slug,size,box)
   im.save(qa/f'{slug}-{size}.png')
   report.append({'symbol':slug,'size':size,'alpha_bbox':box,'edge_clear':True})
 fontpath='C:/Windows/Fonts/msyh.ttc'
 title=ImageFont.truetype(fontpath,25);font=ImageFont.truetype(fontpath,18);small=ImageFont.truetype(fontpath,13)
 for page, subset in enumerate((SPECS[:12],SPECS[12:])):
  rows=(len(subset)+3)//4
  sheet=Image.new('RGB',(1120,100+rows*234),'#f3f1ec');d=ImageDraw.Draw(sheet)
  d.text((24,18),'V5 · '+('十二星座' if page==0 else '十行星')+' · 中心线符号',font=title,fill='#303544')
  d.text((24,56),'32 单位画布 / 1.9 线宽 / 圆形端点 / 16、24、32px 实际 SVG 渲染',font=small,fill='#667080')
  for i,spec in enumerate(subset):
   x=16+(i%4)*278;y=92+(i//4)*234
   d.rounded_rectangle((x,y,x+266,y+220),radius=12,fill='white')
   sheet.paste(render(svgs[spec[0]],64),(x+101,y+12),render(svgs[spec[0]],64))
   d.text((x+16,y+83),spec[1],font=font,fill='#303544')
   d.text((x+16,y+110),spec[0],font=small,fill='#667080')
   for j,size in enumerate((16,24,32)):
    xx=x+40+j*78;yy=y+160-size//2;im=render(svgs[spec[0]],size)
    sheet.paste(im,(xx-size//2,yy),im)
    d.text((xx-16,y+187),f'{size}px',font=small,fill='#667080')
  sheet.save(qa/('zodiac-v5.png' if page==0 else 'planets-v5.png'))
 cards=''
 for spec in SPECS:
  slug,cn,*_=spec;svg=svgs[slug]
  cards+=f'<article><div class="hero">{svg}</div><h2>{cn}</h2><small>{slug}</small><div class="sizes">'
  for size in (16,24,32):cards+=f'<div><span style="width:{size}px;height:{size}px">{svg}</span><p>{size}px</p></div>'
  cards+='</div></article>'
 html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>V5 · 22 个占星中心线符号</title><style>
 body{font:15px system-ui;margin:0;background:#f3f1ec;color:#303544}main{max-width:1120px;margin:auto;padding:28px}h1{font-size:28px}header p{line-height:1.7;color:#667080}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}article{padding:22px;background:white;border-radius:12px;text-align:center}.hero svg{width:72px;height:72px}h2{font-size:19px;margin:10px 0 3px}small{color:#667080}.sizes{display:flex;align-items:end;justify-content:center;gap:28px;margin-top:24px}.sizes span{display:block;margin:auto}.sizes svg{width:100%;height:100%}.sizes p{font-size:12px;color:#667080;margin-bottom:0}button{padding:8px 14px;border:1px solid #ccc;border-radius:8px;background:white;color:#303544}body.dark{background:#151922;color:#dce0ed}.dark article{background:#242a36}.dark small,.dark .sizes p{color:#afb9cd}
 </style><main><header><h1>V5 · 占星中心线符号库</h1><p>12 星座 · 10 行星 / 统一 1.9 线宽 / 圆形端点与转角<br>水瓶座已柔化折角；天王星 H 形；冥王星圆、弧、十字。</p><button onclick="document.body.classList.toggle('dark')">切换深浅背景</button></header><div class="grid">'''+cards+'</div></main></html>'
 for filename in ('preview.html','preview-centerline-v5.html'):(ROOT/filename).write_text(html,encoding='utf-8')
 (qa/'render-checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 (ROOT/'manifest-v5.json').write_text(json.dumps({'version':5,'viewBox':'0 0 32 32','strokeWidth':W,'symbols':[{'id':s[0],'name':s[1],'file':s[0]+'.svg'} for s in SPECS]},ensure_ascii=False,indent=2),encoding='utf-8')
 print('Generated 22 SVGs, 66 actual SVG renders, 2 contact sheets; edge checks passed.')

if __name__=='__main__':main()
