/* 整宫飞宫盘：只由三骰结果推演，不使用出生星盘。 */
window.buildDiceFlying=function(values,record=false){
 const [planet,zodiac,house]=values;
 const z=ASTRO_ZODIACS.findIndex(v=>v.icon===zodiac.icon||v.name===zodiac.name),h=Number(house.symbol);
 if(z<0||h<1||h>12)return document.createElement('div');
 const asc=(z-h+13)%12,rulers=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
 const ruled=Array.from({length:12},(_,i)=>i+1).filter(n=>rulers[(asc+n-1)%12]===planet.icon);
 const text=ruled.length?`${ruled.join('、')}宫主${planet.name} → ${h}宫`:`${planet.name}落${h}宫 · 传统体系不设其守护宫`;
 const modern=rulers.map(r=>[r]);modern[7].push('pluto');modern[10].push('uranus');modern[11].push('neptune');
 const modernRuled=Array.from({length:12},(_,i)=>i+1).filter(n=>modern[(asc+n-1)%12].includes(planet.icon));
 const modernText=modernRuled.length?`${modernRuled.join('、')}宫主${planet.name} → ${h}宫`:`${planet.name}落${h}宫 · 无守护宫`;
 const details=document.createElement('details');details.className='dice-flying';
 const summary=document.createElement('summary');summary.textContent='飞宫盘 · '+modernText;details.append(summary);
 const content=document.createElement('div');content.className='dice-flying-content';
 const pos=(r,a)=>{const t=a*Math.PI/180;return [180+r*Math.cos(t),180+r*Math.sin(t)];};
 const point=(r,a)=>pos(r,a).map(n=>n.toFixed(2)).join(' ');
 let drawing='<circle cx="180" cy="180" r="158"/>';
 for(let n=1;n<=12;n++){
 const a=180-(n-1)*30,b=a-30,m=a-15,sign=ASTRO_ZODIACS[(asc+n-1)%12];
 if(n===h||modernRuled.includes(n))drawing+=`<path class="flying-sector" d="M180 180L${point(158,a)}A158 158 0 0 0 ${point(158,b)}Z"/>`;
 drawing+=`<path d="M180 180L${point(158,a)}"/>`;
 const [sx,sy]=pos(181,m),[hx,hy]=pos(136,m);
 drawing+=`<svg x="${sx-12}" y="${sy-12}" width="24" height="24" viewBox="0 0 48 48">${ASTRO_ICON_PATHS[sign.icon]}</svg><text x="${hx}" y="${hy+4}">${n}</text>`;
 if(n===h){const [px,py]=pos(100,m);drawing+=`<svg class="flying-planet" x="${px-13}" y="${py-13}" width="26" height="26" viewBox="0 0 48 48">${ASTRO_ICON_PATHS[planet.icon]}</svg>`;}
 }
 drawing+='<text x="180" y="174" class="flying-center">整宫制</text><text x="180" y="194" class="flying-center">飞宫盘</text><text x="12" y="177" class="flying-center">ASC</text>';
 content.innerHTML=`<svg class="dice-flying-wheel" viewBox="-20 -20 400 400" role="img" aria-label="${ASTRO_ZODIACS[asc].name}上升，${planet.name}落第${h}宫">${drawing}</svg>`;
 const copy=document.createElement('div');copy.className='dice-flying-copy';
 const exaltations={sun:0,moon:1,mercury:5,venus:11,mars:9,jupiter:3,saturn:6};
 const states=[];const exalt=exaltations[planet.icon];
 if(exalt!==undefined){
 if(modern[z].includes(planet.icon))states.push('庙 · Domicile');
 if(exalt===z)states.push('旺 · Exaltation');
 if(modern[(z+6)%12].includes(planet.icon))states.push('弱 · Detriment');
 if((exalt+6)%12===z)states.push('陷 · Fall');
 }
 const outer={uranus:10,neptune:11,pluto:7}[planet.icon];
 const dignity=outer!==undefined?(z===outer?'庙 · Domicile':z===(outer+6)%12?'弱 · Detriment':'无特殊状态'):exalt===undefined?'交点不设庙旺落陷':states.length?states.join('、'):'无特殊状态';
 const flying=modernText;
 const lines=record?[`推演上升：${ASTRO_ZODIACS[asc].name}`,flying,`${planet.name}在${zodiac.name}：${dignity}`]:[`推演上升：${ASTRO_ZODIACS[asc].name}`,`${planet.name} · ${zodiac.name} · 第${h}宫`,flying];
 lines.forEach(line=>{const p=document.createElement('p');p.textContent=line;copy.append(p);}); content.append(copy);details.append(content);return details;
};
window.updateDiceFlying=function(values){const panel=document.getElementById('astroDicePanel');panel.querySelector('.dice-flying')?.remove();const chart=buildDiceFlying(values);chart.open=true;panel.prepend(chart);};





