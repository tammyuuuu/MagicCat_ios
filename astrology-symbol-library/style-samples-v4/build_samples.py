from pathlib import Path
import json, math, xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
P=Path(__file__).resolve().parent
W=1.8
specs=[('aquarius','水瓶座','Aquarius',['M4 13 L10 9 L12 13 L18 9 L20 13 L26 9 L28 13','M4 23 L10 19 L12 23 L18 19 L20 23 L26 19 L28 23'],[]),('pisces','双鱼座','Pisces',['M7 4 C15 12 15 20 7 28','M25 4 C17 12 17 20 25 28','M5 16 H27'],[]),('sun','太阳','Sun',[],[(16,16,10.7)]),('sagittarius','射手座','Sagittarius',['M6 26 L26 6','M15 6 H26 V17','M8.5 15.5 L16.5 23.5'],[])]
for slug,cn,en,paths,circles in specs:
 body=''.join(f'<path d="{d}"/>' for d in paths)+''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y,r in circles)
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="{W}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="{en}">{body}'+('<circle cx="16" cy="16" r="1.45" fill="currentColor" stroke="none"/>' if slug=='sun' else '')+'</svg>'
 (P/(slug+'.svg')).write_text(svg,encoding='utf-8')
class Pen(BasePen):
 def __init__(self):super().__init__(None);self.lines=[];self.line=[]
 def _moveTo(self,p):self.line=[p];self.lines.append(self.line)
 def _lineTo(self,p):self.line.append(p)
 def _curveToOne(self,a,b,c):
  o=self.line[-1]
  for i in range(1,81):
   t=i/80;u=1-t;self.line.append((u**3*o[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t**3*c[0],u**3*o[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t**3*c[1]))
 def _closePath(self):self.line.append(self.line[0])
 def _endPath(self):pass
def render(spec,size):
 slug,cn,en,paths,circles=spec;ss=8;k=size*ss/32;im=Image.new('RGB',(size*ss,size*ss),'white');d=ImageDraw.Draw(im);color='#303544';r=W*k/2
 for path in paths:
  pen=Pen();parse_path(path,pen)
  for line in pen.lines:
   pts=[(x*k,y*k) for x,y in line];d.line(pts,fill=color,width=round(W*k),joint='curve')
   for x,y in pts:d.ellipse((x-r,y-r,x+r,y+r),fill=color)
 for x,y,rad in circles:d.ellipse(((x-rad)*k,(y-rad)*k,(x+rad)*k,(y+rad)*k),outline=color,width=round(W*k))
 if slug=='sun':d.ellipse((14.55*k,14.55*k,17.45*k,17.45*k),fill=color)
 return im.resize((size,size),Image.Resampling.LANCZOS)
canvas=Image.new('RGB',(960,680),'#f3f1ec');d=ImageDraw.Draw(canvas)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',24);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
d.text((32,22),'ASTROLOGY / V4 STYLE SAMPLES',font=font,fill='#303544')
d.text((32,57),'Uniform 1.8 / 32 stroke - round caps & joins - original proportions',font=small,fill='#626874')
for i,spec in enumerate(specs):
 x=24+(i%2)*468;y=100+(i//2)*280;d.rounded_rectangle((x,y,x+444,y+260),radius=12,fill='white');d.text((x+20,y+16),spec[2],font=font,fill='#303544');canvas.paste(render(spec,88),(x+22,y+80))
 for j,z in enumerate((16,24,32)):
  xx=x+165+j*88;yy=y+124-z//2;canvas.paste(render(spec,z),(xx,yy));d.text((xx-5,y+162),str(z)+' px',font=small,fill='#626874')
canvas.save(P/'samples-v4.png')
cards=''
for slug,cn,en,paths,circles in specs:
 svg=(P/(slug+'.svg')).read_text(encoding='utf-8');cards+=f'<article><div class="hero">{svg}</div><h2>{cn} <small>{en}</small></h2><div class="sizes">'+''.join(f'<div><span style="width:{s}px;height:{s}px">{svg}</span><p>{s}px</p></div>' for s in (16,24,32))+'</div></article>'
(P/'preview-samples-v4.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>V4 四符号风格样本</title><style>body{font:16px system-ui;background:#f3f1ec;color:#303544;margin:0}main{max-width:960px;margin:auto;padding:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}article{background:white;border-radius:12px;padding:24px}.hero svg{width:88px;height:88px}h2{font-size:20px}small{font-size:14px;color:#707580}.sizes{display:flex;gap:48px;align-items:end}.sizes span{display:block}.sizes svg{width:100%;height:100%}p{color:#707580;font-size:14px}</style><main><h1>V4 · 四符号风格样本</h1><p>统一 1.8 / 32 线宽 · 圆形端点 · 圆润转角 · 中心线 SVG</p><div class="grid">'+cards+'</div></main></html>',encoding='utf-8')
print('Created four SVG samples, HTML and raster preview')
