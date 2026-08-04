/**
 * ============================================================
 *  塔罗牌组配置文件
 *  
 *  用法：
 *    1. 在 图片/盒子/ 下创建子文件夹，放入牌组图片
 *    2. 在此文件的 DECKS 数组中添加一个对象
 *    3. 刷新页面即可
 *
 *  图片命名规则（以 维特塔罗 为例）：
 *    图片/盒子/维特塔罗/
 *      ├── back.png          ← 背面图案（必须）
 *      ├── 001.png           ← 第1张牌正面
 *      ├── 002.png           ← 第2张牌正面
 *      ├── 003.png
 *      └── ...               ← 按编号递增
 *
 *  支持的图片格式: png, jpg, jpeg, webp, gif, svg
 *  推荐尺寸: 140×200px（宽×高），PNG 格式支持透明背景
 *
 *  删除牌组：直接从本数组中移除对应对象即可
 *  主 HTML 文件无需任何改动
 * ============================================================
 */

const DECKS = [
  { name: '维特塔罗', path: '图片/盒子/维特塔罗', cardCount: 78, format: 'png' },
  { name: '花影塔罗', path: '图片/盒子/花影塔罗', cardCount: 78, format: 'jpg' },
  { name: '阿卡西之眼·塔罗', path: '图片/盒子/阿卡西之眼_塔罗', cardCount: 78, format: 'png', back: 'jpg' },
  { name: '阿卡西之眼·雷诺曼', path: '图片/盒子/阿卡西之眼_雷诺曼', cardCount: 48, format: 'png', back: 'jpg', noReverse: true, startAt: 1 },
  { name: '雷诺曼', path: '图片/盒子/雷诺曼', cardCount: 36, format: 'webp', back: 'jpg', noReverse: true, startAt: 1 },
];
