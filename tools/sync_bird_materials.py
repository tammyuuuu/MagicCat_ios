from pathlib import Path
import re,shutil
web=Path('../web'); source=(web/'bird_themes.css').read_text(encoding='utf-8-sig');source=re.sub(r'/\*.*?\*/','',source,flags=re.S)
selected=[]
for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',source):
 selector,body=m.groups();selector=selector.strip()
 if selector.startswith('@'):continue
 if any(x in selector for x in ['.coin','.yarrow-art','#sjYarrow','.records-pendant','.rec-drawer','.rec-title','.rec-item','.rec-empty','.rec-close','.rec-clear','.rec-mask']):
  if '.rec-prop' in selector and '.records-pendant' not in selector:continue
  selected.append(selector+'{'+body+'}')
 if '--yarrow-art:' in body:selected.append(selector+'{'+body+'}')
 # The decorated ritual stems use the same counting and geometry as iOS.
 if ':is(.y-pile,.y-hung) i' in selector and ('url(' in body or 'var(--yarrow-art)' in body):selected.append(selector+'{'+body+'}')
css='\n'.join(selected)+'''
/* 手机卦录沿用原入口和点击范围，四象挂件替换竹册。 */
html[data-bird-theme] .rec-prop .bamboo,html[data-bird-theme] .rec-prop .prop-tag{display:none}
html[data-bird-theme] .rec-prop{left:16px;right:auto;top:auto;bottom:16px;transform:none;z-index:40}
html[data-bird-theme] .rec-prop img{object-fit:contain;pointer-events:none}
html[data-bird-theme=rouge] .records-pendant{width:88px;height:145px}
html[data-bird-theme=paper] .records-pendant-baihu{width:78px;height:150px}
html[data-bird-theme=jade] body .records-pendant-xuanwu{width:90px;height:156px}
html[data-bird-theme=apricot] body .records-pendant-qinglong{width:90px;height:138px}
'''
Path('bird_materials.css').write_text(css,encoding='utf-8')
for f in set(re.findall(r'图片/已批准/([^\s\)\'\"]+)',css)):
 shutil.copyfile(web/'图片/已批准'/f,Path('图片/已批准')/f)
s=(web/'bird_web.html').read_text(encoding='utf-8-sig');p=Path('bird_ios.html');ios=p.read_text(encoding='utf-8')
imgs=re.search(r'<div class="rec-prop"[^>]*>(.*?)<div class="bamboo"',s,re.S)
# Only copy native image tags; preserve existing iOS event target and count.
tags='\n'.join(re.findall(r'<img class="records-pendant[^>]+>',s))
for f in re.findall(r'src="图片/已批准/([^"]+)"',tags):shutil.copyfile(web/'图片/已批准'/f,Path('图片/已批准')/f)
ios=re.sub(r'(<div class="rec-prop"[^>]*>)',lambda m:m.group(1)+'\n'+tags,ios,count=1)
ios=ios.replace('<button class="sj-btn" data-sj="yarrow"', '<button class="sj-btn" data-sj="yarrow"')
ios=re.sub(r'(<button[^>]+id="sjYarrow"[^>]*>)',lambda m:m.group(1)+'<span class="yarrow-art" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>',ios,count=1)
ios=ios.replace('</head>','<link rel="stylesheet" href="bird_materials.css">\n</head>');p.write_text(ios,encoding='utf-8')
p=Path('sw.js');t=p.read_text(encoding='utf-8').replace('core-v14','core-v15').replace("'bird_themes.css',","'bird_themes.css', 'bird_materials.css',");p.write_text(t,encoding='utf-8')
