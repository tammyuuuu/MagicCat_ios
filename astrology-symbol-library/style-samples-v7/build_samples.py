"""Four slender-structure proposals; the production SVG library stays unchanged."""
from pathlib import Path
import sys, io, json, hashlib, shutil
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

P=Path(__file__).resolve().parent
ROOT=P.parent
sys.path.insert(0,str(ROOT/'.render-deps'))
import resvg_py

SAMPLES=[
 ('libra','天秤座','收窄横向展开，抬高拱顶，增加纵向张力。',[
  'M7.5 22 H12 C8.7 18.5 10 5 16 5 C22 5 23.3 18.5 20 22 H24.5',
  'M7.5 28 H24.5'],[]),
 ('taurus','金牛座','圆环保持正圆；双角向上舒展，重心更挺拔。',[
  'M8 4 C8.4 10.8 10.4 14 16 14 C21.6 14 23.6 10.8 24 4'],[(16,21,7)]),
 ('aquarius','水瓶座','缩短横向跨度，拉开上下层次，折线更清劲。',[
  'M7 13.5 L11.2 7.3 Q11.55 6.8 11.75 7.4 L13.3 12.7 Q13.5 13.25 13.85 12.8 L18.05 7.3 Q18.4 6.8 18.6 7.4 L20.2 12.7 Q20.4 13.25 20.75 12.8 L25 7.2',
  'M7 25.5 L11.2 19.3 Q11.55 18.8 11.75 19.4 L13.3 24.7 Q13.5 25.25 13.85 24.8 L18.05 19.3 Q18.4 18.8 18.6 19.4 L20.2 24.7 Q20.4 25.25 20.75 24.8 L25 19.2'],[]),
 ('pisces','双鱼座','弧线收窄并延长，保留中央横梁和两侧开口。',[
  'M9 3.5 C12 7.5 13.4 11.5 13.4 16 C13.4 20.5 12 24.5 9 28.5',
  'M23 3.5 C20 7.5 18.6 11.5 18.6 16 C18.6 20.5 20 24.5 23 28.5',
  'M8 16 H24'],[]),
]
def make_svg(spec):
 slug,cn,note,paths,circles=spec
 body=''.join(f'<path d="{d}"/>' for d in paths)
 body+=''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y,r in circles)
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="{cn}">{body}</svg>\n'
def render(svg,size,color='#303544'):
 return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg,width=size,height=size,
  style_sheet=f'svg {{ color: {color}; }}',skip_system_fonts=True))).convert('RGBA')

def main():
 original_hashes={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in ROOT.glob('*.svg')}
 before=P/'before-v6';before.mkdir(exist_ok=True)
 qa=P/'renders';qa.mkdir(exist_ok=True)
 fontpath='C:/Windows/Fonts/msyh.ttc'
 heading=ImageFont.truetype(fontpath,26);font=ImageFont.truetype(fontpath,18);small=ImageFont.truetype(fontpath,13)
 image=Image.new('RGB',(1120,1196),'#f3f1ec');d=ImageDraw.Draw(image)
 d.text((26,20),'V7 · 瘦金体气质 / 四符号比例样本',font=heading,fill='#303544')
 d.text((26,61),'左：V6 修改前     右：V7 重新设计     /     16、24、32px 为实际 SVG 渲染',font=small,fill='#667080')
 records=[];cards=''
 for index,spec in enumerate(SAMPLES):
  slug,cn,note,*_=spec;old=(ROOT/(slug+'.svg')).read_text(encoding='utf-8');new=make_svg(spec)
  (before/(slug+'.svg')).write_text(old,encoding='utf-8');(P/(slug+'.svg')).write_text(new,encoding='utf-8')
  y=99+index*270
  d.text((26,y),cn,font=font,fill='#303544');d.text((130,y+3),note,font=small,fill='#667080')
  cards+=f'<section><h2>{cn}</h2><p>{note}</p><div class="pair">'
  for col,(version,svg) in enumerate((('V6',old),('V7',new))):
   x=22+col*552;yy=y+35
   d.rounded_rectangle((x,yy,x+530,yy+210),radius=10,fill='white')
   d.text((x+20,yy+13),version+(' · 修改前' if col==0 else ' · 修长结构提案'),font=small,fill='#667080')
   im=render(svg,88);image.paste(im,(x+24,yy+59),im)
   cards+=f'<article><h3>{version} '+('修改前' if col==0 else '修长结构提案')+f'</h3><div class="hero">{svg}</div><div class="sizes">'
   for j,size in enumerate((16,24,32)):
    im=render(svg,size);bbox=im.getchannel('A').getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<size and bbox[3]<size,(slug,version,size,bbox)
    im.save(qa/f'{slug}-{version}-{size}.png')
    # Check a second color on dark ground through actual SVG rendering.
    render(svg,size,'#e0e4ef').save(qa/f'{slug}-{version}-{size}-light.png')
    records.append({'symbol':slug,'version':version,'size':size,'bounds':bbox,'edge_clear':True})
    xx=x+200+j*112;image.paste(im,(xx-size//2,yy+102-size//2),im)
    d.text((xx-17,yy+147),f'{size}px',font=small,fill='#667080')
    cards+=f'<div><span style="width:{size}px;height:{size}px">{svg}</span><small>{size}px</small></div>'
   cards+='</div></article>'
  cards+='</div></section>'
 image.save(P/'before-after-v7.png')
 html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>V7 · 四符号前后对照</title><style>
 body{margin:0;font:15px system-ui;background:#f3f1ec;color:#303544}main{max-width:1120px;margin:auto;padding:28px}header p,section>p{color:#667080;line-height:1.8}h1{font-size:27px}h2{font-size:21px;margin-bottom:6px}h3{font-size:14px;font-weight:500;color:#667080}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}article{background:white;border-radius:12px;padding:22px}.hero svg{width:88px;height:88px}.sizes{display:flex;gap:48px;align-items:end;margin-top:18px}.sizes span{display:block;margin:auto}.sizes svg{width:100%;height:100%}small{display:block;margin-top:10px;color:#667080}section{margin-top:30px}button{padding:9px 15px;background:white;border:1px solid #ccc;border-radius:8px}body.dark{background:#151922;color:#e0e4ef}.dark article{background:#242a36}.dark p,.dark h3,.dark small{color:#b8bfce}@media(max-width:600px){main{padding:16px}.pair{gap:8px}article{padding:14px}.sizes{gap:16px}h1{font-size:23px}}
 </style><main><header><h1>V7 · 瘦金体气质 / 四符号前后对照</h1><p>清劲、挺拔、收敛。此次从结构比例入手，保留标准辨识特征；圆环保持正圆，无横向压扁。<br>左为 V6；右为 V7 样本。新版使用 1.4 线宽与细小圆端点，曲线单独设计，未使用整体非等比缩放。</p><button onclick="document.body.classList.toggle('dark')">切换深浅背景</button></header>'''+cards+'</main></html>'
 (P/'preview-before-after-v7.html').write_text(html,encoding='utf-8')
 (P/'render-checks.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
 assert original_hashes=={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in ROOT.glob('*.svg')}
 print('4 samples; 24 size/version renders checked; 48 PNGs including light-color variant. Production SVGs unchanged.')
if __name__=='__main__':main()
