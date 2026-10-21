// One request per interpretation pack, shared by all card readers.
const readingMeaningRequests = new Map();
const readingMeaningBusy = new WeakSet();
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
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 20000);
      try {
        const response = await fetch(`reading-data/${pack}.json`, { signal: abort.signal });
        if (!response.ok) throw new Error('解读尚未下载，请联网后重试');
        const data = await response.json();
        if (!data || !Object.values(data).every(value => value && typeof value === 'object')) throw new Error('解读数据不完整，请重试');
        return data;
      } finally { clearTimeout(timer); }
    })().catch(error => { readingMeaningRequests.delete(pack); throw error; });
    readingMeaningRequests.set(pack, request);
  }
  const data = await readingMeaningRequests.get(pack);
  if (!data[card.id]) throw new Error('未找到这张牌的解读');
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
      zoomInterpret.title = error.name === 'AbortError' ? '解读加载超时，请重试' : error.message;
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
