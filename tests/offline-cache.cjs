const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
class MemoryCache {
  constructor() { this.items = new Map(); }
  key(value) { return typeof value === 'string' ? value : value.url; }
  async match(key) { return this.items.get(this.key(key))?.clone(); }
  async put(key, value) { this.items.set(this.key(key), value.clone()); }
  async keys() { return [...this.items.keys()].map(url => new Request(url)); }
}
(async () => {
  const stores = new Map(); let networkCalls = 0;
  const base = 'https://example.test/project/';
  const context = {
    URL, Request, Response, Map, Uint8Array, AbortController, setTimeout, clearTimeout,
    crypto: webcrypto, importScripts() {},
    self: {location: {href: base+'sw.js'}, PWA_ART: {}, addEventListener() {}, clients: {claim: async()=>{}}},
    caches: {async open(name) { if (!stores.has(name)) stores.set(name,new MemoryCache()); return stores.get(name); }},
    async fetch() { networkCalls++; throw new Error('offline'); },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('sw.js','utf8'),context);
  const digest = async text => Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex');
  const entries = [
    ['图片/维特塔罗/0.webp','waite'],
    ['图片/小小奇遇雷诺曼/1.webp','lenormand'],
    ['图片/四境塔罗/front-fool-dopamine.webp','dopamine'],
    ['图片/四境塔罗/front-cups-ace-dopamine.webp','new compressed image'],
  ];
  const files = await Promise.all(entries.map(async([url,text])=>({url,sha256:await digest(text)})));
  const core = await context.caches.open(vm.runInContext('CORE_CACHE', context));
  const art = await context.caches.open('magiccat-/project/art-v1');
  const revisions = await context.caches.open('magiccat-/project/art-revisions-v1');
  await core.put(base+'offline-library.json',new Response(JSON.stringify([{files}])));
  await art.put(new URL('图片/盒子/维特塔罗/0.webp',base).href,new Response('waite'));
  await art.put(new URL('图片/盒子/小小奇遇雷诺曼/1.webp',base).href,new Response('lenormand'));
  await art.put(new URL(files[2].url+'?v=old',base).href,new Response('dopamine'));
  await art.put(new URL('图片/盒子/四境塔罗/front-cups-ace-dopamine.webp',base).href,new Response('obsolete large image'));
  await context.migrateArtwork();
  for(const file of files.slice(0,3)) {
    const key = new URL(file.url,base).href;
    assert(await art.match(key)); assert.equal(await (await revisions.match(key)).text(),file.sha256);
  }
  assert.equal(await art.match(new URL(files[3].url,base).href),undefined,'obsolete artwork must not be marked downloaded');
  for(const file of files.slice(0,3)) {
    const url = new URL(file.url+'?v=mobile20261003',base);
    const result = await context.artworkResponse({waitUntil(){}},url);
    assert.equal(result.status,200);
  }
  assert.equal(networkCalls,0,'verified packs must load without fetch');
  assert.equal(context.artworkKey(new URL(files[2].url+'?v=x&card_retry=1',base).href),new URL(files[2].url,base).href);
  console.log('PASS: subpath URL normalization, old Waite/Lenormand cache migration, versioned art reuse, obsolete hashes rejected, downloaded drawing makes zero network requests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
