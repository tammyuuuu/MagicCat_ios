const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'reading_ios.html'), 'utf8');
const context = vm.createContext({});
for (const name of ['decks.js', 'reading_catalog.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context);
}
vm.runInContext('let deckList = [];', context);
vm.runInContext(html.slice(html.indexOf('function loadDecksFromConfig()'), html.indexOf('const LENORMAND_MODE_KEY')), context);
context.meaningData = Object.assign({}, ...['waite','lenormand','theme'].map(pack => JSON.parse(fs.readFileSync(path.join(root, 'reading-data', pack + '.json'), 'utf8'))));
vm.runInContext('deckList.forEach(deck => deck._cards.forEach(card => { if (meaningData[card.id]) card.meaning = meaningData[card.id]; }))', context);
vm.runInContext(html.slice(html.indexOf('function themeTarotMeaningMarkup('), html.indexOf('function initThemeTarotMeaningTabs(')), context);
const allCards = vm.runInContext('deckList.find(d => d.name === "小小奇遇雷诺曼")._cards', context);

const cards = allCards.slice(0, vm.runInContext('deckList.find(d => d.classicCardCount).classicCardCount', context));

test('Rana adds four numbered cards with artwork, topic tabs and complete contextual meanings', () => {
  assert.equal(allCards.length, 40);
  const names = new Set(allCards.map(card => card.englishName.toLowerCase()));
  assert.deepEqual(Array.from(allCards.slice(36), card => card.name), ['灵体', '香炉', '床', '市场']);
  allCards.slice(36).forEach((card, i) => {
    assert.equal(card.number, String(i + 37));
    assert(fs.existsSync(path.join(root, card._imgUrl)));
    assert.equal(card.meaning.topics.length, 4);
    assert.equal(card.meaning.symbols.length, 4);
    assert.equal(card.meaning.combination.examples.length, 3);
    assert(card.meaning.uprightText.length >= 3);
    for (const [pair] of card.meaning.combination.examples) {
      const [first, second] = pair.toLowerCase().split(' + ');
      assert.equal(first, card.englishName.toLowerCase());
      assert(names.has(second));
    }
    context.cardUnderTest = card;
    const output = vm.runInContext('themeTarotMeaningMarkup(cardUnderTest)', context);
    for (const label of ['正面表现', '负面表现', '人物', '时间与事件', '组合逻辑']) assert(output.includes(label));
    assert(!output.includes('undefined'));
  });
});

test('all 36 cards map to their numbered artwork and complete interpretations', () => {
  assert.equal(cards.length, 36);
  assert.equal(vm.runInContext('deckList.find(d => d.name === "小小奇遇雷诺曼").noReverse', context), true);
  cards.forEach((card, index) => {
    assert.equal(card.number, String(index + 1).padStart(2, '0'));
    assert.equal(card._imgUrl, `图片/小小奇遇雷诺曼/${index + 1}.webp`);
    assert(fs.existsSync(path.join(root, card._imgUrl)));
    assert(card._lenormand);
    assert.equal(card.meaning.topics.length, 4);
    assert.equal(card.meaning.symbols.length, 4);
    assert.equal(card.meaning.combination.examples.length, 3);
    assert(card.meaning.uprightText.length && card.meaning.caution.length);
    assert(!JSON.stringify(card).includes('===='));
  });
  assert.equal(cards[18].name, '灯塔');
});

test('every interpretation renders symbols, topics and combinations without tarot metadata', () => {
  for (const card of cards) {
    context.cardUnderTest = { ...card, isReversed: true };
    const output = vm.runInContext('themeTarotMeaningMarkup(cardUnderTest)', context);
    for (const text of ['画面象征', '组合逻辑', '需要注意', card.meaning.uprightSimple]) assert(output.includes(text));
    assert.equal((output.match(/role="tab"/g) || []).length, 4);
    assert.equal((output.match(/tt-symbol-item/g) || []).length, 4);
    for (const [pair, text] of card.meaning.combination.examples) assert(output.includes(pair) && output.includes(text));
    assert(!/undefined|元素 ·|行星 ·|字母 ·|· 正位|· 逆位/.test(output));
  }
});

test('combination names match actual cards and vary across the deck', () => {
  const names = new Set(cards.map(card => card.englishName.toLowerCase()));
  const partners = new Set();
  for (const card of cards) {
    const seen = new Set();
    for (const [pair] of card.meaning.combination.examples) {
      const [first, second] = pair.toLowerCase().split(' + ');
      assert.equal(first, card.englishName.toLowerCase());
      assert(names.has(second), pair);
      assert(!seen.has(second), pair);
      seen.add(second);
      partners.add(second);
    }
  }
  assert(partners.size >= 30);
});

test('all topic and symbol descriptions are single paragraphs and cautions contain one sentence', () => {
  for (const card of cards) {
    for (const topic of card.meaning.topics) {
      assert(topic.upright.trim());
      assert(!/[\r\n]/.test(topic.upright), `${card.name}: ${topic.label}`);
    }
    for (const [name, text] of card.meaning.symbols) {
      assert(text.trim());
      assert(!/[\r\n]/.test(text), `${card.name}: ${name}`);
    }
    assert.equal(card.meaning.caution.length, 1, card.name);
    assert(!/[\r\n]/.test(card.meaning.caution[0]), card.name);
    assert.equal((card.meaning.caution[0].match(/[。！？]/g) || []).length, 1, card.name);
  }
});

test('tarot major symbols remain visible and minor symbols remain hidden', () => {
  for (const [art, visible] of [['fool', true], ['wands-ace', false]]) {
    context.cardUnderTest = { name: '测试', _themeArt: art, meaning: { symbols: [['图案', '含义']] } };
    const output = vm.runInContext('themeTarotMeaningMarkup(cardUnderTest)', context);
    assert.equal(output.includes('画面象征'), visible);
    assert(output.includes('· 正位'));
  }
});

test('page inline scripts compile', () => {
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
});
