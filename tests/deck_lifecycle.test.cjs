const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('reading_ios.html','utf8');
function el(){
 const classes=new Set();
 return {dataset:{},style:{setProperty(){}},isConnected:true,removed:false,
  classList:{add(...a){a.forEach(x=>classes.add(x));},remove(...a){a.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);}},
  setAttribute(){},removeAttribute(){},addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},remove(){this.removed=true;},appendChild(){}};
}
function setup(){
 const probes=[],queued=[],returned=[],buttons=[];
 const c={currentDeck:[],drawnIds:new Set(),placedCards:[],fanCardEls:[],fanArea:el(),fanControls:el(),fanScroll:{offsetWidth:800,offsetHeight:220,appendChild(){}},rotationOffset:0,fanScale:1,présSelectedIdx:-1,_enterFromLeft:false,
  cardZoom:el(),zoomCard:el(),zoomInterpret:el(),zoomFlip:el(),IS_MOBILE:false,
  _zoomPlaced:null,_zoomFrontSrc:null,_zoomBackSrc:null,_zoomCardName:'',_zoomInterpSrc:null,_zoomShowingInterp:false,_zoomThemeCard:null,_zoomThemeSide:'front',
  window:{innerWidth:800,innerHeight:600},document:{getElementById(){const x=el();buttons.push(x);return x;},createElement:el,addEventListener(){},removeEventListener(){},body:{appendChild(){}}},
  requestAnimationFrame(fn){fn();},setTimeout(fn){queued.push(fn);},
  renderFanWindow(){},applyCardPosition(){},renderThemeTarotZoom(){},themeTarotBackMarkup(){return '';},themeTarotFrontMarkup(){return '';},
  Image:class {constructor(){probes.push(this);}},
  createFanCardEl(i){returned.push(i);return el();},Math};
 vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('function shuffleDeck('),html.indexOf('function getFanLayout(')),c);
 vm.runInContext(html.slice(html.indexOf('function returnCardToFan('),html.indexOf('clearBtn.addEventListener(')),c);
 vm.runInContext(html.slice(html.indexOf('function regularCardZoomMarkup('),html.indexOf('function renderThemeTarotZoom(')),c);
 vm.runInContext(html.slice(html.indexOf('function openCardZoom('),html.indexOf('// 翻面：切换桌面牌')),c);
 vm.runInContext(html.slice(html.indexOf('function placeCardWithFlip('),html.indexOf("arrowLeft.addEventListener('click'")),c);
 return {c,probes,queued,returned};
}
function placed(card,index=0){const p=el();p.dataset={cardId:card.id,globalIdx:String(index),reversed:'false'};p._cardData=card;p.classList.add('revealed');p.querySelector=s=>({src:s.includes('front')?'front.webp':'back.webp'});return p;}
test('reopening a fan keeps already drawn cards excluded',()=>{
 const {c}=setup();c.currentDeck=[{id:'a'},{id:'b'}];c.drawnIds.add('a');c.closeFan();c.openFan();assert.equal(c.drawnIds.has('a'),true);
 vm.runInContext(html.slice(html.indexOf('function createFanCardEl('),html.indexOf('// --- 渲染可见窗口')),c);
 assert.equal(c.createFanCardEl(c.currentDeck.findIndex(x=>x.id==='a'),1),null);
});
test('shuffle respects the supplied deck reversal policy',()=>{
 const {c}=setup();c.currentDeck._images={noReverse:false};const deck=[{id:'a'}];deck._images={noReverse:true};assert.equal(c.shuffleDeck(deck)[0].isReversed,false);
});
test('returning a card after shuffle finds its new index',()=>{
 const {c,returned}=setup();c.currentDeck=[{id:'b'},{id:'a'}];c.fanArea.classList.add('active');c.drawnIds.add('a');c.returnCardToFan(placed({id:'a'},0));assert.deepEqual(returned,[1]);assert.equal(c.drawnIds.size,0);
});
test('removing a card from a different deck does not insert a foreign fan card',()=>{
 const {c,returned}=setup();c.currentDeck=[{id:'b'}];c.fanArea.classList.add('active');c.drawnIds.add('a');c.returnCardToFan(placed({id:'a'}));assert.deepEqual(returned,[]);assert.equal(c.drawnIds.size,0);
});
test('switching deck during a shuffle cancels the previous animation',async()=>{
 const {c,queued}=setup();c.currentDeck=[{id:'a'}];c.fanArea.classList.add('active');const pending=c.animateShuffle();c.closeFan();const next=[{id:'b'}];c.currentDeck=next;queued.shift()();await pending;assert.equal(c.currentDeck,next);assert.equal(vm.runInContext('isShuffling',c),false);
});
test('placed card retains its interpretation after switching decks',()=>{
 const {c}=setup();const card={id:'a',_waite:true,meaning:{},name:'愚人',_imgUrl:'0.webp'};c.currentDeck=[{id:'b'}];c.openCardZoom(placed(card),'愚人');assert.equal(c._zoomThemeCard.id,'a');assert.equal(c.zoomInterpret.style.display,'flex');
});
test('decks without interpretations never request nonexistent interpretation images',()=>{
 const {c,probes}=setup();c.openCardZoom(placed({id:'a',_imgUrl:'0.webp',_hasInterpretation:false}),'A');assert.equal(probes.length,0);assert.equal(c.zoomInterpret.style.display,'none');
});
test('late image probe cannot expose interpretation button on another card',()=>{
 const {c,probes}=setup();c.openCardZoom(placed({id:'a',_imgUrl:'0.webp'}),'A');const probe=probes[0];c.openCardZoom(placed({id:'b',_imgUrl:'1.webp',_hasInterpretation:false}),'B');probe.onload();assert.equal(c.zoomInterpret.style.display,'none');
});
test('zoom preserves reversed fronts and upright backs',()=>{
 const {c}=setup();c._zoomPlaced=placed({id:'a'});c._zoomPlaced.dataset.reversed='true';c._zoomFrontSrc='front.webp';assert.match(c.regularCardZoomMarkup('front.webp','A'),/rotate\(180deg\)/);assert.doesNotMatch(c.regularCardZoomMarkup('back.webp','A'),/rotate\(180deg\)/);
});
test('placed card captures its data and releases document drag handlers',()=>{
 const {c}=setup();const active=new Map();
 c.document.addEventListener=(name,fn)=>active.set(name,fn);
 c.document.removeEventListener=(name,fn)=>{if(active.get(name)===fn)active.delete(name);};
 const card={id:'a',name:'A',_imgUrl:'0.webp'};c.currentDeck=[card];c.currentDeck._images={back:'back.webp',aspectRatio:1};
 c.placeCardWithFlip(card,0,100,100,false,80,80);
 const p=c.placedCards[0];assert.equal(p._cardData.id,'a');assert.equal(p._cardData.isReversed,false);assert.equal(active.size,2);p._dispose();assert.equal(active.size,0);
});
