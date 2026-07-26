/* =========================================================
   core.js — キャンバス / 入力 / 描画ユーティリティ / セーブ
   ========================================================= */

const CV = document.getElementById('game');
const CTX = CV.getContext('2d');
CTX.imageSmoothingEnabled = false;
const W = 640, H = 480;
const VW = 320, VH = 240;          // 内部（ワールド）解像度
const WCV = document.createElement('canvas'); WCV.width = VW; WCV.height = VH;
const WG = WCV.getContext('2d'); WG.imageSmoothingEnabled = false;

function fitCanvas() {
  const s = Math.max(1, Math.min(window.innerWidth / W, (window.innerHeight - 28) / H));
  CV.style.width = (W * s) + 'px';
  CV.style.height = (H * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

/* ---------------- 入力 ---------------- */
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok',
  x: 'cancel', X: 'cancel', Escape: 'cancel', Backspace: 'cancel',
  Shift: 'run', m: 'mute', M: 'mute'
};
const Input = {
  down: {}, just: {}, _waiters: [],
  isDown(k) { return !!this.down[k]; },
  take(k) { if (this.just[k]) { this.just[k] = false; return true; } return false; },
  clear() { this.just = {}; },
  wait(keys) {
    return new Promise(res => this._waiters.push({ keys, res }));
  },
  _fire(k) {
    for (let i = this._waiters.length - 1; i >= 0; i--) {
      const w = this._waiters[i];
      if (!w.keys || w.keys.indexOf(k) >= 0) { this._waiters.splice(i, 1); w.res(k); }
    }
  }
};
window.addEventListener('keydown', e => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (!Input.down[k]) { Input.just[k] = true; Input._fire(k); }
  Input.down[k] = true;
  Sound.resume();
  if (k === 'mute') { Sound.toggle(); }
}, { passive: false });
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.key];
  if (k) { Input.down[k] = false; e.preventDefault(); }
}, { passive: false });
window.addEventListener('blur', () => { Input.down = {}; });

const sleep = ms => new Promise(r => setTimeout(r, ms));
function waitConfirm() { return Input.wait(['ok', 'cancel']); }

/* ---------------- 描画ユーティリティ ---------------- */
const FONT = '"Yu Gothic UI","Hiragino Kaku Gothic ProN","Meiryo",sans-serif';

function panel(g, x, y, w, h, style) {
  const r = 8;
  g.save();
  const grad = g.createLinearGradient(0, y, 0, y + h);
  if (style === 'dark') { grad.addColorStop(0, '#2a2340'); grad.addColorStop(1, '#191428'); }
  else if (style === 'blue') { grad.addColorStop(0, '#2b4a80'); grad.addColorStop(1, '#1b2d54'); }
  else { grad.addColorStop(0, '#fdfbf4'); grad.addColorStop(1, '#e6e0d0'); }
  g.fillStyle = grad;
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  g.fill();
  g.lineWidth = 4; g.strokeStyle = (style === 'plain') ? '#b8ad95' : '#4b4262';
  g.stroke();
  g.lineWidth = 2; g.strokeStyle = (style === 'plain') ? '#ffffff88' : '#8f83b8';
  g.beginPath();
  if (g.roundRect) g.roundRect(x + 4, y + 4, w - 8, h - 8, r - 3); else g.rect(x + 4, y + 4, w - 8, h - 8);
  g.stroke();
  g.restore();
}

function txt(g, s, x, y, o) {
  o = o || {};
  g.save();
  g.font = (o.bold === false ? '' : 'bold ') + (o.size || 20) + 'px ' + FONT;
  g.textBaseline = 'top';
  g.textAlign = o.align || 'left';
  if (o.shadow !== false) { g.fillStyle = o.shadowColor || 'rgba(0,0,0,.35)'; g.fillText(s, x + 2, y + 2); }
  g.fillStyle = o.color || '#2b2438';
  g.fillText(s, x, y);
  g.restore();
}

function measure(g, s, size, bold) {
  g.save(); g.font = (bold === false ? '' : 'bold ') + (size || 20) + 'px ' + FONT;
  const w = g.measureText(s).width; g.restore(); return w;
}

function wrapText(g, s, size, maxW) {
  const out = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const ch of para) {
      if (measure(g, line + ch, size) > maxW && line) { out.push(line); line = ch; }
      else line += ch;
    }
    out.push(line);
  }
  return out;
}

function bar(g, x, y, w, h, pct, col, bg) {
  g.fillStyle = bg || '#3a3450';
  g.fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle = '#171227';
  g.fillRect(x, y, w, h);
  const p = Math.max(0, Math.min(1, pct));
  g.fillStyle = col;
  g.fillRect(x, y, Math.round(w * p), h);
  g.fillStyle = 'rgba(255,255,255,.30)';
  g.fillRect(x, y, Math.round(w * p), Math.max(1, (h / 3) | 0));
}
function hpColor(p) { return p > .5 ? '#4fd06a' : p > .22 ? '#f2c33c' : '#ef5b5b'; }

function typeChip(g, type, x, y, small) {
  const t = TYPES[type]; if (!t) return 0;
  const s = small ? 13 : 15;
  const w = measure(g, t.name, s) + 16;
  g.save();
  g.fillStyle = t.color;
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, s + 7, 5); else g.rect(x, y, w, s + 7);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke();
  g.restore();
  txt(g, t.name, x + 8, y + 3, { size: s, color: '#241a33', shadow: false });
  return w;
}

/* ---------------- メッセージ窓 ---------------- */
const MsgBox = {
  lines: [], shown: 0, active: false, name: null,
  y: H - 148, h: 138
};

async function say(text, opt) {
  opt = opt || {};
  const g = CTX;
  const lines = wrapText(g, text, 22, 540);
  for (let i = 0; i < lines.length; i += 3) {
    MsgBox.lines = lines.slice(i, i + 3);
    MsgBox.name = opt.name || null;
    MsgBox.active = true;
    MsgBox.shown = 0;
    const total = MsgBox.lines.join('').length;
    while (MsgBox.shown < total) {
      MsgBox.shown += Input.isDown('ok') ? 3 : 1;
      await sleep(16);
    }
    MsgBox.shown = 999;
    MsgBox.wait = true;
    await waitConfirm();
    MsgBox.wait = false;
    Sound.se('cursor');
  }
  if (!opt.keep) MsgBox.active = false;
}

function drawMsgBox(g) {
  if (!MsgBox.active) return;
  panel(g, 24, MsgBox.y, W - 48, MsgBox.h, 'plain');
  if (MsgBox.name) {
    const w = measure(g, MsgBox.name, 17) + 26;
    panel(g, 34, MsgBox.y - 22, w, 34, 'blue');
    txt(g, MsgBox.name, 34 + 13, MsgBox.y - 14, { size: 17, color: '#ffe9a8' });
  }
  let n = MsgBox.shown, yy = MsgBox.y + 22;
  for (const l of MsgBox.lines) {
    const s = l.slice(0, Math.max(0, n));
    txt(g, s, 50, yy, { size: 22, color: '#2b2438', shadow: false });
    n -= l.length;
    yy += 34;
    if (n <= 0) break;
  }
  if (MsgBox.wait) {
    const t = (performance.now() / 300 | 0) % 2;
    g.fillStyle = '#7a5ac8';
    g.beginPath();
    g.moveTo(W - 62, MsgBox.y + MsgBox.h - 30 + t);
    g.lineTo(W - 46, MsgBox.y + MsgBox.h - 30 + t);
    g.lineTo(W - 54, MsgBox.y + MsgBox.h - 18 + t);
    g.fill();
  }
}

/* ---------------- 汎用メニュー ---------------- */
async function chooseMenu(items, o) {
  o = o || {};
  const g = CTX;
  let idx = o.start || 0;
  const per = o.per || items.length;
  let top = 0;
  const wpx = o.w || 220;
  const lh = o.lh || 34;
  const x = o.x === undefined ? W - wpx - 30 : o.x;
  const hpx = per * lh + 26;
  const y = o.y === undefined ? MsgBox.y - hpx - 12 : o.y;
  Menus.push({
    draw() {
      panel(g, x, y, wpx, hpx, o.style || 'plain');
      for (let i = 0; i < per; i++) {
        const it = items[top + i]; if (!it) break;
        const label = typeof it === 'string' ? it : it.label;
        const sub = typeof it === 'string' ? null : it.sub;
        const dis = typeof it === 'object' && it.disabled;
        txt(g, label, x + 34, y + 14 + i * lh, { size: 20, color: dis ? '#9a92a8' : '#2b2438', shadow: false });
        if (sub) txt(g, sub, x + wpx - 20, y + 15 + i * lh, { size: 18, color: '#5a5470', align: 'right', shadow: false });
        if (top + i === idx) {
          g.fillStyle = '#7a5ac8';
          const ay = y + 20 + i * lh;
          g.beginPath(); g.moveTo(x + 14, ay); g.lineTo(x + 26, ay + 7); g.lineTo(x + 14, ay + 14); g.fill();
        }
      }
      if (top > 0) txt(g, '▲', x + wpx - 24, y + 4, { size: 13, color: '#7a5ac8', shadow: false });
      if (top + per < items.length) txt(g, '▼', x + wpx - 24, y + hpx - 20, { size: 13, color: '#7a5ac8', shadow: false });
      if (o.extra) o.extra(g, idx);
    }
  });
  try {
    while (true) {
      const k = await Input.wait(['up', 'down', 'left', 'right', 'ok', 'cancel']);
      if (k === 'up') { idx = (idx - 1 + items.length) % items.length; Sound.se('cursor'); }
      else if (k === 'down') { idx = (idx + 1) % items.length; Sound.se('cursor'); }
      else if (k === 'left') { idx = Math.max(0, idx - per); Sound.se('cursor'); }
      else if (k === 'right') { idx = Math.min(items.length - 1, idx + per); Sound.se('cursor'); }
      else if (k === 'ok') {
        const it = items[idx];
        if (typeof it === 'object' && it.disabled) { Sound.se('cancel'); continue; }
        Sound.se('ok'); return idx;
      }
      else if (k === 'cancel') {
        if (o.noCancel) { Sound.se('cancel'); continue; }
        Sound.se('cancel'); return -1;
      }
      if (idx < top) top = idx;
      if (idx >= top + per) top = idx - per + 1;
    }
  } finally { Menus.pop(); }
}
const Menus = [];   // 現在表示中のオーバーレイ描画リスト

async function confirmYN(text, defNo) {
  await say(text, { keep: true });
  const i = await chooseMenu(['はい', 'いいえ'], { w: 150, per: 2, start: defNo ? 1 : 0 });
  MsgBox.active = false;
  return i === 0;
}

/* ---------------- ゲーム状態 ---------------- */
const game = {
  state: 'title',
  map: 'home', px: 5, py: 5, dir: 'down',
  party: [], box: [], bag: {}, money: 1200,
  flags: {}, seen: {}, caught: {}, defeated: {},
  playerName: 'ヒカル', rivalName: 'カイ',
  retMap: null, steps: 0, playtime: 0, shopId: 1
};
window.game = game;

function addItem(id, n) { game.bag[id] = (game.bag[id] || 0) + (n || 1); }
function useItemCount(id) { game.bag[id]--; if (game.bag[id] <= 0) delete game.bag[id]; }
function bagList() { return Object.keys(game.bag).filter(k => game.bag[k] > 0); }
function partyAlive() { return game.party.some(m => m.hp > 0); }
function healParty() { game.party.forEach(m => { m.hp = m.max; m.st = null; m.slpT = 0; m.moves.forEach(mv => mv.pp = mv.max); }); }
function badgeCount() { return ['badge1', 'badge2', 'badge3', 'badge4'].filter(b => game.flags[b]).length; }

/* ---------------- セーブ ---------------- */
const SAVE_KEY = 'manabeast_save_v1';
function saveGame() {
  try {
    const d = {
      map: game.map, px: game.px, py: game.py, dir: game.dir,
      party: game.party, box: game.box, bag: game.bag, money: game.money,
      flags: game.flags, seen: game.seen, caught: game.caught, defeated: game.defeated,
      playtime: game.playtime, uid: _uidSeq
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    return true;
  } catch (e) { return false; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!d) return false;
    Object.assign(game, {
      map: d.map, px: d.px, py: d.py, dir: d.dir, party: d.party, box: d.box || [],
      bag: d.bag, money: d.money, flags: d.flags, seen: d.seen || {},
      caught: d.caught || {}, defeated: d.defeated || {}, playtime: d.playtime || 0
    });
    _uidSeq = d.uid || 999;
    return true;
  } catch (e) { return false; }
}
