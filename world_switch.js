/* ============================================================
   世界切换入口（公共层）· world_switch.js
   西玄世界 ↔ 东玄世界（玄鸟之境）
   在页面 <body data-world="west|east"> 上注入左上角世界切换符号：
   - 西玄页（west）：玄鸟图案 → 前往 bird_ios.html（玄鸟之境 / 东玄）
   - 东玄页（east）：黑猫图案 → 返回 reading_ios.html（黑猫之境 / 西玄）
   与右上角的世界内导航（魔法工坊 / 显化之境…）层级相互独立。
   ============================================================ */
(function () {
  'use strict';
  if (window.__worldSwitchLoaded) return;
  window.__worldSwitchLoaded = true;

  /* 飞鸟徽章：展翼、双环、虚线与星芒；颜色由四境主题驱动。 */
  var XUANNIAO_SVG =
    '<svg class="ws-bird-seal" viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-linecap="round">' +
    '<circle cx="50" cy="50" r="47.5" stroke-width=".8"/>' +
    '<circle class="ws-seal-dashes" cx="50" cy="50" r="44.3" stroke-width=".85" stroke-dasharray="2.6 3.5"/>' +
    '<circle cx="50" cy="50" r="41" stroke-width=".9"/>' +
    '<circle class="ws-seal-orbit" cx="50" cy="50" r="32.7" stroke-width=".65"/>' +
    '</g>' +
    '<g fill="currentColor"><path d="M50 3.3q.5 2 2 2.7-1.5.7-2 2.7Q49.5 6.7 48 6q1.5-.7 2-2.7ZM50 91.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7ZM6 47.3q.5 2 2 2.7-1.5.7-2 2.7Q5.5 50.7 4 50q1.5-.7 2-2.7ZM94 47.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7Z"/></g>' +
    '<g class="ws-seal-stars"><path d="m50 20 .7 4.2 1.7-1.4-1.2 2 3.3.6-3.3.6 1.2 2-1.7-1.4L50 31l-.7-4.4-1.7 1.4 1.2-2-3.3-.6 3.3-.6-1.2-2 1.7 1.4ZM50 72l.7 4.2 1.7-1.4-1.2 2 3.3.6-3.3.6 1.2 2-1.7-1.4L50 83l-.7-4.4-1.7 1.4 1.2-2-3.3-.6 3.3-.6-1.2-2 1.7 1.4ZM14.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6ZM85.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z"/></g>' +
    '<g stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">' +
    '<path class="ws-bird-paper" stroke-width=".85" d="M56 49c4-8 9-9 12-12l-1 4 5-6-1 5 6-8c1 8-3 13-8 17l-8 7Z"/>' +
    '<path class="ws-bird-paper" stroke-width="1" d="M57 51c3 1 6-6 10-6 2 0 3 1 4 2l4 .2-3 1.4c-3 2-3 7-7 11-4 5-9 6-17 6L27 76l13-11-17 7c2-4 13-6 23-10-4 0-5-1-4-2-4 0-5-1-3-3-4 0-5-2-3-3-4-1-5-3-3-4-4-1-5-3-3-4-4-2-5-4-3-4-4-3-5-6-3-5-4-4-5-7-3-6-3-5-4-9-2-7l8 9c-6-8-8-14-6-16 5 10 12 16 21 24 5 4 5 10 9 12Z" transform="translate(3 0)"/>' +
    '<path stroke-width=".65" d="m51 66-1 3q-1 2-3 1m6-4-1 2h-2M71 47.5l-2 1"/>' +
    '</g>' +
    '<g fill="currentColor"><circle cx="70" cy="47.5" r=".85"/>' +
    '<path d="M36 34q8 7 12 15l5 4q-7-3-11-7l8 4-11-10 9 6ZM40 44l12 9-11-5 12 7-10-3 11 5-10-2 10 4-9-1 9 2-7 1 8-1q-4-1-5-5ZM29 27l7 10-9-8 9 11-10-7 10 9-9-5 11 9-10-5 11 8-9-4 11 7-8-2 10 5-7-1 9 3-6 1 8 1-5 2 7-2-4 3 6-2ZM31 72l15-7-11 9 16-9-7 1ZM66 42l5-6-3 8 8-10-5 11 6-8-3 8-3 3 2-5-7 6 3-7-6 6Z"/></g>' +
    '</svg>';

  /* 坐猫徽章：侧脸、闭眼、卷尾与双环星芒，配玄鸟桌的古玉与金色。 */
  var BLACKCAT_SVG =
    '<svg class="ws-cat-seal" viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-linecap="round">' +
    '<circle cx="50" cy="50" r="47.5" stroke-width=".8"/>' +
    '<circle cx="50" cy="50" r="44.3" stroke-width=".85" stroke-dasharray="2.6 3.5"/>' +
    '<circle cx="50" cy="50" r="41" stroke-width=".9"/>' +
    '<circle class="ws-seal-orbit" cx="50" cy="50" r="32.7" stroke-width=".65"/>' +
    '</g>' +
    '<g fill="currentColor"><path d="M50 3.3q.5 2 2 2.7-1.5.7-2 2.7Q49.5 6.7 48 6q1.5-.7 2-2.7ZM50 91.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7ZM6 47.3q.5 2 2 2.7-1.5.7-2 2.7Q5.5 50.7 4 50q1.5-.7 2-2.7ZM94 47.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7Z"/></g>' +
    '<g class="ws-seal-stars"><path d="m50 20 .7 4.2 1.7-1.4-1.2 2 3.3.6-3.3.6 1.2 2-1.7-1.4L50 31l-.7-4.4-1.7 1.4 1.2-2-3.3-.6 3.3-.6-1.2-2 1.7 1.4ZM14.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6ZM85.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z"/></g>' +
    '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
    '<path stroke-width=".85" d="M40.1 34.5q1.1-2.7 3.2-5l.6 6.3"/>' +
    '<path stroke-width="1" d="M43.9 36q-4.3-2.6-7.4.2c-1.8 1.6-2.3 1.2-3.1 1.5l.3.8-.8.2c-1.1 3.8 1.7 5.1 2.9 7.2 2.3 4.1-2.2 6.1-1.7 10.6.2 2.8 2.9 5.2 4 8.6 1 3 1.6 5.7 1.5 8-2.2.2-2.7 2.8-.7 2.8h2.3c1 0 1.4-.5 1.7-1.7l2.2-12.2c-1.7 6.2-.6 9.2 2.9 11.2-3.8-1.2-6.4 2.7-3.6 2.7h10.8c12.6 0 18.3-10 16.1-19-1.2-5-4.3-8.1-7.8-7.6-4.6.5-4.5 6-.9 5.4 1.8-.3 2.1-1.9 1.2-2.5"/>' +
    '<path stroke-width="1" d="M43.9 36l4.4-3.8c1.5 4.6-.2 10.6.1 13.3.3 3.8 2.3 5.1 5.9 7.4 7.4 4.8 9.7 12.4 6.4 20 8-3 13-10.5 10.3-17.5"/>' +
    '</g>' +
    '<g fill="currentColor">' +
    '<path d="M36.9 38.9q.6-.5 1-.3 1.1 1.2 2.9 1.3-2.8.7-3.9-1ZM48.3 32.2l-2.8 6.3 1.7-5.3ZM35.2 44.3q1.9 2.3 2.9 4.7l-2.6-3.2ZM34.5 54q-.8 3.6 3.6 9l-2-4.6q-1.4-2.1-1.6-4.4ZM44.8 65q2-5.7 7.4-5.8-4.4 1.2-7 8ZM39.7 74q-1.3.8-.8 1.9l-.8-.3q-.1-1.1 1.6-1.6ZM45 74.6q-1.1.3-.9 1.4l-.8-.2q0-1 1.7-1.2ZM70.7 59q2.1 8.3-6.2 13.9 6.3-6.6 6.2-13.9Z"/>' +
    '</g></svg>';

  var CONFIG = {
    west: {
      href: 'bird_ios.html',
      title: '进入东玄 · 前往玄鸟之境',
      label: '进入东玄',
      sub: '前往玄鸟之境',
      svg: XUANNIAO_SVG
    },
    east: {
      href: 'reading_ios.html',
      title: '返回西玄 · 返回黑猫之境',
      label: '返回西玄',
      sub: '返回黑猫之境',
      svg: BLACKCAT_SVG
    }
  };

  function init() {
    if (!document.body) return;
    var world = document.body.getAttribute('data-world') === 'east' ? 'east' : 'west';
    var c = CONFIG[world];
    var a = document.createElement('a');
    a.className = 'world-switch world-switch--' + world;
    a.href = c.href;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', c.label + '，' + c.sub);
    a.title = c.title;
    a.innerHTML = c.svg + '<span class="ws-tip"><span>' + c.label + '</span><em>' + c.sub + '</em></span>';
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
