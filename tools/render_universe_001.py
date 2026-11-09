"""Render bilingual previews using measured wrapping and unchanged final SVG assets."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys, io, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'astrology-symbol-library/.render-deps'))
import resvg_py
LIB=ROOT/'astrology-symbol-library'; OUT=ROOT/'output/universe-letters'
manifest=json.loads((LIB/'manifest-final.json').read_text('utf-8'))
hashes={x['file']:hashlib.sha256((LIB/x['file']).read_bytes()).hexdigest() for x in manifest['symbols']}
def font(size,cn=False,weight=600):
 f=ImageFont.truetype('C:/Windows/Fonts/'+('NotoSerifSC-VF.ttf' if cn else 'georgia.ttf'),size)
 if cn: f.set_variation_by_axes([weight])
 return f
from universe_text_layout import chinese_wrap

def wrap(text,f,width,english=False):
 if not english:return chinese_wrap(text,f,width)
 tokens=text.split() if english else list(text)
 lines=[]; line=''; sep=' ' if english else ''
 for token in tokens:
  candidate=line+sep+token if line else token
  if f.getlength(candidate)>width and line:
   lines.append(line); line=token
  else: line=candidate
 if line: lines.append(line)
 if not english and len(lines)>1:
  # Balance line lengths instead of leaving one or two characters stranded.
  count=len(lines); target=(len(text)+count-1)//count
  balanced=[]; start=0
  while start<len(text):
   end=min(start+target,len(text))
   while end<len(text) and text[end] in '。，、；：！？': end+=1
   balanced.append(text[start:end]);start=end
  if all(f.getlength(x)<=width for x in balanced): lines=balanced
 return lines
def optical_offset(line,f):
 # Center the complete line's text body, excluding only trailing punctuation.
 body=line.rstrip('。，、；：！？…—”’」』）》〉】')
 return (f.getlength(line)-f.getlength(body))/2

def render(number,zh,en,planet,zodiac,element='earth',symmetric=True):
 im=Image.open(OUT/(element+'.png')).convert('RGB');d=ImageDraw.Draw(im);color={'earth':'#435b48','water':'#466b82','fire':'#a35f4d','air':'#82703d','spirit':'#75618e'}[element]
 # Main and auxiliary inks follow each watercolor palette.
 auxiliary_palette={
  'earth':('#a6ad99','#7c8d70'),
  'water':('#a2b4c2','#6f8c9f'),
  'fire':('#d5b1a0','#b4836b'),
  'air':('#c7bb95','#9b8755'),
  'spirit':('#b7aecb','#8977a7'),
 }
 aux,footer=auxiliary_palette[element]
 def text(y,s,f,ink=color): d.text((512,y),s,font=f,fill=ink,anchor='mt')
 def tracked(y,label,f,gap,center_y=False,ink=None):
  widths=[f.getlength(ch) for ch in label]
  width=sum(widths)+gap*(len(label)-1)
  x=512-width/2
  bbox=d.textbbox((0,0),label,font=f)
  baseline=y-(bbox[1]+bbox[3])/2 if center_y else y-bbox[1]
  for ch,advance in zip(label,widths):
   d.text((x,baseline),ch,font=f,fill=ink or aux)
   x+=advance+gap
 label={'earth':'土 EARTH','water':'水 WATER','fire':'火 FIRE','air':'风 AIR','spirit':'灵 SPIRIT'}[element]
 tracked(66,label,font(20,True,300),8)

 cf=font(58,True);ef=font(30)
 cl=wrap(zh,cf,840);el=wrap(en,ef,740,True)
 height=len(cl)*86+24+len(el)*46
 top=730-height/2
 for i,line in enumerate(cl):
  d.text((512+optical_offset(line,cf),round(top+i*86)),line,font=cf,fill=color,anchor='mt')
 ey=top+len(cl)*86+24
 for i,line in enumerate(el):text(round(ey+i*46),line,ef,{'earth':'#71816f','water':'#7891a1','fire':'#b88778','air':'#a1926c','spirit':'#9989ad'}[element])
 # Unchanged standard SVG geometry; staggered translucent decorative placements.
 placements=[(planet,512,top-165,132),(zodiac,512,ey+len(el)*46+155,132)] if symmetric else [(planet,260,365,108),(zodiac,772,1040,86)]
 for name,cx,cy,size in placements:
  svg=(LIB/(name+'.svg')).read_text('utf-8')
  icon=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg,width=320,height=320,style_sheet='svg { color: '+footer+'; }'))).convert('RGBA')
  icon=icon.crop(icon.getchannel('A').getbbox())
  scale=size/max(icon.size)
  icon=icon.resize((round(icon.width*scale),round(icon.height*scale)),Image.Resampling.LANCZOS)
  icon.putalpha(icon.getchannel('A').point(lambda a:round(a*(0.18 if symmetric else 0.24))))
  im.paste(icon,(cx-icon.width//2,round(cy-icon.height//2)),icon)
 
 assert max(cf.getlength(x) for x in cl)<=840
 assert max(ef.getlength(x) for x in el)<=740
 return im,{'id':number,'chineseLines':cl,'englishLines':el,'opticalOffsets':[optical_offset(x,cf) for x in cl],'bodyTop':top,'bodyBottom':ey+len(el)*46}


