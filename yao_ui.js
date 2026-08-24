/* ============================================================
   yao_ui.js — 统一爻线组件（YaoUI）
   主桌面 / 完整排盘 / 未来卦册 统一复用，禁止各页面自绘爻线。
   爻值约定：6老阴(动) 7少阳 8少阴 9老阳(动)；null = 未成。
   API：
     YaoUI.typeOf(v)      -> 'yang' | 'yin'
     YaoUI.movingOf(v)    -> '○' | '×' | ''（老阳○ / 老阴×）
     YaoUI.bar(type,size) -> 单条爻线 HTML（type: yang|yin|none；size: lg|md|sm）
     YaoUI.row(o)         -> 一行 HTML（o: {type,marker,size,label}）
     YaoUI.stack(lines,o) -> 六爻爻柱 HTML（初爻在下；o: {size,showLabel}）
   ============================================================ */
const YaoUI = (function () {
  'use strict';

  const typeOf = v => (v === 7 || v === 9) ? 'yang' : 'yin';
  const movingOf = v => v === 6 ? '×' : v === 9 ? '○' : '';

  /* 单条爻线本体 */
  function bar(type, size) {
    type = type || 'none';
    size = size || 'md';
    return '<span class="yao-bar yao-' + type + ' yao-' + size + '"></span>';
  }

  /* 一行：可选 label + 爻线 + 标记 */
  function row(o) {
    o = o || {};
    const type = o.type || 'none';
    const size = o.size || 'md';
    const marker = o.marker || '';
    const label = (o.label != null && o.label !== '')
      ? '<span class="yao-label yao-' + size + '">' + o.label + '</span>'
      : '<span class="yao-label yao-' + size + '"></span>';
    return '<div class="yao-row">' + label + bar(type, size) +
      '<span class="yao-marker yao-' + size + '">' + marker + '</span></div>';
  }

  /* 六爻爻柱（初爻在下），lines 初→上，null=未成 */
  function stack(lines, o) {
    o = o || {};
    const size = o.size || 'md';
    const showLabel = o.showLabel !== false;
    let html = '<div class="yao-stack">';
    for (let i = 5; i >= 0; i--) {
      const v = lines[i];
      if (v == null) {
        html += row({ type: 'none', size, label: showLabel ? (i + 1) : '' });
      } else {
        html += row({ type: typeOf(v), marker: movingOf(v), size, label: showLabel ? (i + 1) : '' });
      }
    }
    html += '</div>';
    return html;
  }

  return { typeOf, movingOf, bar, row, stack };
})();
