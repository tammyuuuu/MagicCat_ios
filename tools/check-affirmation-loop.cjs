const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const root=path.resolve(__dirname,'..');
(async()=>{
 const missing=[],errors=[];
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(req.url);res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/manifest_ios.html`);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await context.setOffline(true);await page.reload();await page.clock.install();await page.click('#abundanceModeBtn');
  await page.selectOption('#affirmationTheme','财富与丰盛');assert.equal(await page.locator('.xn-card').count(),5);
  await page.locator('[data-l-action=affirmation-session]').click();
  const dialog=page.locator('#loveImmersion');assert.equal(await dialog.getAttribute('aria-labelledby'),'affirmationSessionTitle');assert.equal(await page.locator('#affirmationSessionTitle').textContent(),'财富与丰盛');
  assert.deepEqual(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}),[0,0,393,852]);
  const first=await page.locator('#satsFocusText').textContent();
  await page.clock.fastForward(6000);assert.notEqual(await page.locator('#satsFocusText').textContent(),first);
  for(let i=0;i<4;i++)await page.clock.fastForward(6000);
  assert.equal(await page.locator('#satsFocusText').textContent(),first);
  await page.locator('[data-l-action=affirmation-pause]').click();assert.equal(await page.locator('[data-l-action=affirmation-pause]').getAttribute('aria-pressed'),'true');
  await page.clock.fastForward(60000);assert.equal(await page.locator('#satsFocusText').textContent(),first);
  await page.locator('[data-l-action=affirmation-prev]').click();assert.equal(await page.locator('#affirmationPosition').textContent(),'5 / 5 · 循环');
  await page.selectOption('#satsSpeed','2');await page.clock.fastForward(30000);assert.equal(await page.locator('#affirmationPosition').textContent(),'5 / 5 · 循环');
  await page.locator('[data-l-action=affirmation-pause]').click();await page.clock.fastForward(3000);assert.equal(await page.locator('#satsFocusText').textContent(),first);
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#affirmationPosition').textContent(),'2 / 5 · 循环');
  await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await page.evaluate(()=>document.activeElement.dataset.lAction),'affirmation-session');
  await page.clock.fastForward(60000);assert.equal(await dialog.count(),0);
  await page.locator('.xn-heart').first().click();await page.locator('[data-l-action=filters]').click();await page.locator('[data-l-action=favorites]').click();
  await page.locator('[data-l-action=affirmation-session]').click();assert.equal(await page.locator('#affirmationPosition').textContent(),'1 / 1 · 循环');await page.clock.fastForward(6000);assert.equal(await page.locator('#satsFocusText').textContent(),first);await page.locator('[data-l-action=end]').click();
  await page.fill('#loveSearch','没有这样的心念xyz');assert.equal(await page.locator('[data-l-action=affirmation-session]').isDisabled(),true);
  await page.evaluate(()=>{const d=LoveV01.load();d.personNames.push('小鹿$&');d.personName='小鹿$&';d.affirmations.push({id:'private_loop_test',text:'Ta 温柔地支持我。\n我也可以照顾自己。',theme:'自爱 <测试>',public:false});LoveV01.save(d);LoveV01.enter('affirmations');});
  await page.selectOption('#affirmationTheme','自爱 <测试>');await page.locator('[data-l-action=affirmation-session]').click();assert.equal(await page.locator('#affirmationSessionTitle').textContent(),'自爱 <测试>');assert.ok((await page.locator('#satsFocusText').textContent()).includes('小鹿$&'));assert.equal(await page.locator('#affirmationSessionTitle *').count(),0);
  await page.locator('[data-l-action=end]').click();await page.evaluate(()=>setRitualMode('free'));await page.click('#loveModeBtn');await page.locator('[data-l-action=immerse]').first().click();
  assert.equal(await page.locator('.affirmation-controls').count(),0);await page.locator('[data-l-action=end]').click();await page.evaluate(()=>setRitualMode('free'));await page.click('#abundanceModeBtn');
  for(const theme of ['mystic','noir','parchment','dopamine'])for(const width of [393,1440]){
   await page.setViewportSize({width,height:852});await page.evaluate(t=>{if(t==='mystic')document.body.removeAttribute('data-theme');else document.body.dataset.theme=t;},theme);
   await page.selectOption('#affirmationTheme','事业与成长');await page.locator('[data-l-action=affirmation-session]').click();
   assert.ok(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return r.width===innerWidth&&r.height===innerHeight;}));
   assert.ok(await page.locator('.affirmation-control-buttons').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
   await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#satsFocusText').evaluate(el=>getComputedStyle(el).animationName),'none');
   if(width===393&&theme==='mystic'){fs.mkdirSync(path.join(root,'output'),{recursive:true});await page.screenshot({path:path.join(root,'output/affirmation-loop-mobile.png')});}
   await page.locator('[data-l-action=end]').click();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log(JSON.stringify({themeFilter:true,loopWrap:true,pauseResume:true,manualNavigation:true,speed:true,singleItem:true,emptyDisabled:true,customThemeAndLiteralNames:true,escapeAndTimerCleanup:true,focusRestored:true,satsUnchanged:true,fourThemesMobileDesktop:true,reducedMotion:true,realOffline:true,errors,missing}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
