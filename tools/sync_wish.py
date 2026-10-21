from pathlib import Path
import shutil,re
web=Path('../web');p=Path('wish_ios.html');old=p.read_text(encoding='utf-8-sig');new=(web/'wish_web.html').read_text(encoding='utf-8-sig')
# Keep the iPhone installation metadata and mobile tree sizing.
meta=old[old.index('<meta name="viewport"'):old.index('<title>')]
new=re.sub(r'<meta name="viewport"[^>]*>',meta,new,count=1)
new=new.replace('bird_web.html','bird_ios.html').replace('reading_web.html','reading_ios.html').replace('wish_web.html','wish_ios.html')
new=new.replace('</head>','<style>input,textarea{user-select:text;-webkit-user-select:text}button{touch-action:manipulation}img{-webkit-user-drag:none}@media(max-width:760px){.detail{right:8px;left:8px;width:auto}.altar{bottom:calc(95px + env(safe-area-inset-bottom))}.traces-prop{bottom:calc(16px + env(safe-area-inset-bottom))}}</style>\n</head>')
p.write_text(new,encoding='utf-8')
for f in ['wish_themes.js','wish_themes.css','white_tiger_scrolls.js','qinglong_watering.js']:shutil.copyfile(web/f,f)
contents=new+'\n'+ '\n'.join((web/f).read_text(encoding='utf-8-sig') for f in ['wish_themes.js','wish_themes.css','white_tiger_scrolls.js','qinglong_watering.js'])
for f in set(re.findall(r'图片/已批准/([^\s\)\'\"<>`]+)',contents)):
 src=web/'图片/已批准'/f
 if src.is_file():shutil.copyfile(src,Path('图片/已批准')/f)
p=Path('sw.js');s=p.read_text(encoding='utf-8').replace('core-v15','core-v16').replace("  'bird_themes.js',","  'wish_themes.js', 'wish_themes.css', 'white_tiger_scrolls.js', 'qinglong_watering.js', 'bird_themes.js',");p.write_text(s,encoding='utf-8')
p=Path('iphone15-preview.html');s=p.read_text(encoding='utf-8').replace('src="/bird_ios.html"','src="/wish_ios.html"').replace('玄鸟 · 四象配色 · 可起卦','祝祷之庭 · 四象仪式');p.write_text(s,encoding='utf-8')
