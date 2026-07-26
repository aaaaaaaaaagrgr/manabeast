/* =========================================================
   ui.js — パーティ / どうぐ / ずかん / ショップ / メニュー画面
   ========================================================= */

function drawMonRow(g, m, x, y, w, sel) {
  const sp = SPECIES[m.sp];
  panel(g, x, y, w, 62, sel ? 'blue' : 'plain');
  const cv = creatureCanvas(sp, 1);
  g.drawImage(cv, x + 6, y + 1, 60, 60);
  const col = sel ? '#fdf6e0' : '#2b2438';
  txt(g, monName(m), x + 70, y + 6, { size: 19, color: col, shadow: false });
  txt(g, 'Lv' + m.lv, x + w - 16, y + 8, { size: 17, color: col, align: 'right', shadow: false });
  const p = m.hp / m.max;
  txt(g, m.hp + ' / ' + m.max, x + w - 16, y + 29, { size: 15, color: col, align: 'right', shadow: false });
  bar(g, x + 70, y + 48, w - 88, 9, p, hpColor(p));
  if (m.st) {
    g.fillStyle = STATUS[m.st].color;
    const sw = measure(g, STATUS[m.st].short, 13) + 10;
    g.fillRect(x + 70, y + 29, sw, 17);
    txt(g, STATUS[m.st].short, x + 75, y + 31, { size: 13, color: '#241a33', shadow: false });
  }
  if (m.hp <= 0) { txt(g, 'ひんし', x + 70, y + 29, { size: 15, color: '#ef5b5b', shadow: false }); }
}

/* ---------------- つよさをみる ---------------- */
async function summaryScreen(m) {
  const g = CTX, sp = SPECIES[m.sp];
  let page = 0;
  const layer = {
    draw() {
      g.fillStyle = 'rgba(16,12,28,.92)'; g.fillRect(0, 0, W, H);
      panel(g, 16, 16, W - 32, H - 32, 'dark');
      const cv = creatureCanvas(sp, 4);
      g.drawImage(cv, 40, 54);
      txt(g, 'No.' + String(sp.no).padStart(3, '0'), 40, 190, { size: 16, color: '#b8a0f0' });
      txt(g, monName(m), 190, 46, { size: 28, color: '#fdf6e0' });
      txt(g, 'Lv ' + m.lv, 190, 84, { size: 20, color: '#ffe9a8' });
      let tx = 260;
      tx += typeChip(g, sp.type1, tx, 86) + 6;
      if (sp.type2) typeChip(g, sp.type2, tx, 86);
      const p = m.hp / m.max;
      txt(g, 'HP', 190, 118, { size: 17, color: '#cfc6e8' });
      bar(g, 230, 122, 220, 12, p, hpColor(p));
      txt(g, m.hp + ' / ' + m.max, 462, 116, { size: 17, color: '#fdf6e0' });
      const need = xpToNext(m.lv);
      txt(g, 'EXP', 190, 144, { size: 17, color: '#cfc6e8' });
      bar(g, 230, 148, 220, 8, m.xp / need, '#5fa8ff');
      txt(g, m.xp + ' / ' + need, 462, 142, { size: 15, color: '#cfc6e8' });

      if (page === 0) {
        const st = [['こうげき', m.atk], ['ぼうぎょ', m.def], ['すばやさ', m.spd]];
        st.forEach((s, i) => {
          txt(g, s[0], 60, 232 + i * 34, { size: 19, color: '#cfc6e8' });
          txt(g, String(s[1]), 210, 232 + i * 34, { size: 19, color: '#fdf6e0', align: 'right' });
          bar(g, 220, 238 + i * 34, 160, 10, s[1] / 180, '#a88ce8');
        });
        if (m.st) txt(g, 'じょうたい: ' + STATUS[m.st].name, 60, 340, { size: 18, color: STATUS[m.st].color });
        const info = wrapText(g, sp.info, 17, 220);
        info.forEach((l, i) => txt(g, l, 400, 232 + i * 26, { size: 17, color: '#cfc6e8' }));
        if (sp.evo) txt(g, '→ Lv' + sp.evo.lv + ' で しんか', 400, 340, { size: 16, color: '#ffe9a8' });
      } else {
        txt(g, 'おぼえている わざ', 60, 216, { size: 18, color: '#ffe9a8' });
        m.moves.forEach((mv, i) => {
          const d = MOVES[mv.id];
          const yy = 246 + i * 46;
          panel(g, 52, yy, W - 104, 42, 'blue');
          txt(g, d.name, 66, yy + 10, { size: 19, color: '#fdf6e0', shadow: false });
          typeChip(g, d.type, 230, yy + 11, true);
          txt(g, d.pw ? 'いりょく ' + d.pw : 'へんか', 320, yy + 12, { size: 16, color: '#cfc6e8', shadow: false });
          txt(g, 'PP ' + mv.pp + '/' + mv.max, W - 70, yy + 12, { size: 16, color: '#cfc6e8', align: 'right', shadow: false });
        });
      }
      txt(g, '←→ ページ切替　　X でもどる', W / 2, H - 46, { size: 16, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  while (true) {
    const k = await Input.wait(['left', 'right', 'cancel', 'ok']);
    if (k === 'cancel') break;
    if (k === 'left' || k === 'right' || k === 'ok') { page = 1 - page; Sound.se('cursor'); }
  }
  Sound.se('cancel');
  Menus.pop();
}

/* ---------------- パーティ画面 ---------------- */
async function partyScreen(o) {
  o = o || {};
  const g = CTX;
  let idx = 0, swapFrom = -1;
  const layer = {
    draw() {
      g.fillStyle = 'rgba(16,12,28,.90)'; g.fillRect(0, 0, W, H);
      txt(g, o.title || 'マナビースト', 24, 16, { size: 24, color: '#ffe9a8' });
      if (swapFrom >= 0) txt(g, 'いれかえる あいてを えらんでね', 24, 48, { size: 17, color: '#8fe0ff' });
      else if (o.hint) txt(g, o.hint, 24, 48, { size: 17, color: '#cfc6e8' });
      game.party.forEach((m, i) => {
        const x = 22 + (i % 2) * 300, y = 76 + ((i / 2) | 0) * 74;
        drawMonRow(g, m, x, y, 292, i === idx);
        if (i === swapFrom) txt(g, '⇅', x + 276, y + 6, { size: 20, color: '#8fe0ff' });
      });
      txt(g, o.foot || 'Z けってい　X もどる', W / 2, H - 40, { size: 16, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  try {
    while (true) {
      const k = await Input.wait(['up', 'down', 'left', 'right', 'ok', 'cancel']);
      const n = game.party.length;
      if (k === 'up') { idx = (idx - 2 + n * 2) % n; Sound.se('cursor'); }
      else if (k === 'down') { idx = (idx + 2) % n; Sound.se('cursor'); }
      else if (k === 'left' || k === 'right') { idx = (idx + (k === 'left' ? -1 : 1) + n) % n; Sound.se('cursor'); }
      else if (k === 'cancel') {
        if (swapFrom >= 0) { swapFrom = -1; Sound.se('cancel'); continue; }
        if (o.force) { Sound.se('cancel'); continue; }
        Sound.se('cancel'); return -1;
      }
      else if (k === 'ok') {
        Sound.se('ok');
        if (swapFrom >= 0) {
          const t = game.party[swapFrom]; game.party[swapFrom] = game.party[idx]; game.party[idx] = t;
          swapFrom = -1; continue;
        }
        if (o.mode === 'pick') return idx;
        const acts = ['つよさをみる', 'いれかえ'];
        if (o.mode === 'battle') acts.unshift('たたかわせる');
        acts.push('やめる');
        const a = await chooseMenu(acts, { w: 200, y: 300, x: 400, per: acts.length });
        if (a < 0) continue;
        const label = acts[a];
        if (label === 'たたかわせる') return idx;
        if (label === 'つよさをみる') await summaryScreen(game.party[idx]);
        else if (label === 'いれかえ') swapFrom = idx;
      }
    }
  } finally { Menus.pop(); }
}

/* ---------------- どうぐ画面 ---------------- */
async function bagScreen(o) {
  o = o || {};
  const g = CTX;
  let idx = 0, top = 0;
  const per = 7;
  const list = () => bagList().filter(id => !o.filter || o.filter(ITEMS[id]));
  const layer = {
    draw() {
      const L = list();
      g.fillStyle = 'rgba(16,12,28,.90)'; g.fillRect(0, 0, W, H);
      txt(g, 'どうぐ', 24, 16, { size: 24, color: '#ffe9a8' });
      txt(g, '所持金 ' + game.money + ' マナ', W - 24, 20, { size: 18, color: '#ffe9a8', align: 'right' });
      panel(g, 20, 56, W - 40, 344, 'dark');
      if (L.length === 0) txt(g, 'なにも もっていない…', 56, 90, { size: 20, color: '#cfc6e8' });
      for (let i = 0; i < per; i++) {
        const id = L[top + i]; if (!id) break;
        const it = ITEMS[id], y = 74 + i * 44;
        const sel = (top + i === idx);
        if (sel) { g.fillStyle = 'rgba(122,90,200,.4)'; g.fillRect(34, y - 6, W - 68, 40); }
        if (it.kind === 'ball') g.drawImage(ballCanvas(it.tier, 2), 40, y - 4);
        txt(g, it.name, 80, y, { size: 20, color: '#fdf6e0' });
        txt(g, '×' + game.bag[id], W - 60, y, { size: 19, color: '#ffe9a8', align: 'right' });
      }
      const cur = L[idx];
      if (cur) {
        panel(g, 20, 408, W - 40, 56, 'plain');
        txt(g, ITEMS[cur].desc, 40, 424, { size: 18, color: '#2b2438', shadow: false });
      }
      txt(g, o.foot || 'Z つかう　X もどる', W / 2, H - 18, { size: 15, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  try {
    while (true) {
      const L = list();
      if (idx >= L.length) idx = Math.max(0, L.length - 1);
      const k = await Input.wait(['up', 'down', 'ok', 'cancel']);
      if (k === 'up') { idx = (idx - 1 + L.length) % Math.max(1, L.length); Sound.se('cursor'); }
      else if (k === 'down') { idx = (idx + 1) % Math.max(1, L.length); Sound.se('cursor'); }
      else if (k === 'cancel') { Sound.se('cancel'); return null; }
      else if (k === 'ok') { if (L.length) { Sound.se('ok'); return L[idx]; } }
      if (idx < top) top = idx;
      if (idx >= top + per) top = idx - per + 1;
    }
  } finally { Menus.pop(); }
}

// フィールドでどうぐを使う
async function useItemField(id) {
  const it = ITEMS[id];
  if (it.kind === 'ball') { await say('ここでは つかえない！'); return false; }
  if (it.kind === 'buff') { await say('たたかい の 中でしか つかえない！'); return false; }
  const pi = await partyScreen({ mode: 'pick', title: 'だれに つかう？', hint: it.name });
  if (pi < 0) return false;
  const m = game.party[pi];
  if (it.kind === 'heal') {
    if (m.hp <= 0) { await say(monName(m) + ' は ひんし だ！'); return false; }
    if (m.hp >= m.max) { await say(monName(m) + ' の HPは まんたん だ！'); return false; }
    const before = m.hp;
    m.hp = Math.min(m.max, m.hp + it.amt);
    useItemCount(id); Sound.se('heal');
    await say(monName(m) + ' の HPが ' + (m.hp - before) + ' かいふく した！');
    return true;
  }
  if (it.kind === 'cure') {
    if (!m.st || (it.st !== 'all' && m.st !== it.st)) { await say('こうかが ないみたい…'); return false; }
    m.st = null; m.slpT = 0; useItemCount(id); Sound.se('heal');
    await say(monName(m) + ' の じょうたいが もとに もどった！');
    return true;
  }
  if (it.kind === 'revive') {
    if (m.hp > 0) { await say('げんき な子には つかえない！'); return false; }
    m.hp = Math.max(1, Math.floor(m.max * it.amt)); useItemCount(id); Sound.se('heal');
    await say(monName(m) + ' は げんきを とりもどした！');
    return true;
  }
  if (it.kind === 'candy') {
    useItemCount(id);
    await gainLevel(m, 1);
    return true;
  }
  return false;
}

/* ---------------- あずかりシステム ---------------- */
async function boxScreen() {
  const g = CTX;
  let idx = 0, top = 0;
  const per = 7;
  const layer = {
    draw() {
      g.fillStyle = 'rgba(16,12,28,.93)'; g.fillRect(0, 0, W, H);
      txt(g, 'あずかりシステム', 24, 14, { size: 23, color: '#ffe9a8' });
      txt(g, 'てもち ' + game.party.length + ' / 6', W - 24, 20, { size: 17, color: '#cfc6e8', align: 'right' });
      panel(g, 16, 50, 330, 404, 'dark');
      if (!game.box.length) txt(g, 'あずけている子は いない', 44, 84, { size: 19, color: '#9a92b8' });
      for (let i = 0; i < per; i++) {
        const m = game.box[top + i]; if (!m) break;
        const y = 64 + i * 54, sel = (top + i === idx);
        if (sel) { g.fillStyle = 'rgba(122,90,200,.45)'; g.fillRect(26, y - 4, 310, 50); }
        g.drawImage(creatureCanvas(SPECIES[m.sp], 1), 32, y - 6, 52, 52);
        txt(g, monName(m), 96, y + 4, { size: 19, color: '#fdf6e0' });
        txt(g, 'Lv' + m.lv, 326, y + 6, { size: 17, color: '#ffe9a8', align: 'right' });
      }
      panel(g, 358, 50, W - 378, 404, 'dark');
      txt(g, 'てもち', 378, 62, { size: 18, color: '#ffe9a8' });
      game.party.forEach((m, i) => {
        const y = 92 + i * 56;
        g.drawImage(creatureCanvas(SPECIES[m.sp], 1), 372, y - 6, 52, 52);
        txt(g, monName(m), 432, y, { size: 18, color: '#cfc6e8' });
        txt(g, 'Lv' + m.lv, W - 32, y + 2, { size: 16, color: '#cfc6e8', align: 'right' });
      });
      txt(g, 'Z いれかえ　X もどる', W / 2, H - 18, { size: 15, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  try {
    while (true) {
      const n = game.box.length;
      if (idx >= n) idx = Math.max(0, n - 1);
      const k = await Input.wait(['up', 'down', 'ok', 'cancel']);
      if (k === 'cancel') { Sound.se('cancel'); return; }
      if (k === 'up') { idx = (idx - 1 + Math.max(1, n)) % Math.max(1, n); Sound.se('cursor'); }
      else if (k === 'down') { idx = (idx + 1) % Math.max(1, n); Sound.se('cursor'); }
      else if (k === 'ok' && n) {
        Sound.se('ok');
        const m = game.box[idx];
        if (game.party.length < 6) {
          game.box.splice(idx, 1); game.party.push(m);
          Menus.pop();
          await say(monName(m) + ' を てもちに くわえた！');
          MsgBox.active = false;
          Menus.push(layer);
        } else {
          Menus.pop();
          const pi = await partyScreen({ mode: 'pick', title: 'だれと いれかえる？', hint: monName(m) + ' と こうたい' });
          Menus.push(layer);
          if (pi >= 0) {
            const out = game.party[pi];
            game.party[pi] = m; game.box[idx] = out;
            Sound.se('ok');
            Menus.pop();
            await say(monName(out) + ' と ' + monName(m) + ' を\nいれかえた！');
            MsgBox.active = false;
            Menus.push(layer);
          }
        }
      }
      if (idx < top) top = idx;
      if (idx >= top + per) top = idx - per + 1;
    }
  } finally { Menus.pop(); }
}

/* ---------------- ずかん ---------------- */
async function dexScreen() {
  const g = CTX;
  let idx = 0, top = 0;
  const per = 8;
  const layer = {
    draw() {
      g.fillStyle = 'rgba(16,12,28,.94)'; g.fillRect(0, 0, W, H);
      const seenN = Object.keys(game.seen).length, gotN = Object.keys(game.caught).length;
      txt(g, 'マナずかん', 24, 16, { size: 24, color: '#ffe9a8' });
      txt(g, 'みつけた ' + seenN + '　つかまえた ' + gotN + ' / ' + SPECIES_LIST.length,
          W - 24, 22, { size: 17, color: '#cfc6e8', align: 'right' });
      panel(g, 16, 54, 300, 400, 'dark');
      for (let i = 0; i < per; i++) {
        const sp = SPECIES_LIST[top + i]; if (!sp) break;
        const y = 68 + i * 48, seen = game.seen[sp.no], got = game.caught[sp.no];
        if (top + i === idx) { g.fillStyle = 'rgba(122,90,200,.45)'; g.fillRect(26, y - 6, 280, 44); }
        txt(g, String(sp.no).padStart(3, '0'), 36, y + 4, { size: 17, color: '#9a92b8' });
        txt(g, seen ? sp.name : '－－－－', 84, y + 2, { size: 20, color: seen ? '#fdf6e0' : '#6a6480' });
        if (got) { g.drawImage(ballCanvas(0, 1), 286, y + 4); }
      }
      const sp = SPECIES_LIST[idx];
      panel(g, 328, 54, W - 348, 400, 'dark');
      if (game.seen[sp.no]) {
        const cv = creatureCanvas(sp, 4);
        g.drawImage(cv, 328 + (W - 348) / 2 - 64, 74);
        txt(g, sp.name, 328 + (W - 348) / 2, 214, { size: 24, color: '#fdf6e0', align: 'center' });
        let tx = 328 + (W - 348) / 2 - (sp.type2 ? 62 : 24);
        tx += typeChip(g, sp.type1, tx, 250) + 8;
        if (sp.type2) typeChip(g, sp.type2, tx, 250);
        wrapText(g, sp.info, 17, 260).forEach((l, i) =>
          txt(g, l, 348, 296 + i * 26, { size: 17, color: '#cfc6e8' }));
      } else {
        txt(g, '？', 328 + (W - 348) / 2, 180, { size: 80, color: '#3a3450', align: 'center' });
        txt(g, 'まだ みつけていない', 328 + (W - 348) / 2, 300, { size: 18, color: '#6a6480', align: 'center' });
      }
      txt(g, 'X でもどる', W / 2, H - 18, { size: 15, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  while (true) {
    const k = await Input.wait(['up', 'down', 'left', 'right', 'cancel']);
    const n = SPECIES_LIST.length;
    if (k === 'up') { idx = (idx - 1 + n) % n; Sound.se('cursor'); }
    else if (k === 'down') { idx = (idx + 1) % n; Sound.se('cursor'); }
    else if (k === 'left') { idx = Math.max(0, idx - per); Sound.se('cursor'); }
    else if (k === 'right') { idx = Math.min(n - 1, idx + per); Sound.se('cursor'); }
    else { Sound.se('cancel'); break; }
    if (idx < top) top = idx;
    if (idx >= top + per) top = idx - per + 1;
  }
  Menus.pop();
}

/* ---------------- トレーナーカード ---------------- */
async function cardScreen() {
  const g = CTX;
  const layer = {
    draw() {
      g.fillStyle = 'rgba(16,12,28,.94)'; g.fillRect(0, 0, W, H);
      panel(g, 60, 60, W - 120, H - 150, 'blue');
      txt(g, 'トレーナーカード', 90, 88, { size: 26, color: '#ffe9a8' });
      const cv = charCanvas(LOOK.hero, 'down', 0);
      g.save(); g.imageSmoothingEnabled = false;
      g.drawImage(cv, W - 200, 90, 96, 96); g.restore();
      txt(g, 'なまえ　' + game.playerName, 96, 150, { size: 21, color: '#fdf6e0' });
      txt(g, 'おかね　' + game.money + ' マナ', 96, 184, { size: 21, color: '#fdf6e0' });
      txt(g, 'ずかん　' + Object.keys(game.caught).length + ' たい', 96, 218, { size: 21, color: '#fdf6e0' });
      const t = game.playtime | 0;
      txt(g, 'じかん　' + ((t / 3600) | 0) + ':' + String(((t / 60) | 0) % 60).padStart(2, '0'),
          96, 252, { size: 21, color: '#fdf6e0' });
      txt(g, 'バッジ', 96, 292, { size: 21, color: '#ffe9a8' });
      const names = [['badge1', 'ファイア', '#f4703a'], ['badge2', 'アクア', '#46a6f2'],
                     ['badge3', 'リーフ', '#5cc455'], ['badge4', 'ボルト', '#f5d43a']];
      names.forEach((b, i) => {
        const x = 100 + i * 110, y = 326;
        g.save();
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2 - Math.PI / 2;
          const px = x + Math.cos(a) * 26, py = y + Math.sin(a) * 26;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath();
        g.fillStyle = game.flags[b[0]] ? b[2] : '#2a2440';
        g.fill(); g.lineWidth = 3; g.strokeStyle = '#0f0b1c'; g.stroke();
        g.restore();
        txt(g, b[1], x, y + 32, { size: 14, color: game.flags[b[0]] ? '#fdf6e0' : '#5a5470', align: 'center' });
      });
      txt(g, 'X でもどる', W / 2, H - 60, { size: 15, color: '#9a92b8', align: 'center' });
    }
  };
  Menus.push(layer);
  await Input.wait(['cancel', 'ok']);
  Sound.se('cancel');
  Menus.pop();
}

/* ---------------- メインメニュー ---------------- */
async function openMainMenu() {
  while (true) {
    const items = ['マナビースト', 'どうぐ', 'ずかん', 'カード', 'セーブ', 'とじる'];
    const i = await chooseMenu(items, { w: 230, y: 40, x: W - 260, per: items.length });
    if (i < 0 || items[i] === 'とじる') { MsgBox.active = false; return; }
    if (items[i] === 'マナビースト') {
      if (game.party.length === 0) { await say('まだ 1ぴきも いない！'); MsgBox.active = false; }
      else await partyScreen({});
    }
    else if (items[i] === 'どうぐ') {
      const id = await bagScreen({});
      if (id) { await useItemField(id); MsgBox.active = false; }
    }
    else if (items[i] === 'ずかん') await dexScreen();
    else if (items[i] === 'カード') await cardScreen();
    else if (items[i] === 'セーブ') {
      const ok = await confirmYN('ここまでの ぼうけんを\nきろく しますか？');
      if (ok) {
        const r = saveGame();
        Sound.se(r ? 'heal' : 'cancel');
        await say(r ? 'ぼうけんを きろく しました！' : 'きろく できませんでした…');
      }
      MsgBox.active = false;
    }
  }
}

/* ---------------- ショップ ---------------- */
async function shopScreen(stock) {
  const g = CTX;
  while (true) {
    await say('いらっしゃい！\nなにを おさがしかな？', { name: 'てんいん', keep: true });
    const a = await chooseMenu(['かう', 'うる', 'かえる'], { w: 180, per: 3 });
    MsgBox.active = false;
    if (a < 0 || a === 2) { await say('また どうぞ！', { name: 'てんいん' }); return; }
    if (a === 0) {
      let idx = 0, top = 0; const per = 7;
      const layer = {
        draw() {
          g.fillStyle = 'rgba(16,12,28,.92)'; g.fillRect(0, 0, W, H);
          txt(g, 'マナショップ', 24, 16, { size: 24, color: '#ffe9a8' });
          txt(g, '所持金 ' + game.money + ' マナ', W - 24, 20, { size: 19, color: '#ffe9a8', align: 'right' });
          panel(g, 20, 56, W - 40, 340, 'dark');
          for (let i = 0; i < per; i++) {
            const id = stock[top + i]; if (!id) break;
            const it = ITEMS[id], y = 74 + i * 44, sel = (top + i === idx);
            if (sel) { g.fillStyle = 'rgba(122,90,200,.45)'; g.fillRect(34, y - 6, W - 68, 40); }
            if (it.kind === 'ball') g.drawImage(ballCanvas(it.tier, 2), 40, y - 4);
            txt(g, it.name, 80, y, { size: 20, color: game.money >= it.price ? '#fdf6e0' : '#7a7290' });
            txt(g, it.price + ' マナ', W - 60, y, { size: 19, color: '#ffe9a8', align: 'right' });
          }
          const cur = ITEMS[stock[idx]];
          panel(g, 20, 404, W - 40, 54, 'plain');
          if (cur) txt(g, cur.desc, 40, 420, { size: 18, color: '#2b2438', shadow: false });
        }
      };
      Menus.push(layer);
      let done = false;
      while (!done) {
        const k = await Input.wait(['up', 'down', 'ok', 'cancel']);
        if (k === 'up') { idx = (idx - 1 + stock.length) % stock.length; Sound.se('cursor'); }
        else if (k === 'down') { idx = (idx + 1) % stock.length; Sound.se('cursor'); }
        else if (k === 'cancel') { Sound.se('cancel'); done = true; }
        else {
          const id = stock[idx], it = ITEMS[id];
          const maxN = Math.min(99, Math.floor(game.money / it.price));
          if (maxN < 1) { Sound.se('cancel'); Menus.pop(); await say('おかねが たりないよ！', { name: 'てんいん' }); Menus.push(layer); continue; }
          Sound.se('ok');
          let n = 1;
          const qlayer = {
            draw() {
              panel(g, 200, 180, 240, 120, 'plain');
              txt(g, it.name, 220, 198, { size: 20, color: '#2b2438', shadow: false });
              txt(g, '◀ ' + n + ' ▶', 320, 232, { size: 26, color: '#2b2438', align: 'center', shadow: false });
              txt(g, (it.price * n) + ' マナ', 420, 268, { size: 19, color: '#5a5470', align: 'right', shadow: false });
            }
          };
          Menus.push(qlayer);
          let buy = false, q = true;
          while (q) {
            const k2 = await Input.wait(['left', 'right', 'up', 'down', 'ok', 'cancel']);
            if (k2 === 'right' || k2 === 'up') { n = Math.min(maxN, n + 1); Sound.se('cursor'); }
            else if (k2 === 'left' || k2 === 'down') { n = Math.max(1, n - 1); Sound.se('cursor'); }
            else if (k2 === 'ok') { buy = true; q = false; }
            else { Sound.se('cancel'); q = false; }
          }
          Menus.pop();
          if (buy) {
            game.money -= it.price * n; addItem(id, n); Sound.se('buy');
            Menus.pop();
            await say(it.name + ' を ' + n + 'こ 買った！\nありがとう ございます！', { name: 'てんいん' });
            Menus.push(layer);
          }
        }
        if (idx < top) top = idx;
        if (idx >= top + per) top = idx - per + 1;
      }
      Menus.pop();
    } else {
      const id = await bagScreen({ foot: 'Z うる　X もどる' });
      if (!id) continue;
      const it = ITEMS[id], sell = Math.floor(it.price / 2);
      const ok = await confirmYN(it.name + ' を ' + sell + ' マナで うる？');
      MsgBox.active = false;
      if (ok) {
        useItemCount(id); game.money += sell; Sound.se('buy');
        await say(sell + ' マナ もらった！', { name: 'てんいん' });
      }
    }
  }
}
