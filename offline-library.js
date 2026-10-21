(() => {
  const drawer = document.querySelector('#drawerDeck') || document.querySelector('#themeSheet');
  if (!drawer) return;
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.textContent = '↓ 离线牌库';
  entry.className = 'offline-library-entry';
  const footer = document.createElement('div');
  footer.className = 'offline-library-footer';
  const explanation = document.createElement('p');
  explanation.textContent = '下载常用牌组，断网或飞行模式下也能抽牌、查看牌面与牌义。';
  footer.append(entry, explanation);
  drawer.append(footer);
  const themeSheet = document.querySelector('#themeSheet');
  if (themeSheet && themeSheet !== drawer) {
    const wallpapers = document.createElement('button');
    wallpapers.type = 'button';
    wallpapers.className = 'offline-library-entry';
    wallpapers.textContent = '↓ 离线下载壁纸';
    wallpapers.onclick = () => entry.click();
    themeSheet.append(wallpapers);
  }
  if (drawer === themeSheet) {
    entry.textContent = '↓ 离线下载壁纸';
    explanation.textContent = '下载壁纸包，断网后也能切换使用。';
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'offline-dialog';
  dialog.setAttribute('aria-labelledby', 'offline-title');
  dialog.innerHTML = '<header class="offline-header"><div><span class="offline-eyebrow">随身图库</span><h2 id="offline-title">离线图库</h2></div><button type="button" class="offline-close" aria-label="关闭离线牌库">✕</button></header><div class="offline-layout"><section class="offline-guide"><h3>如何使用</h3><ol><li>连接 Wi-Fi，选择想带走的牌组或壁纸。</li><li>点击下载，保持页面打开至完成。</li><li>断网后照常使用已下载的牌图和壁纸。</li></ol><p>可随时暂停，已下载部分会保留；再次点击即可补齐。</p><small>更新无需重新添加主屏幕图标。请从原主屏幕应用打开牌库；清理网站数据或移除应用可能影响本地缓存。</small></section><section class="offline-downloads"><h3>下载牌组与壁纸</h3><div class="offline-decks">正在检查…</div></section></div>';
  document.body.append(dialog);
  const rows = dialog.querySelector('.offline-decks');
  let running = false, paused = false, groups = [];
  const base = new URL('./', document.baseURI);
  const prefix = 'magiccat-' + base.pathname;
  const buttons = [];
  dialog.querySelector('button').onclick = () => { paused = true; dialog.close(); };
  dialog.addEventListener('cancel', () => { paused = true; });
  function bounded(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]).finally(()=>clearTimeout(timer));}
  async function worker(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext)throw new Error('请通过 HTTPS 网站打开离线牌库');
    // A waiting update must not block an already working offline library.
    if(navigator.serviceWorker.controller)return navigator.serviceWorker.controller;
    let registration=await bounded(navigator.serviceWorker.getRegistration(base.href),8000,'离线程序检查超时，请重试');
    if(registration?.active)return registration.active;
    if(!registration)registration=await bounded(navigator.serviceWorker.register(new URL('sw.js',base),{updateViaCache:'none'}),12000,'离线程序安装超时，请保持联网后重试');
    if(registration.active)return registration.active;
    registration=await bounded(navigator.serviceWorker.ready,15000,'离线程序尚未准备好，请稍后重试；无需重新添加主屏幕');
    return navigator.serviceWorker.controller||registration.active;
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
  let legacyIndex;
  function artKey(input){const url=new URL(input,base);url.searchParams.delete('v');url.searchParams.delete('card_retry');url.pathname=url.pathname.replace(/%E7%9B%92%E5%AD%90\//i,'').replace(/%E5%B8%83%E8%A2%8B\//i,'%E6%B0%B4%E6%99%B6/');return url.href;}
  async function oldArtwork(){if(!legacyIndex)legacyIndex=(async()=>{const index=new Map();for(const name of await caches.keys()){if(!name.startsWith(prefix)||name.includes('core-')||name.includes('revisions'))continue;const cache=await caches.open(name);for(const request of await cache.keys()){const key=artKey(request.url);if(!index.has(key))index.set(key,{cache,request});}}return index;})();return legacyIndex;}
  async function countReady(group){
    const cache=await caches.open(prefix+'art-v1'),revisions=await caches.open(prefix+'art-revisions-v1');let count=0,cursor=0;
    await Promise.all(Array.from({length:4},async()=>{while(cursor<group.files.length){const file=group.files[cursor++],url=artKey(new URL(file.url,base).href);let response=await cache.match(url);const revision=await revisions.match(url);if(response&&revision&&await revision.text()===file.sha256){count++;continue;}
      if(!response){const old=(await oldArtwork()).get(url);if(old)response=await old.cache.match(old.request);}
      if(!response?.ok)continue;
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
      if(hash!==file.sha256)continue;
      await cache.put(url,response);await revisions.put(url,new Response(hash));count++;
    }}));return count;
  }
  async function render() {
    let response;try{response=await bounded(fetch(new URL('offline-library.json',base)),10000,'牌库清单加载超时');if(!response.ok)throw Error('清单请求失败');}catch(_){response=await bounded(caches.match(new URL('offline-library.json',base).href),3000,'读取本机清单超时');if(!response?.ok)throw Error('牌库清单暂时无法加载，请联网后点击重试');}
    groups=await bounded(response.json(),5000,'牌库清单读取超时，请重试');
    const checks=[];
    rows.replaceChildren(); buttons.length = 0;
    for (const group of groups.filter(group => drawer !== themeSheet || group.id.startsWith('wallpapers-'))) {
      const row = document.createElement('section');
      row.className = 'offline-deck';
      const title = document.createElement('strong'); title.textContent = group.name;
      const status = document.createElement('div'); status.setAttribute('aria-live','polite');
      const progress = document.createElement('progress'); progress.max = group.files.length; progress.style.width = '100%';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '下载 / 补齐';
      button.className = 'offline-download';
      const size = (group.bytes / 1024 / 1024).toFixed(1);
      row.append(title,status,progress,button);rows.append(row);status.textContent='正在核对本机图片，可直接点击下载 / 补齐';button.disabled=false;
      let ready=0;button.dataset.complete='false';buttons.push(button);
      checks.push(async()=>{try{const count=await bounded(countReady(group),8000,'本机缓存检查超时');if(running||!button.isConnected)return;ready=count;button.dataset.complete=String(ready===group.files.length);button.disabled=ready===group.files.length;button.textContent=button.disabled?'已下载':'下载 / 补齐';progress.value=ready;status.textContent=`${group.files.length} 张图片 · ${size} MB · 已完成 ${ready}/${group.files.length}`;}catch(error){if(!running&&button.isConnected){button.disabled=false;status.textContent='缓存暂时无法核对，可以点击下载 / 补齐重试';}}});
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
          ready = await bounded(countReady(group),8000,'缓存核对超时，可再次继续');
          progress.value = ready;
          status.textContent = ready === group.files.length ? `已完成 ${ready}/${ready} · 可以离线使用` : `已暂停 · 已保留 ${ready}/${group.files.length}`;
        } catch (error) { try{ready=await bounded(countReady(group),4000,'缓存检查超时');}catch(_){}progress.value=ready;status.textContent=error.message+'；已保留 '+ready+'/'+group.files.length+'，可再次继续'; }
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
    void(async()=>{for(const check of checks)await check();})();
  }
  entry.onclick = async () => {
    if(!dialog.open)dialog.showModal();
    if (running) return;
    rows.textContent = '正在检查…';
    try { await render(); } catch(error) { rows.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='重新检查';retry.className='offline-download';retry.onclick=()=>entry.click();rows.append(document.createElement('br'),retry); }
  };
})();
