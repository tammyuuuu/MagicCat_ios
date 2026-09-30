(() => {
  const drawer = document.querySelector('#drawerDeck');
  if (!drawer) return;
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.textContent = '↓ 离线牌库';
  entry.style.cssText = 'display:block;margin:8px auto 16px;padding:10px 18px;border:1px solid currentColor;border-radius:20px;background:transparent;color:inherit;font:inherit;cursor:pointer;';
  drawer.querySelector('.drawer-title').after(entry);
  const dialog = document.createElement('dialog');
  dialog.className = 'offline-dialog';
  dialog.setAttribute('aria-labelledby', 'offline-title');
  dialog.innerHTML = '<header class="offline-header"><div><span class="offline-eyebrow">随身牌库</span><h2 id="offline-title">离线牌库</h2></div><button type="button" class="offline-close" aria-label="关闭离线牌库">✕</button></header><div class="offline-layout"><section class="offline-guide"><h3>如何使用</h3><ol><li>连接 Wi-Fi，选择想带走的牌组。</li><li>点击下载，保持页面打开至完成。</li><li>断网后照常抽牌、查看牌面与牌义。</li></ol><p>可随时暂停，已下载部分会保留；再次点击即可补齐。</p><small>主屏幕应用请在安装后打开，再下载牌包。浏览器清理站点数据可能移除缓存。</small></section><section class="offline-downloads"><h3>下载牌组</h3><div class="offline-decks">正在检查…</div></section></div>';
  document.body.append(dialog);
  const rows = dialog.querySelector('.offline-decks');
  let running = false, paused = false, groups = [];
  const base = new URL('./', document.baseURI);
  const prefix = 'magiccat-' + base.pathname;
  const buttons = [];
  dialog.querySelector('button').onclick = () => { paused = true; dialog.close(); };
  dialog.addEventListener('cancel', () => { paused = true; });
  async function worker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('请通过 HTTPS 网站打开离线牌库');
    const registration = await navigator.serviceWorker.register(new URL('sw.js', base), {updateViaCache:'none'});
    if (registration.installing) {
      await new Promise(resolve => registration.installing.addEventListener('statechange', function () {
        if (this.state === 'installed' || this.state === 'redundant') resolve();
      }));
    }
    if (registration.waiting) throw new Error('离线功能已更新，请关闭所有本应用页面后重新打开');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once:true}));
    }
    return navigator.serviceWorker.controller;
  }
  function downloadOne(controller, file) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error('下载超时，可稍后继续')); }, 35000);
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close();
        event.data.ok ? resolve(event.data) : reject(new Error(event.data.error));
      };
      controller.postMessage({type:'CACHE_ART', url:new URL(file.url,base).href, sha256:file.sha256}, [channel.port2]);
    });
  }
  async function countReady(group) {
    const cache = await caches.open(prefix + 'art-v1');
    const revisions = await caches.open(prefix + 'art-revisions-v1');
    let count = 0;
    for (const file of group.files) {
      const url = new URL(file.url,base).href;
      const revision = await revisions.match(url);
      if (await cache.match(url) && revision && await revision.text() === file.sha256) count++;
    }
    return count;
  }
  async function render() {
    await worker();
    const response = await fetch(new URL('offline-library.json', base));
    if (!response.ok) throw new Error('牌库清单加载失败，请联网后重试');
    groups = await response.json();
    rows.replaceChildren(); buttons.length = 0;
    for (const group of groups) {
      const row = document.createElement('section');
      row.className = 'offline-deck';
      const title = document.createElement('strong'); title.textContent = group.name;
      const status = document.createElement('div'); status.setAttribute('aria-live','polite');
      const progress = document.createElement('progress'); progress.max = group.files.length; progress.style.width = '100%';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '下载 / 补齐';
      button.className = 'offline-download';
      const size = (group.bytes / 1024 / 1024).toFixed(1);
      let ready = await countReady(group);
      button.dataset.complete = String(ready === group.files.length);
      button.disabled = ready === group.files.length;
      button.textContent = button.disabled ? '已下载' : '下载 / 补齐';
      progress.value = ready;
      status.textContent = `${group.files.length} 张图片 · ${size} MB · 已完成 ${ready}/${group.files.length}`;
      row.append(title,status,progress,button); rows.append(row); buttons.push(button);
      button.onclick = async () => {
        if (running) { paused = true; button.textContent = '正在暂停…'; return; }
        running = true; paused = false;
        buttons.forEach(other => { other.disabled = other !== button; });
        button.textContent = '暂停下载';
        try {
          const controller = await worker();
          let completed = 0;
          for (const file of group.files) {
            if (paused) break;
            await downloadOne(controller,file);
            progress.value = ++completed;
            status.textContent = `下载中 ${completed}/${group.files.length} · ${size} MB`;
          }
          ready = await countReady(group);
          progress.value = ready;
          status.textContent = ready === group.files.length ? `已完成 ${ready}/${ready} · 可以离线使用` : `已暂停 · 已保留 ${ready}/${group.files.length}`;
        } catch (error) { status.textContent = error.message + '；可再次点击继续'; }
        finally {
          running = false;
          button.dataset.complete = String(ready === group.files.length);
          buttons.forEach(other => {
            other.disabled = other.dataset.complete === 'true';
            other.textContent = other.disabled ? '已下载' : '下载 / 补齐';
          });
        }
      };
    }
  }
  entry.onclick = async () => {
    dialog.showModal();
    if (running) return;
    rows.textContent = '正在检查…';
    try { await render(); } catch(error) { rows.textContent = error.message; }
  };
})();
