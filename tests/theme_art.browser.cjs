const { chromium } = require(require.resolve('playwright', { paths: ['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'] }));
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true, channel:'msedge'});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844}});
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8879/reading_ios.html');
    await page.waitForSelector('#themeToggle');
    await page.evaluate(async()=>{
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    const files=JSON.parse(fs.readFileSync('offline-library.json','utf8')).find(g=>g.id==='theme-tarot').files;
    const results=await page.evaluate(async files=>{
      const results=[];
      for(const file of files){
        const response=await fetch(file.url);
        if(!response.ok)throw new Error(file.url+': '+response.status);
        const blob=await response.blob();
        const bitmap=await createImageBitmap(blob);
        results.push({url:file.url,bytes:blob.size,width:bitmap.width,height:bitmap.height});
        bitmap.close();
      }
      return results;
    },files);
    assert.equal(results.length,316);
    assert.ok(results.every(r=>r.bytes<=200000 && r.width===1000 && r.height===1618));
    await page.click('#themeToggle');
    for(const theme of ['mystic','noir','parchment','dopamine']){
      await page.click(`.ts-card[data-theme="${theme}"]`);
      const styles=await page.evaluate(()=>({theme:document.body.dataset.theme || 'mystic',back:getComputedStyle(document.body).getPropertyValue('--tarot-back-image'),front:getComputedStyle(document.body).getPropertyValue('--tarot-front-fool-image')}));
      assert.equal(styles.theme,theme);
      assert.ok(styles.back.includes(`back-${theme}.webp`));
      assert.ok(styles.front.includes(`front-fool-${theme}.webp`));
    }
    await page.click('#themeToggle');
    await page.screenshot({path:'output/theme-color/browser-mobile.png'});
    await context.setOffline(true);
    const offline=await page.evaluate(async files=>{
      for(const file of files){
        const response=await fetch(file.url);
        if(!response.ok)throw new Error('Offline: '+file.url);
        const bitmap=await createImageBitmap(await response.blob()); bitmap.close();
      }
      return files.length;
    },files);
    assert.equal(offline,316);
    assert.deepEqual(errors,[]);
    console.log('PASS: 316 images decode online and offline; all 1000x1618 and <=200000 bytes; four theme switches; no page errors.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
