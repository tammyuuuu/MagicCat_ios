const { chromium } = require(require.resolve('playwright', { paths: ['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'] }));
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      const tab = await browser.newPage({ viewport, serviceWorkers: 'block' });
      const errors = [];
      tab.on('pageerror', e => errors.push(e.message));
      const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8879';
      const isDesktop = viewport.width > 600;
      const response = await tab.goto(`${base}/${isDesktop ? 'phone.html?page=reading_ios.html' : 'reading_ios.html'}`);
      assert(response.ok(), `Preview returned ${response.status()} at ${viewport.width}px`);
      const page = isDesktop ? await (await tab.waitForSelector('#phone')).contentFrame() : tab;
      const reloadReading = () => isDesktop ? page.goto(`${base}/reading_ios.html`) : tab.reload();
      await page.waitForSelector('#tabSpread').catch(error => {
        throw new Error(`Reading page failed at ${viewport.width}px: ${errors.join('; ')}`, { cause: error });
      });
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
        await reloadReading();
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
      await reloadReading();
      await page.click('#tabRec');
      await page.locator('.record-item').first().click();
      assert.equal(await page.locator('#recordPage .placed-card').count(), 5);
      assert.equal(await page.inputValue('#rpQuestion'), '自由抽牌自动保存');
      await page.locator('#recordPage .placed-card').first().click();
      assert.equal(await page.locator('#cardZoom.active').count(), 1);
      await reloadReading();
      await page.click('#tabDeck');
      const mode = name => page.locator(`#deckGrid [data-lenormand-mode="${name}"]`);
      assert.equal(await page.locator('#lenormandMode').count(), 0);
      assert.equal(await mode('classic').getAttribute('aria-pressed'), 'true');
      if (!isDesktop) {
        await tab.setViewportSize({ ...viewport, width: 320 });
        const fits = await mode('rana').evaluate(button => {
          const { left, right } = button.parentElement.getBoundingClientRect();
          const tile = button.closest('.drawer-item').getBoundingClientRect();
          return left >= tile.left && right <= tile.right;
        });
        assert(fits, 'Both mode buttons fit inside the deck tile at 320px');
        await tab.setViewportSize(viewport);
      }
      await mode('classic').click();
      await page.click('#tabDeck');
      assert.equal(await page.evaluate(() => currentDeck.length), 36);

      for (const [modeName, total] of [['classic', 36], ['rana', 40]]) {
        if (modeName === 'rana') {
          await page.click('#tabDeck');
          await mode('rana').click();
          assert.equal(await mode('rana').getAttribute('aria-pressed'), 'true');
          assert.equal(await mode('classic').getAttribute('aria-pressed'), 'false');
          assert.equal(await page.locator('body > .placed-card').count(), 0);
          await page.click('#tabDeck');
        }
        assert.equal(await page.evaluate(() => currentDeck.length), total);
        assert.equal(await page.locator('button[data-spread="tableau"]').count(), 0);
        for (const [type, slots] of [['', 0], ['three', 3], ['choice', 5], ['pyramid', 4], ['inspiration', 6], ['hexagram', 7]]) {
          await page.click('#tabSpread');
          await page.click(`[data-spread="${type}"]`);
          assert.equal(await page.locator('.spread-slot').count(), slots);
          const drawn = await page.evaluate(({ type, modeName }) => {
            clearDesktop();
            const sorted = [...currentDeck].sort((a, b) => Number(b.number) - Number(a.number));
            const draws = sorted.slice(0, type === 'hexagram' ? 4 : 1);
            for (const card of draws) {
              placeCardAt(card, currentDeck.indexOf(card), 190, 150);
            }
            return {
              numbers: placedCards.map(el => Number(el._cardData.number)),
              slots: new Set(placedCards.map(el => el.dataset.spreadSlot)).size,
              reversed: placedCards.some(el => el.dataset.reversed === 'true'),
              sameMode: captureSpread().lenormandMode === modeName
            };
          }, { type, modeName });
          assert.equal(drawn.numbers.length, type === 'hexagram' ? 4 : 1);
          assert.equal(new Set(drawn.numbers).size, drawn.numbers.length);
          if (slots) assert.equal(drawn.slots, drawn.numbers.length);
          assert.equal(drawn.numbers[0], total);
          assert.equal(drawn.reversed, false);
          assert.equal(drawn.sameMode, true);
        }
        if (modeName === 'rana') {
          const type = await page.evaluate(() => activeSpread);
          await page.click('#tabSpread');
          tab.once('dialog', dialog => dialog.accept());
          await page.click('[data-spread="seasons"]');
          assert.equal(await page.evaluate(() => activeSpread), type);
          await page.click('#tabSpread');
        }
      }
      await page.evaluate(() => placedCards.slice(0, 4).forEach(el => el.classList.add('revealed')));
      await page.click('#recordBtn');
      await page.click('#rpSave');
      const rana = await page.evaluate(() => JSON.parse(localStorage.getItem('magiccat_records'))[0].spread);
      assert.equal(rana.lenormandMode, 'rana');
      assert.equal(rana.cards.length, 4);
      assert.deepEqual(rana.cards.slice(0, 4).map(c => Number(c.data.number)), [40, 39, 38, 37]);
      await reloadReading();
      await page.click('#tabDeck');
      assert.equal(await mode('rana').getAttribute('aria-pressed'), 'true');
      await page.locator('#deckGrid .drawer-item').filter({ hasText: '小小奇遇雷诺曼' }).click();
      assert.equal(await page.evaluate(() => currentDeck.length), 40);
      await page.click('#tabDeck');
      await mode('classic').click();
      assert.equal(await mode('classic').getAttribute('aria-pressed'), 'true');
      await page.click('#tabRec');
      await page.locator('.record-item').first().click();
      assert.deepEqual(await page.locator('#recordPage .placed-card').count(), 4);
      assert.match(await page.locator('.spread-record-tip').textContent(), /Rana40/);
      for (const number of [40, 39, 38, 37]) {
        const card = page.locator(`#recordPage .placed-card[data-card-id="config-deck-1-${number - 1}"]`);
        await card.click();
        await page.click('#zoomInterpret');
        await page.locator('.tt-meaning-index', { hasText: String(number) }).waitFor();
        assert.match(await page.locator('.theme-tarot-meaning').textContent(), /时间与事件/);
        await page.click('#zoomClose');
      }
      assert.equal(await page.evaluate(() => currentDeck.length), 36);
      assert.deepEqual(errors, []);
      console.log(`PASS ${viewport.width}: layouts, snapping, save/reload, zoom, Classic/Rana isolation, and all Rana interpretations`);
      await tab.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
