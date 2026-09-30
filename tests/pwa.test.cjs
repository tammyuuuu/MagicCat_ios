const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const events = {}, stores = new Map(), requests = [];
  let online = true, revision = 'first', unavailable = false;
  const self = { location: { href: 'https://example.test/tarot/sw.js' },
    clients: { claim: async () => {} }, addEventListener(type, fn) { events[type] = fn; } };
  const caches = { async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return { async match(key) { return store.get(String(key))?.clone(); },
      async put(key, value) { store.set(String(key), value); },
      async addAll(list) {
        for (const request of list) {
          assert.ok(!decodeURI(request.url).includes('图片/'));
          store.set(request.url, new Response('core'));
        }
      } };
  } };
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), {
    self, caches, URL, Request, Response, setTimeout, clearTimeout,
    AbortController, crypto: require('node:crypto').webcrypto,
    importScripts() { self.PWA_ART = { '图片/card.png': 'optimized/card.webp?v=one' }; },
    async fetch(url) {
      requests.push(String(url));
      if (!online) throw new Error('offline');
      if (unavailable) return new Response('unavailable', {status:503});
      return new Response(revision);
    }
  });
  async function lifecycle(type) {
    const waits = [];
    events[type]({ waitUntil(p) { waits.push(p); } });
    await Promise.all(waits);
  }
  async function request(path, destination = '') {
    const waits = []; let response;
    events.fetch({ request: { url: new URL(path, self.location.href).href, method: 'GET', destination },
      waitUntil(p) { waits.push(p); }, respondWith(p) { response = p; } });
    const result = await response;
    await Promise.all(waits);
    return result;
  }
  return { lifecycle, request, requests, stores, offline() { online = false; },
    update() { revision = 'second'; }, unavailable() { unavailable = true; },
    async pack(url, sha256) {
      const waits = []; let reply;
      events.message({ data:{type:'CACHE_ART',url,sha256}, ports:[{postMessage(value) {reply=value;}}], waitUntil(p) {waits.push(p);} });
      await Promise.all(waits); return reply;
    } };
}
test('all precached files and optimized mappings exist on disk', () => {
  const source = fs.readFileSync('sw.js', 'utf8');
  const list = source.match(/const CORE = \[([\s\S]*?)\]/)[1];
  for (const match of list.matchAll(/'([^']+)'/g)) {
    assert.ok(fs.existsSync(match[1].split('?')[0]), match[1]);
  }
  const context = { self: {} };
  vm.runInNewContext(fs.readFileSync('pwa-art.js', 'utf8'), context);
  for (const [original, optimized] of Object.entries(context.self.PWA_ART)) {
    assert.ok(fs.existsSync(original), original);
    assert.ok(fs.existsSync(optimized.split('?')[0]), optimized);
  }
  const state = JSON.parse(fs.readFileSync('webp-state.json', 'utf8'));
  for (const entry of Object.values(state)) {
    assert.ok(fs.existsSync(entry.target), entry.target);
    assert.ok(entry.target.endsWith('.webp'));
  }
});
test('install precaches all four pages under repository scope without artwork', async () => {
  const app = setup(); await app.lifecycle('install'); await app.lifecycle('activate');
  app.offline();
  for (const page of ['reading_ios.html', 'manifest_ios.html', 'bird_ios.html', 'wish_ios.html', 'waite_meanings.js']) {
    assert.equal(await (await app.request(page)).text(), 'core');
  }
  assert.equal(await (await app.request('./')).text(), 'core');
});
test('visited optimized artwork survives offline and retry parameters', async () => {
  const app = setup();
  assert.equal(await (await app.request('图片/card.png', 'image')).text(), 'first');
  assert.ok(app.requests[0].endsWith('optimized/card.webp?v=one'));
  app.offline();
  assert.equal(await (await app.request('图片/card.png', 'image')).text(), 'first');
  assert.equal(await (await app.request('图片/card.png?card_retry=123', 'image')).text(), 'first');
});
test('one changed card refreshes without clearing any other card', async () => {
  const app = setup();
  await app.request('图片/card.png', 'image');
  await app.request('图片/other.webp', 'image');
  app.update();
  assert.equal(await (await app.request('图片/card.png', 'image')).text(), 'first');
  app.offline();
  assert.equal(await (await app.request('图片/card.png', 'image')).text(), 'second');
  assert.equal(await (await app.request('图片/other.webp', 'image')).text(), 'first');
});
test('manual retry retains cached artwork when the server returns an error', async () => {
  const app = setup();
  await app.request('图片/other.webp', 'image');
  app.unavailable();
  assert.equal(await (await app.request('图片/other.webp?card_retry=123', 'image')).text(), 'first');
});
test('optional pack reuses complete files offline and updates only changed files', async () => {
  const hash = value => require('node:crypto').createHash('sha256').update(value).digest('hex');
  const app = setup();
  assert.equal((await app.pack('图片/other.webp',hash('first'))).reused,false);
  const before = app.requests.length;
  app.offline();
  assert.equal((await app.pack('图片/other.webp',hash('first'))).reused,true);
  assert.equal(app.requests.length,before);
  assert.equal((await app.pack('图片/missing.webp',hash('first'))).ok,false);
});
test('optional pack rejects invalid paths and mismatched deployed artwork', async () => {
  const app = setup(), hash = 'a'.repeat(64);
  assert.equal((await app.pack('https://example.test/elsewhere/card.webp',hash)).ok,false);
  assert.equal(app.requests.length,0);
  assert.equal((await app.pack('图片/card.webp',hash)).ok,false);
  app.offline();
  assert.equal((await app.request('图片/card.webp','image')).status,504);
});
test('offline inventory matches current image hashes and includes every deck', () => {
  const groups = JSON.parse(fs.readFileSync('offline-library.json','utf8'));
  assert.equal(groups.length,7);
  assert.deepEqual(groups.slice(0,3).map(group => group.files.length),[79,37,141]);
  for (const group of groups) {
    assert.equal(group.bytes,group.files.reduce((total,file)=>total+file.bytes,0));
    for (const file of group.files) {
      const bytes = fs.readFileSync(file.url);
      assert.equal(bytes.length,file.bytes);
      assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),file.sha256);
    }
  }
});
