from pathlib import Path
bird=Path('bird_themes.js').read_text(encoding='utf-8-sig')
svg=bird.split("toggle.innerHTML='")[1].split("';")[0]
js='''
document.addEventListener('DOMContentLoaded',()=>{
 const palette=document.querySelector('.wish-palette');palette.id='wishPalette';palette.hidden=true;
 const toggle=document.createElement('button');toggle.id='wishThemeToggle';toggle.type='button';toggle.setAttribute('aria-label','切换四象配色');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','wishPalette');
 toggle.innerHTML=SVG_VALUE;document.body.append(toggle);
 function close(){palette.hidden=true;toggle.setAttribute('aria-expanded','false')}
 toggle.onclick=()=>{palette.hidden=!palette.hidden;toggle.setAttribute('aria-expanded',String(!palette.hidden))};
 palette.addEventListener('click',e=>{if(e.target.closest('[data-wish-palette]'))close()});
 document.addEventListener('click',e=>{if(!palette.contains(e.target)&&!toggle.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
});
'''
import json
with Path('wish_themes.js').open('a',encoding='utf-8') as f:f.write(js.replace('SVG_VALUE',json.dumps(svg,ensure_ascii=False)))
css=Path('bird_materials.css').read_text(encoding='utf-8-sig').split('#birdThemeToggle{')[1].split('html[data-bird-theme] body #recProp')[0]
css=('#birdThemeToggle{'+css).replace('birdThemeToggle','wishThemeToggle').replace('bird-palette','wish-palette')
with Path('wish_themes.css').open('a',encoding='utf-8') as f:f.write('\n'+css)
p=Path('iphone15-preview.html');s=p.read_text(encoding='utf-8').replace('src="/bird_ios.html"','src="/wish_ios.html"').replace('玄鸟 · 卦录与鸟羽配色','祝祷之庭 · 尾羽配色');p.write_text(s,encoding='utf-8')
p=Path('sw.js');s=p.read_text(encoding='utf-8').replace('core-v18','core-v19');p.write_text(s,encoding='utf-8')
p=Path('tools/preview-wish.cjs');s=p.read_text(encoding='utf-8-sig').replace('await p.click(`[data-wish-palette=', 'await p.click("#wishThemeToggle");await p.click(`[data-wish-palette=');s=s.replace("await p.click('[data-wish-palette=\"paper\"]')", "await p.click('#wishThemeToggle');await p.click('[data-wish-palette=\"paper\"]')");p.write_text(s,encoding='utf-8')
