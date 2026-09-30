// Keep a drawn card usable when its artwork is slow, unavailable, or retried.
(() => {
  const states = new Map();
  const selector = '.placed-card .card-front img, .theme-tarot-front-art';

  function watch(target) {
    const background = target.matches('.theme-tarot-front-art');
    const host = target.parentElement;
    const css = background ? getComputedStyle(target).backgroundImage : '';
    const url = background ? css.match(/^url\(["']?(.*?)["']?\)$/)?.[1] : target.getAttribute('src');
    if (!url || states.has(target)) return;

    const status = document.createElement('button');
    status.type = 'button';
    status.className = 'card-image-status';
    status.setAttribute('aria-live', 'polite');
    host.appendChild(status);
    const picture = background ? new Image() : target;
    let timer, generation = 0, attempts = 0;
    const state = { dispose() {
      generation++;
      clearTimeout(timer);
      picture.onload = picture.onerror = null;
      status.remove();
      if (background) target.style.backgroundImage = '';
    } };
    states.set(target, state);

    function start(retry) {
      const token = ++generation;
      clearTimeout(timer);
      status.hidden = false;
      status.textContent = '牌面加载中…';
      status.dataset.retry = '';
      const fail = () => {
        if (token !== generation) return;
        clearTimeout(timer);
        // One automatic retry for network errors; stalled requests remain able to finish.
        if (attempts++ === 0) { start(true); return; }
        status.textContent = '加载失败\n点此重试';
        status.dataset.retry = 'true';
      };
      picture.onload = () => {
        if (token !== generation) return;
        clearTimeout(timer);
        if (!picture.naturalWidth) { fail(); return; }
        if (background) target.style.backgroundImage = `url(${JSON.stringify(picture.src)})`;
        status.hidden = true;
      };
      picture.onerror = fail;
      timer = setTimeout(() => {
        if (token !== generation) return;
        status.textContent = '加载较慢\n点此重试';
        status.dataset.retry = 'true';
      }, 12000);
      let source = url;
      if (retry) {
        const fresh = new URL(url, document.baseURI);
        fresh.searchParams.set('card_retry', Date.now() + '-' + generation);
        source = fresh.href;
      }
      // Attach listeners before setting src, including for cached images.
      picture.src = source;
      if (picture.complete && picture.naturalWidth) picture.onload();
    }
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick'].forEach(type => {
      status.addEventListener(type, event => event.stopPropagation());
    });
    status.addEventListener('click', event => {
      event.stopPropagation();
      if (status.dataset.retry) { attempts = 1; start(true); }
    });
    start(false);
  }

  function scan() {
    for (const [target, state] of states) {
      if (!target.isConnected) { state.dispose(); states.delete(target); }
    }
    document.querySelectorAll(selector).forEach(watch);
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(() => {
    for (const [target, state] of states) {
      if (target.matches('.theme-tarot-front-art')) { state.dispose(); states.delete(target); }
    }
    scan();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  scan();
})();
