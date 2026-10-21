const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8878/reading_ios.html');
await page.waitForSelector('.db-browse',{state:'attached'});
await page.evaluate(()=>document.getElementById('drawerDeck').classList.add('open'));
await page.locator('.db-browse').first().click();
if(await page.locator('.db-card').count()!==78)throw Error('Waite count');
await page.screenshot({path:'output/deck-browser-mobile.png'});
const before=await page.evaluate(()=>JSON.stringify({drawn:[...drawnIds],cards:placedCards.length,deck:currentDeck.map(c=>c.id)}));
await page.locator('.db-card').first().click();
await page.locator('#zoomInterpret').click({timeout:3000}).catch(async e=>{console.log(await page.evaluate(()=>({selected:document.querySelector('#dbDeck').value,card:_zoomThemeCard?.name,active:cardZoom.className,display:zoomInterpret.style.display,nav:document.querySelector('.db-detail-title').textContent})));await page.screenshot({path:'output/deck-browser-failure.png'});throw e;});
await page.locator('.tt-meaning-name').filter({hasText:'愚人'}).waitFor();
await page.locator('#dbReverse').click();
if(!await page.locator('.tt-meaning-orientation').innerText().then(t=>t.includes('逆位')))throw Error('reverse');
await page.screenshot({path:'output/deck-browser-meaning-mobile.png'});
await page.locator('[data-step="1"]').click();
if(!await page.locator('.db-detail-title').innerText().then(t=>t.includes('2 / 78')))throw Error('next');
await page.locator('#zoomClose').click();
await page.locator('#dbSearch').fill('愚人');
if(await page.locator('.db-card').count()!==1)throw Error('search');
await page.locator('#dbSearch').fill('nothing-matches');
if(await page.locator('.db-empty').count()!==1)throw Error('empty');
for(const [id,n] of [['theme-tarot-prototype',78],['config-deck-1',36],['config-deck-2',140],['config-deck-3',50]]){
await page.selectOption('#dbDeck',id);
if(await page.locator('.db-card').count()!==n)throw Error(id+' count');
await page.locator('.db-card').first().click();
if(id==='theme-tarot-prototype'||id==='config-deck-1'){
await page.locator('#zoomInterpret').click({timeout:3000}).catch(async e=>{console.log(await page.evaluate(()=>({selected:document.querySelector('#dbDeck').value,card:_zoomThemeCard?.name,active:cardZoom.className,display:zoomInterpret.style.display,nav:document.querySelector('.db-detail-title').textContent})));await page.screenshot({path:'output/deck-browser-failure.png'});throw e;});
if(await page.locator('.theme-tarot-meaning').count()!==1)throw Error(id+' meaning');
}else if(await page.locator('#zoomInterpret').isVisible())throw Error('unexpected meaning');
await page.locator('#zoomClose').click();
}
const after=await page.evaluate(()=>JSON.stringify({drawn:[...drawnIds],cards:placedCards.length,deck:currentDeck.map(c=>c.id)}));
if(before!==after)throw Error('reading mutated');
await page.keyboard.press('Escape');
if(await page.locator('#deckBrowser').isVisible())throw Error('escape');
await page.setViewportSize({width:1280,height:900});
await page.evaluate(()=>document.getElementById('drawerDeck').classList.add('open'));
await page.locator('.db-browse').nth(1).click();
await page.screenshot({path:'output/deck-browser-desktop.png'});
console.log(JSON.stringify({errors,deckCounts:[78,78,36,140,50],readingUnchanged:before===after}));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});



