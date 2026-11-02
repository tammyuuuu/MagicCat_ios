const assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const desktop=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 const mobile=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const errors=[];desktop.on('pageerror',e=>errors.push(e.message));mobile.on('pageerror',e=>errors.push(e.message));
 for(const name of ['reading','manifest','bird','wish']){
  await desktop.goto(`http://127.0.0.1:8878/${name}_ios.html`);
  await desktop.waitForURL('**/phone.html?*');
  const frame=desktop.frameLocator('#phone');
  await frame.locator('body').waitFor();
  const dimensions=await frame.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight}));
  assert.equal(dimensions.width,430);assert.equal(dimensions.height,1000);
  const box=await desktop.locator('#phone').boundingBox();assert.equal(box.x,505);
  await desktop.screenshot({path:`output/phone-layout-${name}-desktop.png`});
  await mobile.goto(`http://127.0.0.1:8878/${name}_ios.html`);
  assert(mobile.url().includes(`${name}_ios.html`));
  assert.equal(await mobile.locator('#phone').count(),0);
  assert.equal(await mobile.evaluate(()=>innerWidth),393);
 }
 await desktop.goto('http://127.0.0.1:8878/reading_ios.html');
 const f=desktop.frameLocator('#phone');
 await f.locator('.db-browse').first().waitFor({state:'attached'});
 await f.locator('body').evaluate(()=>document.getElementById('drawerDeck').classList.add('open'));
 await f.locator('.db-browse').first().click();
 await f.locator('#dbDeck').selectOption('config-deck-2');
 await f.locator('.db-card').first().click();
 await f.locator('#zoomCard img').evaluate(i=>i.decode());
 const image=await f.locator('#zoomCard img').boundingBox();
 assert(image.x>=505 && image.x+image.width<=935);
 await desktop.screenshot({path:'output/phone-layout-reading-card-desktop.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({desktopWidth:430,mobileWidth:393,pages:4,cardZoomContained:true,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
