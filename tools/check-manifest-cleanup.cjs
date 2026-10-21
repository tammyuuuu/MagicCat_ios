// Compare live styles before/after dead-code removal; run with --baseline before edits.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths:['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output');
const baseline = path.join(output, 'manifest-cleanup-baseline.json');
(async () => {
  fs.mkdirSync(output, {recursive:true});
  const browser = await chromium.launch({headless:true, channel:'msedge', args:['--no-proxy-server']});
  try {
    const page = await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const errors = [], failed = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('http://127.0.0.1:8883/**', route => {
      const file = path.resolve(root, '.' + decodeURIComponent(new URL(route.request().url()).pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { failed.push(file); return route.fulfill({status:404,body:''}); }
      return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});
    });
    const results = {};
    for (const width of [393,1440]) for (const theme of ['mystic','noir','parchment','dopamine']) {
      await page.setViewportSize({width,height:852});
      await page.goto('http://127.0.0.1:8883/manifest_ios.html');
      await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
      await page.evaluate(t => { if(t==='mystic')document.body.removeAttribute('data-theme');else document.body.dataset.theme=t; },theme);
      for (const view of ['free','affirmations','filters','editor','sats','preview','immersion','diary']) {
        await page.evaluate(v => {
          if(v==='free')setRitualMode('free');
          if(v==='affirmations')setRitualMode('abundance');
          if(v==='filters')document.querySelector('[data-l-action=filters]').click();
          if(v==='editor')document.querySelector('[data-l-action=new]').click();
          if(v==='sats')setRitualMode('love');
          if(v==='preview')document.querySelector('[data-l-action=preview]').click();
          if(v==='immersion')document.querySelector('[data-l-action=begin-preview]').click();
          if(v==='diary'){document.querySelector('[data-l-action=end]').click();LoveV01.open('diary');}
        },view);
        results[`${width}/${theme}/${view}`] = await page.evaluate(() => {
          const roots = [...document.querySelectorAll('#lovePreview,#loveImmersion,#activateBtn,#intentionTab,#abundanceModeBtn,#loveModeBtn,#altar,#recordPage')];
          const nodes = [...new Set(roots.flatMap(r=>[r,...r.querySelectorAll('*')]))];
          return nodes.filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden').map(el=>{
            const s=getComputedStyle(el), rect=el.getBoundingClientRect();
            return [el.tagName,el.id,el.getAttribute('class'),...['color','background','border','border-radius','font','padding','margin','display','position','width','height','overflow','box-shadow','opacity','transform','animation','transition'].map(k=>s.getPropertyValue(k)),...[rect.x,rect.y,rect.width,rect.height].map(n=>Math.round(n*100)/100)];
          });
        });
      }
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    if(process.argv.includes('--baseline'))fs.writeFileSync(baseline,JSON.stringify(results));
    else {
      if(fs.existsSync(baseline)) {
        const before=JSON.parse(fs.readFileSync(baseline));
        for(const key of Object.keys(results))assert.deepEqual(results[key],before[key],key);
      }
      assert.equal(await page.locator('#abundanceWorkspace,[data-love-screen],[data-open-abundance],[data-open-love]').count(),0);
      assert.equal(await page.evaluate(()=>typeof AbundanceCore),'undefined');
      assert.equal(await page.evaluate(()=>localStorage.getItem('manifest_abundance_longterm_v2')),null);
    }
    console.log(JSON.stringify({baseline:process.argv.includes('--baseline'),styleStates:Object.keys(results).length,errors,failed}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
