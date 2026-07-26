/* =========================================================
   overworld.js — フィールド移動 / 描画 / イベント
   ========================================================= */

const OW = { ox: 0, oy: 0, mvx: 0, mvy: 0, moving: false, step: 0, anim: 0, frame: 0,
             busy: false, fade: 0, fadeDir: 0, encCool: 0 };

function curMap() { return MAPS[game.map]; }
function tileAt(m, x, y) {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return -1;
  return m.t[y * m.w + x];
}
function npcVisible(n) {
  if (n.gone && game.flags[n.gone]) return false;
  if (n.hideUntil && !game.flags[n.hideUntil]) return false;
  if (n.trainer && !n.special && game.defeated[n.trainer.id] && n.vanish) return false;
  return true;
}
function npcAt(m, x, y) {
  return (m.npcs || []).find(n => npcVisible(n) && n.x === x && n.y === y);
}
function solidAt(m, x, y) {
  const t = tileAt(m, x, y);
  if (t < 0) return true;
  if (TK[t].solid) return true;
  if (npcAt(m, x, y)) return true;
  return false;
}

const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function battleBg() {
  const id = game.map;
  if (id === 'route2') return 'water';
  if (id === 'forest') return 'forest';
  if (id === 'mountain') return 'mountain';
  if (id === 'temple') return 'cave';
  if (MAPS[id].indoor) return 'indoor';
  return 'grass';
}
function mapBgm() { return curMap().bgm || 'town'; }

/* ---------------- 更新 ---------------- */
function updateField(dt) {
  if (OW.busy || game.state !== 'field') return;
  const m = curMap();
  if (OW.moving) {
    const speed = (Input.isDown('run') ? 3.4 : 2.0);
    OW.step += speed;
    OW.anim += speed;
    OW.ox = OW.mvx * OW.step;
    OW.oy = OW.mvy * OW.step;
    if (OW.step >= 16) {
      game.px += OW.mvx; game.py += OW.mvy;
      OW.ox = OW.oy = 0; OW.step = 0; OW.moving = false;
      OW.frame = (OW.frame + 1) % 4;
      game.steps++;
      afterStep();
    }
    return;
  }
  let d = null;
  if (Input.isDown('up')) d = 'up';
  else if (Input.isDown('down')) d = 'down';
  else if (Input.isDown('left')) d = 'left';
  else if (Input.isDown('right')) d = 'right';

  if (Input.take('ok')) { interact(); return; }
  if (Input.take('cancel')) { runEvent(openMainMenu); return; }

  if (d) {
    if (game.dir !== d && !OW.turnDelay) { game.dir = d; OW.turnDelay = 4; return; }
    OW.turnDelay = 0;
    const [dx, dy] = DIRV[d];
    game.dir = d;
    if (!solidAt(m, game.px + dx, game.py + dy)) {
      OW.moving = true; OW.mvx = dx; OW.mvy = dy; OW.step = 0;
    } else {
      if (!OW.bumpCool) { Sound.se('bump'); OW.bumpCool = 18; }
      OW.frame = 0;
    }
  } else { OW.frame = 0; OW.anim = 0; OW.turnDelay = 0; }
  if (OW.bumpCool) OW.bumpCool--;
}

function afterStep() {
  const m = curMap();
  // ワープ
  const wp = (m.warps || []).find(w => w.x === game.px && w.y === game.py);
  if (wp) { runEvent(() => doWarp(wp)); return; }
  // エンカウント
  const t = tileAt(m, game.px, game.py);
  if (m.enc && TK[t] && TK[t].enc && game.party.length) {
    if (OW.encCool > 0) { OW.encCool--; return; }
    if (Math.random() < m.enc.rate) {
      OW.encCool = 3;
      runEvent(wildEncounter);
    }
  }
}

async function fadeOut() { OW.fade = 0; for (let i = 0; i <= 12; i++) { OW.fade = i / 12; await sleep(16); } }
async function fadeIn() { for (let i = 12; i >= 0; i--) { OW.fade = i / 12; await sleep(16); } OW.fade = 0; }

async function doWarp(wp) {
  if (wp.need && !game.flags[wp.need]) {
    await say(wp.needMsg || 'この先には いけないようだ。');
    MsgBox.active = false;
    // 押し戻す
    const [dx, dy] = DIRV[game.dir];
    if (!solidAt(curMap(), game.px - dx, game.py - dy)) { game.px -= dx; game.py -= dy; }
    return;
  }
  Sound.se('warp');
  await fadeOut();
  if (wp.to === '@back') {
    const r = game.retMap;
    game.map = r.map; game.px = r.x; game.py = r.y; game.dir = 'down';
  } else {
    if (wp.to === 'center' || wp.to === 'mart') {
      game.retMap = { map: game.map, x: wp.x, y: wp.y + 1 };
      if (wp.shop) game.shopId = wp.shop;
    }
    game.map = wp.to; game.px = wp.tx; game.py = wp.ty;
    if (wp.dir) game.dir = wp.dir;
  }
  Sound.play(mapBgm());
  await fadeIn();
}

/* ---------------- 野生エンカウント ---------------- */
function pickEnc(tbl) {
  const total = tbl.reduce((s, e) => s + e[3], 0);
  let r = Math.random() * total;
  for (const e of tbl) { r -= e[3]; if (r <= 0) return e; }
  return tbl[0];
}
async function wildEncounter() {
  const m = curMap();
  const e = pickEnc(m.enc.table);
  const lv = e[1] + ((Math.random() * (e[2] - e[1] + 1)) | 0);
  await flashEncounter();
  const res = await startBattle({ wild: makeMon(e[0], lv), bg: battleBg() });
  await afterBattle(res);
}
async function flashEncounter() {
  for (let i = 0; i < 6; i++) { OW.fade = (i % 2) ? 0 : 1; await sleep(70); }
  OW.fade = 1; await sleep(120);
}
async function afterBattle(res) {
  OW.fade = 1;
  if (res === 'lose') { await whiteout(); return; }
  Sound.play(mapBgm());
  await fadeIn();
}
async function whiteout() {
  const c = game.lastCenter || { map: 'village', x: 6, y: 11 };
  game.money = Math.max(0, Math.floor(game.money / 2));
  game.map = c.map; game.px = c.x; game.py = c.y; game.dir = 'down';
  healParty();
  Sound.play(mapBgm());
  await fadeIn();
  await say('…気がつくと ヒーリングセンターに\nはこばれていた。\nマナビーストは 元気に なっている。');
  await say('おかねを すこし おとして しまった…');
  MsgBox.active = false;
}

/* ---------------- 会話・イベント ---------------- */
function runEvent(fn) {
  if (OW.busy) return;              // イベント中の多重起動を防ぐ
  OW.busy = true;
  Promise.resolve().then(fn).catch(e => console.error(e)).then(() => {
    OW.busy = false; MsgBox.active = false;
    Menus.length = 0;               // 取り残されたオーバーレイを掃除
    Input.clear();
  });
}

function interact() {
  const m = curMap();
  const [dx, dy] = DIRV[game.dir];
  const tx = game.px + dx, ty = game.py + dy;
  let n = npcAt(m, tx, ty);
  // カウンター越しにも話せる
  if (!n && tileAt(m, tx, ty) === T.COUNTER) n = npcAt(m, tx + dx, ty + dy);
  if (n) { runEvent(() => talkNPC(n)); return; }
  const t = tileAt(m, tx, ty);
  if (TK[t] && TK[t].sign) {
    const s = (m.signs || {})['' + tx + ',' + ty];
    if (s) runEvent(async () => { await say(s); });
    return;
  }
  const s2 = (m.signs || {})['' + tx + ',' + ty];
  if (s2) { runEvent(async () => { await say(s2); }); }
}

async function talkNPC(n) {
  // 向きをこちらに
  n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[game.dir];
  if (n.special) { await SPECIAL[n.special](n); return; }
  if (n.trainer && !game.defeated[n.trainer.id]) {
    for (const l of n.lines) await say(l, { name: n.name });
    await trainerBattle(n);
    return;
  }
  if (n.give && !game.flags[n.give.flag]) {
    for (const l of n.lines) await say(l, { name: n.name });
    addItem(n.give.item, n.give.n);
    game.flags[n.give.flag] = 1;
    Sound.se('buy');
    await say(ITEMS[n.give.item].name + ' を ' + n.give.n + 'こ もらった！');
    return;
  }
  if (n.trainer && game.defeated[n.trainer.id]) {
    await say(n.trainer.win || 'また しょうぶ しようね！', { name: n.name });
    return;
  }
  const lines = n.lines || ['…'];
  for (const l of lines) await say(l, { name: n.name });
  if (n.heal) { healParty(); Sound.se('heal'); await say('マナビーストが 元気に なった！'); }
}

async function trainerBattle(n, opt) {
  opt = opt || {};
  const team = opt.team || n.trainer.team;
  Sound.se('encounter');
  await flashEncounter();
  const res = await startBattle({
    trainer: { team, money: (opt.money || n.trainer.money), win: null, id: n.trainer.id },
    name: n.name, bg: battleBg(), boss: opt.boss
  });
  if (res === 'win') { game.defeated[n.trainer.id] = 1; }
  if (res === 'lose' && opt.noWhiteout) {
    healParty();
    OW.fade = 1; Sound.play(mapBgm()); await fadeIn();
    await say('…気を うしなっていたようだ。\nマナビーストは 手当てを うけて\n元気に なっている。');
  } else {
    await afterBattle(res);
  }
  return res;
}

/* ---------------- 特殊NPC ---------------- */
const SPECIAL = {};

SPECIAL.prof = async function (n) {
  if (!game.flags.gotStarter) {
    await say('おお ' + game.playerName + '！ よく来たね。', { name: 'マナベ博士' });
    await say('この世界には マナビーストという\nふしぎな 生きものが いる。\nキミにも 1ぴき あずけよう。', { name: 'マナベ博士' });
    let pick = -1;
    while (pick < 0) {
      const opts = [1, 4, 7];
      const g = CTX;
      const layer = { draw() {
        panel(g, 40, 60, W - 80, 220, 'plain');
        txt(g, 'どの子と 旅に出る？', W / 2, 76, { size: 22, color: '#2b2438', align: 'center', shadow: false });
        opts.forEach((id, i) => {
          const sp = SPECIES[id];
          const x = 90 + i * 165;
          g.drawImage(creatureCanvas(sp, 3), x, 110);
          txt(g, sp.name, x + 48, 208, { size: 18, color: '#2b2438', align: 'center', shadow: false });
          typeChip(g, sp.type1, x + 24, 232);
        });
      } };
      Menus.push(layer);
      const i = await chooseMenu(['リフィー （くさ）', 'ポワニャ （ほのお）', 'アクアト （みず）'],
        { w: 300, x: 170, y: 300, per: 3 });
      Menus.pop();
      if (i < 0) { await say('まよって いるのかな？', { name: 'マナベ博士' }); continue; }
      const sp = SPECIES[opts[i]];
      const ok = await confirmYN(sp.name + ' に きめる？');
      MsgBox.active = false;
      if (ok) pick = opts[i];
    }
    const mon = makeMon(pick, 5, { met: 'マナ研究所' });
    game.party.push(mon);
    game.seen[SPECIES[pick].no] = 1; game.caught[SPECIES[pick].no] = 1;
    game.flags.gotStarter = 1;
    game.flags.starter = pick;
    Sound.se('catch'); Sound.cry(SPECIES[pick].cry);
    await say(SPECIES[pick].name + ' を てにいれた！');
    addItem('ball1', 5); addItem('potion', 3);
    await say('クリスタル 5こ と\nキズぐすり 3こ も もらった！');
    // ライバル登場
    const rs = { 1: 4, 4: 7, 7: 1 }[pick];   // 相性で有利な子をえらぶ
    game.flags.rivalStarter = rs;
    await say('まてよ ' + game.playerName + '！', { name: game.rivalName });
    await say('おれも 博士に もらったんだ。\nさっそく 力だめし と いこうぜ！', { name: game.rivalName });
    const fake = { name: game.rivalName, trainer: { id: 'rival1', team: [[rs, 5]], money: 400 } };
    const res = await trainerBattle(fake, { noWhiteout: true });
    if (res === 'win') {
      await say('うわー まけた！\nでも つぎは 負けないからな！', { name: game.rivalName });
      game.flags.rival1 = 1;
    } else {
      await say('おれの 勝ちだな！\nもっと きたえて 出直してこいよ！', { name: game.rivalName });
      game.flags.rival1 = 1;
    }
    await say('ふたりとも いい旅を！\n北の アカネの町を めざすと いい。', { name: 'マナベ博士' });
  } else {
    await say('マナずかんが 埋まってきたかね？\nキミの 旅を 楽しみに しているよ。', { name: 'マナベ博士' });
    if (game.party.some(m => m.hp < m.max)) {
      healParty(); Sound.se('heal');
      await say('つかれた子は 休ませて あげよう。\n…はい 元気に なったよ！', { name: 'マナベ博士' });
    }
  }
};

SPECIAL.guard = async function (n) {
  if (game.flags[n.need]) { await say(n.pass, { name: n.name }); n.passed = 1; }
  else await say(n.block, { name: n.name });
};

SPECIAL.nurse = async function (n) {
  await say('ヒーリングセンターへ ようこそ！\nごようけんを どうぞ！', { name: 'ヒーラー', keep: true });
  const i = await chooseMenu(['休ませる', 'あずかりシステム', 'やめる'], { w: 240, per: 3 });
  MsgBox.active = false;
  if (i === 1) {
    if (!game.box.length) { await say('いまは あずかっている子は\nいないようです。', { name: 'ヒーラー' }); return; }
    await boxScreen();
    MsgBox.active = false;
    return;
  }
  if (i === 0) {
    healParty();
    Sound.se('heal');
    await sleep(500);
    await say('おまたせしました！\nマナビーストは 元気いっぱいです。', { name: 'ヒーラー' });
    const r = game.retMap;
    if (r) game.lastCenter = { map: r.map, x: r.x, y: r.y };
    saveGame();
    await say('（ぼうけんが きろくされた）');
  } else {
    await say('またの おこしを おまちしてます！', { name: 'ヒーラー' });
  }
};

SPECIAL.shop = async function (n) {
  await shopScreen(shopStock(game.shopId));
};

SPECIAL.leader = async function (n) {
  if (game.flags[n.badge]) {
    await say(n.after, { name: n.name });
    return;
  }
  for (const l of n.lines) await say(l, { name: n.name });
  const res = await trainerBattle(n, { boss: true });
  if (res !== 'win') {
    if (res === 'lose') return;
    await say('逃げるとは しかたない…\nまた いつでも 来い。', { name: n.name });
    return;
  }
  await say(n.trainer.win, { name: n.name });
  game.flags[n.badge] = 1;
  Sound.se('catch');
  await say(game.playerName + ' は ' + n.badgeName + ' を てにいれた！');
  if (n.reward) {
    addItem(n.reward.item, n.reward.n);
    await say(ITEMS[n.reward.item].name + ' を ' + n.reward.n + 'こ もらった！');
  }
  await say(n.after, { name: n.name });
};

/* --- ライバル戦 --- */
function rivalTeam(stage) {
  const s = game.flags.rivalStarter || 4;
  if (stage === 2) return [[12, 12], [10, 13], [s, 15]];
  if (stage === 3) return [[13, 20], [26, 19], [16, 20], [s + 1, 22]];
  return [[13, 29], [32, 29], [19, 30], [23, 30], [s + 2, 33]];
}

SPECIAL.rival2 = async function (n) {
  if (game.flags.rival2) { await say('ジムバッジ ためこんでるか？\nおれは もう つぎの 町だ！', { name: game.rivalName }); return; }
  if (!game.flags.badge1) { await say('よう！ ジムには もう 行ったか？\nおれは これから だ！', { name: game.rivalName }); return; }
  await say('やっぱり おまえも 勝ったか！', { name: game.rivalName });
  await say('だったら もう一度\nどっちが 上か たしかめようぜ！', { name: game.rivalName });
  const res = await trainerBattle({ name: game.rivalName, trainer: { id: 'rival2', team: rivalTeam(2), money: 1500 } }, { boss: true });
  if (res === 'win') {
    game.flags.rival2 = 1;
    await say('くそー！ また 負けた！\n…つぎは 樹海で 会おうぜ！', { name: game.rivalName });
    addItem('potion2', 2);
    await say('これ やるよ。 じゃあな！');
  }
};

SPECIAL.rival3 = async function (n) {
  if (game.flags.rival3) { await say('大樹の 守り手は つよいぞ。\n油断するなよ！', { name: game.rivalName }); return; }
  await say('おっ 来たな！\n森の 空気は うまいだろ？', { name: game.rivalName });
  await say('おれも だいぶ 強くなった。\n…いくぞ！', { name: game.rivalName });
  const res = await trainerBattle({ name: game.rivalName, trainer: { id: 'rival3', team: rivalTeam(3), money: 2600 } }, { boss: true });
  if (res === 'win') {
    game.flags.rival3 = 1;
    await say('つえー…\nおまえ ほんとに つよいな。', { name: game.rivalName });
    await say('闇の神殿の うわさ 聞いたか？\nおれは 先に 行ってるぜ！', { name: game.rivalName });
    addItem('full', 1);
    await say('まんたんドリンク を もらった！');
  }
};

SPECIAL.rival4 = async function (n) {
  await say('おそかったな ' + game.playerName + '！', { name: game.rivalName });
  await say('この 奥に ノクスが いる。\n…正直 おれ ひとりじゃ むりだった。', { name: game.rivalName });
  await say('だから これが 最後の 力だめしだ。\nおまえが 本気か たしかめさせろ！', { name: game.rivalName });
  const res = await trainerBattle({ name: game.rivalName, trainer: { id: 'rival4', team: rivalTeam(4), money: 5000 } }, { boss: true });
  if (res === 'win') {
    game.flags.rival4 = 1;
    await say('…ああ。 やっぱり おまえだ。', { name: game.rivalName });
    await say('ここは まかせた。\n世界を たのむぜ、 相棒！', { name: game.rivalName });
    healParty();
    Sound.se('heal');
    await say('カイは 手持ちを 回復してくれた！');
  }
};

SPECIAL.boss = async function (n) {
  await say('…よく ここまで 来た、\n小さき 光よ。', { name: 'ノクス' });
  await say('マナは 闇に かえる。\nこの世界も じきに 眠りにつく。', { name: 'ノクス' });
  await say('だが おまえの 目は まだ 燃えている。\n…見せてみよ、 その 光を！', { name: 'ノクス' });
  const res = await trainerBattle({
    name: 'やみの王 ノクス',
    trainer: { id: 'boss', team: [[34, 31], [19, 32], [23, 32], [17, 33], [36, 36]], money: 12000 }
  }, { boss: true });
  if (res !== 'win') return;
  game.flags.bossdone = 1;
  await say('……ばかな。\nこの 私が、 光に…', { name: 'ノクス' });
  await say('ノクスの すがたは 闇に とけて\n消えていった…');
  await fadeOut();
  await sleep(400);
  await fadeIn();
  await say('神殿の 奥から\nまばゆい 光が あふれだした！');
  Sound.play('center');
};

SPECIAL.lumina = async function (n) {
  if (game.flags.luminaDone) {
    await say('祭壇には あたたかい 光が\nのこっている。');
    return;
  }
  await say('祭壇の うえで\n光の かたまりが ゆれている…');
  await say('『よくぞ 闇を はらった。\n　わたしは ルミナ。\n　世界の 光の かけら。』', { name: '？？？' });
  await say('『あなたの 力を\n　この目で たしかめたい。』', { name: 'ルミナ' });
  game.flags.luminaDone = 1;
  await flashEncounter();
  const res = await startBattle({ wild: makeMon(35, 40), bg: 'temple', boss: true });
  await afterBattle(res);
  if (res === 'caught') {
    await say('ルミナは あなたの 相棒に なった！');
  } else {
    await say('ルミナは 光に とけて 消えた…\nまた どこかで 会えるだろうか。');
  }
  await endingScene();
};

async function endingScene() {
  if (game.flags.endingShown) return;
  game.flags.endingShown = 1;
  await fadeOut();
  const g = CTX;
  const lines = [
    '闇の王 ノクスは やぶれ、',
    '世界に ふたたび マナの 光が もどった。',
    '',
    'ミナト村の 小さな トレーナーは、',
    'いつのまにか 世界を すくった 英雄に なっていた。',
    '',
    'だが 旅は まだ おわらない。',
    'まだ 見ぬ マナビーストが、',
    'どこかで きみを 待っている――',
    '',
    '★ THE END ★',
    '',
    'マナビースト ～光と闇のかけら～',
    'ご プレイ ありがとう ございました！'
  ];
  let t = 0;
  const layer = { draw() {
    g.fillStyle = '#0a0814'; g.fillRect(0, 0, W, H);
    lines.forEach((l, i) => {
      const y = H + 20 - t + i * 40;
      if (y > -40 && y < H + 40)
        txt(g, l, W / 2, y, { size: l.indexOf('★') >= 0 ? 30 : 21,
                              color: l.indexOf('★') >= 0 ? '#ffe9a8' : '#cfc6e8', align: 'center' });
    });
  } };
  Menus.push(layer);
  OW.fade = 0;
  Sound.play('forest');
  while (t < lines.length * 40 + H + 80) { t += 1.4; await sleep(16); }
  await Input.wait(['ok', 'cancel']);
  const li = Menus.indexOf(layer); if (li >= 0) Menus.splice(li, 1);
  await say('※ このあとも 自由に ぼうけんできます。\nずかん コンプリートを めざそう！');
  Sound.play(mapBgm());
}

/* ---------------- 描画 ---------------- */
function drawField(g) {
  const m = curMap();
  const camW = VW, camH = VH;
  let cx = game.px * 16 + OW.ox + 8 - camW / 2;
  let cy = game.py * 16 + OW.oy + 8 - camH / 2;
  cx = Math.max(0, Math.min(m.w * 16 - camW, cx));
  cy = Math.max(0, Math.min(m.h * 16 - camH, cy));
  if (m.w * 16 < camW) cx = (m.w * 16 - camW) / 2;
  if (m.h * 16 < camH) cy = (m.h * 16 - camH) / 2;
  cx = Math.round(cx); cy = Math.round(cy);

  WG.fillStyle = m.indoor ? '#1a1626' : '#12203a';
  WG.fillRect(0, 0, camW, camH);
  const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
  const wv = (performance.now() / 420 | 0) % 2;
  for (let y = y0; y <= y0 + camH / 16 + 1; y++) {
    for (let x = x0; x <= x0 + camW / 16 + 1; x++) {
      const t = tileAt(m, x, y);
      if (t < 0) continue;
      const kind = TK[t].k;
      const variant = kind === 'water' ? wv : ((x * 7 + y * 13) % 3);
      WG.drawImage(tileCanvas(kind, variant), x * 16 - cx, y * 16 - cy);
    }
  }
  // 影と登場人物（Yソート）
  const actors = [];
  (m.npcs || []).forEach(n => { if (npcVisible(n)) actors.push({ y: n.y * 16, draw: () => {
    WG.globalAlpha = .22; WG.fillStyle = '#000';
    WG.beginPath(); WG.ellipse(n.x * 16 - cx + 8, n.y * 16 - cy + 15, 6, 3, 0, 0, 7); WG.fill();
    WG.globalAlpha = 1;
    WG.drawImage(charCanvas(n.look, n.dir || 'down', 0), n.x * 16 - cx, n.y * 16 - cy);
    if (n.trainer && !game.defeated[n.trainer.id] && !n.special) {
      const bob = Math.sin(performance.now() / 300) * 1.5;
      WG.fillStyle = '#ffe15e';
      WG.fillRect(n.x * 16 - cx + 6, n.y * 16 - cy - 8 + bob, 4, 5);
      WG.fillRect(n.x * 16 - cx + 6, n.y * 16 - cy - 2 + bob, 4, 2);
    }
  } }); });
  const pxp = game.px * 16 + OW.ox - cx, pyp = game.py * 16 + OW.oy - cy;
  actors.push({ y: game.py * 16 + OW.oy, draw: () => {
    WG.globalAlpha = .22; WG.fillStyle = '#000';
    WG.beginPath(); WG.ellipse(pxp + 8, pyp + 15, 6, 3, 0, 0, 7); WG.fill();
    WG.globalAlpha = 1;
    const fr = OW.moving ? (1 + (Math.floor(OW.anim / 8) % 2) * 2) : 0;
    WG.drawImage(charCanvas(LOOK.hero, game.dir, fr), pxp, pyp);
  } });
  actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());

  // 暗いマップ
  if (m.dark) {
    const grd = WG.createRadialGradient(pxp + 8, pyp + 8, 20, pxp + 8, pyp + 8, 120);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(4,2,12,.72)');
    WG.fillStyle = grd; WG.fillRect(0, 0, camW, camH);
  }

  g.imageSmoothingEnabled = false;
  g.drawImage(WCV, 0, 0, camW, camH, 0, 0, W, H);

  // 位置表示
  if (!MsgBox.active && !OW.busy) {
    const nm = m.name;
    const w = measure(g, nm, 18) + 30;
    panel(g, 16, 14, w, 38, 'plain');
    txt(g, nm, 32, 24, { size: 18, color: '#2b2438', shadow: false });
  }
}
