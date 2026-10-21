// Real HTTP + real Service Worker smoke test, including offline private records.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png'};
(async()=>{
  const missing=[],errors=[],consoleErrors=[];
  const server=http.createServer((req,res)=>{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      missing.push(name);res.writeHead(404);res.end();return;
    }
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server']});
    const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
    await page.goto(origin+'/manifest_ios.html');
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    const cached=await page.evaluate(async()=>{
      const names=await caches.keys(),core=names.find(n=>n.includes('core-'));
      return (await (await caches.open(core)).keys()).map(r=>new URL(r.url).pathname);
    });
    assert.ok(cached.includes('/manifest_ios.html'));
    assert.ok(cached.includes('/love_v01.js'));
    assert.ok(cached.includes('/love_library.css'));
    assert.ok(!cached.includes('/abundance_core.js'));
    // Artwork is cached on visit or by an optional offline pack, not core install.
    for(const name of ['reading_ios.html','bird_ios.html','wish_ios.html','manifest_ios.html'])
      await page.goto(origin+'/'+name,{waitUntil:'networkidle'});
    await page.click('#intentionTab');await page.fill('#intentionInput','离线也能继续的愿望');await page.click('#wishGenerateBtn');
    await page.click('#abundanceModeBtn');await page.locator('.xn-inline-add').first().click();
    await page.click('#loveModeBtn');await page.locator('[data-l-action=altar]').first().click();
    await page.click('#manifestRecordBtn');await page.click('#layoutSaveConfirm');
    const id=await page.evaluate(()=>loadRecords()[0].id);
    const historical={manifest_abundance_longterm_v2:'{"version":2,"history":[{"text":"保留旧历史"}]}',magiccatbird_love_v1:'{"version":1,"diary":[{"text":"保留旧日记"}]}'};
    await page.evaluate(data=>{for(const [key,value]of Object.entries(data))localStorage.setItem(key,value);},historical);
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator('.wish-bottle').count(),1);
    assert.equal(await page.locator('[data-altar-token]').count(),2);
    await page.click('#abundanceModeBtn');
    assert.equal(await page.locator('.xn-card').count(),56);
    await page.locator('[data-l-action=new]').click();await page.fill('#loveEditText','我可以在离线时记录自己。');await page.locator('#loveEditor .love-primary').click();
    await page.locator('[data-l-action=home]').click();await page.click('#loveModeBtn');
    assert.equal(await page.locator('.xj-card').count(),8);
    await page.locator('[data-l-action=preview]').first().click();await page.locator('[data-l-action=begin-preview]').click();
    assert.equal(await page.locator('#loveImmersion').count(),1);
    await page.locator('[data-l-action=end]').click();await page.locator('[data-l-action=home]').click();
    await page.evaluate(recordId=>openRecordPage({...loadRecords().find(r=>r.id===recordId),img:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}),id);
    await page.fill('#rpInterp','今天完成了一次离线练习。');await page.click('#rpSave');
    await page.reload();
    assert.ok(await page.evaluate(recordId=>loadRecords().some(r=>r.id===recordId && JSON.stringify(r).includes('今天完成了一次离线练习。')),id));
    await page.click('#abundanceModeBtn');assert.equal(await page.locator('.xn-card').count(),57);
    await page.locator('[data-l-action=home]').click();await page.click('#recTab');
    await page.locator('#recGrid .mind-record-main').first().click();
    assert.equal(await page.locator('[data-altar-token]').count(),2);
    for(const [key,value]of Object.entries(historical))assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),value);
    for(const name of ['reading_ios.html','bird_ios.html','wish_ios.html','manifest_ios.html']){
      await page.goto(origin+'/'+name);assert.ok(await page.locator('body').count());
    }
    assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
    console.log(JSON.stringify({realServiceWorker:true,coreResources:cached.length,removedFileNotCached:true,offlineReload:true,offlineAffirmationEdit:true,offlineScenePlayback:true,offlineDiarySave:true,offlineRecordRestore:true,fourPagesOffline:true,legacyDataUnchanged:true,missing,errors,consoleErrors}));
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
