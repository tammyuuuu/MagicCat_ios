/* ============================================================
   liuyao_core.js — 东玄 · 六爻排盘算法层（纯函数，与 UI 无关）
   模块：coinCasting / timeCasting / hexagram / changingLines /
         najia / sixRelatives / sixSpirits / shiYing / buildFullChart
   依赖：yijing_data.js（YIJING_TEXT / GUA_GONG / GUA_SHI / NAJIA /
         GONG_WUXING / ZHI_WUXING / SHENG / KE / SHEN_ORDER /
         SHEN_START / TIAN_GAN / DI_ZHI）
   约定：爻位自初爻(0)至上爻(5)；爻值 6老阴(动) 7少阳 8少阴 9老阳(动)。
   ============================================================ */
const Liuyao = (function () {
  'use strict';

  /* ---- 基础映射 ---- */
  const BIN_TRIGRAM = { '111':'乾','110':'兑','101':'离','100':'震','011':'巽','010':'坎','001':'艮','000':'坤' };
  /* 先天八卦数（乾1兑2离3震4巽5坎6艮7坤8）→ 二进制 */
  const NUM_BIN = { 1:'111', 2:'110', 3:'101', 4:'100', 5:'011', 6:'010', 7:'001', 8:'000' };
  const YAO_NAME = ['初爻','二爻','三爻','四爻','五爻','上爻'];

  const mod8 = n => { const r = ((n % 8) + 8) % 8; return r === 0 ? 8 : r; };

  /* 卦 key → 下/上经卦（二进制数值） */
  const lowerVal = key => key % 8;
  const upperVal = key => Math.floor(key / 8);
  const binOf = v => (v.toString(2)).padStart(3, '0').split(''); /* 数值 → 3位二进制（自下而上） */

  /* ============================================================
     三枚铜钱起卦
     规则（以“背”计）：三背老阳9 / 二背一正少阳7 / 一背二正少阴8 / 三正老阴6
     ============================================================ */
  const coinCasting = {
    /* 模拟一次抛三枚铜钱：返回 { faces:[正/背 x3], backs, value } */
    toss() {
      const faces = Array.from({ length: 3 }, () => Math.random() < 0.5); /* true=字(正) false=背 */
      const backs = faces.filter(f => !f).length;
      const value = backs === 3 ? 9 : backs === 2 ? 7 : backs === 1 ? 8 : 6;
      return { faces, backs, value };
    },
    /* 起满六爻：返回 [6..9 x6]（初→上） */
    castAll() {
      return Array.from({ length: 6 }, () => this.toss().value);
    }
  };

  /* ============================================================
     时间起卦（简化算法，文档化：以公历数字取数，可后续切换干支/农历）
     上卦 = (年+月+日) mod 8；下卦 = (年+月+日+时) mod 8；动爻 = (年+月+日+时) mod 6
     静爻：阳→少阳7 阴→少阴8；动爻：阳→老阳9 阴→老阴6
     ============================================================ */
  const timeCasting = {
    cast({ year, month, day, hour }) {
      const sum = year + month + day;
      const sum2 = sum + hour;
      const upper = mod8(sum);   /* 上卦：年月日 */
      const lower = mod8(sum2);  /* 下卦：年月日时 */
      const moving = (sum2 % 6) || 6; /* 1..6 */
      const bits = NUM_BIN[lower] + NUM_BIN[upper]; /* 初→上：下卦在前 */
      const lines = bits.split('').map((b, i) => {
        if ((i + 1) === moving) return b === '1' ? 9 : 6;
        return b === '1' ? 7 : 8;
      });
      return { upper, lower, moving, lines, note: '简化时间起卦：以公历年月日时取数' };
    }
  };

  /* ============================================================
     本卦 / 变卦 / 动爻
     ============================================================ */
  const isYang = v => v === 7 || v === 9;
  const isMove = v => v === 6 || v === 9;
  const hexKeyOf = lines => {
    const bits = lines.map(v => (isYang(v) ? '1' : '0'));
    return parseInt(bits.slice(3, 6).join(''), 2) * 8 + parseInt(bits.slice(0, 3).join(''), 2);
  };
  const trigramOf = bits => ({ name: BIN_TRIGRAM[bits], bits });

  const hexagram = {
    /* 由六爻值（初→上）构建本卦/变卦 */
    fromLines(lines) {
      const key = hexKeyOf(lines);
      const bits = lines.map(v => (isYang(v) ? '1' : '0'));
      const g = YIJING_TEXT[key];
      const moving = lines.map((v, i) => (isMove(v) ? i + 1 : 0)).filter(Boolean);
      const hasMoving = moving.length > 0;
      let bian = null;
      if (hasMoving) {
        const bLines = lines.map(v => (isMove(v) ? (v === 6 ? 7 : 8) : v)); /* 老阴→少阳，老阳→少阴 */
        const bKey = hexKeyOf(bLines);
        const bg = YIJING_TEXT[bKey];
        bian = { key: bKey, name: bg.n, full: bg.f, bits: bLines.map(v => (isYang(v) ? '1' : '0')) };
      }
      return {
        key, name: g.n, full: g.f, bits,
        lower: trigramOf(bits.slice(0, 3).join('')),
        upper: trigramOf(bits.slice(3, 6).join('')),
        moving, hasMoving, bian
      };
    }
  };

  const changingLines = {
    /* 动爻位（1..6，自初爻起） */
    of(lines) { return lines.map((v, i) => (isMove(v) ? i + 1 : 0)).filter(Boolean); },
    /* 变卦六爻值（老阴→7，老阳→8） */
    transform(lines) { return lines.map(v => (isMove(v) ? (v === 6 ? 7 : 8) : v)); }
  };

  /* ============================================================
     纳甲（京房纳甲）：每爻 天干+地支
     下卦经卦取 inner[初二三]，上卦经卦取 outer[四五上]
     ============================================================ */
  const najia = {
    compute(key) {
      const lo = BIN_TRIGRAM[binOf(lowerVal(key)).join('')];
      const up = BIN_TRIGRAM[binOf(upperVal(key)).join('')];
      return NAJIA[lo].inner.concat(NAJIA[up].outer); /* 初→上 */
    }
  };

  /* ============================================================
     六亲：以宫五行为“我”，与爻支五行生克
     生我父母 / 我生子孙 / 克我官鬼 / 我克妻财 / 同我兄弟
     ============================================================ */
  const sixRelatives = {
    compute(key, najiaLines) {
      const wo = GONG_WUXING[GUA_GONG[key]];
      return najiaLines.map(gz => {
        const zhi = gz[1]; /* 地支 */
        const z = ZHI_WUXING[zhi];
        if (z === wo) return '兄弟';
        if (SHENG[wo] === z) return '子孙';
        if (KE[wo] === z) return '妻财';
        if (SHENG[z] === wo) return '父母';
        return '官鬼';
      });
    }
  };

  /* ============================================================
     六神：依日干起（甲乙青龙…），自初爻依序上推
     ============================================================ */
  const sixSpirits = {
    compute(dayGan) {
      const start = SHEN_START[dayGan];
      const i0 = SHEN_ORDER.indexOf(start);
      return Array.from({ length: 6 }, (_, i) => SHEN_ORDER[(i0 + i) % 6]);
    }
  };

  /* ============================================================
     世应：世位查表，应爻 = 世爻隔三爻（世一应四…）
     ============================================================ */
  const shiYing = {
    compute(key) {
      const shi = GUA_SHI[key] || 6;
      const ying = ((shi + 2) % 6) + 1;
      return { shi, ying };
    }
  };

  /* ============================================================
     干支 / 旬空 / 神煞（历法辅助；节气月为公历近似）
     ============================================================ */
  const ganzhi = {
    /* 年干支：以 (year-4)%60（简化，忽略立春边界） */
    year(y) { const i = (((y - 4) % 60) + 60) % 60; return { gan: TIAN_GAN[i % 10], zhi: DI_ZHI[i % 12], idx: i }; },
    /* 日干支：锚点 2000-01-01 = 戊午日（甲子序 54） */
    day(d) {
      const days = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2000, 0, 1)) / 86400000);
      const idx = (((days + 54) % 60) + 60) % 60;
      return { gan: TIAN_GAN[idx % 10], zhi: DI_ZHI[idx % 12], idx };
    },
    /* 月支（节气近似）：取日期之前最近的一个“节” */
    monthZhi(mo, da) {
      let best = null;
      for (const j of JIE_APPROX) if (j[0] < mo || (j[0] === mo && j[1] <= da)) best = j;
      if (!best) best = JIE_APPROX[11]; /* 小寒前属前年大雪～小寒之子月 */
      return best[3];
    },
    /* 月干支：月支由节气，月干由五虎遁 */
    month(y, mo, da) {
      const yy = ganzhi.year(y);
      const zhi = ganzhi.monthZhi(mo, da);
      const monthNum = ((DI_ZHI.indexOf(zhi) - 2 + 12) % 12) + 1; /* 寅月=1 … 丑月=12 */
      const gan = TIAN_GAN[(TIAN_GAN.indexOf(WU_HU[yy.gan]) + monthNum - 1) % 10];
      return { gan, zhi };
    },
    /* 时干支：时支由钟点，时干由五鼠遁 */
    hour(dayGan, h) {
      const zhiIdx = Math.floor(((h + 1) % 24) / 2); /* 23/0→子 … */
      const gan = TIAN_GAN[(TIAN_GAN.indexOf(WU_SHU[dayGan]) + zhiIdx) % 10];
      return { gan, zhi: DI_ZHI[zhiIdx] };
    },
    /* 旬空（空亡） */
    kongWang(idx) {
      const z0 = Math.floor(idx / 10) * 10 % 12; /* 旬首地支 */
      return [DI_ZHI[(z0 + 10) % 12], DI_ZHI[(z0 + 11) % 12]];
    }
  };

  /* 神煞：驿马 / 桃花 / 日禄 / 天乙贵人 */
  const shensha = {
    compute(dayGan, dayZhi) {
      return {
        yiMa: YI_MA[dayZhi] || '—',
        taoHua: TAO_HUA[dayZhi] || '—',
        lu: LU[dayGan] || '—',
        guiRen: (GUI_REN[dayGan] || []).join(' ')
      };
    }
  };

  /* 卦位：宫名 + 八纯/一世…游魂/归魂 */
  const palaceOf = key => {
    for (const arr of GONG_ORDER) {
      const i = arr.indexOf(key);
      if (i >= 0) return { gong: GUA_GONG[key], pos: i, posName: GUA_POS_NAME[i] };
    }
    return { gong: GUA_GONG[key] || '', pos: 0, posName: '' };
  };

  /* 伏神：本卦所缺之六亲，自本宫首卦（八纯卦）对应爻位伏出 */
  const fushen = {
    compute(key) {
      const gIdx = GONG_ORDER.findIndex(a => a.indexOf(key) >= 0);
      const shouKey = GONG_ORDER[gIdx][0];
      const shouNajia = najia.compute(shouKey);
      const shouRel = sixRelatives.compute(shouKey, shouNajia);
      const benRel = sixRelatives.compute(key, najia.compute(key));
      const present = {};
      benRel.forEach(r => { present[r] = true; });
      const out = [null, null, null, null, null, null];
      for (let i = 0; i < 6; i++) {
        if (!present[shouRel[i]]) out[i] = { rel: shouRel[i], gz: shouNajia[i] };
      }
      return out;
    }
  };

  /* ============================================================
     大衍筮法（蓍草）：三变成一爻，十八变成六爻；得 24/28/32/36 → 6/7/8/9
     概率遵循传统大衍：老阴6=1/16 少阳7=5/16 少阴8=7/16 老阳9=3/16
     （一变归奇 5:9 = 3:1；二三变归奇 4:8 = 1:1；28 时仅可取归奇 4）
     ============================================================ */
  const yarrowCasting = {
    /* 一变：先按经典概率取归奇，再均匀选取一个能得此归奇的分二结果 */
    variation(total) {
      let target;
      if (total === 49) target = Math.random() < 0.75 ? 5 : 9;
      else if (total === 28) target = 4; /* 28-8=20 无效，仅可取归奇 4 */
      else target = Math.random() < 0.5 ? 4 : 8;
      const valid = [];
      for (let l = 1; l <= total - 1; l++) {
        const r = total - l - 1;
        const lr = l % 4 === 0 ? 4 : l % 4;
        const rr = r % 4 === 0 ? 4 : r % 4;
        if (1 + lr + rr === target) valid.push(l);
      }
      const left = valid[Math.floor(Math.random() * valid.length)];
      const right = total - left - 1; /* 挂一后 */
      const lr = left % 4 === 0 ? 4 : left % 4;
      const rr = right % 4 === 0 ? 4 : right % 4;
      return { total: total - (1 + lr + rr), left, right, lr, rr, gui: 1 + lr + rr };
    },
    /* 三变余数 → 爻值：36→9 老阳 / 32→8 少阴 / 28→7 少阳 / 24→6 老阴 */
    valueOfTotal(t) { return t === 36 ? 9 : t === 32 ? 8 : t === 28 ? 7 : 6; },
    /* 三变 → 一爻 */
    line() {
      let t = 49;
      for (let v = 0; v < 3; v++) t = yarrowCasting.variation(t).total;
      return { value: yarrowCasting.valueOfTotal(t), total: t };
    },
    /* 六爻 */
    lines() { return Array.from({ length: 6 }, function () { return yarrowCasting.line().value; }); }
  };

  /* ============================================================
     完整排盘：本卦/变卦 各自的 纳甲/六亲/世应/伏神/卦位，
               及 六神 / 动爻 / 干支 / 旬空 / 神煞
     ============================================================ */
  function buildFullChart({ lines, date, dayGan }) {
    const dt = date || new Date();
    const dg = dayGan || ganzhi.day(dt).gan;

    const ben = hexagram.fromLines(lines);
    ben.lines = lines.slice();
    ben.najia = najia.compute(ben.key);
    ben.sixRelatives = sixRelatives.compute(ben.key, ben.najia);
    ben.shiYing = shiYing.compute(ben.key);
    ben.palace = palaceOf(ben.key);
    ben.fushen = fushen.compute(ben.key);

    let bian = ben.bian;
    if (bian) {
      bian.lines = changingLines.transform(lines);
      bian.najia = najia.compute(bian.key);
      bian.sixRelatives = sixRelatives.compute(bian.key, bian.najia);
      bian.shiYing = shiYing.compute(bian.key);
      bian.palace = palaceOf(bian.key);
      bian.fushen = fushen.compute(bian.key);
    }

    const yy = ganzhi.year(dt.getFullYear());
    const mm = ganzhi.month(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    const dd = ganzhi.day(dt);
    const hh = ganzhi.hour(dg, dt.getHours());

    return {
      ben,
      bian,
      moving: ben.moving,
      hasMoving: ben.hasMoving,
      sixSpirits: sixSpirits.compute(dg),
      dayGan: dg,
      jingDong: lines.map(v => (isMove(v) ? '动' : '静')),
      yinYang: lines.map(v => (isYang(v) ? '阳' : '阴')),
      ganzhi: { year: yy.gan + yy.zhi, month: mm.gan + mm.zhi, day: dd.gan + dd.zhi, hour: hh.gan + hh.zhi },
      kongWang: ganzhi.kongWang(dd.idx),
      shensha: shensha.compute(dg, dd.zhi),
      /* 兼容保留 */
      najia: ben.najia,
      sixRelatives: ben.sixRelatives,
      shiYing: ben.shiYing
    };
  }

  return {
    coinCasting, timeCasting, hexagram, changingLines,
    najia, sixRelatives, sixSpirits, shiYing,
    ganzhi, shensha, fushen, palaceOf,
    yarrowCasting,
    buildFullChart,
    isYang, isMove, hexKeyOf, YAO_NAME
  };
})();
