/* =========================================================
   battle.js — ターン制バトル
   ========================================================= */

const B = {
  on: false, foe: null, mi: 0, wild: true, trainer: null, tIdx: 0,
  st: { my: {}, foe: {} }, myOff: 0, foeOff: 0, myFlash: 0, foeFlash: 0,
  shake: 0, myShowHp: 0, foeShowHp: 0, myShowXp: 0, ballAnim: null,
  bg: 'grass', foeHide: false, myHide: false, msg2: null
};
function my() { return game.party[B.mi]; }

const STAGE_MUL = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
function stat(m, key, side) {
  let v = m[key];
  const s = B.st[side][key] || 0;
  v = Math.floor(v * STAGE_MUL(s));
  if (key === 'atk' && m.st === 'brn') v = Math.floor(v * 0.55);
  if (key === 'spd' && m.st === 'par') v = Math.floor(v * 0.5);
  return Math.max(1, v);
}

function damageCalc(a, d, move, lv, mult, crit) {
  let x = Math.floor(Math.floor(Math.floor(2 * lv / 5 + 2) * move.pw * a / Math.max(1, d)) / 50) + 2;
  x = Math.floor(x * mult * (crit ? 1.8 : 1) * (0.86 + Math.random() * 0.15));
  return Math.max(1, x);
}

function effText(m) {
  if (m === 0) return 'こうかが ないようだ…';
  if (m >= 2) return 'こうかは ばつぐんだ！';
  if (m > 1) return 'こうかは ばつぐんだ！';
  if (m < 1) return 'こうかは いまひとつ のようだ…';
  return null;
}

/* ---------------- 描画 ---------------- */
const BG_STYLE = {
  grass:   ['#8fd0f4', '#cfeeff', '#79c46a', '#5aa84e'],
  forest:  ['#4e8a5a', '#8fd08a', '#4f9a44', '#3a7a38'],
  water:   ['#7fc4f4', '#d6f0ff', '#6ab8d8', '#4a94b8'],
  cave:    ['#2a2438', '#443c5c', '#5b5566', '#413c4d'],
  mountain:['#a8c8e8', '#e0eefa', '#9aa0aa', '#7a8088'],
  temple:  ['#1a1428', '#3a2a58', '#4a3a68', '#31264c'],
  indoor:  ['#5a4a6a', '#8a7aa0', '#c8a888', '#a5763f']
};

function drawBattle(g) {
  const s = BG_STYLE[B.bg] || BG_STYLE.grass;
  const sx = B.shake ? (Math.random() - .5) * B.shake : 0;
  g.save(); g.translate(sx, 0);
  const grad = g.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, s[0]); grad.addColorStop(1, s[1]);
  g.fillStyle = grad; g.fillRect(-8, 0, W + 16, 300);
  g.fillStyle = s[2]; g.fillRect(-8, 288, W + 16, H - 288);
  g.fillStyle = s[3];
  g.beginPath(); g.ellipse(468, 196, 112, 26, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(150, 340, 146, 34, 0, 0, 7); g.fill();
  g.globalAlpha = .18; g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(468, 190, 112, 26, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(150, 334, 146, 34, 0, 0, 7); g.fill();
  g.globalAlpha = 1;

  // 敵
  if (B.foe && !B.foeHide) {
    const cv = creatureCanvas(SPECIES[B.foe.sp], 4);
    g.save();
    if (B.foeFlash > 0) g.globalAlpha = (B.foeFlash % 2) ? 0.25 : 1;
    g.drawImage(cv, 404 + B.foeOff, 66 + (B.foeDrop || 0));
    g.restore();
  }
  // 味方
  const mm = my();
  if (mm && !B.myHide) {
    const cv = creatureCanvas(SPECIES[mm.sp], 5, true);
    g.save();
    if (B.myFlash > 0) g.globalAlpha = (B.myFlash % 2) ? 0.25 : 1;
    g.drawImage(cv, 70 + B.myOff, 178 + (B.myDrop || 0));
    g.restore();
  }
  // クリスタル演出
  if (B.ballAnim) {
    const a = B.ballAnim;
    g.drawImage(ballCanvas(a.tier, 3), a.x - 24, a.y - 24);
  }
  g.restore();

  // 敵ステータス
  if (B.foe) {
    panel(g, 26, 34, 286, 76, 'plain');
    txt(g, monName(B.foe), 44, 44, { size: 19, color: '#2b2438', shadow: false });
    txt(g, 'Lv' + B.foe.lv, 292, 46, { size: 17, color: '#2b2438', align: 'right', shadow: false });
    const p = B.foeShowHp / B.foe.max;
    bar(g, 44, 76, 250, 12, p, hpColor(p));
    if (B.foe.st) {
      g.fillStyle = STATUS[B.foe.st].color;
      const sw = measure(g, STATUS[B.foe.st].short, 13) + 10;
      g.fillRect(44, 92, sw, 16);
      txt(g, STATUS[B.foe.st].short, 49, 93, { size: 13, color: '#241a33', shadow: false });
    }
    if (game.caught[SPECIES[B.foe.sp].no]) g.drawImage(ballCanvas(0, 1), 292, 90);
  }
  // 味方ステータス
  if (mm) {
    panel(g, 330, 212, 286, 104, 'plain');
    txt(g, monName(mm), 348, 222, { size: 19, color: '#2b2438', shadow: false });
    txt(g, 'Lv' + mm.lv, 596, 224, { size: 17, color: '#2b2438', align: 'right', shadow: false });
    const p = B.myShowHp / mm.max;
    bar(g, 348, 252, 250, 12, p, hpColor(p));
    txt(g, Math.round(B.myShowHp) + '/' + mm.max, 598, 268, { size: 16, color: '#2b2438', align: 'right', shadow: false });
    txt(g, 'EXP', 348, 290, { size: 13, color: '#5a5470', shadow: false });
    bar(g, 382, 294, 216, 6, B.myShowXp, '#5fa8ff');
    if (mm.st) {
      g.fillStyle = STATUS[mm.st].color;
      const sw = measure(g, STATUS[mm.st].short, 13) + 10;
      g.fillRect(348, 268, sw, 16);
      txt(g, STATUS[mm.st].short, 353, 269, { size: 13, color: '#241a33', shadow: false });
    }
  }
  // 相手の手持ち残り
  if (!B.wild && B.trainer) {
    for (let i = 0; i < B.trainer.team.length; i++) {
      const alive = i > B.tIdx || (i === B.tIdx && B.foe && B.foe.hp > 0);
      g.save();
      g.globalAlpha = alive ? 1 : .3;
      g.drawImage(ballCanvas(0, 1), 26 + i * 20, 118);
      g.restore();
    }
  }
}

/* ---------------- アニメ ---------------- */
async function animHpTo(side, target) {
  const key = side === 'my' ? 'myShowHp' : 'foeShowHp';
  const from = B[key];
  const steps = Math.max(6, Math.min(30, Math.round(Math.abs(target - from) / 3)));
  for (let i = 1; i <= steps; i++) { B[key] = from + (target - from) * i / steps; await sleep(16); }
  B[key] = target;
}
async function animLunge(side) {
  const key = side === 'my' ? 'myOff' : 'foeOff';
  const d = side === 'my' ? 1 : -1;
  for (let i = 0; i < 5; i++) { B[key] = d * (i + 1) * 7; await sleep(14); }
  for (let i = 5; i >= 0; i--) { B[key] = d * i * 7; await sleep(14); }
  B[key] = 0;
}
async function animHitFx(side, mult) {
  const key = side === 'my' ? 'myFlash' : 'foeFlash';
  Sound.se(mult >= 2 ? 'sup' : mult < 1 ? 'weak' : 'hit');
  B.shake = mult >= 2 ? 9 : 5;
  for (let i = 0; i < 8; i++) { B[key] = i + 1; await sleep(28); }
  B[key] = 0; B.shake = 0;
}
async function animFaint(side) {
  const key = side === 'my' ? 'myDrop' : 'foeDrop';
  Sound.se('faint');
  for (let i = 0; i <= 14; i++) { B[key] = i * 10; await sleep(22); }
  if (side === 'my') B.myHide = true; else B.foeHide = true;
  B[key] = 0;
}
async function animSendOut(side) {
  const key = side === 'my' ? 'myDrop' : 'foeDrop';
  if (side === 'my') B.myHide = false; else B.foeHide = false;
  for (let i = 8; i >= 0; i--) { B[key] = -i * 12; await sleep(18); }
  B[key] = 0;
}

/* ---------------- レベルアップ・進化 ---------------- */
async function learnCheck(m, lv) {
  const sp = SPECIES[m.sp];
  for (const [l, mid] of sp.learn) {
    if (l !== lv) continue;
    if (m.moves.some(x => x.id === mid)) continue;
    const mv = MOVES[mid];
    if (m.moves.length < 4) {
      m.moves.push({ id: mid, pp: mv.pp, max: mv.pp });
      Sound.se('levelup');
      await say(monName(m) + ' は\n' + mv.name + ' を おぼえた！');
    } else {
      const ok = await confirmYN(monName(m) + ' は ' + mv.name + ' を おぼえたい！\nしかし わざは 4つまで。\nどれか わすれさせますか？');
      MsgBox.active = false;
      if (!ok) { await say(monName(m) + ' は ' + mv.name + ' を\nおぼえなかった…'); continue; }
      const items = m.moves.map(x => ({ label: MOVES[x.id].name, sub: MOVES[x.id].pw ? 'いりょく' + MOVES[x.id].pw : 'へんか' }));
      items.push({ label: 'やめる' });
      const i = await chooseMenu(items, { w: 300, per: items.length, x: 170, y: 140 });
      if (i < 0 || i >= 4) { await say(monName(m) + ' は ' + mv.name + ' を\nおぼえなかった…'); continue; }
      const old = MOVES[m.moves[i].id].name;
      m.moves[i] = { id: mid, pp: mv.pp, max: mv.pp };
      Sound.se('levelup');
      await say(old + ' を わすれて…\n' + monName(m) + ' は ' + mv.name + ' を おぼえた！');
    }
  }
}

async function evolveCheck(m) {
  const sp = SPECIES[m.sp];
  if (!sp.evo || m.lv < sp.evo.lv) return;
  const to = SPECIES[sp.evo.to];
  await say('おや…？\n' + monName(m) + ' の ようすが…！');
  const layer = {
    t: 0,
    draw(g) {
      g.fillStyle = '#0e0a18'; g.fillRect(0, 0, W, H);
      const k = (this.t % 40) / 40;
      const cv = creatureCanvas(k < .5 ? sp : to, 6);
      g.save();
      g.globalAlpha = 1;
      g.shadowColor = '#ffe9a8'; g.shadowBlur = 40;
      g.drawImage(cv, W / 2 - 96, 90);
      g.restore();
      this.t++;
    }
  };
  const evoLayer = { draw: () => layer.draw(CTX) };
  Menus.push(evoLayer);
  Sound.play('victory');
  for (let i = 0; i < 110; i++) await sleep(24);
  const ei = Menus.indexOf(evoLayer); if (ei >= 0) Menus.splice(ei, 1);
  Sound.play(B.on ? (B.music || 'battle') : mapBgm());
  const wasName = monName(m);
  m.sp = sp.evo.to;
  if (m.nick === null) { /* nickname keeps null → new species name */ }
  refreshStats(m);
  game.seen[to.no] = 1; game.caught[to.no] = 1;
  Sound.se('catch');
  await say('おめでとう！ ' + wasName + ' は\n' + to.name + ' に しんか した！');
  // 進化後のわざを空きスロットに覚える
  for (const [l, mid] of to.learn) {
    if (l > m.lv || m.moves.length >= 4 || m.moves.some(x => x.id === mid)) continue;
    m.moves.push({ id: mid, pp: MOVES[mid].pp, max: MOVES[mid].pp });
    Sound.se('levelup');
    await say(monName(m) + ' は\n' + MOVES[mid].name + ' を おぼえた！');
  }
  await learnCheck(m, m.lv);
  await evolveCheck(m);
}

async function gainLevel(m, n) {
  for (let i = 0; i < n; i++) {
    if (m.lv >= 60) { await say(monName(m) + ' は これいじょう つよくなれない！'); return; }
    m.lv++;
    const before = { atk: m.atk, def: m.def, spd: m.spd, max: m.max };
    refreshStats(m);
    m.hp = Math.min(m.max, m.hp + (m.max - before.max));
    Sound.se('levelup');
    await say(monName(m) + ' は レベル ' + m.lv + ' に あがった！\nHP+' + (m.max - before.max) +
              '　こうげき+' + (m.atk - before.atk) + '　ぼうぎょ+' + (m.def - before.def) +
              '　すばやさ+' + (m.spd - before.spd));
    await learnCheck(m, m.lv);
    await evolveCheck(m);
  }
}

async function gainXP(m, amount) {
  if (m.hp <= 0) return;
  await say(monName(m) + ' は ' + amount + ' の\nけいけんちを もらった！');
  m.xp += amount;
  while (m.xp >= xpToNext(m.lv) && m.lv < 60) {
    m.xp -= xpToNext(m.lv);
    if (m === my()) { await animXpTo(1); B.myShowXp = 0; }
    await gainLevel(m, 1);
  }
  if (m === my()) await animXpTo(m.xp / xpToNext(m.lv));
}
async function animXpTo(t) {
  const from = B.myShowXp;
  for (let i = 1; i <= 14; i++) { B.myShowXp = from + (t - from) * i / 14; await sleep(18); }
  B.myShowXp = t;
}

/* ---------------- 捕獲 ---------------- */
function catchShakes(mon, ballRate) {
  const sp = SPECIES[mon.sp];
  const stB = mon.st ? (mon.st === 'slp' ? 2.2 : 1.6) : 1;
  const a = ((3 * mon.max - 2 * mon.hp) * sp.rate * ballRate * stB) / (3 * mon.max);
  if (a >= 255) return 4;
  const b = 65536 / Math.pow(255 / a, 0.25);
  let sh = 0;
  for (let i = 0; i < 4; i++) { if (Math.random() * 65536 < b) sh++; else break; }
  return sh;
}

async function throwBall(itemId) {
  const it = ITEMS[itemId];
  useItemCount(itemId);
  await say(game.playerName + ' は ' + it.name + ' を なげた！');
  Sound.se('ball');
  B.ballAnim = { x: 140, y: 300, tier: it.tier };
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    B.ballAnim.x = 140 + (468 - 140) * t;
    B.ballAnim.y = 300 + (130 - 300) * t - Math.sin(t * Math.PI) * 110;
    await sleep(18);
  }
  B.foeHide = true;
  B.ballAnim.x = 468; B.ballAnim.y = 130;
  await sleep(200);
  for (let i = 0; i <= 12; i++) { B.ballAnim.y = 130 + i * 4.2; await sleep(18); }
  const sh = catchShakes(B.foe, it.rate);
  for (let i = 0; i < Math.min(3, sh); i++) {
    await sleep(360); Sound.se('shake');
    for (let k = 0; k < 8; k++) { B.ballAnim.x = 468 + Math.sin(k) * 8; await sleep(28); }
    B.ballAnim.x = 468;
  }
  await sleep(300);
  if (sh >= 4) {
    Sound.se('catch');
    B.ballAnim = null;
    const sp = SPECIES[B.foe.sp];
    game.caught[sp.no] = 1; game.seen[sp.no] = 1;
    await say('やった！　' + sp.name + ' を\nつかまえた！');
    B.foe.met = MAPS[game.map] ? MAPS[game.map].name : null;
    if (game.party.length < 6) { game.party.push(B.foe); await say(sp.name + ' を てもちに くわえた！'); }
    else { game.box.push(B.foe); await say('てもちが いっぱいなので\n' + sp.name + ' を あずかりシステムに おくった。'); }
    return true;
  }
  B.ballAnim = null;
  B.foeHide = false;
  await animSendOut('foe');
  const msgs = ['ああっ！ 出てきてしまった！', 'おしい！ あと すこし だったのに！', 'ダメだ！ ぜんぜん とらえられない！', 'おっと！ とびだされた！'];
  await say(msgs[Math.min(3, sh)]);
  return false;
}

/* ---------------- わざ実行 ---------------- */
async function doMove(atkSide, slot) {
  const atkr = atkSide === 'my' ? my() : B.foe;
  const defr = atkSide === 'my' ? B.foe : my();
  const defSide = atkSide === 'my' ? 'foe' : 'my';
  const mv = atkr.moves[slot];
  const d = MOVES[mv.id];
  const label = atkSide === 'my' ? '' : 'あいての ';

  // ねむり・まひ判定
  if (atkr.st === 'slp') {
    atkr.slpT--;
    if (atkr.slpT <= 0) { atkr.st = null; await say(label + monName(atkr) + ' は 目を さました！'); }
    else { await say(label + monName(atkr) + ' は ぐうぐう ねむっている…'); return; }
  }
  if (atkr.st === 'par' && Math.random() < 0.25) {
    await say(label + monName(atkr) + ' は からだが しびれて うごけない！');
    return;
  }
  mv.pp = Math.max(0, mv.pp - 1);
  await say(label + monName(atkr) + ' の\n' + d.name + '！');
  await animLunge(atkSide);

  if (Math.random() * 100 > d.ac) { await say('しかし はずれてしまった…'); return; }

  const sp = SPECIES[defr.sp];
  if (d.pw > 0) {
    const mult = effect(d.type, sp.type1, sp.type2);
    if (mult === 0) { await say('こうかが ないようだ…'); return; }
    const stab = (SPECIES[atkr.sp].type1 === d.type || SPECIES[atkr.sp].type2 === d.type) ? 1.5 : 1;
    const critR = 0.0625 * (1 + ((d.fx && d.fx.crit) || 0) * 3 + (B.st[atkSide].crit || 0) * 3);
    const crit = Math.random() < critR;
    const dmg = damageCalc(stat(atkr, 'atk', atkSide), stat(defr, 'def', defSide), d, atkr.lv, mult * stab, crit);
    const dealt = Math.min(dmg, defr.hp);   // 実際に与えたダメージ（吸収・反動の計算に使う）
    defr.hp = Math.max(0, defr.hp - dmg);
    await animHitFx(defSide, mult);
    await animHpTo(defSide, defr.hp);
    if (crit) await say('きゅうしょに あたった！');
    const et = effText(mult);
    if (et) await say(et);
    if (d.fx && d.fx.drain) {
      const h = Math.max(1, Math.floor(dealt * d.fx.drain));
      atkr.hp = Math.min(atkr.max, atkr.hp + h);
      await animHpTo(atkSide, atkr.hp);
      Sound.se('heal');
      await say(label + monName(atkr) + ' は たいりょくを すいとった！');
    }
    if (d.fx && d.fx.recoil) {
      const r = Math.max(1, Math.floor(dealt * d.fx.recoil));
      atkr.hp = Math.max(0, atkr.hp - r);
      await animHpTo(atkSide, atkr.hp);
      await say(label + monName(atkr) + ' は はんどうで ダメージを うけた！');
    }
  }

  // 追加効果
  if (d.fx) {
    if (d.fx.st && Math.random() * 100 < d.fx.ch && defr.hp > 0) {
      if (!defr.st) {
        const defType = [sp.type1, sp.type2];
        const immune = (d.fx.st === 'brn' && defType.indexOf('fire') >= 0) ||
                       (d.fx.st === 'par' && defType.indexOf('bolt') >= 0) ||
                       (d.fx.st === 'psn' && defType.indexOf('dark') >= 0);
        if (!immune) {
          defr.st = d.fx.st;
          if (d.fx.st === 'slp') defr.slpT = 1 + ((Math.random() * 3) | 0);
          Sound.se('weak');
          await say((defSide === 'my' ? '' : 'あいての ') + monName(defr) + ' は ' +
                    STATUS[d.fx.st].name + ' じょうたい に なった！');
        }
      } else if (d.pw === 0) {
        await say('しかし うまく きまらなかった…');
      }
    }
    if (d.fx.buf) {
      const [tgt, key, n] = d.fx.buf;
      const side = tgt === 'self' ? atkSide : defSide;
      const t = tgt === 'self' ? atkr : defr;
      const cur = B.st[side][key] || 0;
      if ((n > 0 && cur >= 6) || (n < 0 && cur <= -6)) {
        await say((side === 'my' ? '' : 'あいての ') + monName(t) + ' の ' + statName(key) +
                  ' は もう ' + (n > 0 ? 'あがらない' : 'さがらない') + '！');
      } else {
        B.st[side][key] = Math.max(-6, Math.min(6, cur + n));
        Sound.se(n > 0 ? 'heal' : 'weak');
        await say((side === 'my' ? '' : 'あいての ') + monName(t) + ' の ' + statName(key) +
                  ' が ' + (Math.abs(n) > 1 ? 'ぐーんと ' : '') + (n > 0 ? 'あがった！' : 'さがった！'));
      }
    }
    if (d.fx.heal) {
      if (atkr.hp >= atkr.max) await say('しかし HPは まんたん だ！');
      else {
        atkr.hp = Math.min(atkr.max, atkr.hp + Math.floor(atkr.max * d.fx.heal));
        await animHpTo(atkSide, atkr.hp);
        Sound.se('heal');
        await say(label + monName(atkr) + ' は たいりょくを かいふく した！');
      }
      if (d.fx.cure && atkr.st) { atkr.st = null; await say('じょうたい いじょうも なおった！'); }
    }
  }
}
function statName(k) { return { atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ', crit: 'きゅうしょ率' }[k] || k; }

/* ---------------- 敵AI ---------------- */
function aiChoose() {
  const f = B.foe, p = my();
  const sp = SPECIES[p.sp];
  let best = 0, bestScore = -1;
  f.moves.forEach((mv, i) => {
    if (mv.pp <= 0) return;
    const d = MOVES[mv.id];
    let score;
    if (d.pw > 0) {
      const mult = effect(d.type, sp.type1, sp.type2);
      const stab = (SPECIES[f.sp].type1 === d.type || SPECIES[f.sp].type2 === d.type) ? 1.5 : 1;
      score = d.pw * mult * stab * (d.ac / 100);
      if (mult === 0) score = 0;
      if (d.fx && d.fx.recoil && f.hp / f.max < 0.35) score *= 0.35;   // 瀕死なら反動わざを避ける
    } else {
      score = 42;
      if (d.fx && d.fx.st && p.st) score = 4;
      if (d.fx && d.fx.heal) score = f.hp / f.max < .4 ? 130 : 3;
      score *= 0.8 + Math.random() * 0.6;
    }
    score *= 0.85 + Math.random() * 0.3;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  if (f.moves.every(m => m.pp <= 0)) return -1;
  return best;
}

/* ---------------- コマンド選択 ---------------- */
async function chooseMoveMenu() {
  const m = my();
  const items = m.moves.map(mv => {
    const d = MOVES[mv.id];
    return { label: d.name, sub: mv.pp + '/' + mv.max, disabled: mv.pp <= 0 };
  });
  const foeSp = SPECIES[B.foe.sp];
  const idx = await chooseMenu(items, {
    w: 330, x: 18, y: MsgBox.y, lh: 30, per: items.length,
    extra(g, i) {
      const d = MOVES[m.moves[i].id];
      panel(g, 358, MsgBox.y, W - 382, 30 * items.length + 26, 'plain');
      let tx = 378;
      tx += typeChip(g, d.type, tx, MsgBox.y + 14) + 8;
      const mult = d.pw > 0 ? effect(d.type, foeSp.type1, foeSp.type2) : 1;
      if (d.pw > 0 && game.seen[foeSp.no]) {
        const lbl = mult === 0 ? 'こうかなし' : mult > 1 ? 'ばつぐん！' : mult < 1 ? 'いまひとつ' : 'ふつう';
        const col = mult === 0 ? '#8a8a9a' : mult > 1 ? '#e0553a' : mult < 1 ? '#4a7ad0' : '#5a5470';
        txt(g, lbl, tx, MsgBox.y + 16, { size: 16, color: col, shadow: false });
      }
      txt(g, d.pw ? 'いりょく ' + d.pw : 'へんかわざ', 378, MsgBox.y + 46, { size: 17, color: '#2b2438', shadow: false });
      txt(g, 'めいちゅう ' + d.ac, 378, MsgBox.y + 72, { size: 17, color: '#2b2438', shadow: false });
      wrapText(g, d.desc, 15, W - 420).forEach((l, k) =>
        txt(g, l, 378, MsgBox.y + 100 + k * 20, { size: 15, color: '#5a5470', shadow: false }));
    }
  });
  return idx;
}

/* ---------------- 交代 ---------------- */
async function switchTo(i, silent) {
  if (!silent) await say(monName(my()) + '！ もどれ！');
  B.mi = i;
  B.st.my = {};
  B.myShowHp = my().hp;
  B.myShowXp = my().xp / xpToNext(my().lv);
  B.myHide = true;
  await say('ゆけっ！ ' + monName(my()) + '！');
  Sound.cry(SPECIES[my().sp].cry);
  await animSendOut('my');
}

/* ---------------- メイン ---------------- */
async function startBattle(o) {
  B.on = true; game.state = 'battle';
  B.wild = !o.trainer; B.trainer = o.trainer || null; B.tIdx = 0;
  B.st = { my: {}, foe: {} };
  B.myHide = false; B.foeHide = false; B.myDrop = 0; B.foeDrop = 0;
  B.bg = o.bg || 'grass';
  B.mi = game.party.findIndex(m => m.hp > 0);
  if (B.mi < 0) { B.on = false; game.state = 'field'; return 'lose'; }
  B.foe = o.wild || makeMon(o.trainer.team[0][0], o.trainer.team[0][1]);
  B.foeShowHp = B.foe.hp; B.myShowHp = my().hp;
  B.myShowXp = my().xp / xpToNext(my().lv);
  game.seen[SPECIES[B.foe.sp].no] = 1;

  B.music = o.boss ? 'boss' : 'battle';
  Sound.play(B.music);
  Sound.se('encounter');
  OW.fade = 1;
  for (let i = 10; i >= 0; i--) { OW.fade = i / 10; await sleep(22); }
  OW.fade = 0;

  if (B.wild) { await say('あっ！ やせいの ' + monName(B.foe) + ' が\nとびだして きた！'); }
  else { await say(o.name + ' が しょうぶを しかけてきた！'); await say(o.name + ' は ' + monName(B.foe) + ' を くりだした！'); }
  Sound.cry(SPECIES[B.foe.sp].cry);
  await say('ゆけっ！ ' + monName(my()) + '！');
  Sound.cry(SPECIES[my().sp].cry);

  let result = null;
  let runTries = 0;

  while (!result) {
    // --- プレイヤー行動選択 ---
    let action = null;
    while (!action) {
      await say(monName(my()) + ' は どうする？', { keep: true });
      const items = ['たたかう', 'マナビースト', 'どうぐ', B.wild ? 'にげる' : 'にげる'];
      const c = await chooseMenu(items, { x: W - 236, y: MsgBox.y, w: 212, lh: 30, per: 4, noCancel: true });
      MsgBox.active = false;
      if (c === 0) {
        const mi = await chooseMoveMenu();
        if (mi < 0) continue;
        action = { t: 'move', i: mi };
      } else if (c === 1) {
        const pi = await partyScreen({ mode: 'battle', title: 'だれと こうたい する？' });
        if (pi < 0) continue;
        if (pi === B.mi) { await say('その子は もう たたかっている！'); continue; }
        if (game.party[pi].hp <= 0) { await say(monName(game.party[pi]) + ' は たたかえない！'); continue; }
        action = { t: 'switch', i: pi };
      } else if (c === 2) {
        const id = await bagScreen({ foot: 'Z つかう　X もどる' });
        if (!id) continue;
        const it = ITEMS[id];
        if (it.kind === 'ball') {
          if (!B.wild) { await say('ひとの マナビーストを\nとるなんて ダメだ！'); continue; }
          action = { t: 'ball', id };
        } else if (it.kind === 'buff') {
          action = { t: 'buff', id };
        } else {
          const before = JSON.stringify(game.bag);
          const used = await useItemField(id);
          MsgBox.active = false;
          if (!used) continue;
          B.myShowHp = my().hp;
          action = { t: 'item' };
        }
      } else {
        if (!B.wild) { await say('トレーナー しょうぶから\nにげることは できない！'); continue; }
        action = { t: 'run' };
      }
    }

    // --- 捕獲・逃走・道具は先に処理 ---
    if (action.t === 'ball') {
      const got = await throwBall(action.id);
      if (got) { result = 'caught'; break; }
    } else if (action.t === 'run') {
      runTries++;
      const odds = (stat(my(), 'spd', 'my') * 32 / Math.max(1, (stat(B.foe, 'spd', 'foe') / 4) % 256)) + 30 * runTries;
      if (my().spd >= B.foe.spd || Math.random() * 256 < odds) {
        Sound.se('warp');
        await say('うまく にげきれた！');
        result = 'run'; break;
      }
      await say('だめだ！ にげられない！');
    } else if (action.t === 'buff') {
      const it = ITEMS[action.id];
      useItemCount(action.id);
      const cur = B.st.my[it.stat] || 0;
      B.st.my[it.stat] = Math.min(6, cur + 2);
      Sound.se('heal');
      await say(it.name + ' を つかった！\n' + monName(my()) + ' の ' + statName(it.stat) + ' が ぐーんと あがった！');
    } else if (action.t === 'switch') {
      await switchTo(action.i);
    }

    // --- 相手の行動 ---
    const foeSlot = aiChoose();
    let order = [];
    if (action.t === 'move') {
      const myMv = MOVES[my().moves[action.i].id];
      const foeMv = foeSlot >= 0 ? MOVES[B.foe.moves[foeSlot].id] : null;
      const myPri = myMv.pri, foePri = foeMv ? foeMv.pri : -9;
      const mySpd = stat(my(), 'spd', 'my'), foeSpd = stat(B.foe, 'spd', 'foe');
      const meFirst = myPri !== foePri ? myPri > foePri
        : (mySpd !== foeSpd ? mySpd > foeSpd : Math.random() < .5);
      order = meFirst ? ['my', 'foe'] : ['foe', 'my'];
    } else {
      order = ['foe'];
    }

    for (const side of order) {
      if (result) break;
      if (side === 'my') {
        if (my().hp <= 0) continue;
        await doMove('my', action.i);
      } else {
        if (B.foe.hp <= 0) continue;
        if (foeSlot < 0) { await say('あいての ' + monName(B.foe) + ' は\nわざが つかえない！ もがいている！'); }
        else await doMove('foe', foeSlot);
      }
      // 戦闘不能チェック
      if (B.foe.hp <= 0) { result = await onFoeFaint(o) || result; break; }
      if (my().hp <= 0) { const r = await onMyFaint(); if (r) { result = r; } break; }
    }
    if (result) break;

    // --- ターン終了処理（状態異常）---
    for (const side of ['my', 'foe']) {
      const m = side === 'my' ? my() : B.foe;
      if (!m || m.hp <= 0 || !m.st) continue;
      const pre = side === 'my' ? '' : 'あいての ';
      if (m.st === 'psn') {
        m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.max / 8)));
        Sound.se('weak'); await animHpTo(side, m.hp);
        await say(pre + monName(m) + ' は どくの ダメージを うけた！');
      } else if (m.st === 'brn') {
        m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.max / 16)));
        Sound.se('weak'); await animHpTo(side, m.hp);
        await say(pre + monName(m) + ' は やけどの ダメージを うけた！');
      }
    }
    if (B.foe.hp <= 0 && !result) { const r = await onFoeFaint(o); if (r) result = r; }
    if (my() && my().hp <= 0 && !result) { const r = await onMyFaint(); if (r) result = r; }
  }

  // --- 終了処理 ---
  MsgBox.active = false;
  if (result === 'win' && !B.wild) {
    const mny = o.trainer.money;
    game.money += mny;
    await say(o.name + ' に かった！\n' + mny + ' マナを てにいれた！');
    if (o.trainer.win) await say(o.trainer.win, { name: o.name });
  }
  if (result === 'lose') {
    await say('目のまえが まっくらに なった…');
  }
  B.on = false;
  game.state = 'field';
  MsgBox.active = false;
  return result;
}

async function onFoeFaint(o) {
  await animFaint('foe');
  await say((B.wild ? 'やせいの ' : 'あいての ') + monName(B.foe) + ' は\nたおれた！');
  // 経験値
  const base = SPECIES[B.foe.sp].xp;
  const amount = Math.max(1, Math.floor(base * B.foe.lv / 4 * (B.wild ? 1 : 1.5)));
  const alive = game.party.filter(m => m.hp > 0);
  for (const m of alive) {
    await gainXP(m, m === my() ? amount : Math.floor(amount * 0.45));
  }
  if (!B.wild && B.tIdx + 1 < B.trainer.team.length) {
    B.tIdx++;
    const t = B.trainer.team[B.tIdx];
    B.foe = makeMon(t[0], t[1]);
    B.foeShowHp = B.foe.hp;
    B.st.foe = {};
    game.seen[SPECIES[B.foe.sp].no] = 1;
    await say(o.name + ' は ' + monName(B.foe) + ' を くりだした！');
    Sound.cry(SPECIES[B.foe.sp].cry);
    await animSendOut('foe');
    return null;
  }
  Sound.play('victory');
  return 'win';
}

async function onMyFaint() {
  await animFaint('my');
  await say(monName(my()) + ' は たおれた！');
  if (!partyAlive()) return 'lose';
  const pi = await partyScreen({ mode: 'pick', title: 'つぎは だれに たのむ？', force: true });
  if (pi < 0 || game.party[pi].hp <= 0) {
    const alt = game.party.findIndex(m => m.hp > 0);
    await switchTo(alt, true);
  } else {
    B.mi = pi; B.st.my = {};
    B.myShowHp = my().hp; B.myShowXp = my().xp / xpToNext(my().lv);
    B.myHide = true;
    await say('ゆけっ！ ' + monName(my()) + '！');
    Sound.cry(SPECIES[my().sp].cry);
    await animSendOut('my');
  }
  return null;
}
