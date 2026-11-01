const fs=require('fs');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const b=await chromium.launch({headless:true,channel:'msedge'});
 const p=await b.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await p.goto('http://127.0.0.1:8878/reading_ios.html');
 await p.waitForSelector('.db-browse',{state:'attached'});
 await p.evaluate(()=>document.getElementById('drawerDeck').classList.add('open'));
 await p.locator('.db-browse').first().click();
 await p.selectOption('#dbDeck','config-deck-2');
 const reports=[];
 const layouts=JSON.parse(fs.readFileSync('output/cosmic-redesign/layouts.json','utf8'));
 for(const [id,label] of [[0,'short'],[82,'long'],[128,'comma']]){
  await p.locator('.db-card').nth(id).click();
  await p.locator('#zoomCard img').evaluate(i=>i.decode());
  await p.locator('#cardZoom .zoom-wrap').evaluate(async e=>Promise.all(e.getAnimations().map(a=>a.finished)));
  await p.screenshot({path:`output/cosmic-redesign/mobile-${label}.png`});
  const box=await p.locator('#zoomCard img').boundingBox();
  reports.push({label,width:box.width,chinesePixels:Math.round(layouts[id].size*box.width/1024),englishPixels:Math.round(46*box.width/1024)});
  await p.locator('#zoomClose').click();
 }
 console.log(JSON.stringify(reports));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
