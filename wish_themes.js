/* M288 配色与龟形石池；愿望存档由原页面管理。 */
(()=>{
  const themes=[['rouge','朱雀','#933d32'],['paper','白虎','#fffdf7'],['jade','玄武','#12273b'],['apricot','青龙','#729451']];
  let selected='rouge';try{selected=localStorage.getItem('magicbird_theme')||selected}catch(_){}
  if(!themes.some(t=>t[0]===selected))selected='rouge';
  function syncThemeChrome(id) {
    const colors={rouge:'#310b08',paper:'#fffdf7',jade:'#0b1929',apricot:'#edf4e9'};
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=colors[id]||colors.rouge;
  }
  document.documentElement.dataset.wishTheme=selected;
  syncThemeChrome(selected);
  document.addEventListener('DOMContentLoaded',()=>{
    const palette=document.createElement('div');palette.className='wish-palette';palette.setAttribute('role','group');palette.setAttribute('aria-label','四象配色');
    palette.innerHTML=themes.map(([id,name,color])=>`<button type="button" data-wish-palette="${id}" aria-label="${name}" style="background:${color}"></button>`).join('');document.body.append(palette);
    const pond=document.createElement('div');pond.className='pond-stage';pond.id='pondStage';
    pond.innerHTML=`<div class="pond-caption">玄 武 承 愿 池<small>一枚铜钱，寄托一愿 · 点击池中钱币查看愿望</small></div><div class="pond-scene"><svg viewBox="0 0 800 560" aria-hidden="true"><defs><linearGradient id="pondStone" x2="0" y2="1"><stop stop-color="#8b9da5"/><stop offset="1" stop-color="#344e61"/></linearGradient><radialGradient id="pondWater"><stop stop-color="#24546c"/><stop offset="1" stop-color="#102b43"/></radialGradient></defs><g fill="url(#pondStone)" stroke="#b3bdaf" stroke-width="2"><ellipse cx="400" cy="93" rx="45" ry="56"/><path d="M225 180Q110 130 116 207Q128 244 220 240M575 180Q690 130 684 207Q672 244 580 240M225 375Q110 426 150 452Q182 469 256 411M575 375Q690 426 650 452Q618 469 544 411M387 448l13 69 13-69Z"/><ellipse cx="400" cy="288" rx="247" ry="183"/></g><ellipse cx="400" cy="278" rx="218" ry="154" fill="url(#pondWater)" stroke="#c6b184" stroke-width="3"/><ellipse cx="400" cy="278" rx="205" ry="141" fill="none" stroke="#618598" opacity=".6"/><g fill="none" stroke="#80a9bb" opacity=".22"><path d="M230 235q80-20 160 0t180 0M205 284q90-20 180 0t200 0M235 337q80-20 160 0t160 0"/></g><circle cx="383" cy="82" r="3" fill="#192e3a"/><circle cx="417" cy="82" r="3" fill="#192e3a"/></svg><i class="pond-coin"></i><i class="pond-ripple"></i></div>`;document.body.append(pond);
    function apply(id){document.documentElement.dataset.wishTheme=id;syncThemeChrome(id);palette.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wishPalette===id)));const blue=id==='jade';document.querySelector('.altar-body').innerHTML=blue?'投 币 许 愿':'祝 祷 台';document.querySelector('.altar-tip').textContent=blue?'写下一愿 · 投一枚铜钱':'点击此处 · 立下一愿';document.getElementById('wishSubmit').textContent=blue?'投 币 许 愿':'立 愿';document.querySelector('#carrierGrid').closest('.field').hidden=blue;document.getElementById('altarBtn').setAttribute('aria-label',blue?'投币许愿':'祝祷台 · 立愿');document.dispatchEvent(new Event('wish-theme-change'));}
    palette.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;apply(b.dataset.wishPalette);try{localStorage.setItem('magicbird_theme',b.dataset.wishPalette)}catch(_){}});apply(selected);
    document.addEventListener('wish-coin-toss',()=>{pond.classList.remove('toss');void pond.offsetWidth;pond.classList.add('toss');setTimeout(()=>pond.classList.remove('toss'),2800)});
  });
})();

/* M290 四象仪式小样；存档沿用原页面，可选 ritual 字段识别用途。 */
window.wishRitualObject=w=>{
 const t=w.ritual||document.documentElement.dataset.wishTheme;
 if(t==='jade')return '';
 if(t==='rouge')return '<span class="ritual-token sealed-letter">笺</span>';
 if(t==='paper')return '<span class="ritual-token jade-vow">约</span>';
 const leaves=Math.min(8,(w.traces||[]).length+2);
 return '<svg viewBox="0 0 140 180" aria-hidden="true"><path d="M70 170Q66 90 70 20" fill="none" stroke="#58764e" stroke-width="3"/>'+Array.from({length:leaves},(_,i)=>{const side=i%2?1:-1,y=145-Math.floor(i/2)*34,x=70+side*32;return `<path d="M70 ${y+14}Q${70+side*15} ${y+8} ${x} ${y}" fill="none" stroke="#58764e" stroke-width="2"/><ellipse cx="${x}" cy="${y-5}" rx="22" ry="9" transform="rotate(${side*-25} ${x} ${y-5})" fill="${i%2?'#638658':'#426b47'}"/>`;}).join('')+'<path d="M46 170h48l-7 9H53Z" fill="#b5ad7c"/></svg>';

};
document.addEventListener('DOMContentLoaded',()=>{
 const desk=document.querySelector('.desk'),pond=document.getElementById('pondStage');desk.prepend(pond);
 const stage=document.createElement('div');stage.className='ritual-stage';
 stage.innerHTML='<div class="ritual-caption"><h1></h1><p></p></div><div class="ritual-scene"><div class="ritual-fire"><i class="burning-sheet">愿此心事<br>随火而去</i><div class="fire-flames"><i></i><i></i><i></i><i></i><i></i></div><div class="fire-ashes"><i></i><i></i><i></i><i></i><i></i></div><div class="fire-status" role="status">写下一笺，亲手放下。</div><div class="fire-bowl"></div></div><div class="ritual-guard"><div class="vow-scroll"><small>白 虎 守 约</small><h2>为所珍惜，立下一约</h2><p>写下要守护的人或事<br>再用每日行动践行承诺</p><div class="vow-seal">守</div></div><div class="guard-base"></div><div class="vow-steps"><span>一 · 立约</span><span>二 · 践行</span><span>三 · 成约</span></div></div><div class="ritual-garden"><div class="garden-ring"></div><div class="garden-sprout"><svg viewBox="0 0 160 180" aria-hidden="true"><path d="M80 170V45" fill="none" stroke="#55764b" stroke-width="5"/><path d="M78 115Q20 118 22 65Q75 64 78 115M82 80Q134 84 139 30Q90 28 82 80" fill="#638658" stroke="#426b47" stroke-width="2"/></svg></div></div></div>';
 desk.prepend(stage);
 const copy={rouge:['朱 雀 焚 笺 炉','将烦恼写入一笺，让它随灰光散去。','写 笺 放 下','写下想放下的事','焚 笺','烦恼或牵挂','随火放下，不留存，也不回看。'],paper:['白 虎 守 护 台','立约守护 · 点击下方玉符记录践行，完成后成约','立 下 一 约','为自己或所爱立约','立 约','守护之约','记录践行，完成后封印成约。'],jade:['玄 武 承 愿 池','一枚铜钱，寄托一愿 · 点击池中钱币回看','投 币 许 愿','写下一愿 · 投一枚铜钱','投 币','愿望','一愿入池，愿迹可随时回看。'],apricot:['青 龙 生 长 庭','提壶浇水，让小草慢慢长大','种 下 愿 种','写下目标 · 从一小步开始','种 愿','成长目标','记录行动，让愿种一点点生长。']};
 function sync(){const t=document.documentElement.dataset.wishTheme,c=copy[t];stage.querySelector('h1').textContent=c[0];stage.querySelector('p').textContent=c[1];document.querySelector('.altar-body').textContent=c[2];document.querySelector('.altar-tip').textContent=c[3];document.getElementById('wishSubmit').textContent=c[4];document.querySelector('#wishModal .m-head').firstChild.textContent=c[4]+' ';
 document.getElementById('wName').placeholder='给'+c[5]+'一个名字…';document.getElementById('wContent').placeholder=c[6];document.getElementById('wName').previousElementSibling.innerHTML=c[5]+'名称 <b>*</b>';document.getElementById('wContent').previousElementSibling.textContent=c[5]+'内容';document.getElementById('wTarget').closest('.field').hidden=t==='rouge';document.getElementById('carrierGrid').closest('.field').hidden=true;document.getElementById('altarBtn').setAttribute('aria-label',c[2]);}
 document.addEventListener('wish-theme-change',sync);sync();
 let ritualTimer,ashTimer;document.addEventListener('wish-ritual-submit',()=>{clearTimeout(ritualTimer);clearTimeout(ashTimer);if(document.documentElement.dataset.wishTheme==='jade')document.dispatchEvent(new Event('wish-coin-toss'));stage.classList.remove('ritual-play');void stage.offsetWidth;stage.classList.add('ritual-play');stage.querySelector('.fire-status').textContent='笺入炉中 · 火起';ashTimer=setTimeout(()=>stage.querySelector('.fire-status').textContent='纸笺化灰 · 此事已放下',3300);ritualTimer=setTimeout(()=>stage.classList.remove('ritual-play'),5600);});
});




document.addEventListener('DOMContentLoaded',()=>{
 const palette=document.querySelector('.wish-palette');palette.id='wishPalette';palette.hidden=true;
 const toggle=document.createElement('button');toggle.id='wishThemeToggle';toggle.type='button';toggle.setAttribute('aria-label','切换四象配色');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','wishPalette');
 toggle.innerHTML="<svg viewBox=\"0 0 100 100\" aria-hidden=\"true\"><circle cx=\"50\" cy=\"50\" r=\"46\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"/><g stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linejoin=\"round\"><path d=\"M29 72Q16 45 31 19Q48 33 49 57Q44 66 29 72Z\" fill=\"#a54e42\"/><path d=\"M32 73Q29 44 47 16Q61 39 57 59Q48 68 32 73Z\" fill=\"#fff6df\"/><path d=\"M35 75Q45 40 65 22Q76 43 66 62Q54 74 35 75Z\" fill=\"#23465f\"/><path d=\"M38 77Q65 48 83 42Q83 68 61 77Q49 83 38 77Z\" fill=\"#719b78\"/></g><path d=\"M28 82Q49 63 67 42\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>";document.body.append(toggle);
 function close(){palette.hidden=true;toggle.setAttribute('aria-expanded','false')}
 toggle.onclick=()=>{palette.hidden=!palette.hidden;toggle.setAttribute('aria-expanded',String(!palette.hidden))};
 palette.addEventListener('click',e=>{if(e.target.closest('[data-wish-palette]'))close()});
 document.addEventListener('click',e=>{if(!palette.contains(e.target)&&!toggle.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
});
