// One request per interpretation pack, shared by all card readers.
const readingMeaningRequests = new Map();
const readingMeaningBusy = new WeakSet();
let localReadingRequest;
function loadLocalReadingPacks() {
  if (!localReadingRequest) {
    localReadingRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'reading-data/local-packs.js';
      script.onload = () => window.localReadingPacks ? resolve(window.localReadingPacks) : reject(new Error('本地解读文件不完整'));
      script.onerror = () => reject(new Error('无法打开本地解读文件 reading-data/local-packs.js'));
      document.head.append(script);
    }).catch(error => { localReadingRequest = null; throw error; });
  }
  return localReadingRequest;
}
function readingMeaningPack(card) {
  return card._waite ? 'waite' : card._lenormand ? 'lenormand' : card._themeTarot ? 'theme' : null;
}
async function ensureReadingMeaning(card) {
  // Old records can contain their own complete interpretation. Preserve it.
  if (card.meaning) return card.meaning;
  const pack = readingMeaningPack(card);
  if (!pack) throw new Error('这张牌暂无文字解读');
  if (!readingMeaningRequests.has(pack)) {
    const request = (async () => {
      if (location.protocol === 'file:') return (await loadLocalReadingPacks())[pack];
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 20000);
      try {
        const response = await fetch(`reading-data/${pack}.json`, { cache: 'no-cache', signal: abort.signal });
        if (response.status === 503) throw new Error('解读暂不可用，请联网更新页面后重试');
        if (!response.ok) throw new Error('解读尚未下载，请联网后重试');
        const data = await response.json();
        if (!data || !Object.values(data).every(value => value && typeof value === 'object')) throw new Error('解读数据不完整，请重试');
        return data;
      } finally { clearTimeout(timer); }
    })().catch(error => { readingMeaningRequests.delete(pack); throw error; });
    readingMeaningRequests.set(pack, request);
  }
  const data = await readingMeaningRequests.get(pack);
  if (!data[card.id]) {
    readingMeaningRequests.delete(pack);
    throw new Error('当前解读包缺少这张牌，请联网更新页面后重试');
  }
  card.meaning = data[card.id];
  return card.meaning;
}
async function showReadingMeaning({ reverse = false } = {}) {
  const card = _zoomThemeCard;
  if (!card || readingMeaningBusy.has(card)) return;
  if (_zoomShowingInterp && !reverse) {
    _zoomShowingInterp = false;
    renderThemeTarotZoom();
    return;
  }
  readingMeaningBusy.add(card);
  zoomInterpret.removeAttribute('title');
  zoomInterpret.textContent = '加载解读…';
  try {
    await ensureReadingMeaning(card);
    if (_zoomThemeCard !== card || !cardZoom.classList.contains('active')) return;
    if (reverse) card.isReversed = !card.isReversed;
    _zoomShowingInterp = true;
    renderThemeTarotZoom();
    zoomCard.scrollTop = 0;
    const reverseButton = document.getElementById('dbReverse');
    if (reverseButton) reverseButton.textContent = card.isReversed ? '查看正位' : '查看逆位';
  } catch (error) {
    if (_zoomThemeCard === card && cardZoom.classList.contains('active')) {
      zoomInterpret.textContent = '加载失败，点此重试';
      const reason = error.name === 'AbortError' ? '解读加载超时，请重试' : error.message;
      zoomInterpret.title = reason;
      if (typeof showSpreadNotice === 'function') showSpreadNotice(reason);
    }
  } finally { readingMeaningBusy.delete(card); }
}

// Warm verified offline packs after the first screen, sequentially in the worker.
// Interrupted downloads resume on the next visit or through the offline library.
(() => {
  let warming = false;
  async function warm() {
    if (warming || !navigator.onLine || !('serviceWorker' in navigator)) return;
    warming = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const worker = navigator.serviceWorker.controller || registration?.active;
      if (!worker) return;
      for (const file of READING_MEANING_FILES) {
        await new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => { channel.port1.close(); reject(new Error('offline timeout')); }, 30000);
          channel.port1.onmessage = event => {
            clearTimeout(timer); channel.port1.close();
            event.data.ok ? resolve() : reject(new Error(event.data.error));
          };
          worker.postMessage({ type: 'CACHE_ART', url: new URL(file.url, document.baseURI).href, sha256: file.sha256 }, [channel.port2]);
        });
      }
    } catch (_) { /* Reading stays usable; explicit offline download can retry. */ }
    finally { warming = false; }
  }
  function schedule() { setTimeout(() => { if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 5000 }); else void warm(); }, 6000); }
  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('online', schedule);
  navigator.serviceWorker?.addEventListener('controllerchange', schedule);
})();
