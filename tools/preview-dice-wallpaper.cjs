const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8879/reading_ios.html');
 await page.waitForSelector('#astroDiceToggle');
 await page.evaluate(()=>document.querySelectorAll('.drawer').forEach(x=>x.classList.remove('open')));
 await page.click('#astroDiceToggle');
 await page.waitForSelector('.dice-flying-wheel');
 await page.waitForTimeout(1400);
 for(const theme of ['mystic','noir','parchment','dopamine']){
  await page.evaluate(theme=>{
   document.body.dataset.theme=theme;
   document.querySelectorAll('#desktop,#starfield').forEach(e=>{
    e.classList.add('has-wallpaper');
    e.style.setProperty('--reading-wallpaper','url("图片/壁纸/mystic-moon.webp")');
   });
  },theme);
  await page.screenshot({path:`output/dice-wallpaper-${theme}.png`});
  const style=await page.locator('#astroDicePanel .dice-flying-wheel').evaluate(e=>({background:getComputedStyle(e).backgroundColor,radius:getComputedStyle(e).borderRadius}));
  if(style.background==='rgba(0, 0, 0, 0)' || style.radius!=='50%')throw Error('Missing chart backing: '+theme);
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({themes:4,chartBacking:true,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
