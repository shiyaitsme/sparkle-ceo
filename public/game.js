'use strict';
/* SPARK!E 董事长模拟 · 原型 v0.1
 * 纯前端,无依赖。双击 index.html 或用任意静态服务器打开。
 * 规则全部由代码计算,没有接任何 API。 */

const KEY = 'spark_ceo_v1';
const FIXED = 5000;        // 每季固定支出:工位、软件、云算力、你自己的生活补贴
const ASSIST = 4000;       // 助理每季费用
const BASE_TIME = 10;      // 每季基础时间点
const GOAL = { cash: 40000, rep: 15, works: 4 };

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const chance = (p) => Math.random() < p;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const yen = (n) => (n < 0 ? '-¥' : '¥') + Math.abs(Math.round(n)).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ====================================================== state */
let S = null;
let pickedMode = 'real';

function newState(mode) {
  return {
    mode,
    year: 2027, quarter: 1, phase: 'start',
    cash: 20000, buffer: 20000, debt: 0,
    rep: 3, works: 1, gigs: 0, soldIP: 0,
    timeClient: 0, timeOwn: 0,
    assistant: false, boost: 0,
    time: BASE_TIME, applied: false,
    pending: [], seen: [], log: [],
  };
}
const real = () => S.mode === 'real';
const maxTime = () => BASE_TIME + (S.assistant ? 2 : 0) + S.boost;
const useTime = (n) => { S.time = Math.max(0, S.time - n); };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const clearSave = () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } };

/* ====================================================== stage scaling */
function fit() {
  const s = Math.min(window.innerWidth / 810, window.innerHeight / 570);
  $('stage').style.transform = `scale(${s}) translate(-50%, -50%)`;
}
window.addEventListener('resize', fit);

/* ====================================================== pixel scene */
const SKY = [
  ['#1e1450', '#4a2a7a', '#8a4a98'],
  ['#162a5a', '#2e4a8a', '#6a7ab8'],
  ['#2a1450', '#6a2a78', '#c86a90'],
  ['#101838', '#2a2a5a', '#5a4a88'],
];
const CITY = [[0, 12], [5, 20], [11, 14], [16, 27], [22, 16], [28, 23], [34, 12], [39, 19]];
const FRAME_COL = ['#f0a0c8', '#80d0e8', '#f8e088', '#a8e0b0'];

function drawScene() {
  const g = $('sceneCv').getContext('2d');
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const q = S ? clamp(S.quarter - 1, 0, 3) : 0;
  const works = S ? S.works : 1;

  // wall with dither
  r('#d8a0c4', 0, 0, 130, 44);
  for (let y = 0; y < 44; y += 2) for (let x = (y / 2) % 2 * 2; x < 130; x += 4) r('#cf96ba', x, y, 1, 1);
  r('#8a5a8a', 0, 43, 130, 2);
  // floor + carpet
  r('#6a3e72', 0, 45, 130, 17);
  for (let y = 46; y < 62; y += 3) r('#5e3466', 0, y, 130, 1);
  r('#a65a8e', 8, 49, 74, 12);
  for (let x = 8; x < 82; x += 2) { r('#c878a8', x, 49, 1, 1); r('#c878a8', x + 1, 60, 1, 1); }

  // window + night sky + skyline
  r('#2a1840', 78, 2, 48, 36);
  const sky = SKY[q];
  r(sky[0], 80, 4, 44, 11);
  r(sky[1], 80, 15, 44, 11);
  r(sky[2], 80, 26, 44, 10);
  for (let x = 80; x < 124; x += 2) { r(sky[1], x, 14, 1, 1); r(sky[2], x + 1, 25, 1, 1); }
  r('#fff8d0', 116, 8, 3, 3);
  [[84, 6], [92, 9], [100, 5], [108, 11]].forEach(([x, y]) => r('#ffffff', x, y, 1, 1));
  CITY.forEach(([ox, h], i) => {
    const w = i % 2 ? 6 : 5;
    r('#1a1030', 80 + ox, 36 - h, w, h);
    for (let j = 0; j < h - 2; j += 3) {
      if ((i * 7 + j * 3) % 5 < 2) r('#f8e060', 81 + ox + (j % 2), 34 - j, 1, 1);
    }
  });
  r('#2a1840', 101, 4, 2, 32);
  r('#2a1840', 80, 20, 44, 2);

  // framed works on the wall (one per work, up to 4)
  for (let i = 0; i < Math.min(works, 4); i++) {
    const x = 14 + i * 14;
    r('#2a1840', x, 6, 11, 10);
    r(FRAME_COL[i], x + 1, 7, 9, 8);
    r('#ffffff', x + 2, 8, 2, 1);
  }

  // plant
  r('#8a4a3a', 4, 38, 8, 7);
  r('#2a8a5a', 3, 27, 3, 11); r('#3aaa6a', 6, 22, 3, 16); r('#2a8a5a', 9, 28, 3, 10);

  // desk
  r('#8a5a3a', 14, 34, 58, 3);
  r('#6a4228', 14, 37, 58, 2);
  r('#6a4228', 16, 39, 3, 6); r('#6a4228', 67, 39, 3, 6);
  // monitor
  r('#2a1840', 26, 18, 22, 15);
  r('#58c8e8', 28, 20, 18, 11);
  r('#ffffff', 30, 22, 10, 1); r('#b8f0ff', 30, 25, 14, 1); r('#ffffff', 30, 28, 8, 1);
  r('#2a1840', 35, 33, 4, 1);
  // lamp + mug
  r('#f8d860', 51, 24, 5, 3); r('#2a1840', 53, 27, 1, 7);
  r('#ffffff', 18, 31, 3, 3); r('#e86aa0', 18, 31, 3, 1);
  // chair
  r('#b84a80', 30, 41, 14, 3); r('#b84a80', 31, 36, 3, 6); r('#6a2a58', 36, 44, 2, 3);

  // assistant
  if (S && S.assistant) {
    r('#4a3a2a', 60, 24, 4, 2); r('#f4d0b8', 60, 26, 4, 4); r('#58c8e8', 59, 30, 6, 4);
  }

  // low cash: the room goes dim
  if (S && S.cash < 5000) { g.fillStyle = 'rgba(10, 0, 30, 0.38)'; g.fillRect(0, 0, 130, 62); }
}

/* ====================================================== pixel portraits */
const PORT = {
  self:    { hair: '#e86aa0', skin: '#f8d8c0', cloth: '#58c8e8', bg: '#6a3a8a', style: 'long' },
  client:  { hair: '#2a2038', skin: '#f0c8a8', cloth: '#3a3a5a', bg: '#3a5a8a', style: 'short', glasses: true },
  curator: { hair: '#5a3a8a', skin: '#f8d8c0', cloth: '#e8e0f0', bg: '#8a4a78', style: 'bob' },
  friend:  { hair: '#7a4a2a', skin: '#f4d0b0', cloth: '#f8d860', bg: '#4a8a78', style: 'short' },
  brand:   { hair: '#d88a3a', skin: '#f8d8c0', cloth: '#e86aa0', bg: '#5a4a98', style: 'bob', glasses: true },
};
const SPK = {
  narr:    { name: '旁白', kind: 'cat' },
  self:    { name: '你', kind: 'self' },
  client:  { name: '客户', kind: 'client' },
  curator: { name: '策展人', kind: 'curator' },
  friend:  { name: '朋友', kind: 'friend' },
  brand:   { name: '品牌方', kind: 'brand' },
};

function drawPortrait(kind) {
  const g = $('portrait').getContext('2d');
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const speckle = () => {
    g.fillStyle = 'rgba(255,255,255,0.07)';
    for (let y = 0; y < 24; y++) for (let x = y % 2; x < 24; x += 2) g.fillRect(x, y, 1, 1);
  };
  if (kind === 'cat') {
    r('#3a2a58', 0, 0, 24, 24); speckle();
    r('#14101c', 5, 4, 3, 4); r('#14101c', 16, 4, 3, 4);
    r('#e8a0b8', 6, 5, 1, 2); r('#e8a0b8', 17, 5, 1, 2);
    r('#14101c', 5, 7, 14, 11); r('#14101c', 4, 18, 16, 6);
    r('#c8f060', 8, 11, 3, 3); r('#c8f060', 13, 11, 3, 3);
    r('#14101c', 9, 11, 1, 3); r('#14101c', 14, 11, 1, 3);
    r('#e8809c', 11, 15, 2, 1); r('#9a90b0', 2, 14, 4, 1); r('#9a90b0', 18, 14, 4, 1);
    r('#e86aa0', 8, 18, 8, 1);
    return;
  }
  const p = PORT[kind] || PORT.self;
  r(p.bg, 0, 0, 24, 24); speckle();
  if (p.style === 'long') r(p.hair, 4, 4, 16, 19);
  else if (p.style === 'bob') r(p.hair, 5, 4, 14, 13);
  else r(p.hair, 6, 4, 12, 6);
  r(p.cloth, 2, 19, 20, 5); r(p.cloth, 4, 18, 16, 2);
  r(p.skin, 10, 16, 4, 3);
  r(p.skin, 8, 6, 8, 12);
  r(p.hair, 6, 4, 12, 3); r(p.hair, 6, 7, 3, 3); r(p.hair, 15, 7, 3, 3); r(p.hair, 9, 7, 6, 1);
  r('#2a1840', 9, 11, 2, 3); r('#2a1840', 13, 11, 2, 3);
  r('#ffffff', 9, 11, 1, 1); r('#ffffff', 13, 11, 1, 1);
  r('#f090b0', 8, 15, 2, 1); r('#f090b0', 14, 15, 2, 1);
  r('#c04060', 11, 16, 2, 1);
  if (p.glasses) {
    ['#2a1840'].forEach((c) => {
      r(c, 8, 10, 4, 1); r(c, 8, 14, 4, 1); r(c, 8, 10, 1, 5); r(c, 11, 10, 1, 5);
      r(c, 12, 10, 4, 1); r(c, 12, 14, 4, 1); r(c, 12, 10, 1, 5); r(c, 15, 10, 1, 5);
    });
  }
}

/* ====================================================== HUD */
function renderStats() {
  if (!S) return;
  const rows = [
    ['日期', `${S.year} 第${S.quarter}季`, ''],
    ['现金', yen(S.cash), S.cash < 5000 ? 'warn' : ''],
    ['声誉', S.rep, ''],
    ['时间', `${S.time} / ${maxTime()}`, ''],
    ['安全垫', yen(S.buffer), ''],
    ['作品', S.works, ''],
  ];
  rows.push(S.debt > 0 ? ['个人债务', yen(S.debt), 'warn'] : ['商单', S.gigs, '']);
  $('stats').innerHTML = rows.map(([a, b, c]) => `<div class="row ${c}"><span>${a}</span><b>${b}</b></div>`).join('');

  const g = (label, v, goal, fmt) => `${label} ${fmt(v)}/${fmt(goal)}${v >= goal ? '(达成)' : ''}`;
  $('hint').textContent =
    `今年目标:${g('现金', S.cash, GOAL.cash, yen)} · ${g('声誉', S.rep, GOAL.rep, String)} · ${g('作品', S.works, GOAL.works, String)}。全部达成就解锁下一条业务线。(${real() ? '真实' : '轻松'}模式)`;
}
function renderAll() { renderStats(); drawScene(); }

function setSpeaker(who, name) {
  const info = SPK[who] || SPK.narr;
  $('speaker').textContent = name || info.name;
  $('nameBar').textContent = name || info.name;
  drawPortrait(info.kind);
}

/* ====================================================== dialogue engine */
let advanceFn = null;
const showNext = (on) => { $('next').style.display = on ? 'block' : 'none'; };

function say(who, text, name) {
  renderAll();
  setSpeaker(who, name);
  $('choices').innerHTML = '';
  showNext(false);
  return new Promise((resolve) => {
    const el = $('text');
    let i = 0;
    let done = false;
    let timer = null;
    const finish = () => { clearInterval(timer); done = true; el.textContent = text; showNext(true); };
    timer = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 16);
    advanceFn = () => {
      if (!done) { finish(); return; }
      advanceFn = null; showNext(false); resolve();
    };
  });
}

function setPrompt(text) {
  renderAll();
  setSpeaker('narr');
  advanceFn = null;
  showNext(false);
  $('choices').innerHTML = '';
  $('text').textContent = text;
}

function choose(who, prompt, options, name) {
  renderAll();
  setSpeaker(who, name);
  advanceFn = null;
  showNext(false);
  $('text').textContent = prompt;
  $('text').classList.add('compact');
  const box = $('choices');
  box.innerHTML = '';
  return new Promise((resolve) => {
    options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = `${i + 1}. ${esc(o.label)}${o.hint ? `<span class="hint">${esc(o.hint)}</span>` : ''}`;
      b.disabled = o.enabled === false;
      b.addEventListener('click', (e) => { e.stopPropagation(); box.innerHTML = ''; $('text').classList.remove('compact'); resolve(i); });
      box.appendChild(b);
    });
  });
}

$('dialog').addEventListener('click', () => { if (advanceFn) advanceFn(); });
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    if (advanceFn) { e.preventDefault(); advanceFn(); }
  } else if (/^[1-5]$/.test(e.key)) {
    const btns = $('choices').querySelectorAll('button');
    const b = btns[Number(e.key) - 1];
    if (b && !b.disabled) b.click();
  }
});

/* ---- commands ---- */
let cmdResolve = null;
function updateCmds(on) {
  document.querySelectorAll('.cmd').forEach((b) => {
    const c = b.dataset.cmd;
    if (c === 'restart') { b.disabled = false; return; }
    if (!on || !S) { b.disabled = true; return; }
    if (c === 'gig' || c === 'work') b.disabled = S.time < 3;
    else if (c === 'apply') b.disabled = S.time < 2 || S.applied;
    else b.disabled = false;
  });
}
document.querySelectorAll('.cmd').forEach((b) => b.addEventListener('click', () => {
  const c = b.dataset.cmd;
  if (c === 'restart') {
    if (window.confirm('清除存档并重新开始?')) { clearSave(); location.reload(); }
    return;
  }
  if (cmdResolve) { const r = cmdResolve; cmdResolve = null; r(c); }
}));
const waitCmd = () => new Promise((res) => { cmdResolve = res; });


/* ---- pixel icons for the command buttons ---- */
const ICONS = {
  gig:     ['########', '##....##', '#.#..#.#', '#..##..#', '#......#', '#......#', '########', '........'],
  work:    ['...##...', '...##...', '..####..', '########', '########', '..####..', '...##...', '...##...'],
  apply:   ['#.......', '######..', '#######.', '#######.', '######..', '#.......', '#.......', '#.......'],
  ledger:  ['.######.', '##....##', '#.####.#', '#......#', '#.####.#', '#......#', '#.####.#', '.######.'],
  end:     ['##......', '####....', '######..', '########', '########', '######..', '####....', '##......'],
  restart: ['..####..', '.#....#.', '#.....##', '#....###', '#.......', '.#.....#', '..#####.', '........'],
};
function drawIcons() {
  document.querySelectorAll('.cmd').forEach((b) => {
    const rows = ICONS[b.dataset.cmd];
    const holder = b.querySelector('.ico');
    if (!rows || !holder) return;
    const cv = document.createElement('canvas');
    cv.width = 8; cv.height = 8;
    const g = cv.getContext('2d');
    g.fillStyle = '#e86aa0';
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') g.fillRect(x, y, 1, 1); }));
    holder.textContent = '';
    holder.appendChild(cv);
  });
}

/* ====================================================== actions */
const GIG_TITLES = ['咖啡品牌的社交媒体动态视觉', '独立音乐人的实时演出画面', '展会开场的 AE 动画', '新品发布会的 AI 生成视觉', '快闪店的互动投影'];
const WORK_TITLES = ['情绪可视化的实时画面', '会呼吸的 TouchDesigner 装置', 'AI 生成的梦境影像短片', '"危险的浪漫"系列视觉'];

async function doGig() {
  useTime(3); S.gigs++; S.timeClient += 3; S.rep += 1;
  const pay = rnd(30, 50) * 100;
  const title = pick(GIG_TITLES);
  if (real() && chance(0.25)) {
    S.pending.push({ amount: pay, label: title });
    await say('narr', `《${title}》交付了。客户说财务流程走得慢,${yen(pay)} 要下个季度才到账。声誉 +1。`);
  } else {
    S.cash += pay;
    await say('narr', `《${title}》交付了,客户付款 ${yen(pay)}。声誉 +1。`);
  }
}

async function doWork() {
  useTime(3); S.works++; S.rep += 2; S.cash -= 500; S.timeOwn += 3;
  await say('narr', `你做完了《${pick(WORK_TITLES)}》。没有人付钱,但它是你自己的作品。作品 +1,声誉 +2,材料费 ${yen(500)}。`);
}

async function doApply() {
  useTime(2); S.applied = true;
  const p = clamp(0.15 + S.rep * 0.03 + S.works * 0.06, 0.1, 0.8);
  if (chance(p)) {
    S.cash += 8000; S.rep += 3;
    await say('narr', `申请通过了。基金给了 ${yen(8000)},声誉 +3。(命中率约 ${Math.round(p * 100)}%)`);
  } else {
    await say('narr', `这次没有通过。评审说方案有意思,但作品还不够成熟。(命中率约 ${Math.round(p * 100)}%)`);
  }
}

async function showLedger() {
  const pend = S.pending.reduce((a, p) => a + p.amount, 0);
  const fixed = FIXED + (S.assistant ? ASSIST : 0);
  const interest = real() && S.debt > 0 ? Math.round(S.debt * 0.05) : 0;
  await say('narr',
    `现金 ${yen(S.cash)}  ·  个人安全垫 ${yen(S.buffer)}${S.debt ? `  ·  个人债务 ${yen(S.debt)}` : ''}\n` +
    `待到账 ${yen(pend)}\n` +
    `每季固定支出 ${yen(fixed)}${interest ? `,另有利息 ${yen(interest)}` : ''}\n` +
    `商单 ${S.gigs} 个 · 自己的作品 ${S.works} 件 · 买断版权 ${S.soldIP} 次`);
}

/* ====================================================== events */
const EVENTS = {
  buyout: {
    title: '版权买断', who: 'client', name: '品牌方 · 林总监',
    cond: () => true,
    pages: ['我们看了你的实时视觉作品,很喜欢。', '有个新品发布会想用一套类似的装置内容,预算 ¥10,000。'],
    ask: '不过合同要买断版权,作品归品牌方所有。你怎么答?',
    choices: [
      { label: '接受买断', hint: '+¥10,000,时间 -3,版权归对方',
        run() { S.cash += 10000; S.gigs++; S.soldIP++; S.rep += 1; useTime(3); S.timeClient += 3;
          return ['你签了合同,钱当天到账。不过这批作品以后不能放进你自己的作品集。']; } },
      { label: '谈判:保留版权,价格降到 ¥6,000', hint: '约 55% 成功;失败则客户离开,时间 -1',
        run() {
          if (chance(0.55)) { S.cash += 6000; S.works++; S.gigs++; S.rep += 1; useTime(3); S.timeClient += 3;
            return ['对方同意了。钱少了,但作品留在你手里。作品 +1。']; }
          useTime(1);
          return ['对方说预算和流程都定了,没法改。这个单子没谈成,白花了一点时间。'];
        } },
      { label: '拒绝', hint: '没有变化',
        run() { return ['你把机会让给了别人。账上没变,心里踏实了点。']; } },
    ],
  },

  gpu: {
    title: '设备故障', who: 'narr',
    cond: () => true,
    pages: ['渲染到一半,笔记本的显卡突然黑屏了。散热口飘出一股焦味。'],
    ask: '设备要怎么处理?',
    choices: [
      { label: '送去修', hint: '-¥3,000', enabled: () => S.cash >= 3000,
        run() { S.cash -= 3000; return ['修好了,继续用。']; } },
      { label: '换新机器', hint: '-¥12,000,以后每季度 +1 时间点', enabled: () => S.cash >= 12000,
        run() { S.cash -= 12000; S.boost += 1; S.time += 1; return ['新机器渲染快多了,每季度能多出 1 个时间点。']; } },
      { label: '先凑合用', hint: '不花钱,本季度时间 -2',
        run() { useTime(2); return ['你用核显硬撑着渲染,慢得像在等一场雨停。本季度时间 -2。']; } },
    ],
  },

  hire: {
    title: '第一个帮手', who: 'friend', name: '朋友 · 阿宁',
    cond: () => !S.assistant,
    pages: ['我最近有空,可以来帮你做 TouchDesigner 的活。', '我不想白帮忙,每季度 ¥4,000 就行。你每季度能多出 2 个时间点。'],
    ask: '要不要请他?',
    choices: [
      { label: '请他做长期助理', hint: '每季度 -¥4,000,时间点上限 +2',
        run() { S.assistant = true; S.time += 2; return ['阿宁坐到了你旁边的桌子。工作室不再只有你一个人。']; } },
      { label: '只请他做这一个季度的项目', hint: '一次性 -¥2,000,本季度 +2 时间点', enabled: () => S.cash >= 2000,
        run() { S.cash -= 2000; S.time += 2; return ['阿宁帮你把积压的活清了一批。本季度时间 +2。']; } },
      { label: '先不请', hint: '维持现状',
        run() { return ['你说再等等。阿宁笑了笑,说随时找他。']; } },
    ],
  },

  install: {
    title: '艺术节装置', who: 'curator', name: '策展人 · 周',
    cond: () => true,
    pages: ['艺术节想邀请你做一件互动装置,放在主展厅。',
      '制作费需要你先垫付 ¥20,000,展后补贴 ¥28,000,还有展位和宣传。',
      '补贴要到下个季度才发,主办方的预算有一定风险。'],
    ask: '你打算怎么做?',
    choices: [
      { label: '公司现金垫付', hint: '-¥20,000 现金', enabled: () => S.cash >= 20000,
        run() { S.cash -= 20000; return installOutcome(); } },
      { label: '向机构贷款 ¥20,000',
        hint: '', // filled in below
        run() { if (real()) S.debt += 20000; return installOutcome(); } },
      { label: '做缩小版', hint: '-¥6,000,时间 -2,补贴 ¥9,000,几乎没有风险', enabled: () => S.cash >= 6000,
        run() { S.cash -= 6000; useTime(2); S.pending.push({ amount: 9000, label: '艺术节(缩小版)' }); S.works++; S.rep += 2; S.timeOwn += 2;
          return ['你把装置缩小成一面互动墙。补贴 ¥9,000 下个季度到账。作品 +1,声誉 +2。']; } },
      { label: '婉拒', hint: '没有变化',
        run() { return ['你说时间和钱都不够。周老师说下次还找你。']; } },
    ],
  },

  viral: {
    title: '作品出圈', who: 'brand', name: '品牌 · 小夏',
    cond: () => S.works >= 2,
    pages: ['你的作品在社交平台被转发了很多次。', '一个潮流品牌来问联名的事。'],
    ask: '怎么处理这个机会?',
    choices: [
      { label: '做联名', hint: '+¥6,000,时间 -2,声誉 +1',
        run() { S.cash += 6000; S.gigs++; S.rep += 1; useTime(2); S.timeClient += 2; return ['联名款上线了。钱到手,风格也被对方改掉了一些。']; } },
      { label: '保持低调,继续做自己的', hint: '声誉 +2',
        run() { S.rep += 2; return ['你没有回复。热度慢慢退去,留下了一批关注你的人。']; } },
      { label: '趁势办一个线上展', hint: '-¥1,000,时间 -2,声誉 +4', enabled: () => S.cash >= 1000,
        run() { S.cash -= 1000; useTime(2); S.timeOwn += 2; S.rep += 4; return ['线上展做得很快,来看展的人比预想的多。声誉 +4。']; } },
    ],
  },

  seoul: {
    title: '首尔的公开征集', who: 'friend', name: '朋友',
    cond: () => true,
    pages: ['首尔有个独立展览在公开征集,要交作品和一页方案。', '报名费 ¥1,500。我觉得你的作品很适合。'],
    ask: '要报名吗?',
    choices: [
      { label: '报名', hint: '-¥1,500,时间 -1,入选可得补助 ¥5,000', enabled: () => S.cash >= 1500,
        run() {
          S.cash -= 1500; useTime(1);
          const p = clamp(0.2 + S.works * 0.08 + S.rep * 0.02, 0.2, 0.75);
          if (chance(p)) { S.cash += 5000; S.rep += 4; return [`入选了。补助 ${yen(5000)} 到账,声誉 +4。`]; }
          return ['这次没有入选。不过你顺便把作品集整理了一遍,下次会更顺。'];
        } },
      { label: '不报名', hint: '没有变化',
        run() { return ['你把链接存起来了。说不定下次。']; } },
    ],
  },
};

function installOutcome() {
  useTime(3); S.timeOwn += 3; S.works++;
  const roll = Math.random();
  if (roll < 0.6) {
    S.pending.push({ amount: 28000, label: '艺术节补贴' }); S.rep += 4;
    return ['展出很成功,有人在装置前站了很久。补贴 ¥28,000 将在下个季度到账。作品 +1,声誉 +4。'];
  }
  if (roll < 0.85 || !real()) {
    S.pending.push({ amount: 16000, label: '艺术节补贴(缩水)' }); S.rep += 3;
    return ['主办方砍了预算,补贴只剩 ¥16,000,下个季度到账。装置还是展出了。作品 +1,声誉 +3。'];
  }
  S.rep += 2;
  return ['主办方资金出了问题,补贴取消了。装置展出了,但这笔钱没有了。作品 +1,声誉 +2。'];
}

function pickEvent() {
  const q = S.quarter;
  let pool;
  if (q === 1) pool = ['buyout', 'gpu', 'hire'];
  else if (q === 2) pool = ['install'];
  else pool = ['hire', 'gpu', 'buyout', 'viral', 'seoul'];
  const ok = (id) => !S.seen.includes(id) && EVENTS[id].cond();
  let list = pool.filter(ok);
  if (!list.length) list = Object.keys(EVENTS).filter(ok);
  if (!list.length) return null;
  const id = pick(list);
  S.seen.push(id);
  return id;
}

async function runEvent(id) {
  const ev = EVENTS[id];
  for (const t of ev.pages) await say(ev.who, t, ev.name);
  const opts = ev.choices.map((c) => {
    let hint = c.hint;
    if (id === 'install' && c.label.startsWith('向机构贷款')) {
      hint = real() ? '需要你个人担保,年底前要还,每季度 5% 利息' : '轻松模式:没有个人担保';
    }
    return { label: c.label, hint, enabled: c.enabled ? c.enabled() : true };
  });
  const i = await choose(ev.who, ev.ask, opts, ev.name);
  const lines = ev.choices[i].run();
  S.log.push(`第${S.quarter}季度 · ${ev.title}:${ev.choices[i].label}`);
  for (const t of lines) await say('narr', t);
}

/* ====================================================== quarter flow */
async function startQuarter() {
  if (S.quarter === 1 && S.log.length === 0) {
    await say('narr', '2027 年 1 月。SPARK!E 还只有你一个人,一台笔记本,和一些没做完的想法。');
    await say('narr', `今年的目标:现金 ≥ ${yen(GOAL.cash)}、声誉 ≥ ${GOAL.rep}、作品 ≥ ${GOAL.works}。做到就能解锁下一条业务线。`);
    await say('narr', real()
      ? '真实模式:钱不够时会动用你的个人安全垫;贷款需要你个人担保。公司可以倒,但别让债落到自己头上。'
      : '轻松模式:现金不会见底,没有个人担保。慢慢看故事就好。');
  } else {
    await say('narr', `${S.year} 年 第 ${S.quarter} 季度开始。`);
  }
  if (S.pending.length) {
    const total = S.pending.reduce((a, p) => a + p.amount, 0);
    const names = S.pending.map((p) => p.label).join('、');
    S.pending = [];
    S.cash += total;
    await say('narr', `上个季度拖着的款项到账了:${names},共 ${yen(total)}。`);
  }
  const id = pickEvent();
  if (id) await runEvent(id);
  S.phase = 'plan';
}

async function planPhase() {
  for (;;) {
    save();
    if (S.time < 2) setPrompt('这个季度的时间用完了。可以看看账本,或者结束本季度。');
    else setPrompt(`${S.year} 年第 ${S.quarter} 季度。还有 ${S.time} 个时间点。要做什么?`);
    updateCmds(true);
    const cmd = await waitCmd();
    updateCmds(false);
    if (cmd === 'ledger') { await showLedger(); continue; }
    if (cmd === 'end') {
      if (S.time >= 3) {
        const i = await choose('narr', `还有 ${S.time} 个时间点没用。现在结束本季度吗?`, [{ label: '结束本季度' }, { label: '再想想' }]);
        if (i === 1) continue;
      }
      return;
    }
    if (cmd === 'gig') await doGig();
    else if (cmd === 'work') await doWork();
    else if (cmd === 'apply') await doApply();
  }
}

async function settle() {
  const fixed = FIXED + (S.assistant ? ASSIST : 0);
  const interest = real() && S.debt > 0 ? Math.round(S.debt * 0.05) : 0;
  S.cash -= fixed + interest;
  await say('narr', `季度结算。固定支出 ${yen(fixed)}${interest ? `,贷款利息 ${yen(interest)}` : ''}。现金剩余 ${yen(S.cash)}。`);

  if (S.cash < 0) {
    if (real()) {
      const take = Math.min(S.buffer, -S.cash);
      S.buffer -= take; S.cash += take;
      if (take > 0) await say('narr', `账上的钱不够,你动用了个人安全垫 ${yen(take)}。安全垫剩余 ${yen(S.buffer)}。`);
      if (S.cash < 0) return 'bankrupt';
    } else {
      const gap = -S.cash; S.cash = 0;
      await say('narr', `(轻松模式)现金见底了,有人悄悄补上了 ${yen(gap)} 的缺口。`);
    }
  }
  if (S.quarter >= 4) return 'yearend';
  S.quarter++; S.time = maxTime(); S.applied = false; S.phase = 'start';
  save();
  return null;
}

/* ====================================================== endings */
function overlay(html) { const o = $('overlay'); o.innerHTML = html; o.hidden = false; o.scrollTop = 0; }

function summaryTable() {
  const tot = S.timeClient + S.timeOwn;
  const pct = tot ? Math.round((S.timeClient / tot) * 100) : 0;
  const rows = [
    ['现金', yen(S.cash)], ['个人安全垫', yen(S.buffer)], ['个人债务', yen(S.debt)],
    ['声誉', S.rep], ['自己的作品', `${S.works} 件`], ['商单', `${S.gigs} 个`], ['买断版权', `${S.soldIP} 次`],
  ];
  return `<table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>` +
    (tot ? `<p class="sub">这一年你的时间:${pct}% 用在商单上,${100 - pct}% 用在自己的作品上。</p>` : '');
}

async function finish(kind) {
  let title; let body; let cls = 'ok'; let extra = '';
  S.pending.forEach((p) => { S.cash += p.amount; }); S.pending = [];

  if (kind === 'bankrupt') {
    if (S.debt > 0) kind = 'debt';
  } else {
    if (S.debt > 0) {
      let owe = S.debt;
      const fromCash = Math.min(S.cash, owe); S.cash -= fromCash; owe -= fromCash;
      const fromBuf = Math.min(S.buffer, owe); S.buffer -= fromBuf; owe -= fromBuf;
      S.debt = owe;
      if (owe > 0) kind = 'debt';
    }
  }

  if (kind === 'debt') {
    cls = 'bad';
    title = '公司倒了,债留给了你';
    body = `现金和安全垫都用完了,担保的贷款还挂在你名下:个人债务 ${yen(Math.max(S.debt, 0) + Math.max(-S.cash, 0))}。<br>公司可以倒,但这笔债不该落在你身上。下次试试缩小版方案,或者先不贷款。`;
  } else if (kind === 'bankrupt') {
    cls = 'bad';
    title = '公司关门了';
    body = '现金和安全垫都用完了。但你没有欠任何个人债务,账是清的。你手里还有作品、经验和一份明白账,可以重新开始。';
  } else if (S.cash >= GOAL.cash && S.rep >= GOAL.rep && S.works >= GOAL.works) {
    title = 'SPARK!E 站稳了';
    body = '一年下来,现金、声誉和作品都够了。F\'est Vie(生活方式线)解锁了,稳定现金流的那一层,下一版开放。';
    extra = '<h2>已解锁</h2><p class="ok">F\'est Vie · Living Aesthetic Division(下一版开放)</p>';
  } else if (S.works >= 4 && S.gigs <= 2) {
    title = '有作品,没现金的艺术家';
    body = '你把时间都给了自己的作品,声誉在涨,账上不宽裕。再多一两个稳定来源,就能撑得更久。';
  } else if (S.gigs >= S.works * 2) {
    title = '稳稳的接单工作室';
    body = '你活得不错,账也好看。这一年的时间大多用在商单上,自己的作品还不多。作品和声誉再多一些,就能解锁下一条业务线。';
  } else {
    title = '活下来了';
    body = '这一年没出大事,也没有大突破。离解锁下一条业务线还差一点。';
  }

  const logHtml = S.log.length ? `<h2>这一年你做过的决定</h2><div class="log">${S.log.map(esc).join('<br>')}</div>` : '';
  clearSave();
  overlay(
    `<h1 class="${cls === 'bad' ? 'bad' : ''}">${title}</h1><p>${body}</p>${extra}<h2>最终状态</h2>${summaryTable()}${logHtml}` +
    '<p><button class="big" data-act="again">再来一局</button><button class="big" data-act="title">回到标题</button></p>');
}

/* ====================================================== title + boot */
const MODE_DESC = {
  real: '真实:钱不够会动用个人安全垫,贷款要个人担保并计利息,客户可能拖款。没有倒计时,想多久都行。',
  easy: '轻松:现金不会见底,没有个人担保,不会拖款。适合看故事、熟悉规则。',
};

function showTitle() {
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  overlay(
    '<h1>SPARK!E</h1><p class="sub">董事长模拟 · 原型 v0.1</p>' +
    '<p>你是一家刚起步的数字艺术工作室的老板:一个人、几万块钱、一堆想法。<br>一年四个季度。每个季度先遇到一件事,再安排时间。</p>' +
    '<h2>难度</h2>' +
    `<button class="big ${pickedMode === 'easy' ? 'sel' : ''}" data-mode="easy">轻松</button>` +
    `<button class="big ${pickedMode === 'real' ? 'sel' : ''}" data-mode="real">真实</button>` +
    `<p class="sub" id="modeDesc">${MODE_DESC[pickedMode]}</p>` +
    '<h2>开始</h2>' +
    '<button class="big" data-act="start">新游戏</button>' +
    (hasSave ? '<button class="big" data-act="continue">继续上次</button>' : '') +
    '<p class="sub">点击对话框或按空格继续;按 1–4 选择选项。</p>');
}

$('overlay').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.mode) {
    pickedMode = t.dataset.mode;
    $('overlay').querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('sel', b === t));
    $('modeDesc').textContent = MODE_DESC[pickedMode];
    return;
  }
  const act = t.dataset.act;
  if (act === 'start') { S = newState(pickedMode); $('overlay').hidden = true; run(false); }
  else if (act === 'continue') {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (err) { S = null; }
    if (!S) { showTitle(); return; }
    $('overlay').hidden = true; run(true);
  } else if (act === 'again') { S = newState(S ? S.mode : pickedMode); $('overlay').hidden = true; run(false); }
  else if (act === 'title') { S = null; showTitle(); }
});

async function run(resume) {
  let skipStart = resume && S.phase === 'plan';
  for (;;) {
    if (!skipStart) await startQuarter();
    skipStart = false;
    await planPhase();
    const r = await settle();
    if (r === 'bankrupt' || r === 'yearend') { await finish(r); return; }
  }
}

fit();
drawIcons();
S = null;
drawScene();
drawPortrait('cat');
updateCmds(false);
showTitle();
