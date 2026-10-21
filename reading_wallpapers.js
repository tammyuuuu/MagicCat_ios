(() => {
  const key = 'magiccat_reading_wallpapers';
  const catalog = {
    dopamine: [
      { id: 'cranes', name: '云羽星歌', src: '图片/壁纸/dopamine-cranes.webp' },
      { id: 'moon', name: '雾糖月轮', src: '图片/壁纸/dopamine-moon.webp' },
      { id: 'clock', name: '花间时光', src: '图片/壁纸/dopamine-clock.webp' },
      { id: 'roses', name: '玫瑰晴窗', src: '图片/壁纸/dopamine-roses.webp' }
    ],
    parchment: [
      { id: 'moon-palace', name: '月映星殿', src: '图片/壁纸/parchment-moon-palace.webp' },
      { id: 'golden-cat', name: '金铃福猫', src: '图片/壁纸/parchment-golden-cat.webp' }
    ],
    noir: [
      { id: 'moon-cat', name: '月窗望星', src: '图片/壁纸/noir-moon-cat.webp' },
      { id: 'affirmations', name: '如愿手记', src: '图片/壁纸/noir-affirmations.webp' }
    ],
    mystic: [
      { id: 'moon', name: '星河月轮', src: '图片/壁纸/mystic-moon.webp' },
      { id: 'sun', name: '玫瑰日光', src: '图片/壁纸/mystic-sun.webp' }
    ]
  };
  let choices = {};
  try { choices = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  if (typeof choices !== 'object' || Array.isArray(choices)) choices = {};
  const section = document.createElement('section');
  section.className = 'wallpaper-section';
  section.innerHTML = '<h3>桌面壁纸</h3><p class="wallpaper-note"></p><div class="wallpaper-options"></div>';
  document.getElementById('themeSheet').appendChild(section);
  const desktop = document.getElementById('starfield') || document.getElementById('desktop');
  const preview = document.createElement('dialog');
  preview.className = 'wallpaper-preview';
  preview.setAttribute('aria-label', '壁纸预览');
  preview.innerHTML = '<header><span class="wp-preview-name"></span><button type="button" class="wp-preview-close" aria-label="关闭预览">×</button></header><img alt=""><footer><a class="wp-preview-save" download>保存图片</a><button type="button" class="wp-preview-back">返回</button><button type="button" class="wp-preview-use">使用这张壁纸</button></footer>';
  document.body.appendChild(preview);
  let pending = null;
  function save(theme, id) {
    choices[theme] = id;
    try { localStorage.setItem(key, JSON.stringify(choices)); } catch (_) {}
    render();
  }
  preview.querySelector('.wp-preview-close').onclick = () => preview.close();
  preview.querySelector('.wp-preview-back').onclick = () => preview.close();
  preview.querySelector('.wp-preview-use').onclick = () => {
    if (pending) save(pending.theme, pending.id);
    preview.close();
  };
  preview.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
  });
  preview.addEventListener('click', event => { if (event.target === preview) preview.close(); });
  function render() {
    const theme = document.body.dataset.theme || 'mystic';
    const options = catalog[theme] || [];
    const selected = options.find(item => item.id === choices[theme]);
    desktop.classList.remove('has-wallpaper');
    const defaultBackground = getComputedStyle(desktop).background;
    desktop.classList.toggle('has-wallpaper', !!selected);
    if (selected) desktop.style.setProperty('--reading-wallpaper', `url("${selected.src}")`);
    else desktop.style.removeProperty('--reading-wallpaper');
    section.querySelector('.wallpaper-note').textContent = options.length ? '点击壁纸查看全图，喜欢再使用' : '当前配色暂无壁纸';
    section.querySelector('.wallpaper-options').innerHTML = [
      { id: '', name: '默认底纹' }, ...options
    ].map(item => `<button type="button" class="wallpaper-option" data-wallpaper="${item.id}" aria-pressed="${selected ? selected.id === item.id : !item.id}">
      ${item.src ? `<img src="${item.src}" alt="" loading="lazy">` : '<span class="wallpaper-default" aria-hidden="true"></span>'}
      <span>${item.name}</span></button>`).join('');
    section.querySelector('.wallpaper-default').style.background = defaultBackground;
  }
  section.addEventListener('click', event => {
    const button = event.target.closest('[data-wallpaper]');
    if (!button) return;
    const theme = document.body.dataset.theme || 'mystic';
    const item = (catalog[theme] || []).find(item => item.id === button.dataset.wallpaper);
    if (!item) { save(theme, ''); return; }
    pending = { theme, id: item.id };
    preview.querySelector('.wp-preview-name').textContent = item.name;
    preview.querySelector('img').src = item.src;
    preview.querySelector('.wp-preview-save').href = item.src;
    preview.querySelector('.wp-preview-save').download = item.name + '.webp';
    preview.querySelector('img').alt = item.name + '完整壁纸';
    preview.showModal();
  });
  new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  render();
})();
