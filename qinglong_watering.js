(()=>{
 function init(){
 const garden=document.querySelector('.ritual-garden'),grass=garden.querySelector('.garden-sprout');
 const key='qinglong_grass_watering_v1';let count=0;try{count=Math.max(0,Number(localStorage.getItem(key))||0);}catch{}
 const harvestKey='qinglong_flower_harvests_v1',emptyKey='qinglong_garden_empty_v1';let harvests=[],empty=false;
 try{const saved=JSON.parse(localStorage.getItem(harvestKey)||'[]');harvests=Array.isArray(saved)?saved:[];empty=localStorage.getItem(emptyKey)==='1';}catch{}
 const varieties={white:{seed:'青白种',name:'青白花',color:'#f3f7ed',edge:'#86a897'},pink:{seed:'胭脂种',name:'桃花',color:'#d982a0',edge:'#a44e72'},purple:{seed:'藤紫种',name:'小铃花',color:'#a68bc9',edge:'#705594'},yellow:{seed:'金黄种',name:'雏菊',color:'#d9b347',edge:'#a7802d'},blue:{seed:'靛蓝种',name:'鸢尾',color:'#647fb6',edge:'#405b91'}};
 let variety='white';try{const saved=localStorage.getItem('qinglong_seed_variety_v1');if(varieties[saved])variety=saved;}catch{}
 function bloom(kind){const v=varieties[kind]||varieties.white;let petals='';
 if(kind==='purple')petals='<path d="M-12-17Q0-32 12-17L17 5Q8 1 0 8Q-8 1-17 5Z"/><path d="M0 8V14" stroke="#c7b46f" stroke-width="3"/>';
 else if(kind==='blue')petals=Array.from({length:3},(_,i)=>`<path d="M0 0Q-20-36 0-30Q20-36 0 0M0 0Q-28 10-18 20Q-3 24 0 0" transform="rotate(${i*120})"/>`).join('');
 else{const n=kind==='pink'?5:kind==='yellow'?12:6;petals=Array.from({length:n},(_,i)=>kind==='pink'?`<path d="M0 0Q-20-15-8-27L0-23L8-27Q20-15 0 0" transform="rotate(${i*360/n})"/>`:`<ellipse cy="-${kind==='yellow'?18:16}" rx="${kind==='yellow'?5:10}" ry="${kind==='yellow'?12:17}" transform="rotate(${i*360/n})"/>`).join('');}
 return `<g fill="${v.color}" stroke="${v.edge}" stroke-width="1.2">${petals}</g><circle r="${kind==='yellow'?9:5}" fill="#c7b46f"/>`;
 }
 const can=document.createElement('button');can.type='button';can.className='garden-watering-can';can.setAttribute('aria-label','给小草浇水');
 can.innerHTML='<svg viewBox="0 0 160 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"><path d="M37 43C7 20 1 77 35 78"/><path d="M31 41h60l-6 55H39Z" fill="currentColor" fill-opacity=".15"/><path d="M91 57l37-27 10 11-47 41M123 24l20 23M45 40V25h34v15"/></g></svg><span>浇 水</span>';
 const drops=document.createElement('div');drops.className='garden-water-drops';drops.setAttribute('aria-hidden','true');drops.innerHTML='<i></i><i></i><i></i><i></i>';
 const body=document.createElement('div');body.className='garden-can-body';body.append(can.querySelector('svg'),drops);can.prepend(body);
 const status=document.createElement('span');status.className='garden-water-status';status.setAttribute('role','status');garden.append(can,status);
 const cycle=document.createElement('button');cycle.type='button';cycle.className='garden-cycle';garden.append(cycle);
 const seeds=document.createElement('div');seeds.className='garden-seed-library';seeds.hidden=true;seeds.setAttribute('role','group');seeds.setAttribute('aria-label','选择花种');
 seeds.innerHTML='<p>选一粒花种</p>'+Object.entries(varieties).map(([id,v])=>`<button type="button" data-seed="${id}" style="--seed-color:${v.color};--seed-edge:${v.edge}"><svg viewBox="0 0 60 70" aria-hidden="true"><path d="M8 8H52V62Q30 68 8 62Z" fill="#ede6d0" stroke="#b5a886"/><path d="M8 15H52" stroke="#b5a886"/><g transform="translate(30 39) scale(.6)">${bloom(id)}</g></svg><span>${v.seed}</span><small>${v.name}</small></button>`).join('')+'<button type="button" class="garden-seed-cancel">稍后再种</button>';garden.append(seeds);
 seeds.onclick=e=>{const button=e.target.closest('[data-seed]');if(button){variety=button.dataset.seed;empty=false;count=0;localStorage.setItem('qinglong_seed_variety_v1',variety);localStorage.setItem(key,'0');localStorage.setItem(emptyKey,'0');seeds.hidden=true;status.textContent=varieties[variety].seed+'已种下，静待生长。';render();}else if(e.target.closest('.garden-seed-cancel'))seeds.hidden=true;};
 const basket=document.createElement('details');basket.className='garden-flower-basket';basket.innerHTML='<summary>花 篮 <span></span></summary><div class="garden-harvest-list"></div>';document.querySelector('.desk').append(basket);
 function renderBasket(){
 const summary=basket.querySelector('summary');summary.setAttribute('aria-label',`，已收获${harvests.length}朵花，点击查看`);
 const flowers=Array.from({length:Math.min(harvests.length,9)},(_,i)=>{const x=62+(i%3)*28,y=75-Math.floor(i/3)*17;return `<g transform="translate(${x} ${y})"><path d="M0 0L${(90-x)*.4} ${112-y}" stroke="#547955" stroke-width="2"/><path d="M0 16Q-18 5-14 20Q-5 27 0 16" fill="#648c5c"/><g transform="scale(.4)">${bloom(harvests[i].variety)}</g></g>`;}).join('');
 summary.innerHTML=`<svg class="garden-basket-art" viewBox="0 0 180 155" aria-hidden="true"><defs><linearGradient id="gardenBasketShade" x2="0" y2="1"><stop stop-color="#ba9363"/><stop offset="1" stop-color="#896239"/></linearGradient><pattern id="gardenBasketWeave" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0 2H12M0 7H12" stroke="#d1ae7d" stroke-width="2"/><path d="M3 0V10M9 0V10" stroke="#725632" stroke-width="1"/></pattern></defs><ellipse cx="90" cy="142" rx="62" ry="6" fill="#456742" opacity=".12"/><path d="M43 96C24 10 152 10 137 96" fill="none" stroke="#755839" stroke-width="9"/><path d="M43 96C24 10 152 10 137 96" fill="none" stroke="#bfa073" stroke-width="4"/>${flowers}<path d="M29 92Q90 106 151 92L139 130Q90 153 41 130Z" fill="url(#gardenBasketShade)" stroke="#725632" stroke-width="2"/><path d="M29 92Q90 106 151 92L139 130Q90 153 41 130Z" fill="url(#gardenBasketWeave)" opacity=".7"/><path d="M29 92Q90 106 151 92M41 130Q90 151 139 130" fill="none" stroke="#c7a475" stroke-width="5"/></svg><span class="garden-basket-caption">${harvests.length||''}</span>`;
 const list=basket.querySelector('.garden-harvest-list');list.replaceChildren();if(!harvests.length){const note=document.createElement('p');note.textContent='待一朵花开。';list.append(note);}harvests.slice().reverse().forEach(h=>{const row=document.createElement('p');row.textContent='✿ '+(varieties[h.variety]||varieties.white).name+' · '+new Date(h.at).toLocaleDateString('zh-CN');list.append(row);});}
 cycle.onclick=()=>{if(can.disabled)return;if(empty){seeds.hidden=!seeds.hidden;return;}else if(count>=12){harvests.push({at:Date.now(),variety});localStorage.setItem(harvestKey,JSON.stringify(harvests));empty=true;localStorage.setItem(emptyKey,'1');status.textContent='花已入篮，再播下一粒种子。';}render();renderBasket();};
 function render(){
  grass.hidden=empty;can.hidden=empty;cycle.hidden=!empty&&count<12;cycle.classList.toggle('garden-sow-button',empty);
  cycle.innerHTML=empty?'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 24V13M16 18C6 18 5 10 5 8C13 8 16 12 16 18ZM16 14C16 7 22 5 27 5C27 12 23 15 16 14Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 26Q16 22 25 26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>播下一粒种子</span>':'采花留存';
  if(empty){grass.dataset.growthStage='empty';return;}
  const stage=count<3?'grass':count<8?'seedling':count<12?'bud':'flower';grass.dataset.growthStage=stage;
  grass.style.setProperty('--grass-growth',1+Math.min(count,24)*.025);
  grass.dataset.variety=variety;const leaves=stage==='grass'?2:variety==='yellow'?6:4,tip=stage==='grass'?95:stage==='seedling'?65:38;
  let flower='';
  if(stage==='bud')flower='<path d="M80 48C52 32 72 10 80 13C88 10 108 32 80 48Z" fill="'+varieties[variety].color+'" stroke="'+varieties[variety].edge+'" stroke-width="2"/><path d="M66 39L80 51L94 39" fill="none" stroke="#58785e" stroke-width="2"/>';
  if(stage==='flower')flower='<g transform="translate(80 36)">'+bloom(variety)+'</g>';  grass.innerHTML='<svg viewBox="0 0 160 180" aria-hidden="true"><path d="M80 170V'+tip+'" fill="none" stroke="#426b47" stroke-width="3"/>'+Array.from({length:leaves},(_,i)=>{const side=i%2?1:-1,y=145-Math.floor(i/2)*35;return `<path d="M80 ${y}Q${80+side*42} ${y+5} ${80+side*43} ${y-30}Q${80+side*8} ${y-33} 80 ${y}" fill="${i%2?'#6b9858':'#45784b'}"/>`;}).join('')+flower+'</svg>';
  grass.setAttribute('role','img');grass.setAttribute('aria-label',({grass:'小草',seedling:'花苗',bud:'含苞',flower:varieties[variety].name})[stage]);
 }
 let timer,suppressClick=false;function water(){if(can.disabled||empty)return;count++;try{localStorage.setItem(key,String(count));}catch{}can.disabled=true;garden.classList.add('watering');status.textContent=count>=12?'水润花开，'+varieties[variety].name+'一朵。':count>=8?'花苞初成，静待花开。':count>=3?'花苗渐长，叶色更新。':'水落土中，小草又长了一点。';clearTimeout(timer);timer=setTimeout(()=>{render();garden.classList.remove('watering');can.disabled=false;},1100);}
 can.onclick=()=>{if(suppressClick){suppressClick=false;return;}water();};
 let drag=null,x=0,y=0;
 can.addEventListener('pointerdown',e=>{if(can.disabled||e.button>0)return;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x,y,moved:false};can.setPointerCapture(e.pointerId);can.classList.add('dragging');});
 can.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(Math.hypot(dx,dy)>5)drag.moved=true;x=drag.x+dx;y=drag.y+dy;can.style.transform=`translate(${x}px,${y}px)`;});
 function end(e){if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;can.classList.remove('dragging');if(moved){suppressClick=true;const box=grass.getBoundingClientRect();if(e.clientX>box.left-90&&e.clientX<box.right+90&&e.clientY>box.top-60&&e.clientY<box.bottom+100){water();}else status.textContent='把水壶拖到小草旁，松手浇水。';}}
 can.addEventListener('pointerup',end);can.addEventListener('pointercancel',()=>{drag=null;can.classList.remove('dragging');});render();renderBasket();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();



