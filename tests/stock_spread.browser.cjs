const assert = require('node:assert/strict');
const { chromium } = require(require.resolve('playwright', {
  paths: ['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']
}));

async function checkStockSpread(browser, viewport, hasTouch) {
  const tab = await browser.newPage({ viewport, hasTouch, serviceWorkers: 'block' });
  const errors = [];
  tab.on('pageerror', error => errors.push(error.message));
  const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8879';
  const readingUrl = `${base}/reading_ios.html`;
  assert((await tab.goto(hasTouch ? readingUrl : `${base}/phone.html?page=reading_ios.html`)).ok());
  const page = hasTouch ? tab : await (await tab.waitForSelector('#phone')).contentFrame();
  const press = locator => hasTouch ? locator.tap() : locator.click();
  const id = name => page.locator(`#${name}`);
  const entry = name => page.locator('#deckGrid .drawer-item').filter({ hasText: name }).locator('.gem-label');
  const cards = page.locator('body > .stock-placement');
  const status = page.locator('.stock-draw-status');
  const touch = hasTouch ? await tab.context().newCDPSession(tab) : null;
  const options = page.locator('#drawerSpread .spread-options button:visible');
  const readCards = () => cards.evaluateAll(elements => elements.map(el => ({
    number: Number(el._cardData.number),
    slot: Number(el.dataset.spreadSlot),
    reversed: el.dataset.reversed,
    revealed: el.classList.contains('revealed'),
  })));
  async function dragFromFan() {
    const point = await (await page.waitForFunction(() => {
      for (const card of document.querySelectorAll('#fanArea.active .fan-card')) {
        const box = card.getBoundingClientRect();
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);
        if (document.elementFromPoint(x, y)?.closest('.fan-card') === card) return { x, y };
      }
    })).jsonValue();
    if (touch) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      for (const offset of [26, 65, 110]) {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: point.x, y: point.y - offset }],
        });
      }
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const frame = await tab.locator('#phone').boundingBox();
      const x = point.x + frame.x;
      const y = point.y + frame.y;
      await tab.mouse.move(x, y);
      await tab.mouse.down();
      await tab.mouse.move(x, y - 110, { steps: 8 });
      await tab.mouse.up();
    }
  }

  try {
    await press(id('tabSpread'));
    assert.equal(await page.locator('#drawerSpread [data-spread="stock-monthly"]').isVisible(), false);
    await press(id('tabDeck'));
    await press(entry('股市占卜牌'));
    await press(id('tabSpread'));
    assert.deepEqual(await options.evaluateAll(buttons => buttons.map(button => button.dataset.spread)), ['stock-monthly']);
    await press(options.first());
    assert.deepEqual(await page.locator('.spread-slot span').allTextContents(), ['交易决策', '上月', '当月', '下月']);
    assert.equal(await id('fanArea').isVisible(), true);
    assert.equal(await page.evaluate(() => currentDeck.length === 6 && currentDeck.every(card => card.stockRole === 'decision')), true);

    const metadata = await page.evaluate(async () => {
      const deck = deckList.find(d => d.name === '股市占卜牌');
      const imageUrls = [...deck._cards.map(card => card._imgUrl), deck._backImg];
      await Promise.all(imageUrls.map(async url => {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (image.naturalWidth !== 1024 || image.naturalHeight !== 1536) throw Error(url);
      }));
      return deck._cards.map(({ number, name, stockRole, amplitude, closingReturn }) =>
        [Number(number), name, stockRole, amplitude || null, closingReturn || null]);
    });
    assert.deepEqual(metadata.map(card => card[0]), Array.from({ length: 36 }, (_, i) => i + 1));
    assert.deepEqual(metadata[0], [1, '升旗·弱幅', 'trend', '8.60%', '+4.20%']);
    assert.deepEqual(metadata[29], [30, '井绳·强幅', 'trend', '25.00%', '-0.50%']);
    assert(metadata.slice(0, 30).every(card => card[2] === 'trend' && card[3] && card[4]));
    assert.deepEqual(metadata.slice(30).map(card => card.slice(1, 3)), [
      '非常值得买入', '值得买入', '静待时机', '尚需观察', '暂不值得买入', '不值得买入'
    ].map(name => [name, 'decision']));

    await dragFromFan();
    const [decision] = await readCards();
    assert(decision.number >= 31 && decision.number <= 36);
    assert.equal(decision.slot, 0);
    assert.equal(decision.revealed, false);
    assert.equal(await id('fanArea').isVisible(), false);
    await press(id('recordBtn'));
    assert.equal(await id('recordPage').isVisible(), false);
    await press(cards.first());
    assert.equal(await status.textContent(), '从扇形牌堆拖出上月趋势牌');
    assert.equal(await page.evaluate(() => currentDeck.length === 30 && currentDeck.every(card => card.stockRole === 'trend')), true);
    for (const month of ['上月', '当月', '下月']) {
      assert.equal(await status.textContent(), `从扇形牌堆拖出${month}趋势牌`);
      await dragFromFan();
    }
    assert.equal(await id('fanArea').isVisible(), false);
    const drawn = await readCards();
    assert.deepEqual(drawn.map(card => card.slot), [0, 1, 2, 3]);
    assert.deepEqual(drawn.map(card => card.revealed), [true, false, false, false]);
    assert.equal(drawn[0].number, decision.number);
    assert(drawn.slice(1).every(card => card.number >= 1 && card.number <= 30));
    assert.equal(new Set(drawn.map(card => card.number)).size, 4);
    assert(drawn.every(card => card.reversed === 'false'));
    const [top, left, center, right] = await cards.evaluateAll(elements => elements.map(el => el.getBoundingClientRect().toJSON()));
    const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    assert(Math.abs(top.x - center.x) < 1 && top.y + top.height < center.y);
    assert(Math.abs(left.y - center.y) < 1 && Math.abs(right.y - center.y) < 1);
    assert(left.x >= 0 && left.x + left.width < center.x && center.x + center.width < right.x &&
      right.x + right.width <= width && right.y + right.height < height);
    for (let i = 1; i <= 3; i++) {
      await press(cards.nth(i));
      await page.waitForFunction(slot => document.querySelector(`body > .stock-placement[data-spread-slot="${slot}"]`)?.classList.contains('revealed'), i);
    }
    await cards.nth(1).locator('.card-flipper').evaluate(flipper =>
      Promise.allSettled(flipper.getAnimations().map(animation => animation.finished)));
    await press(cards.nth(1));
    await id('cardZoom').waitFor({ state: 'visible' });
    await press(id('zoomClose'));
    await press(id('recordBtn'));
    assert.deepEqual(await page.locator('#rpStockMatch option').allTextContents(), ['请选择', '大体吻合', '部分吻合', '不吻合']);
    await id('rpStockMatch').selectOption('不吻合');
    await press(id('rpSave'));
    assert.deepEqual((await readCards()).map(card => card.number), drawn.map(card => card.number));

    await page.goto(readingUrl);
    await press(id('tabRec'));
    await press(page.locator('.record-item').first());
    assert.equal(await id('rpStockMatch').inputValue(), '不吻合');
    assert.equal(await page.locator('#recordPage .placed-card.revealed').count(), 4);
    await id('rpStockMatch').selectOption('部分吻合');
    await press(id('rpSave'));
    assert.equal(await page.evaluate(() => loadRecords()[0].spread.stockMatch), '部分吻合');
    await press(id('tabDeck'));
    await press(entry('股市占卜牌'));
    await dragFromFan();
    await press(id('clearBtn'));
    assert.equal(await cards.count(), 0);
    assert.equal(await id('fanArea').isVisible(), true);
    await dragFromFan();
    await press(id('tabDeck'));
    await press(entry('维特塔罗'));
    assert.equal(await cards.count(), 0);
    assert.equal(await status.count(), 0);
    assert.equal(await page.evaluate(() => currentDeck.length), 78);
    await press(id('tabSpread'));
    assert.equal(await page.locator('#drawerSpread [data-spread="stock-monthly"]').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}×${viewport.height}: artwork, stock spread isolation, draw order, layout and record persistence`);
  } finally {
    await tab.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await checkStockSpread(browser, viewport, viewport.width < 600);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
