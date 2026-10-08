/* GitHub Pages subpaths: every URL is relative to this worker's directory.
   Local previews must serve this file with a JavaScript MIME type. */
importScripts('./pwa-art.js');
const BASE = new URL('./', self.location.href);
const PREFIX = 'magiccat-' + BASE.pathname;
const CORE_CACHE = PREFIX + 'core-v12';
// Kept across application releases. No user data lives in these caches.
const ART_CACHE = PREFIX + 'art-v1';
const ART_REVISIONS = PREFIX + 'art-revisions-v1';
const CORE = [
  'spread.js', 'spread.css', 'reading_ios.html', 'manifest_ios.html', 'bird_ios.html', 'wish_ios.html',
  'manifest.json', 'pwa.js', 'offline-library.js', 'offline-library.css', 'offline-library.json', 'world_switch.js', 'world_switch.css',
  'card_images.js', 'decks.js', 'waite_meanings.js', 'lenormand_meanings.js',
  'html2canvas.min.js', 'abundance_core.js', 'love_v01.js', 'liuyao_core.js',
  'yao_ui.js', 'yao_ui.css', 'yijing_data.js',
  'icons/icon-192.webp?v=icon1', 'icons/icon-512.webp?v=icon1',
  'icons/apple-touch-icon.webp?v=icon1'
].map(path => new URL(path, BASE).href);
const refreshing = new Map();
function artworkKey(input) {
  const url = new URL(input, BASE);
  const relative = decodeURIComponent(url.pathname.slice(BASE.pathname.length))
    .replace(/^图片\/盒子\//, '图片/').replace(/^图片\/布袋\//, '图片/水晶/');
  const key = new URL(relative, BASE);
  key.search = url.search;
  key.searchParams.delete('v');
  key.searchParams.delete('card_retry');
  return key.href;
}
let inventoryPromise;
function artworkInventory() {
  if (!inventoryPromise) inventoryPromise = (async () => {
    const core = await caches.open(CORE_CACHE);
    const response = await core.match(new URL('offline-library.json', BASE).href);
    if (!response) return new Map();
    const groups = await response.json();
    return new Map(groups.flatMap(group => group.files.map(file => [artworkKey(file.url), file.sha256])));
  })().catch(() => { inventoryPromise = undefined; return new Map(); });
  return inventoryPromise;
}
async function migrateArtwork() {
  const cache = await caches.open(ART_CACHE);
  const revisions = await caches.open(ART_REVISIONS);
  const inventory = await artworkInventory();
  for (const request of await cache.keys()) {
    const key = artworkKey(request.url);
    const expected = inventory.get(key);
    if (key === request.url || !expected) continue;
    const known = await revisions.match(key);
    if (await cache.match(key) && known && await known.text() === expected) continue;
    const response = await cache.match(request);
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer()))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== expected) continue;
    await cache.put(key, response);
    await revisions.put(key, new Response(expected));
  }
}
// Optional packs use the same artwork cache as ordinary drawing. Each completed
// image is durable independently, so closing or pausing does not discard it.
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_ART' || !event.ports[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    try {
      const url = new URL(event.data.url, BASE);
      const revision = event.data.sha256;
      if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname) ||
          !/\.webp$/i.test(url.pathname) || !/^[a-f0-9]{64}$/.test(revision)) throw new Error('图片地址无效');
      const cache = await caches.open(ART_CACHE);
      const revisions = await caches.open(ART_REVISIONS);
      const key = artworkKey(url.href);
      const known = await revisions.match(key);
      if (await cache.match(key) && known && await known.text() === revision) {
        port.postMessage({ok:true, reused:true});
        return;
      }
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 25000);
      let response;
      try { response = await fetch(url.href, {cache:'no-cache', signal:abort.signal}); }
      finally { clearTimeout(timer); }
      if (!response.ok) throw new Error('下载失败，请联网后重试');
      const bytes = await response.clone().arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map(byte => byte.toString(16).padStart(2,'0')).join('');
      if (hash !== revision) throw new Error('图片已更新，请重新打开离线牌库后重试');
      await cache.put(key, response);
      await revisions.put(key, new Response(revision));
      port.postMessage({ok:true, reused:false});
    } catch (error) { port.postMessage({ok:false, error: error.name === 'QuotaExceededError' ? '存储空间不足，已下载部分已保留' : error.message}); }
  })());
});
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    await cache.addAll(CORE.map(url => new Request(url, { cache: 'reload' })));
    // New worker waits for open pages to close; no forced reload during a draw.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await migrateArtwork();
    await self.clients.claim();
  })());
});
function refresh(cache, key, url) {
  if (refreshing.has(key)) return refreshing.get(key);
  const promise = (async () => {
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.ok && response.type !== 'opaque') await cache.put(key, response.clone());
    return response;
  })().finally(() => refreshing.delete(key));
  refreshing.set(key, promise);
  return promise;
}
async function coreResponse(event, key) {
  const cache = await caches.open(CORE_CACHE);
  const update = refresh(cache, key, key);
  event.waitUntil(update.catch(() => {}));
  // Online pages pick up ordinary GitHub pushes without changing a version.
  let timer;
  try {
    const response = await Promise.race([
      update,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('slow network')), 2500); })
    ]);
    if (response.ok) return response;
  } catch (_) {} finally { clearTimeout(timer); }
  return await cache.match(key) || new Response('暂时无法连接，请联网后重试。', { status: 503 });
}
async function artworkResponse(event, url) {
  const cache = await caches.open(ART_CACHE);
  const relative = decodeURIComponent(url.pathname.slice(BASE.pathname.length));
  const optimized = self.PWA_ART[relative];
  const target = optimized ? new URL(optimized, BASE).href : url.href;
  const key = artworkKey(url.href);
  const cached = await cache.match(key);
  if (cached && !url.searchParams.has('card_retry')) {
    const expected = (await artworkInventory()).get(key);
    const revisions = await caches.open(ART_REVISIONS);
    const known = await revisions.match(key);
    // Verified downloaded packs are served locally without a network refresh.
    if (expected && known && await known.text() === expected) return cached;
  }
  const update = refresh(cache, key, target);
  event.waitUntil(update.catch(() => {}));
  // Only requested images are downloaded; unchanged files use HTTP validation.
  if (cached && !url.searchParams.has('card_retry')) return cached;
  try {
    const response = await update;
    if (!response.ok && cached) return cached;
    if (response.ok || !optimized) return response;
  } catch (_) {
    if (cached) return cached;
  }
  if (optimized) {
    const original = cached;
    try { return await refresh(cache, key, url.href); }
    catch (_) { if (original) return original; }
  }
  return new Response('', { status: 504 });
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (url.pathname === BASE.pathname) {
    event.respondWith(coreResponse(event, new URL('reading_ios.html', BASE).href));
  } else if (CORE.includes(url.href)) {
    event.respondWith(coreResponse(event, url.href));
  } else if (event.request.destination === 'image' || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname)) {
    event.respondWith(artworkResponse(event, url));
  }
});
