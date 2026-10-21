// Browse the library using separate card copies, leaving the reading untouched.
(() => {
  const drawer = document.getElementById('drawerDeck');
  function loadCovers() {
    if (!drawer.classList.contains('open')) return;
    drawer.querySelectorAll('img[data-deck-cover]').forEach(img => {
      img.src = img.dataset.deckCover;
      img.removeAttribute('data-deck-cover');
    });
  }
  new MutationObserver(loadCovers).observe(drawer, { attributes: true, attributeFilter: ['class'] });
  loadCovers();
  const panel = document.createElement('section');
  panel.id = 'deckBrowser';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'deckBrowserTitle');
  panel.innerHTML = `<div class="db-shell">
    <header class="db-header"><div><h2 id="deckBrowserTitle">牌组图鉴</h2><p id="dbCount"></p></div><button type="button" id="dbClose" aria-label="关闭牌组图鉴">×</button></header>
    <label class="db-label">选择牌组<select id="dbDeck"></select></label>
    <label class="db-label">查找卡牌<input id="dbSearch" type="search" placeholder="输入牌名、英文名或编号" autocomplete="off"></label>
    <p class="db-hint">点击牌面放大，查看已有解读</p>
    <div id="dbCards" class="db-cards"></div>
  </div>`;
  document.body.appendChild(panel);
  const select = panel.querySelector('#dbDeck');
  const search = panel.querySelector('#dbSearch');
  const grid = panel.querySelector('#dbCards');
  const count = panel.querySelector('#dbCount');
  let deck, cards = [], index = -1, returnFocus, detailFocus;
  const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
  select.innerHTML = deckList.map(d => `<option value="${escape(d.id)}">${escape(d.name)}</option>`).join('');

  const nav = document.createElement('div');
  nav.className = 'db-detail-nav';
  nav.hidden = true;
  nav.innerHTML = `<div class="db-detail-title" aria-live="polite"></div><div class="db-detail-actions"><button type="button" data-step="-1">上一张</button><button type="button" id="dbReverse">查看逆位</button><button type="button" data-step="1">下一张</button></div><p class="db-detail-hint"></p>`;
  document.querySelector('#cardZoom .zoom-wrap').appendChild(nav);

  function render() {
    const query = search.value.trim().toLowerCase();
    cards = (deck._cards || []).filter(c => !query || [c.name, c.englishName || '', c.number].some(v => String(v).toLowerCase().includes(query)));
    count.textContent = `${deck.name} · 共 ${(deck._cards || []).length} 张${query ? ` · 找到 ${cards.length} 张` : ''}`;
    grid.innerHTML = cards.length ? cards.map((c, i) => `<button type="button" class="db-card" data-index="${i}" aria-label="查看 ${escape(c.name)}">
      <span class="db-art" style="--db-ratio:${deck.aspectRatio || 2 / 3}">${c._themeTarot ? themeTarotFrontMarkup(c) : `<img src="${escape(c._imgUrl)}" alt="${escape(c.name)}" loading="lazy" decoding="async" draggable="false">`}</span>
      <span class="db-card-name">${escape(c.name)}</span><span class="db-card-number">${escape(c.number)}</span></button>`).join('') : '<p class="db-empty">没有找到这张牌，试试其他名称或编号。</p>';
  }
  function open(id, trigger) {
    returnFocus = trigger;
    deck = deckList.find(d => d.id === id) || deckList[0];
    if (!deck) return;
    select.value = deck.id;
    search.value = '';
    render();
    panel.hidden = false;
    document.getElementById('dbClose').focus();
  }
  function close() {
    panel.hidden = true;
    returnFocus?.focus();
  }
  function showCard(next) {
    index = next;
    const card = { ...cards[index], isReversed: false };
    const holder = document.createElement('div');
    holder.className = 'revealed';
    holder.dataset.cardId = card.id;
    holder.dataset.reversed = 'false';
    holder._cardData = card;
    // The existing zoom reader accepts a card host; this host is never on the table.
    holder.innerHTML = `<div class="card-front">${card._imgUrl ? `<img src="${escape(card._imgUrl)}">` : ''}</div><div class="card-back">${deck._backImg ? `<img src="${escape(deck._backImg)}">` : ''}</div>`;
    openCardZoom(holder, card.name);
    zoomCard.classList.remove('interp');
    zoomCard.scrollTop = 0;
    cardZoom.scrollTop = 0;
    nav.hidden = false;
    nav.querySelector('.db-detail-title').textContent = `${card.name} · ${index + 1} / ${cards.length}`;
    nav.querySelector('[data-step="-1"]').disabled = index === 0;
    nav.querySelector('[data-step="1"]').disabled = index === cards.length - 1;
    const reverse = nav.querySelector('#dbReverse');
    reverse.hidden = !!deck.noReverse || !readingMeaningPack(card);
    reverse.textContent = '查看逆位';
    nav.querySelector('.db-detail-hint').textContent = card.meaning || card._hasInterpretation !== false ? '' : '这套牌暂无独立解读，可放大阅读牌面。';
    zoomClose.focus();
  }
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-index]');
    if (!button) return;
    detailFocus = button;
    showCard(Number(button.dataset.index));
  });
  nav.addEventListener('click', event => {
    const step = event.target.closest('[data-step]');
    if (step && !step.disabled) showCard(index + Number(step.dataset.step));
  });
  nav.querySelector('#dbReverse').addEventListener('click', () => {
    if (!_zoomThemeCard) return;
    void showReadingMeaning({ reverse: true });
  });
  // Reset library controls for every exit path, including the existing Escape handler.
  new MutationObserver(() => {
    if (!cardZoom.classList.contains('active') && !nav.hidden) {
      nav.hidden = true;
      detailFocus?.focus();
    }
  }).observe(cardZoom, { attributes: true, attributeFilter: ['class'] });
  select.addEventListener('change', () => { deck = deckList.find(d => d.id === select.value); search.value = ''; render(); });
  search.addEventListener('input', render);
  panel.querySelector('#dbClose').addEventListener('click', close);
  panel.addEventListener('click', event => { if (event.target === panel) close(); });
  document.addEventListener('keydown', event => {
    if (panel.hidden) return;
    // Capture keeps Escape on the detail reader from also closing its parent.
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation();
      if (cardZoom.classList.contains('active')) closeCardZoom(); else close();
    }
    if (event.key === 'Tab') {
      const scope = cardZoom.classList.contains('active') ? cardZoom : panel;
      const focusable = [...scope.querySelectorAll('button, input, select, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }, true);
  document.querySelectorAll('#deckGrid .drawer-item').forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'db-browse';
    button.textContent = '查看全牌';
    button.addEventListener('click', event => { event.stopPropagation(); open(item.dataset.deckId, button); });
    item.appendChild(button);
  });
})();
