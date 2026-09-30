(() => {
  const drawer = document.querySelector('#drawerDeck');
  if (!drawer) return;
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.textContent = '↓ 离线牌库';
  entry.style.cssText = 'display:block;margin:8px auto 16px;padding:10px 18px;border:1px solid currentColor;border-radius:20px;background:transparent;color:inherit;font:inherit;cursor:pointer;';
  drawer.querySelector('.drawer-title').after(entry);
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'width:min(440px,calc(100vw - 40px));max-height:80vh;overflow:auto;border:1px solid #b8a1c8;border-radius:20px;padding:20px;background:#f8f5fb;color:#362343;font:15px/1.6 sans-serif;';
  dialog.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><strong>离线牌库</strong><button type="button" aria-label="关闭离线牌库">关闭</button></div><p>选择需要的牌组下载，完成后即可离线使用。建议连接 Wi-Fi，并保持页面打开。</p><div class="offline-decks">正在检查…</div><p style="font-size:12px">暂停或关闭会保留已下载图片。浏览器清理站点数据可能移除缓存。</p>';
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
      row.style.cssText = 'border-top:1px solid #d9cfdf;padding:12px 0';
      const title = document.createElement('strong'); title.textContent = group.name;
      const status = document.createElement('div'); status.setAttribute('aria-live','polite');
      const progress = document.createElement('progress'); progress.max = group.files.length; progress.style.width = '100%';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '下载 / 补齐';
      button.style.cssText = 'min-height:44px;padding:8px 14px;border-radius:12px;border:1px solid #aa94ba;background:#eee6f3;color:#362343;font:inherit;cursor:pointer;';
      const size = (group.bytes / 1024 / 1024).toFixed(1);
      let ready = await countReady(group);
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
        finally { running = false; buttons.forEach(other => other.disabled = false); button.textContent = '下载 / 补齐'; }
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
