const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'reading_ios.html'), 'utf8');
const context = vm.createContext({});
for (const file of ['decks.js', 'lenormand_meanings.js', 'waite_meanings.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
vm.runInContext('let deckList = [];', context);
vm.runInContext(html.slice(html.indexOf('function loadDecksFromConfig()'), html.indexOf('function renderDecks()')), context);
vm.runInContext(html.slice(html.indexOf('function themeTarotMeaningMarkup('), html.indexOf('function initThemeTarotMeaningTabs(')), context);
const deck = vm.runInContext('deckList.find(d => d.name === "维特塔罗")', context);

test('all 78 Waite cards match actual image numbering and suit order', () => {
  assert.equal(deck._cards.length, 78);
  assert.equal(deck.aspectRatio, 250 / 429);
  assert.equal(deck.noReverse, false);
  assert.equal(new Set(deck._cards.map(c => c.name)).size, 78);
  const milestones = {0:'愚人',8:'力量',11:'正义',21:'世界',22:'宝剑王牌',35:'宝剑国王',36:'权杖王牌',49:'权杖国王',50:'圣杯王牌',63:'圣杯国王',64:'星币王牌',77:'星币国王'};
  for (const [id, name] of Object.entries(milestones)) assert.equal(deck._cards[id].name, name);
  deck._cards.forEach((card, index) => {
    assert(card._waite && card.meaning, String(index));
    assert.equal(card.number, String(index));
    assert.equal(card._imgUrl, `图片/盒子/维特塔罗/${index}.webp`);
    assert(fs.existsSync(path.join(root, card._imgUrl)));
  });
});

test('every upright and reversed reading is complete and renders the corresponding text', () => {
  for (const card of deck._cards) {
    const m = card.meaning;
    assert.equal(m.topics.length, 4);
    assert.equal(m.symbols.length, 4);
    assert.equal(m.caution.length, 1);
    assert(m.reversedCaution);
    for (const direction of ['upright', 'reversed']) {
      for (const field of [direction, `${direction}Simple`]) assert(m[field]?.trim(), `${card.name}: ${field}`);
      assert(m[`${direction}Text`].every(p => p.trim()));
      context.cardUnderTest = {...card, isReversed: direction === 'reversed'};
      const output = vm.runInContext('themeTarotMeaningMarkup(cardUnderTest)', context);
      assert(output.includes(direction === 'upright' ? '· 正位' : '· 逆位'));
      assert(output.includes(m[`${direction}Simple`]));
      assert(output.includes(direction === 'upright' ? m.caution[0] : m.reversedCaution));
      assert(output.includes('画面象征'));
      assert(!/undefined|THE FOOL.*THE FOOL|行星 ·|字母 ·/.test(output));
      for (const t of m.topics) {
        assert(t[direction]?.trim());
        assert(!/[\r\n]/.test(t[direction]));
        assert(output.includes(t[direction]));
      }
      for (const [name, text] of m.symbols) {
        assert(name && text && !/[\r\n]/.test(text));
        assert(output.includes(name) && output.includes(text));
      }
    }
    assert.notEqual(m.upright, m.reversed);
    assert.equal((m.caution[0].match(/[。！？]/g) || []).length, 1, card.name);
    assert.equal((m.reversedCaution.match(/[。！？]/g) || []).length, 1, card.name);
  }
});

test('Waite image, back and interpretation retain correct orientation and palette class', () => {
  const classes = new Set();
  const classList = {toggle(name, value) { value ? classes.add(name) : classes.delete(name); }};
  const ctx = vm.createContext({
    zoomCard: {classList, innerHTML: ''}, zoomFlip: {style: {}}, zoomInterpret: {classList: {toggle() {}}},
    _zoomThemeCard: {...deck._cards[22], isReversed: true}, _zoomShowingInterp: false,
    _zoomThemeSide: 'front', _zoomFrontSrc: '22.webp', _zoomBackSrc: 'back.webp',
    themeTarotMeaningMarkup: () => 'reading', initThemeTarotMeaningTabs() {}
  });
  vm.runInContext(html.slice(html.indexOf('function renderThemeTarotZoom()'), html.indexOf('function openCardZoom(')), ctx);
  vm.runInContext('renderThemeTarotZoom()', ctx);
  assert(classes.has('waite-zoom') && !classes.has('lenormand-zoom'));
  assert.match(ctx.zoomCard.innerHTML, /22.webp.*rotate\(180deg\)/);
  ctx._zoomThemeSide = 'back';
  vm.runInContext('renderThemeTarotZoom()', ctx);
  assert(ctx.zoomCard.innerHTML.includes('back.webp'));
  assert(!ctx.zoomCard.innerHTML.includes('rotate(180deg)'));
  ctx._zoomShowingInterp = true;
  vm.runInContext('renderThemeTarotZoom()', ctx);
  assert.equal(ctx.zoomCard.innerHTML, 'reading');
  assert(classes.has('waite-zoom') && classes.has('theme-tarot-zoom') && classes.has('interp'));
  assert.equal(ctx.zoomFlip.style.visibility, 'hidden');
});

test('shared zoom sizing fits common viewports without changing the card ratio', () => {
  assert(html.includes('--zoom-height: min(68vh, 600px, calc(86vw / var(--zoom-ratio)))'));
  assert(html.includes('--zoom-height: min(68svh, 600px, calc(86vw / var(--zoom-ratio)))'));
  for (const [width, height] of [[390,844],[1440,900],[844,390],[320,568]]) {
    for (const ratio of [250/429,1024/1365,.618034]) {
      const zoomHeight = Math.min(height*.68,600,width*.86/ratio);
      const zoomWidth = zoomHeight*ratio;
      assert(zoomHeight <= height*.68 + .001);
      assert(zoomWidth <= width*.86 + .001);
      assert(Math.abs(zoomWidth/zoomHeight-ratio) < .00001);
    }
  }
});
