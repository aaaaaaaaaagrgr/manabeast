/* =========================================================
   main.js — タイトル / メインループ
   ========================================================= */

const Title = { t: 0, sel: 0, mons: [1, 4, 7, 32, 21, 36] };

function drawTitle(g) {
  Title.t += 1;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#1a1030'); grd.addColorStop(.55, '#3a2258'); grd.addColorStop(1, '#8a4a68');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // 星
  for (let i = 0; i < 60; i++) {
    const x = (i * 97.3) % W, y = (i * 53.7) % 300;
    const a = .3 + .7 * Math.abs(Math.sin(Title.t / 40 + i));
    g.fillStyle = 'rgba(255,255,255,' + (a * .6) + ')';
    g.fillRect(x, y, 2, 2);
  }
  // 地面
  g.fillStyle = '#2a1a3a'; g.fillRect(0, 356, W, H - 356);
  g.fillStyle = '#3a2450';
  g.beginPath(); g.ellipse(W / 2, 366, 320, 26, 0, 0, 7); g.fill();
  // モンスターたち
  Title.mons.forEach((id, i) => {
    const sp = SPECIES[id];
    const x = 26 + i * 101, bob = Math.sin(Title.t / 28 + i * 1.3) * 6;
    g.save(); g.globalAlpha = .95;
    g.drawImage(creatureCanvas(sp, 3), x, 268 + bob);
    g.restore();
  });
  // ロゴ
  g.save();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const pulse = 1 + Math.sin(Title.t / 34) * 0.02;
  g.translate(W / 2, 128); g.scale(pulse, pulse);
  g.font = 'bold 62px ' + FONT;
  g.lineWidth = 12; g.strokeStyle = '#1a1030'; g.strokeText('マナビースト', 0, 0);
  const lg = g.createLinearGradient(0, -34, 0, 34);
  lg.addColorStop(0, '#fff6c8'); lg.addColorStop(.5, '#ffd75e'); lg.addColorStop(1, '#f08a3a');
  g.fillStyle = lg; g.fillText('マナビースト', 0, 0);
  g.restore();
  txt(g, '～ 光と闇の かけら ～', W / 2, 176, { size: 22, color: '#d8c8ff', align: 'center' });

  // メニュー
  const items = ['はじめから', 'つづきから'];
  panel(g, W / 2 - 130, 372, 260, 84, 'dark');
  items.forEach((s, i) => {
    const y = 386 + i * 32;
    const on = i === Title.sel;
    const dis = (i === 1 && !hasSave());
    txt(g, (on ? '▶ ' : '　') + s, W / 2, y,
        { size: 23, color: dis ? '#5a5470' : on ? '#ffe9a8' : '#cfc6e8', align: 'center' });
  });
  txt(g, 'Z/Enter で けってい　　M で BGM ON/OFF', W / 2, H - 22,
      { size: 14, color: '#a89ac8', align: 'center' });
}

async function titleLoop() {
  game.state = 'title';
  Sound.play('town');
  while (game.state === 'title') {
    const k = await Input.wait(['up', 'down', 'ok']);
    if (k === 'up' || k === 'down') { Title.sel = 1 - Title.sel; Sound.se('cursor'); }
    else {
      if (Title.sel === 1) {
        if (!hasSave()) { Sound.se('cancel'); continue; }
        if (!loadGame()) { Sound.se('cancel'); continue; }
        Sound.se('ok');
        game.state = 'field';
        OW.fade = 1;
        Sound.play(mapBgm());
        await fadeIn();
        return;
      }
      Sound.se('ok');
      await newGame();
      return;
    }
  }
}

async function newGame() {
  Object.assign(game, {
    map: 'home', px: 5, py: 6, dir: 'down',
    party: [], box: [], bag: {}, money: 1500,
    flags: {}, seen: {}, caught: {}, defeated: {},
    lastCenter: { map: 'village', x: 6, y: 11 }, playtime: 0, steps: 0
  });
  addItem('potion', 2);
  game.state = 'field';
  OW.fade = 1;
  OW.busy = true;
  Sound.play('town');
  await fadeIn();
  await say('ここは マナが みちる 世界。\n人と マナビーストが ともに 暮らす 場所。');
  await say('けれど 北の 神殿から\n闇が しずかに あふれはじめていた…');
  await say('ミナト村に すむ きみは\nきょう ついに 旅に出る――');
  MsgBox.active = false;
  OW.busy = false;
}

/* ---------------- ループ ---------------- */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(50, now - lastT); lastT = now;
  if (game.state === 'field') game.playtime += dt / 1000;

  const g = CTX;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);

  if (game.state === 'title') {
    drawTitle(g);
  } else if (game.state === 'battle' && B.on) {
    drawBattle(g);
  } else {
    updateField(dt);
    drawField(g);
  }

  drawMsgBox(g);
  for (const m of Menus) { try { m.draw(g); } catch (e) { } }

  if (OW.fade > 0) {
    g.fillStyle = 'rgba(0,0,0,' + OW.fade + ')';
    g.fillRect(0, 0, W, H);
  }
  if (!Sound.isOn()) {
    txt(g, '♪ OFF', W - 14, 6, { size: 13, color: '#ffffffaa', align: 'right' });
  }
  Input.clear();
  requestAnimationFrame(loop);
}

/* ---------------- 起動 ---------------- */
(function boot() {
  const g = CTX;
  g.fillStyle = '#0a0a12'; g.fillRect(0, 0, W, H);
  txt(g, 'よみこみ中…', W / 2, H / 2, { size: 22, color: '#cfc6e8', align: 'center' });
  requestAnimationFrame(loop);
  titleLoop();
})();
