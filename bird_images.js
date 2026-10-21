// Hidden pendants for the other themes should not delay the current theme.
(() => {
  function load() {
    document.querySelectorAll('img[data-bird-src]').forEach(img => {
      if (getComputedStyle(img).display === 'none') return;
      img.src = img.dataset.birdSrc;
      img.removeAttribute('data-bird-src');
    });
  }
  new MutationObserver(load).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bird-theme'] });
  load();
})();
