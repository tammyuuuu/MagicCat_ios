/* M-157: 玄鸟主题小样；仅保存配色偏好，不触碰卦册。 */
(() => {
  const themes = [['rouge','朱雀'],['paper','白虎'],['jade','玄武'],['apricot','青龙']];
  // 用户四象参考图：古印侧身剪影与回卷尾羽。
  const beasts = {
    rouge: `<path fill="currentColor" stroke="none" d="M155 135q-19-11-42 4l25 8-29 15 35-3q38 20 16 62c-37 60-18 121 49 134 65 13 104-32 111-70 8-47-43-73-18-114 10-17 32-12 39 2-8-39-64-45-80-11-21 44 19 72-8 97-27 26-70 26-87 9-19-19 5-53 15-78 13-30 0-49-11-59l17-28-31 15-3-28-14 28Z"/><path stroke-width="10" d="M290 287c75-39 112-5 86 34-18 27-39 12-33-8M275 321c73 2 80 66 24 73m-58-40c27 42 6 64-17 54M195 337l-12 27 40 13m-13-35 24 27-3 16M164 128q18-38 38-42"/><path stroke="var(--cut)" stroke-width="6" d="m193 294 43-42m-33 50 45-40m-30 48 43-37"/>`,
    paper: `<path fill="currentColor" stroke="none" d="M145 175l-20-29-18 24-32 9 12 35 33 11 13 38c11 29 31 39 66 34l49-10 38 20 10 38 36 21 34-5-22-18-24-8-1-30c28-16 37-47 15-74-28-36-63-19-90-24-33-6-57-26-65-39l-8-23-21 5Z"/><path stroke-width="14" d="M301 223c34 3 60-27 61-61 1-38-23-54-45-42-22 12-11 40 7 32M146 276l-17 44-27 14 33 5 26-17 21-41m52 5 3 46 31 24 32-3-29-12-11-42M125 170l-16-23m45 21-3-31"/><path stroke="var(--cut)" stroke-width="7" d="m166 218 3 20m18-10 4 25m22-16 3 28m24-28 6 27m23-21 9 23m-144-53 14 3m-31-29 10 2"/>`,
    jade: `<path fill="currentColor" stroke="none" d="M147 260c0-58 42-93 109-86 64 7 99 50 82 103-13 45-56 69-110 58-54-10-81-36-81-75Zm-3-19-26-22-29 9 23 25 32 5Zm31 69-30 22-3 28 32-14 18-25Zm108 16 10 31 26 8-3-27-18-22Zm50-72 37-12 19 13-18 17-33-1Z"/><path stroke-width="14" d="M168 198c-35-51-8-94 31-86 32 6 21 40 5 40m-49 123c-69 7-72 88-10 106 62 18 177-7 219-64 53-73-31-137-107-139-25-1-42-17-43-30"/><path stroke="var(--cut)" stroke-width="6" d="m238 201 36 21 1 38-35 25-34-25v-39l32-20Zm-31 21-41 13m41 25-34 20m67 5v38m35-63 39 22m-40-60 38 14"/>`,
    apricot: `<path fill="currentColor" stroke="none" d="m146 145-22-24-13 31-36 17 23 18 39-4c19 25 25 43 8 72-33 55-9 90 47 99 79 13 154-37 148-94-4-38-45-61-75-40-25 18-9 44 10 43-20-30 25-41 30-8 7 44-60 74-108 58-45-16-20-45-1-78 17-30-1-68-21-87l-5-32-23 29Z"/><path stroke-width="12" d="M309 230c57-13 75-44 54-70-16-19-44-15-48 5-4 17 14 24 26 15M320 307c28 48 4 80-32 70m-89-46-18 44-41 7 26 13 35-8 19-40M163 245l-28-25-21 5m12-2-12-25M146 140l20-46 23 3m-53 43-1-48"/><path stroke="var(--cut)" stroke-width="6" d="m181 277 22 11m-15 3 23 12m6-4 22 6m12-4 18-7"/>`
  };
  let selected = 'rouge';
  try { selected = localStorage.getItem('magicbird_theme') || selected; } catch (_) {}
  if (!themes.some(([id]) => id === selected)) selected = 'rouge';
  document.documentElement.dataset.birdTheme = selected;
  document.addEventListener('DOMContentLoaded', () => {
    const box = document.createElement('div');
    box.className = 'bird-palette';
    box.setAttribute('role','group');
    box.setAttribute('aria-label','页面配色');
    box.innerHTML = themes.map(([id,name]) => `<button type="button" data-palette="${id}" aria-label="${name}" title="${name}"><span class="palette-swatch swatch-${id}"></span></button>`).join('');
    document.body.append(box);
    function apply(id) {
      document.documentElement.dataset.birdTheme = id;
      box.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.palette === id)));
      const color = getComputedStyle(document.body).getPropertyValue('--bg0').trim();
      const stroke = getComputedStyle(document.body).getPropertyValue('--motif').trim();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" style="--cut:${color}"><g color="${stroke}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M76 151A207 207 0 0 1 399 111M435 190A207 207 0 0 1 362 420M291 452A207 207 0 0 1 54 284" stroke-width="13"/><path d="M65 162A219 219 0 0 1 341 49M450 231A203 203 0 0 1 406 379M250 457A207 207 0 0 1 73 338" stroke-width="4"/>${beasts[id]}</g></svg>`;
      document.documentElement.style.setProperty('--beast-pattern', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',color);
    }
    box.addEventListener('click', event => {
      const button = event.target.closest('button[data-palette]');
      if (!button) return;
      apply(button.dataset.palette);
      try { localStorage.setItem('magicbird_theme',button.dataset.palette); } catch (_) {}
    });
    apply(selected);
  });
})();
document.addEventListener('DOMContentLoaded',()=>{
 const palette=document.querySelector('.bird-palette');palette.id='birdPalette';palette.hidden=true;
 const toggle=document.createElement('button');toggle.id='birdThemeToggle';toggle.type='button';toggle.setAttribute('aria-label','切换四象配色');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','birdPalette');
 toggle.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.5"/><g stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M29 72Q16 45 31 19Q48 33 49 57Q44 66 29 72Z" fill="#a54e42"/><path d="M32 73Q29 44 47 16Q61 39 57 59Q48 68 32 73Z" fill="#fff6df"/><path d="M35 75Q45 40 65 22Q76 43 66 62Q54 74 35 75Z" fill="#23465f"/><path d="M38 77Q65 48 83 42Q83 68 61 77Q49 83 38 77Z" fill="#719b78"/></g><path d="M28 82Q49 63 67 42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
 document.body.append(toggle);function close(){palette.hidden=true;toggle.setAttribute('aria-expanded','false')}
 toggle.onclick=()=>{palette.hidden=!palette.hidden;toggle.setAttribute('aria-expanded',String(!palette.hidden))};palette.addEventListener('click',e=>{if(e.target.closest('[data-palette]'))close()});document.addEventListener('click',e=>{if(!palette.contains(e.target)&&!toggle.contains(e.target))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 const record=document.getElementById('recProp');record.setAttribute('role','button');record.tabIndex=0;record.setAttribute('aria-label','卦录');record.title='卦录';record.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();record.click()}});
});
