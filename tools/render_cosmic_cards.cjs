/* Typeset the approved generated backgrounds with reproducible, searchable source copy. */
const fs = require('fs');
const path = require('path');
const {chromium} = require(require.resolve('playwright', {paths: ['C:/Users/tammy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const root = path.resolve(__dirname, '..');
const cards = JSON.parse(fs.readFileSync(path.join(root, 'reading-data/cosmic.json'), 'utf8'));

async function main() {
  const out = path.join(root, 'output/cosmic-redesign/cards');
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  const page = await browser.newPage({viewport: {width: 1024, height: 1536}});
  await page.setContent('<style>body{margin:0}canvas{display:block}</style><canvas width="1024" height="1536"></canvas>');
  const layouts = [];
  for (const card of cards) {
    const bg = fs.readFileSync(path.join(root, `图片/宇宙力量卡/design/${card.element}.webp`)).toString('base64');
    const result = await page.evaluate(async ({card, bg}) => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.src = 'data:image/webp;base64,' + bg;
      await image.decode();
      ctx.clearRect(0, 0, 1024, 1536);
      ctx.drawImage(image, 0, 0, 1024, 1536);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#42203e';
      ctx.font = '34px SimSun, serif';
      ctx.fillText(`${card.elementZh} · ${card.elementEn}`, 512, 60);
      ctx.font = '23px "Times New Roman", serif';
      ctx.fillText(`${String(card.number).padStart(2, '0')} / ${card.count}`, 512, 137);
      const text = card.zh;
      let size = text.length <= 8 ? 100 : text.length <= 11 ? 80 : 66;
      ctx.font = `bold ${size}px SimSun, serif`;
      const maxWidth = 850;
      function wrapChinese(value) {
        if (ctx.measureText(value).width <= maxWidth) return [value];
        // Only a two-line layout may prefer a comma boundary; retain existing rules for longer text.
        const clauses = value.match(/[^，；：！？。]+[，；：！？。]?/g) || [value];
        const capacity = Math.floor(maxWidth / ctx.measureText('国').width);
        if (Math.ceil(value.length / capacity) === 2 && clauses.length === 2 && /，$/.test(clauses[0]) && clauses.join('') === value &&
            clauses.every(clause => ctx.measureText(clause).width <= maxWidth)) {
          return clauses;
        }
        // Dynamic programming favors full lines, balanced lengths, and punctuation boundaries.
        const maxChars = Math.floor(maxWidth / ctx.measureText('国').width);
        const rows = Math.ceil(value.length / maxChars);
        if (rows === 1) return [value];
        const target = value.length / rows;
        const memo = new Map();
        function split(start, left) {
          if (left === 0) return start === value.length ? {cost: 0, lines: []} : null;
          const key = `${start}:${left}`;
          if (memo.has(key)) return memo.get(key);
          let best = null;
          for (let end = start + 1; end <= Math.min(value.length, start + maxChars); end++) {
            const line = value.slice(start, end);
            if (/^[，。、；：！？]/.test(line) || ctx.measureText(line).width > maxWidth) continue;
            const rest = split(end, left - 1);
            if (!rest) continue;
            const punctuation = /[，。、；：！？]$/.test(line);
            const cost = rest.cost + (line.length - target) ** 2 + (left > 1 && !punctuation ? 6 : 0);
            if (!best || cost < best.cost) best = {cost, lines: [line, ...rest.lines]};
          }
          memo.set(key, best);
          return best;
        }
        const result = split(0, rows);
        return result ? result.lines : null;
      }
      let lines = wrapChinese(text);
      while ((!lines || lines.length > 3) && size > 56) {
        size--;
        ctx.font = `bold ${size}px SimSun, serif`;
        lines = wrapChinese(text);
      }
      if (!lines) throw Error('Cannot wrap Chinese: ' + card.id);
      const leading = size * 1.42;
      const center = lines.length === 3 ? 714 : lines.length === 2 ? 742 : 750;
      lines.forEach((line, i) => {
        const y = center + (i - (lines.length - 1) / 2) * leading;
        if (lines.length === 1 && /[。！？]$/.test(line)) {
          const body = line.slice(0, -1);
          const width = ctx.measureText(body).width;
          ctx.fillText(body, 512, y);
          ctx.textAlign = 'left';
          ctx.fillText(line.slice(-1), 512 + width / 2, y);
          ctx.textAlign = 'center';
        } else ctx.fillText(line, 512, y);
      });
      if (center + (lines.length - 1) * leading / 2 + size / 2 > 842) throw Error('Chinese overlaps divider: ' + card.id);
      ctx.font = '46px "Times New Roman", serif';
      const english = [];
      let line = '';
      for (const word of card.en.split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width > 800 && line) { english.push(line); line = word; }
        else line = candidate;
      }
      if (line) english.push(line);
      if (english.length > 5) throw Error('English exceeds area: ' + card.id);
      english.forEach((line, i) => ctx.fillText(line, 512, 918 + i * 54));
      ctx.fillStyle = '#96671f';
      ctx.font = '26px SimSun, serif';
      ctx.fillText('宇 宙 力 量 卡', 512, 1482);
      return {data: canvas.toDataURL('image/webp', .78).split(',')[1], layout: {id: card.id, lines, size, english, center}};
    }, {card, bg});
    fs.writeFileSync(path.join(out, `${card.id}.webp`), Buffer.from(result.data, 'base64'));
    layouts.push(result.layout);
  }
  await browser.close();
  fs.writeFileSync(path.join(root, 'output/cosmic-redesign/layouts.json'), JSON.stringify(layouts, null, 2));
  console.log(JSON.stringify({rendered: layouts.length, longestLines: Math.max(...layouts.map(x => x.lines.length)), maxEnglishLines: Math.max(...layouts.map(x => x.english.length))}));
}
main().catch(error => {console.error(error); process.exit(1);});
