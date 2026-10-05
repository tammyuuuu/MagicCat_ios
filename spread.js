// Layout coordinates also serve as the portable format for saved spreads.
const SPREADS = {
  three: { name: '三张牌', slots: [['过去', .18, .48], ['现在', .5, .48], ['未来', .82, .48]] },
  choice: { name: '二选一', slots: [['当前处境', .5, .79], ['A 的发展', .25, .47], ['A 的结果', .25, .15], ['B 的发展', .75, .47], ['B 的结果', .75, .15]] },
  inspiration: { name: '灵感对应', slots: [['我对对方的看法', .18, .28], ['我眼中的关系现状', .5, .28], ['我期待的未来', .82, .28], ['对方对我的看法', .18, .7], ['对方眼中的关系现状', .5, .7], ['对方期待的未来', .82, .7]] },
  seasons: { name: '四季牌阵', slots: [['本季主题 · 大牌', .5, .47], ['行动 · 权杖', .5, .12], ['情感 · 圣杯', .82, .47], ['思考 · 宝剑', .5, .82], ['物质 · 星币', .18, .47]] },
  pyramid: { name: '恋爱金字塔', slots: [['你', .18, .7], ['对方', .82, .7], ['感情现状', .5, .7], ['未来发展', .5, .25]] },
  hexagram: { name: '六芒星', slots: [['过去', .5, .12], ['现在', .18, .69], ['未来', .82, .69], ['对策建议', .5, .88], ['外部影响', .18, .31], ['态度与愿望', .82, .31], ['综合结果', .5, .5]] },
  venus: { name: '维纳斯', slots: [['我的心态', .18, .28], ['对方的心态', .82, .28], ['我对对方的影响', .5, .1], ['对方对我的影响', .5, .46], ['关系障碍', .5, .64], ['发展结果', .5, .84], ['我之后的感受', .18, .84], ['对方之后的感受', .82, .84]] }
};
const SEASON_GROUPS = ['major', 'wands', 'cups', 'swords', 'pentacles'];
let seasonSource = null;
let seasonSlot = 0;
let spreadNoticeTimer;
function showSpreadNotice(message) {
  let notice = document.getElementById('spreadNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'spreadNotice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    document.body.append(notice);
  }
  notice.textContent = message;
  notice.classList.add('visible');
  clearTimeout(spreadNoticeTimer);
  spreadNoticeTimer = setTimeout(() => notice.classList.remove('visible'), 4500);
}
function tarotGroup(card) {
  if (!card?._waite && !card?._themeTarot) return null;
  const name = card.name || '';
  for (const [label, group] of [['权杖', 'wands'], ['圣杯', 'cups'], ['宝剑', 'swords'], ['星币', 'pentacles']]) if (name.includes(label)) return group;
  return 'major';
}
function seasonDeckChosen() {
  seasonSource = currentDeck;
  seasonSlot = 0;
  filterSeasonDeck();
}
function filterSeasonDeck() {
  const cards = seasonSource.filter(c => tarotGroup(c) === SEASON_GROUPS[seasonSlot]);
  cards._images = seasonSource._images;
  cards._themeTarot = seasonSource._themeTarot;
  currentDeck = cards;
}
function selectSeasonSlot(index) {
  seasonSlot = index;
  filterSeasonDeck();
  openFan();
  renderSpread();
}
let activeSpread = null;
let inspirationSwapped = false;
let pendingSpread = null;
let pendingDice = null;
let lastDiceResult = null;
let recordCategory = 'tarot';
const recordTabs = document.createElement('div');
recordTabs.className = 'record-category-tabs';
recordTabs.setAttribute('role', 'tablist');
for (const [category, label] of [['tarot', '塔罗'], ['dice', '骰子']]) {
  const tab = document.createElement('button');
  tab.type = 'button'; tab.textContent = label; tab.dataset.category = category;
  tab.setAttribute('role', 'tab');
  tab.onclick = () => { recordCategory = category; renderRecords(); };
  recordTabs.append(tab);
}
document.getElementById('recGrid').before(recordTabs);
function updateRecordTabs() {
  recordTabs.querySelectorAll('button').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.category === recordCategory)));
}
updateRecordTabs();
function beginDiceRecord() {
  if (astroDiceRolling) { showSpreadNotice('请等骰子停稳后再记录。'); return; }
  if (!lastDiceResult) { showSpreadNotice('请先投掷一次骰子。'); return; }
  pendingDice = lastDiceResult.map(value => ({ ...value }));
  pendingSpread = null; _captureDataUrl = null;
  openRecordPage(null);
}
function chooseRecordKind() {
  if (!astroDicePanel.classList.contains('open')) { beginTarotRecord(); return; }
  if (!placedCards.length) { beginDiceRecord(); return; }
  const overlay = document.createElement('div'); overlay.className = 'record-kind-overlay';
  const panel = document.createElement('div'); panel.className = 'record-kind-panel';
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '选择记录内容');
  const title = document.createElement('p'); title.textContent = '记录哪一项？'; panel.append(title);
  for (const [label, action] of [['塔罗', beginTarotRecord], ['骰子', beginDiceRecord], ['取消', () => {}]]) {
    const button = document.createElement('button'); button.textContent = label;
    button.onclick = () => { overlay.remove(); recordBtn.focus(); action(); }; panel.append(button);
  }
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.onkeydown = e => { if (e.key === 'Escape') { overlay.remove(); recordBtn.focus(); } };
  overlay.append(panel); document.body.append(overlay); panel.querySelector('button').focus();
}
function showDiceRecord(values) {
  rpPhoto.replaceChildren();
  const title = document.createElement('div'); title.className = 'spread-record-tip'; title.textContent = '占星骰子';
  const row = document.createElement('div'); row.className = 'dice-record-row';
  values.forEach((value, index) => {
    const tile = document.createElement('div'); tile.className = 'dice-record-tile';
    const symbol = document.createElement('div'); symbol.className = 'dice-record-symbol';
    if (value.icon && ASTRO_ICON_PATHS[value.icon]) symbol.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${ASTRO_ICON_PATHS[value.icon]}</svg>`;
    else symbol.textContent = value.symbol;
    const label = document.createElement('span'); label.textContent = value.name;
    const kind = document.createElement('small'); kind.textContent = ['行星', '星座', '宫位'][index];
    tile.append(kind, symbol, label); row.append(tile);
  });
  rpPhoto.append(title, row);
}
function spreadSlots(type = activeSpread) {
  return SPREADS[type].slots.map(([label, x, y]) => [label, x, type === 'inspiration' && inspirationSwapped ? (y === .28 ? .7 : .28) : y]);
}
const spreadLayer = document.createElement('div');
spreadLayer.id = 'spreadLayer';
document.body.append(spreadLayer);
const spreadTab = document.createElement('button');
spreadTab.id = 'tabSpread';
spreadTab.className = 'side-tab drawer-bookmark';
spreadTab.innerHTML = '<span class="tab-text">牌阵</span>';
document.body.append(spreadTab);
const spreadDrawer = document.createElement('div');
spreadDrawer.id = 'drawerSpread';
spreadDrawer.className = 'drawer drawer-left';
spreadDrawer.innerHTML = '<div class="drawer-title">✦ 牌 阵 ✦</div><div class="spread-options"></div><p class="spread-help">选择牌阵后，将卡牌拖入虚线框。<br>点击底部「记录」保存本次解读。</p>';
document.body.append(spreadDrawer);
// Retain the Venus definition only for previously saved records.
for (const [key, name] of [['', '自由摆牌'], ...Object.entries(SPREADS).filter(([key]) => key !== 'venus').sort(([, a], [, b]) => a.slots.length - b.slots.length).map(([key, spread]) => [key, spread.name])]) {
  const button = document.createElement('button');
  const description = {
    '': '自由拖动、排列卡牌，适合随心探索。',
    three: '从过去、现在与未来，观察事情的发展。',
    choice: '从当前处境出发，观察两个选择的发展与结果。',
    inspiration: '对照双方的看法、关系现状与未来期待。',
    seasons: '在季节更替时，观察接下来一个季度的整体主题，以及行动、情感、思考和物质生活的状态。',
    pyramid: '了解双方的状态、目前的感情关系与未来发展趋势。',
    hexagram: '梳理事情的过去、现在与未来，结合外部影响、自身态度和建议，探索整体走向。',
    venus: '深入了解双方的心态与彼此影响，探索关系障碍、发展走向及之后的感受。'
  }[key];
  const preview = document.createElement('span');
  preview.className = `spread-mini spread-mini-${key || 'free'}`;
  preview.setAttribute('aria-hidden', 'true');
  const positions = key ? SPREADS[key].slots.map(([, x, y]) => [x, y]) : [[.25, .5], [.5, .35], [.75, .55]];
  positions.forEach(([x, y], index) => {
    const tile = document.createElement('i');
    tile.style.left = `${x * 100}%`; tile.style.top = `${y * 100}%`;
    if (!key) tile.style.transform = `translate(-50%, -50%) rotate(${(index - 1) * 13}deg)`;
    preview.append(tile);
  });
  const text = document.createElement('span'); text.className = 'spread-option-copy';
  const title = document.createElement('span'); title.className = 'spread-option-name'; title.textContent = name;
  const desc = document.createElement('span'); desc.className = 'spread-option-description'; desc.textContent = description;
  const note = document.createElement('span'); note.className = 'spread-option-note';
  note.textContent = key ? `${SPREADS[key].slots.length} 个牌位 · 保存牌阵` : '不限牌位 · 框选截图';
  text.append(title, desc, note);
  button.append(preview, text);
  button.dataset.spread = key;
  button.onclick = () => {
    if (key === 'seasons' && !SEASON_GROUPS.every(group => (seasonSource || currentDeck).some(c => tarotGroup(c) === group))) {
      alert('四季牌阵需要完整塔罗牌组，请先在牌盒选择维特塔罗或主题塔罗。');
      return;
    }
    const wasSeasons = activeSpread === 'seasons';
    if (activeSpread !== (key || null)) clearDesktop();
    activeSpread = key || null;
    if (activeSpread === 'seasons') {
      if (!wasSeasons) seasonDeckChosen();
      openFan();
    } else if (wasSeasons && seasonSource) {
      currentDeck = seasonSource; seasonSource = null; openFan();
    }
    placedCards.forEach(card => delete card.dataset.spreadSlot);
    spreadDrawer.classList.remove('open');
    renderSpread();
    if (activeSpread) placedCards.forEach(card => snapToSpread(card, true));
  };
  spreadDrawer.querySelector('.spread-options').append(button);
}
spreadTab.onclick = () => {
  drawerDeck.classList.remove('open'); drawerRec.classList.remove('open');
  spreadDrawer.classList.toggle('open');
};
[tabDeck, tabRec].forEach(tab => tab.addEventListener('click', () => spreadDrawer.classList.remove('open')));
desktop.addEventListener('click', () => spreadDrawer.classList.remove('open'));

function spreadGeometry() {
  const top = 76;
  const bottom = fanArea.classList.contains('active') ? fanArea.getBoundingClientRect().top - 28 : innerHeight - 105;
  const width = Math.max(220, innerWidth - 90);
  const height = Math.max(200, bottom - top);
  const cardWidth = Math.min(112, width * .22, height / (activeSpread === 'venus' ? 10 : ['inspiration', 'pyramid'].includes(activeSpread) ? 3.8 : SPREADS[activeSpread]?.slots.length > 3 ? 5.6 : 2.1));
  return { left: 55, top, width, height, cardWidth };
}
function renderSpread() {
  spreadLayer.replaceChildren();
  spreadDrawer.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.spread || null) === activeSpread)));
  if (!activeSpread) return;
  const g = spreadGeometry();
  spreadSlots().forEach(([label, x, y], index) => {
    const slot = document.createElement('div');
    slot.className = 'spread-slot'; slot.dataset.slot = index;
    Object.assign(slot.style, { left: `${g.left + x * g.width - g.cardWidth / 2}px`, top: `${g.top + y * g.height - g.cardWidth * .75}px`, width: `${g.cardWidth}px`, height: `${g.cardWidth * 1.5}px` });
    const caption = document.createElement('span'); caption.textContent = label; slot.append(caption);
    if (activeSpread === 'seasons') {
      slot.classList.add('season-slot');
      slot.setAttribute('role', 'button'); slot.tabIndex = 0;
      slot.setAttribute('aria-label', `抽取${label}`);
      slot.setAttribute('aria-pressed', String(index === seasonSlot));
      if (index === seasonSlot) slot.classList.add('selected');
      slot.onclick = () => selectSeasonSlot(index);
      slot.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSeasonSlot(index); } };
    }
    if (placedCards.some(c => c.isConnected && c.dataset.spreadSlot === String(index))) slot.classList.add('occupied');
    spreadLayer.append(slot);
  });
  if (activeSpread === 'inspiration') {
    const swap = document.createElement('button');
    swap.className = 'spread-swap'; swap.type = 'button';
    swap.textContent = '⇅';
    const swapLabel = `${inspirationSwapped ? '自己在下排' : '自己在上排'}，点击上下互换`;
    swap.setAttribute('aria-label', swapLabel);
    swap.title = swapLabel;
    swap.setAttribute('aria-pressed', String(inspirationSwapped));
    swap.style.left = `${g.left + g.width + 12}px`;
    swap.style.top = `${g.top + g.height * .51}px`;
    swap.onclick = () => {
      inspirationSwapped = !inspirationSwapped;
      renderSpread();
      placedCards.filter(c => c.dataset.spreadSlot !== undefined).forEach(c => snapToSpread(c, true, c.dataset.spreadSlot));
    };
    spreadLayer.append(swap);
  }
}
function snapToSpread(card, force = false, desiredSlot) {
  if (!activeSpread || !card?.isConnected) return;
  const rect = card.getBoundingClientRect();
  const slots = [...spreadLayer.querySelectorAll('.spread-slot')].map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el }) => activeSpread !== 'seasons' || SEASON_GROUPS[Number(el.dataset.slot)] === tarotGroup(card._cardData))
    .filter(({ el }) => !placedCards.some(c => c !== card && c.isConnected && c.dataset.spreadSlot === el.dataset.slot));
  slots.sort((a, b) => Math.hypot(a.r.x + a.r.width / 2 - rect.x - rect.width / 2, a.r.y + a.r.height / 2 - rect.y - rect.height / 2) - Math.hypot(b.r.x + b.r.width / 2 - rect.x - rect.width / 2, b.r.y + b.r.height / 2 - rect.y - rect.height / 2));
  const target = desiredSlot !== undefined ? slots.find(s => s.el.dataset.slot === String(desiredSlot)) : slots[0];
  if (!target) { delete card.dataset.spreadSlot; renderSpread(); return; }
  const distance = Math.hypot(target.r.x + target.r.width / 2 - rect.x - rect.width / 2, target.r.y + target.r.height / 2 - rect.y - rect.height / 2);
  if (!force && distance > Math.max(target.r.width, target.r.height) * .85) { delete card.dataset.spreadSlot; renderSpread(); return; }
  card.dataset.spreadSlot = target.el.dataset.slot;
  const ratio = Number(card.style.getPropertyValue('--card-image-ratio')) || 2 / 3;
  const w = Math.min(target.r.width, target.r.height * ratio);
  card.style.width = `${w / fanScale}px`;
  card.style.left = `${target.r.x + (target.r.width - w) / 2 - (1 - fanScale) * (w / fanScale) / 2}px`;
  card.style.top = `${target.r.y + (target.r.height - w / ratio) / 2 - (1 - fanScale) * (w / fanScale / ratio) / 2}px`;
  renderSpread();
}
for (const event of ['pointerup', 'mouseup']) document.addEventListener(event, e => {
  const card = e.target.closest?.('.placed-card');
  if (card) setTimeout(() => snapToSpread(card), 0);
});
window.addEventListener('resize', () => {
  renderSpread();
  placedCards.filter(c => c.dataset.spreadSlot !== undefined).forEach(c => snapToSpread(c, true));
});

function captureSpread() {
  const g = spreadGeometry();
  return { type: activeSpread, slots: spreadSlots(), swapped: activeSpread === 'inspiration' && inspirationSwapped, aspect: g.width / g.height, cards: placedCards.filter(c => c.isConnected).map(c => {
    const r = c.getBoundingClientRect();
    return { data: c._cardData, reversed: c.dataset.reversed === 'true', revealed: c.classList.contains('revealed'), slot: c.dataset.spreadSlot, html: c.innerHTML, className: c.className, ratio: c.style.getPropertyValue('--card-image-ratio'), x: (r.x - g.left) / g.width, y: (r.y - g.top) / g.height, w: r.width / g.width };
  }) };
}
function showSpreadRecord(spread) {
  rpPhoto.replaceChildren();
  const tip = document.createElement('div'); tip.className = 'spread-record-tip';
  tip.textContent = `${SPREADS[spread.type].name} · 点击卡牌放大查看`;
  const board = document.createElement('div'); board.className = 'spread-record-board';
  board.dataset.spread = spread.type;
  board.style.aspectRatio = String(spread.aspect || 1);
  (spread.slots || SPREADS[spread.type].slots).forEach(([label, x, y]) => {
    const slot = document.createElement('div'); slot.className = 'spread-record-slot';
    slot.style.left = `${x * 100}%`; slot.style.top = `${y * 100}%`; slot.textContent = label;
    board.append(slot);
  });
  spread.cards.forEach(saved => {
    const card = document.createElement('div'); card.className = saved.className;
    card.innerHTML = saved.html; card._cardData = saved.data;
    card.dataset.cardId = saved.data.id; card.dataset.reversed = String(saved.reversed);
    card.style.setProperty('--card-image-ratio', saved.ratio);
    Object.assign(card.style, { position: 'absolute', left: `${saved.x * 100}%`, top: `${saved.y * 100}%`, width: `${saved.w * 100}%`, transform: 'none', margin: '0' });
    card.onclick = () => openCardZoom(card, saved.data.name);
    board.append(card);
  });
  rpPhoto.append(tip, board);
}
renderSpread();
new MutationObserver(() => {
  if (activeSpread) renderSpread();
}).observe(document.body, { childList: true });
new MutationObserver(() => {
  renderSpread();
  placedCards.filter(c => c.dataset.spreadSlot !== undefined).forEach(c => snapToSpread(c, true));
}).observe(fanArea, { attributes: true, attributeFilter: ['class'] });
