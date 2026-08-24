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

  /* 玄鸟：镂空线稿 · 小弧形鸟首、长颈、展翼与流线尾羽 */
  var XUANNIAO_SVG =
    '<svg viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M40 27c1-7 5-12 11-13 5-1 9 1 11 5l9-5"/>' +
    '<path d="M53 16c3 9 3 19-1 29-4 10-11 16-19 14-7-2-11-8-10-16"/>' +
    '<path d="M38 38C29 30 19 24 7 22c7 8 15 14 25 19M34 36C25 34 17 30 10 26M30 31c-6-1-11-3-15-6"/>' +
    '<path d="M33 58c-7 4-14 6-22 6m17-9c-6 2-11 3-16 2"/>' +
    '<path d="M55 18h.1"/>' +
    '</g></svg>';

  /* 黑猫：与玄鸟一致的镂空线稿，端坐侧身、弯尾与月星 */
  var BLACKCAT_SVG =
    '<svg viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M29 21 24 12l-6 8c-4 3-6 8-5 14 1 6 5 9 10 11-3 7-3 13 0 18"/>' +
    '<path d="M29 21c8 1 14 7 15 17 1 9-2 18-8 25M23 63h22"/>' +
    '<path d="M37 63c12 1 22-4 22-13 0-6-5-10-10-8-4 1-6 5-5 9 1 3 4 4 7 3"/>' +
    '<path d="M27 31h.1M18 30c3 2 6 2 9 0"/>' +
    '<path d="M54 11c5 3 7 9 5 14-2 4-7 7-12 5 5-1 8-5 8-9 0-3-1-6-4-8"/>' +
    '<path d="M9 12l1.3 3.4 3.4 1.3-3.4 1.3L9 21.5 7.7 18 4.3 16.7l3.4-1.3Z"/>' +
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
