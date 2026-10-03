/**
 * ============================================================
 *  塔罗牌组配置文件
 *  
 *  用法：
 *    1. 在 图片/ 下创建子文件夹，放入牌组图片
 *    2. 在此文件的 DECKS 数组中添加一个对象
 *    3. 刷新页面即可
 *
 *  图片命名规则（以 维特塔罗 为例）：
 *    图片/维特塔罗/
 *      ├── back.webp         ← 背面图案（必须）
 *      ├── 0.webp            ← 第1张牌正面
 *      ├── 1.webp            ← 第2张牌正面
 *      ├── 2.webp
 *      └── ...               ← 按编号递增
 *
 *  支持的图片格式: png, jpg, jpeg, webp, gif, svg
 *  format 指定正面格式；back 未指定时跟随 format。
 *  编号默认从 0 开始，不补零；从 1 开始的牌组请设置 startAt: 1。
 *  推荐尺寸: 140×200px（宽×高），PNG 格式支持透明背景
 *
 *  删除牌组：直接从本数组中移除对应对象即可
 *  主 HTML 文件无需任何改动
 * ============================================================
 */

const DECKS = [
  { name: '维特塔罗', path: '图片/维特塔罗', cardCount: 78, format: 'webp', startAt: 0, aspectRatio: 250 / 429 },
  { name: '小小奇遇雷诺曼', path: '图片/小小奇遇雷诺曼', cardCount: 36, format: 'webp', back: 'webp', noReverse: true, startAt: 1, aspectRatio: 1024 / 1365, hasInterpretation: true },
  { name: '宇宙力量卡', path: '图片/宇宙力量卡/cards', cardCount: 140, format: 'webp', back: 'webp', noReverse: true, startAt: 0, layout: 'landscape', aspectRatio: 16 / 9, hasInterpretation: false },
  { name: '万象字卡', path: '图片/万象字卡', cardCount: 50, format: 'webp', back: 'webp', noReverse: true, startAt: 0, aspectRatio: 1, hasInterpretation: false, cardNames: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] },
];
