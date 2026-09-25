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

  /* 飞鸟徽章：简洁展翼轮廓、三束长尾、双环与星芒；四境共用透明线稿。 */
  var XUANNIAO_SVG =
    '<svg class="ws-bird-seal" viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
    '<g stroke="currentColor" stroke-linecap="round">' +
    '<circle cx="50" cy="50" r="47.5" stroke-width=".8"/>' +
    '<circle class="ws-seal-dashes" cx="50" cy="50" r="44.3" stroke-width=".85" stroke-dasharray="2.6 3.5"/>' +
    '<circle cx="50" cy="50" r="41" stroke-width=".9"/>' +
    '<path class="ws-seal-orbit" d="M35.3 21.3A32.7 32.7 0 0 1 76 30.8M79.4 35.9A32.7 32.7 0 0 1 30.8 76.5M24.8 70.1A32.7 32.7 0 0 1 27.6 26.2" stroke-width=".45"/>' +
    '</g>' +
    '<g fill="currentColor"><path d="M50 3.3q.5 2 2 2.7-1.5.7-2 2.7Q49.5 6.7 48 6q1.5-.7 2-2.7ZM50 91.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7ZM6 47.3q.5 2 2 2.7-1.5.7-2 2.7Q5.5 50.7 4 50q1.5-.7 2-2.7ZM94 47.3q.5 2 2 2.7-1.5.7-2 2.7-.5-2-2-2.7 1.5-.7 2-2.7Z"/></g>' +
    '<g class="ws-seal-stars"><path d="m50 20 .7 4.2 1.7-1.4-1.2 2 3.3.6-3.3.6 1.2 2-1.7-1.4L50 31l-.7-4.4-1.7 1.4 1.2-2-3.3-.6 3.3-.6-1.2-2 1.7 1.4ZM50 72l.7 4.2 1.7-1.4-1.2 2 3.3.6-3.3.6 1.2 2-1.7-1.4L50 83l-.7-4.4-1.7 1.4 1.2-2-3.3-.6 3.3-.6-1.2-2 1.7 1.4ZM14.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6ZM85.5 48l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z"/></g>' +
    '<g transform="translate(-9.82 -8.77) scale(.0954)">' +
    '<g stroke="currentColor" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M702 625Q707 595 724 578L723 590Q735 566 747 559L748 577Q767 538 785 527L785 548Q808 505 830 495L826 523Q852 475 872 469L865 501Q899 439 918 430C925 474 885 548 844 588"/>' +
    '<path d="M749 655C701 648 692 603 672 570S629 523 594 492C522 431 472 362 442 292Q426 318 462 391L414 343Q399 369 452 435L410 414Q403 440 451 486L422 477Q416 499 463 535L440 534Q432 553 491 586L464 585Q451 604 510 629L491 631Q481 650 536 666L520 673Q513 689 567 696L556 704Q548 722 603 720C544 748 425 772 389 802"/>' +
    '<path d="M718 642C752 629 767 594 800 585Q829 576 852 599Q874 597 886 603L853 615 861 619C834 648 834 687 807 722C772 769 711 789 643 785Q591 782 560 802"/>' +
    '</g>' +
    '<g fill="currentColor"><circle cx="825" cy="612" r="8"/>' +
    '<path d="M389 802C424 773 500 765 575 763L607 756C553 790 432 875 405 881Q393 885 407 870C436 842 500 801 538 777C480 803 367 870 351 869Q338 867 360 847C399 813 487 783 540 772L390 808Q380 809 389 802Z"/>' +
    '<path d="M442 292Q432 324 455 373L479 411 456 394Q430 343 442 292ZM414 343Q409 381 440 421L470 451 450 440Q406 397 414 343ZM410 414Q411 448 438 474L469 496 448 490Q411 459 410 414Z"/>' +
    '</g></g>' +
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
