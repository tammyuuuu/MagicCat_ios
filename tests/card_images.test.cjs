const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(background = false, cached = false) {
  const observers = [], timers = new Map(), probes = [], buttons = [];
  let nextTimer = 0;
  const host = { appendChild(button) { buttons.push(button); } };
  const target = {
    parentElement: host, isConnected: true, style: {},
    src: 'https://example.test/card.png', complete: cached, naturalWidth: cached ? 600 : 0,
    matches: () => background, getAttribute() { return this.src; }
  };
  let css = 'url("https://example.test/图片/front.png?v=1")';
  const context = {
    URL, Date, Image: function () { probes.push(this); },
    getComputedStyle: () => ({ backgroundImage: css }),
    setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    MutationObserver: function (fn) { observers.push(fn); this.observe = () => {}; },
    document: {
      body: {}, baseURI: 'https://example.test/',
      querySelectorAll: () => target.isConnected ? [target] : [],
      createElement: () => ({ dataset: {}, events: {}, setAttribute() {},
        addEventListener(type, fn) { this.events[type] = fn; }, remove() { this.removed = true; } })
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../card_images.js'), 'utf8'), context);
  return { target, buttons, probes, timers, observers, setCss(value) { css = value; } };
}

test('cached artwork displays immediately without waiting for a new load event', () => {
  const x = setup(false, true);
  assert.equal(x.buttons[0].hidden, true);
  assert.equal(x.timers.size, 0);
});
test('network error retries once, then keeps the same card and offers manual retry', () => {
  const x = setup();
  x.target.onerror();
  assert.match(x.target.src, /card_retry=/);
  x.target.onerror();
  assert.equal(x.buttons[0].dataset.retry, 'true');
  x.buttons[0].events.click({ stopPropagation() {} });
  x.target.naturalWidth = 600;
  x.target.onload();
  assert.equal(x.buttons[0].hidden, true);
});
test('a slow request can still complete after its timeout notice', () => {
  const x = setup();
  [...x.timers.values()][0]();
  assert.equal(x.buttons[0].dataset.retry, 'true');
  x.target.naturalWidth = 600;
  x.target.onload();
  assert.equal(x.buttons[0].hidden, true);
});
test('switching theme ignores the previous theme response and loads the new artwork', () => {
  const x = setup(true);
  const staleLoad = x.probes[0].onload;
  x.setCss('url("https://example.test/new-theme.png")');
  x.observers[1]();
  x.probes[0].naturalWidth = 600;
  staleLoad();
  assert.equal(x.target.style.backgroundImage, '');
  x.probes[1].naturalWidth = 600;
  x.probes[1].onload();
  assert.match(x.target.style.backgroundImage, /new-theme/);
  assert.equal(x.buttons[1].hidden, true);
});
test('removing a card clears its pending timer and image handlers', () => {
  const x = setup();
  x.target.isConnected = false;
  x.observers[0]();
  assert.equal(x.timers.size, 0);
  assert.equal(x.target.onload, null);
  assert.equal(x.buttons[0].removed, true);
});
