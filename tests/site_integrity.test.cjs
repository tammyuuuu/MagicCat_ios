const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const pages=['index.html','reading_ios.html','manifest_ios.html','bird_ios.html','wish_ios.html'];
test('all page scripts and local JavaScript files compile',()=>{
 for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.js')))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
 for(const page of pages){
  const html=fs.readFileSync(page,'utf8');
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(!/\bsrc=/.test(m[1]) && !/application\/ld\+json/.test(m[1]))new vm.Script(m[2],{filename:page});
  }
 }
});
test('all local page links, scripts, styles and literal image sources exist',()=>{
 for(const page of pages){
  const html=fs.readFileSync(page,'utf8');
  for(const m of html.matchAll(/<(?:script|link|a|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi)){
   const url=m[1];if(/^(?:https?:|data:|#|javascript:)/.test(url)||url.includes('${'))continue;
   const file=decodeURIComponent(url.split(/[?#]/)[0]);
   assert.ok(fs.existsSync(path.resolve(path.dirname(page),file)),`${page}: ${url}`);
  }
 }
});
test('all configured decks have complete front and back artwork',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync('decks.js','utf8'),c);
 for(const deck of vm.runInContext('DECKS',c)){
  if(deck.cardNames)assert.equal(deck.cardNames.length,deck.cardCount);
  for(let i=0;i<deck.cardCount;i++)assert.ok(fs.existsSync(`${deck.path}/${(deck.startAt||0)+i}.${deck.format}`));
  assert.ok(fs.existsSync(`${deck.path}/back.${deck.back||deck.format}`));
 }
});
