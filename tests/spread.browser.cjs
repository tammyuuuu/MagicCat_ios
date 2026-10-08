const { chromium } = require(require.resolve('playwright', { paths: ['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'] }));
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      const page = await browser.newPage({ viewport });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${process.env.PREVIEW_URL || 'http://127.0.0.1:8879'}/reading_ios.html`);
      await page.waitForSelector('#tabSpread');
      for (const [type, count] of [['three', 3], ['choice', 5], ['inspiration', 6], ['pyramid', 4], ['hexagram', 7]]) {
        await page.click('#tabSpread');
        await page.click(`[data-spread="${type}"]`);
        assert.equal(await page.locator('.spread-slot').count(), count);
        await page.evaluate(() => {
          clearDesktop();
          placeCardWithFlip({ id: 'spread-test', name: '测试牌', number: '1' }, 0, 100, 120, true);
          placedCards[0].classList.add('revealed');
        });
        assert.equal(await page.locator('.spread-slot.occupied').count(), 1);
        if (type === 'inspiration') {
          const before = await page.locator('body > .placed-card').boundingBox();
          const slot = await page.locator('body > .placed-card').getAttribute('data-spread-slot');
          await page.click('.spread-swap');
          assert.equal(await page.locator('body > .placed-card').getAttribute('data-spread-slot'), slot);
          const after = await page.locator('body > .placed-card').boundingBox();
          assert.ok(Math.abs(after.y - before.y) > 30);
        }
        await page.click('#recordBtn');
        assert.equal(await page.locator('#recordPage .placed-card').count(), 1);
        await page.fill('#rpQuestion', '保存牌阵测试');
        await page.click('#rpSave');
        if (type === 'inspiration') {
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('magiccat_records'))[0].spread.swapped), true);
        }
        await page.reload();
        await page.click('#tabRec');
        await page.locator('.record-item').first().click();
        assert.equal(await page.locator('#recordPage .placed-card').count(), 1);
        assert.equal(await page.inputValue('#rpQuestion'), '保存牌阵测试');
        assert.equal(await page.locator('#recordPage .placed-card').getAttribute('data-reversed'), 'true');
        await page.locator('#recordPage .placed-card').click();
        assert.equal(await page.locator('#cardZoom.active').count(), 1);
        await page.click('#zoomClose'); await page.click('#rpCancel');
      }
      await page.evaluate(() => { clearDesktop(); selectDeckAndOpen(deckList.find(d => d.name === '维特塔罗')); });
      await page.click('#tabSpread'); await page.click('[data-spread="seasons"]');
      assert.equal(await page.locator('.season-slot').count(), 5);
      for (let i = 0; i < 5; i++) {
        await page.click(`.season-slot[data-slot="${i}"]`);
        const group = await page.evaluate(() => ({ total: currentDeck.length, correct: currentDeck.every(c => tarotGroup(c) === SEASON_GROUPS[seasonSlot]) }));
        assert.equal(group.total, i === 0 ? 22 : 14);
        assert.equal(group.correct, true);
        await page.evaluate(() => { placeCardAt(currentDeck[0], 0, 100, 120); placedCards.at(-1).classList.add('revealed'); });
        assert.equal(await page.locator(`body > .placed-card[data-spread-slot="${i}"]`).count(), 1);
      }
      await page.click('#recordBtn'); await page.click('#rpSave');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('magiccat_records'))[0].spread.cards.length), 5);
      await page.click('#tabSpread'); await page.click('[data-spread=""]');
      assert.equal(await page.evaluate(() => currentDeck.length), 78);
      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) {
          placeCardAt(currentDeck[i], i, 30 + i * 55, 110 + i * 25);
          placedCards.at(-1).classList.add('revealed');
        }
      });
      await page.click('#recordBtn');
      assert.equal(await page.locator('#captureOverlay.active').count(), 0);
      assert.equal(await page.locator('#recordPage .placed-card').count(), 5);
      assert.equal(await page.locator('#recordPage .spread-record-slot').count(), 0);
      await page.fill('#rpQuestion', '自由抽牌自动保存');
      await page.click('#rpSave');
      const free = await page.evaluate(() => JSON.parse(localStorage.getItem('magiccat_records'))[0]);
      assert.equal(free.spread.type, null);
      assert.equal(free.spread.cards.length, 5);
      assert.equal(free.img, null);
      await page.reload();
      await page.click('#tabRec');
      await page.locator('.record-item').first().click();
      assert.equal(await page.locator('#recordPage .placed-card').count(), 5);
      assert.equal(await page.inputValue('#rpQuestion'), '自由抽牌自动保存');
      await page.locator('#recordPage .placed-card').first().click();
      assert.equal(await page.locator('#cardZoom.active').count(), 1);
      assert.deepEqual(errors, []);
      console.log(`PASS ${viewport.width}: layouts, snapping, save/reload, reversal, zoom, free automatic records`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
