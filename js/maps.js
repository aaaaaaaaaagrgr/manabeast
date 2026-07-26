/* =========================================================
   maps.js — タイル定義 / マップビルダ / 全マップ・NPC・トレーナー
   ========================================================= */

const TK = [
  { k: 'grass' },                              // 0
  { k: 'tall', enc: true },                    // 1
  { k: 'path' },                               // 2
  { k: 'sand' },                               // 3
  { k: 'water', solid: true },                 // 4
  { k: 'tree', solid: true },                  // 5
  { k: 'rock', solid: true },                  // 6
  { k: 'wall', solid: true },                  // 7
  { k: 'roof', solid: true },                  // 8
  { k: 'roof2', solid: true },                 // 9
  { k: 'door' },                               // 10
  { k: 'sign', solid: true, sign: true },      // 11
  { k: 'counter', solid: true },               // 12
  { k: 'floor' },                              // 13
  { k: 'cavefloor' },                          // 14
  { k: 'cavewall', solid: true },              // 15
  { k: 'flower' },                             // 16
  { k: 'stair' },                              // 17
  { k: 'shrine', solid: true },                // 18
  { k: 'snow' },                               // 19
  { k: 'ice' },                                // 20
  { k: 'cavegrass', enc: true },               // 21 洞窟の草むら（エンカウント）
  { k: 'roof3', solid: true }                  // 22 ジムの屋根
];
const T = { GRASS: 0, TALL: 1, PATH: 2, SAND: 3, WATER: 4, TREE: 5, ROCK: 6, WALL: 7,
            ROOF: 8, ROOF2: 9, DOOR: 10, SIGN: 11, COUNTER: 12, FLOOR: 13, CAVE: 14,
            CWALL: 15, FLOWER: 16, STAIR: 17, SHRINE: 18, SNOW: 19, ICE: 20, CAVEG: 21,
            ROOF3: 22 };

class MB {
  constructor(w, h, base) {
    this.w = w; this.h = h;
    this.t = new Uint8Array(w * h).fill(base || 0);
    this.seed = 12345;
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  at(x, y, v) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.t[y * this.w + x] = v; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? -1 : this.t[y * this.w + x]; }
  rect(x0, y0, x1, y1, v) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.at(x, y, v); }
  hline(y, x0, x1, v) { this.rect(x0, y, x1, y, v); }
  vline(x, y0, y1, v) { this.rect(x, y0, x, y1, v); }
  border(v, n) { n = n || 1; for (let i = 0; i < n; i++) { this.hline(i, 0, this.w - 1, v); this.hline(this.h - 1 - i, 0, this.w - 1, v); this.vline(i, 0, this.h - 1, v); this.vline(this.w - 1 - i, 0, this.h - 1, v); } }
  blob(cx, cy, r, v, jag) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const d = Math.hypot(x - cx, y - cy) + (jag ? (this.rnd() - .5) * jag : 0);
        if (d <= r) this.at(x, y, v);
      }
  }
  scatter(v, n, over) {
    for (let i = 0; i < n * 12 && n > 0; i++) {
      const x = (this.rnd() * this.w) | 0, y = (this.rnd() * this.h) | 0;
      if (over === undefined || this.get(x, y) === over) { this.at(x, y, v); n--; }
    }
  }
  // 家：屋根 + 壁 + ドア
  house(x, y, w, h, roof, doorOff) {
    this.rect(x, y, x + w - 1, y + h - 2, roof);
    this.hline(y + h - 1, x, x + w - 1, T.WALL);
    this.at(x + doorOff, y + h - 1, T.DOOR);
    return { dx: x + doorOff, dy: y + h - 1 };
  }
  // 室内の部屋
  room(x, y, w, h) {
    this.rect(x, y, x + w - 1, y + h - 1, T.FLOOR);
    this.hline(y - 1, x - 1, x + w, T.WALL);
    this.vline(x - 1, y - 1, y + h, T.WALL);
    this.vline(x + w, y - 1, y + h, T.WALL);
    this.hline(y + h, x - 1, x + w, T.WALL);
  }
}

const MAPS = {};
function defMap(id, o) { o.id = id; MAPS[id] = o; }

const LOOK = {
  hero:  { hair: '#3a2a1e', skin: '#f0c49a', shirt: '#3f7fd0', pants: '#38405a' },
  rival: { hair: '#c04a3a', skin: '#f0c49a', shirt: '#e8e2d4', pants: '#4a4a58' },
  mom:   { hair: '#6a4a2a', skin: '#f4cba4', shirt: '#e07aa0', pants: '#8a5a7a' },
  prof:  { hair: '#d8d8d8', skin: '#f0c49a', shirt: '#f4f4f4', pants: '#5a5a68' },
  nurse: { hair: '#f07aa8', skin: '#f4cba4', shirt: '#ffffff', pants: '#e04a80' },
  clerk: { hair: '#3a3a4a', skin: '#e8b888', shirt: '#4aa86a', pants: '#38405a' },
  boy:   { hair: '#2a2a3a', skin: '#f0c49a', shirt: '#f0c04a', pants: '#4a5a7a' },
  girl:  { hair: '#8a5a2a', skin: '#f4cba4', shirt: '#a86ad8', pants: '#5a4a7a' },
  old:   { hair: '#c8c8c8', skin: '#e0b898', shirt: '#8a7a5a', pants: '#5a4a3a' },
  camp:  { hair: '#4a3a2a', skin: '#d8a878', shirt: '#c86a3a', pants: '#6a5a3a' },
  fish:  { hair: '#2a4a6a', skin: '#e8b888', shirt: '#3a8ad0', pants: '#2a3a5a' },
  hiker: { hair: '#5a3a2a', skin: '#d8a878', shirt: '#8a6a3a', pants: '#4a5a3a' },
  dark:  { hair: '#1a1a2a', skin: '#c8a888', shirt: '#4a3a6a', pants: '#2a2438' },
  gym1:  { hair: '#e05a2a', skin: '#f0c49a', shirt: '#ff8a3a', pants: '#8a3a1a' },
  gym2:  { hair: '#3a7ad0', skin: '#f4cba4', shirt: '#4aa8f0', pants: '#2a4a8a' },
  gym3:  { hair: '#3a8a4a', skin: '#f0c49a', shirt: '#6ac45a', pants: '#3a5a2a' },
  gym4:  { hair: '#e8d43a', skin: '#e8b888', shirt: '#f5d43a', pants: '#6a5a1a' },
  boss:  { hair: '#2a1a3a', skin: '#c0a8c8', shirt: '#4a2a7a', pants: '#1a1428' },
  lumi:  { hair: '#fff6c8', skin: '#fff4d8', shirt: '#ffe9a8', pants: '#f0d38a' }
};

/* =========================================================
   1. しゅじんこうの家（室内）
   ========================================================= */
{
  const b = new MB(12, 10, T.WALL);
  b.room(1, 1, 10, 8);
  b.rect(1, 1, 10, 1, T.WALL);
  b.at(5, 9, T.DOOR); b.at(6, 9, T.DOOR);
  b.rect(2, 2, 3, 3, T.COUNTER);         // ベッド代わりの家具
  b.rect(8, 2, 9, 3, T.COUNTER);
  defMap('home', {
    name: 'じぶんの へや', w: 12, h: 10, t: b.t, indoor: true, bgm: 'town',
    warps: [{ x: 5, y: 9, to: 'village', tx: 6, ty: 11, dir: 'down' },
            { x: 6, y: 9, to: 'village', tx: 6, ty: 11, dir: 'down' }],
    npcs: [
      { x: 7, y: 5, dir: 'down', look: LOOK.mom, name: 'ママ',
        lines: ['あら おはよう！\nよく ねむれた？',
                'ハカセが 待ってるわよ。\nついに あなたも マナビーストと\n旅に出るのね！',
                'いってらっしゃい。\n…ごはんは ちゃんと 食べるのよ？'],
        heal: true }
    ],
    signs: { '2,2': 'ふかふかの ベッドだ。\nもう ねむくない！', '8,2': '本だな。\n『マナビースト入門』が おいてある。' }
  });
}

/* =========================================================
   2. ハカセの研究所（室内）
   ========================================================= */
{
  const b = new MB(14, 12, T.WALL);
  b.room(1, 1, 12, 10);
  b.rect(1, 2, 3, 3, T.COUNTER);
  b.rect(10, 2, 12, 3, T.COUNTER);
  b.rect(1, 6, 3, 6, T.COUNTER);
  b.rect(10, 6, 12, 6, T.COUNTER);
  b.at(6, 11, T.DOOR); b.at(7, 11, T.DOOR);
  defMap('lab', {
    name: 'マナ研究所', w: 14, h: 12, t: b.t, indoor: true, bgm: 'town',
    warps: [{ x: 6, y: 11, to: 'village', tx: 20, ty: 11, dir: 'down' },
            { x: 7, y: 11, to: 'village', tx: 20, ty: 11, dir: 'down' }],
    npcs: [
      { x: 6, y: 3, dir: 'down', look: LOOK.prof, name: 'マナベ博士', id: 'prof', special: 'prof' },
      { x: 10, y: 7, dir: 'left', look: LOOK.girl, name: 'じょしゅ',
        lines: ['マナビーストは 弱らせてから\nクリスタルを 投げると 捕まえやすいの。',
                '状態異常に すると さらに\n成功率が 上がるわ！'] },
      { x: 2, y: 7, dir: 'right', look: LOOK.boy, name: 'けんきゅういん',
        lines: ['属性の 相性は だいじだよ。\n炎は 草に つよくて 水に よわい。',
                'たたかう画面で わざを えらぶと\n相性の ヒントが 出るよ。'] }
    ],
    signs: { '1,6': 'いろんな 器具が ならんでいる。\nさわらないほうが よさそうだ。',
             '11,6': '棚には マナビーストの 標本が\nずらりと ならんでいる。' }
  });
}

/* =========================================================
   3. ミナト村
   ========================================================= */
{
  const b = new MB(26, 20, T.GRASS);
  b.border(T.TREE, 2);
  b.scatter(T.FLOWER, 22, T.GRASS);
  b.vline(6, 3, 17, T.PATH); b.vline(7, 3, 17, T.PATH);
  b.hline(12, 6, 20, T.PATH); b.hline(13, 6, 20, T.PATH);
  b.vline(20, 3, 13, T.PATH);
  b.hline(2, 6, 7, T.PATH); b.hline(1, 6, 7, T.PATH);   // 北の出口
  b.house(3, 6, 6, 5, T.ROOF, 3);                        // じぶんの家 door(6,10)
  b.house(17, 6, 7, 5, T.ROOF2, 3);                      // 研究所 door(20,10)
  b.blob(20, 17, 3, T.WATER, 1.2);
  b.at(8, 11, T.SIGN); b.at(16, 11, T.SIGN);
  b.rect(11, 15, 14, 17, T.SAND);
  defMap('village', {
    name: 'ミナト村', w: 26, h: 20, t: b.t, bgm: 'town',
    warps: [{ x: 6, y: 1, to: 'route1', tx: 15, ty: 24, dir: 'up' },
            { x: 7, y: 1, to: 'route1', tx: 15, ty: 24, dir: 'up' },
            { x: 6, y: 10, to: 'home', tx: 5, ty: 8, dir: 'up' },
            { x: 20, y: 10, to: 'lab', tx: 6, ty: 10, dir: 'up' }],
    npcs: [
      { x: 12, y: 16, dir: 'down', look: LOOK.old, name: 'ろうじん',
        lines: ['ミナト村は 世界の はしっこじゃ。\n若いもんは みな 旅に出る。',
                '北の 神殿に 闇が 満ちてきておる…\nお前さんが 光になるのかもしれん。'] },
      { x: 10, y: 8, dir: 'right', look: LOOK.boy, name: 'こども',
        lines: ['くさむらに 入ると\nマナビーストが とび出してくるよ！',
                'たたかう まえに\nHPを 回復しておこうね。'] }
    ],
    signs: {
      '8,11': '『ミナト村』\nマナと 海がまじわる 小さな村',
      '16,11': '『マナ研究所』\nマナビーストの ふしぎを 研究中'
    }
  });
}

/* =========================================================
   4. 1番道路
   ========================================================= */
{
  const b = new MB(30, 26, T.GRASS);
  b.border(T.TREE, 2);
  b.vline(15, 2, 25, T.PATH); b.vline(16, 2, 25, T.PATH);
  b.hline(14, 6, 16, T.PATH); b.hline(15, 6, 16, T.PATH);
  b.vline(6, 5, 15, T.PATH); b.vline(7, 5, 15, T.PATH);
  b.hline(5, 6, 12, T.PATH);
  b.rect(3, 17, 12, 23, T.TALL);
  b.rect(19, 6, 27, 13, T.TALL);
  b.rect(19, 18, 26, 22, T.TALL);
  b.rect(9, 8, 13, 12, T.TALL);
  b.blob(24, 3, 2.5, T.ROCK, 1);
  b.scatter(T.TREE, 14, T.GRASS);
  b.scatter(T.FLOWER, 16, T.GRASS);
  b.hline(1, 15, 16, T.PATH); b.hline(0, 15, 16, T.PATH);
  b.at(14, 23, T.SIGN);
  defMap('route1', {
    name: '1ばん道路', w: 30, h: 26, t: b.t, bgm: 'route',
    enc: { rate: .12, table: [[10, 3, 6, 30], [12, 3, 6, 25], [1, 3, 5, 8], [4, 3, 5, 8],
                              [7, 3, 5, 8], [24, 4, 6, 12], [26, 3, 6, 9]] },
    warps: [{ x: 15, y: 25, to: 'village', tx: 6, ty: 3, dir: 'down' },
            { x: 16, y: 25, to: 'village', tx: 7, ty: 3, dir: 'down' },
            { x: 15, y: 0, to: 'akane', tx: 13, ty: 19, dir: 'up' },
            { x: 16, y: 0, to: 'akane', tx: 14, ty: 19, dir: 'up' }],
    npcs: [
      { x: 15, y: 20, dir: 'down', look: LOOK.boy, name: 'たんけんキッズ ソラ',
        lines: ['見つけた！ おれと しょうぶだ！'],
        trainer: { id: 't1', team: [[10, 5], [12, 5]], money: 300,
          win: 'つ つよい…！\n北の アカネの町には ジムが あるよ。' } },
      { x: 20, y: 14, dir: 'left', look: LOOK.girl, name: 'むしとりガール ナナ',
        lines: ['かわいい マナビースト\nつかまえた？ 見せっこしよ！'],
        trainer: { id: 't2', team: [[26, 6], [24, 6]], money: 340,
          win: 'まけちゃった…\nでも うちの子 かわいいでしょ？' } },
      { x: 8, y: 16, dir: 'down', look: LOOK.old, name: 'たびびと',
        lines: ['クリスタルは 町の ショップで\n買えるぞ。 多めに 持っていけ。',
                'はい これ 餞別じゃ。'],
        give: { item: 'ball1', n: 5, flag: 'gift_ball' } }
    ],
    signs: { '14,23': '『1ばん道路』\n← ミナト村　　アカネの町 →' }
  });
}

/* =========================================================
   5. アカネの町
   ========================================================= */
{
  const b = new MB(28, 22, T.GRASS);
  b.border(T.TREE, 2);
  b.rect(2, 2, 25, 19, T.PATH);
  b.scatter(T.FLOWER, 10, T.PATH);
  b.house(4, 4, 7, 5, T.ROOF2, 3);      // センター door(7,8)
  b.house(15, 4, 7, 5, T.ROOF, 3);      // ショップ door(18,8)
  b.rect(9, 12, 18, 16, T.WALL);
  b.rect(9, 12, 18, 15, T.ROOF3);
  b.at(13, 16, T.DOOR); b.at(14, 16, T.DOOR);
  b.at(12, 9, T.SIGN); b.at(20, 9, T.SIGN); b.at(8, 17, T.SIGN);
  b.hline(20, 13, 14, T.PATH); b.hline(21, 13, 14, T.PATH);
  b.vline(26, 9, 10, T.PATH); b.vline(27, 9, 10, T.PATH);
  b.rect(3, 16, 6, 19, T.FLOWER);
  defMap('akane', {
    name: 'アカネの町', w: 28, h: 22, t: b.t, bgm: 'town',
    warps: [{ x: 13, y: 21, to: 'route1', tx: 15, ty: 1, dir: 'down' },
            { x: 14, y: 21, to: 'route1', tx: 16, ty: 1, dir: 'down' },
            { x: 7, y: 8, to: 'center', tx: 6, ty: 8, dir: 'up' },
            { x: 18, y: 8, to: 'mart', tx: 6, ty: 8, dir: 'up', shop: 1 },
            { x: 13, y: 16, to: 'gym1', tx: 6, ty: 15, dir: 'up' },
            { x: 14, y: 16, to: 'gym1', tx: 7, ty: 15, dir: 'up' },
            { x: 27, y: 9, to: 'route2', tx: 1, ty: 12, dir: 'right', need: 'badge1',
              needMsg: 'けいびいん「まだ 通せないよ。\nジムバッジを 見せてくれ！」' },
            { x: 27, y: 10, to: 'route2', tx: 1, ty: 13, dir: 'right', need: 'badge1',
              needMsg: 'けいびいん「まだ 通せないよ。\nジムバッジを 見せてくれ！」' }],
    npcs: [
      { x: 24, y: 10, dir: 'left', look: LOOK.camp, name: 'けいびいん', id: 'guard1',
        special: 'guard', need: 'badge1',
        block: 'この先の 2ばん道路は\nマナビーストが あらあらしい。\nジムバッジを 見せてくれたら 通すよ。',
        pass: 'ヒノさんに 勝ったのか！\nさあ 通ってくれ。 気をつけてな。' },
      { x: 6, y: 12, dir: 'right', look: LOOK.girl, name: 'まちのひと',
        lines: ['青い屋根が ヒーリングセンター。\nマナビーストが 全回復するわ。',
                '赤い屋根は ショップよ。\nどうぐを 買いためておいてね。'] },
      { x: 20, y: 17, dir: 'up', look: LOOK.boy, name: 'ジムファン',
        lines: ['ジムリーダーの ヒノさんは\n炎つかいだ！',
                '水か 地の マナビーストを\nつれていくと いいかもね。'] },
      { x: 10, y: 19, dir: 'up', look: LOOK.rival, name: 'カイ', id: 'rival2',
        special: 'rival2' }
    ],
    signs: {
      '12,9': '『ヒーリングセンター』\nマナビーストを 休ませよう',
      '20,9': '『マナショップ』\nどうぐと クリスタル',
      '8,17': '『アカネジム』\nリーダー ヒノ　―― 燃える闘志'
    }
  });
}

/* =========================================================
   6. アカネジム（室内）
   ========================================================= */
{
  const b = new MB(14, 18, T.WALL);
  b.room(1, 1, 12, 16);
  b.at(6, 17, T.DOOR); b.at(7, 17, T.DOOR);
  b.rect(2, 4, 3, 5, T.SHRINE); b.rect(10, 4, 11, 5, T.SHRINE);
  b.rect(2, 10, 3, 11, T.SHRINE); b.rect(10, 10, 11, 11, T.SHRINE);
  b.rect(6, 2, 7, 2, T.COUNTER);
  defMap('gym1', {
    name: 'アカネジム', w: 14, h: 18, t: b.t, indoor: true, bgm: 'gym',
    warps: [{ x: 6, y: 17, to: 'akane', tx: 13, ty: 17, dir: 'down' },
            { x: 7, y: 17, to: 'akane', tx: 14, ty: 17, dir: 'down' }],
    npcs: [
      { x: 4, y: 12, dir: 'right', look: LOOK.camp, name: 'ジムトレーナー ホムラ',
        lines: ['ここから先は 炎の道！\n熱くなれるか？'],
        trainer: { id: 'g1a', team: [[4, 11], [29, 12]], money: 700,
          win: 'あつい たたかいだった…！' } },
      { x: 9, y: 8, dir: 'left', look: LOOK.girl, name: 'ジムトレーナー ヒバナ',
        lines: ['火の粉が 舞うわよ！'],
        trainer: { id: 'g1b', team: [[4, 12], [16, 12]], money: 700,
          win: 'まぶしい…\nあなたの ほうが 熱いわ。' } },
      { x: 6, y: 4, dir: 'down', look: LOOK.gym1, name: 'ヒノ', id: 'leader1',
        special: 'leader',
        badge: 'badge1', badgeName: 'ファイアバッジ',
        lines: ['よく来た！ おれが アカネジムの\nリーダー ヒノだ。',
                'マナビーストは 心で燃える。\nお前の 火は 本物か…\n見せてもらうぞ！'],
        trainer: { id: 'leader1', team: [[4, 13], [29, 14], [5, 16]], money: 2000,
          win: 'ハハッ！ みごとだ！\nお前の 炎は 本物だった！' },
        after: 'ファイアバッジが あれば\nどこへでも 行ける。\n強いやつを 探しにいけ！',
        reward: { item: 'potion2', n: 3 } }
    ],
    signs: {}
  });
}

/* =========================================================
   7. 2ばん道路（湖畔）
   ========================================================= */
{
  const b = new MB(30, 26, T.GRASS);
  b.border(T.TREE, 2);
  b.hline(12, 1, 28, T.PATH); b.hline(13, 1, 28, T.PATH);
  b.vline(21, 3, 13, T.PATH); b.vline(22, 3, 13, T.PATH);
  b.hline(2, 21, 22, T.PATH); b.hline(1, 21, 22, T.PATH);
  b.blob(9, 19, 6.5, T.WATER, 1.6);
  b.blob(16, 20, 4.5, T.WATER, 1.4);
  b.rect(4, 4, 12, 10, T.TALL);
  b.rect(24, 15, 27, 23, T.TALL);
  b.rect(15, 4, 19, 9, T.TALL);
  b.scatter(T.TREE, 12, T.GRASS);
  b.scatter(T.FLOWER, 12, T.GRASS);
  b.rect(6, 14, 18, 15, T.SAND);
  b.at(0, 12, T.PATH); b.at(0, 13, T.PATH);
  b.hline(0, 21, 22, T.PATH);
  b.at(3, 11, T.SIGN);
  defMap('route2', {
    name: '2ばん道路', w: 30, h: 26, t: b.t, bgm: 'route',
    enc: { rate: .13, table: [[22, 8, 12, 26], [12, 8, 11, 18], [10, 8, 11, 14],
                              [7, 9, 12, 10], [30, 10, 13, 10], [26, 8, 11, 12], [16, 9, 12, 10]] },
    warps: [{ x: 0, y: 12, to: 'akane', tx: 26, ty: 9, dir: 'left' },
            { x: 0, y: 13, to: 'akane', tx: 26, ty: 10, dir: 'left' },
            { x: 21, y: 0, to: 'mizuho', tx: 13, ty: 20, dir: 'up' },
            { x: 22, y: 0, to: 'mizuho', tx: 14, ty: 20, dir: 'up' }],
    npcs: [
      { x: 13, y: 14, dir: 'down', look: LOOK.fish, name: 'つりびと ミナモ',
        lines: ['この湖には 主が いるらしい。\nおっと きみ トレーナーだね？'],
        trainer: { id: 't3', team: [[22, 11], [22, 12], [7, 12]], money: 620,
          win: 'つれなかったのは おれの ほうか…' } },
      { x: 20, y: 8, dir: 'left', look: LOOK.camp, name: 'キャンパー タケ',
        lines: ['山より 湖！ 湖より しょうぶ！'],
        trainer: { id: 't4', team: [[16, 12], [10, 12]], money: 560,
          win: 'いい勝負だった。 また会おう！' } },
      { x: 25, y: 20, dir: 'up', look: LOOK.girl, name: 'ピクニックガール',
        lines: ['ミズホの街は 水の街。\nジムリーダーの ナギさんは\nとっても つよいのよ。'] },
      { x: 6, y: 5, dir: 'down', look: LOOK.old, name: 'ものしり',
        lines: ['くさむらの 中でも たまに\n強い個体に 出会うことがある。',
                'HPが 減った相手ほど\nクリスタルで 捕まえやすいぞ。'],
        give: { item: 'ball2', n: 3, flag: 'gift_ball2' } }
    ],
    signs: { '3,11': '『2ばん道路』\n← アカネの町　　ミズホの街 ↑' }
  });
}

/* =========================================================
   8. ミズホの街
   ========================================================= */
{
  const b = new MB(28, 22, T.GRASS);
  b.border(T.TREE, 2);
  b.rect(2, 2, 25, 19, T.PATH);
  b.rect(2, 15, 9, 19, T.WATER);
  b.rect(3, 14, 8, 14, T.SAND);
  b.house(4, 3, 7, 5, T.ROOF2, 3);      // センター door(7,7)
  b.house(16, 3, 7, 5, T.ROOF, 3);      // ショップ door(19,7)
  b.rect(13, 11, 22, 15, T.WALL);
  b.rect(13, 11, 22, 14, T.ROOF3);
  b.at(17, 15, T.DOOR); b.at(18, 15, T.DOOR);
  b.at(12, 8, T.SIGN); b.at(21, 8, T.SIGN); b.at(12, 16, T.SIGN);
  b.hline(20, 13, 14, T.PATH); b.hline(21, 13, 14, T.PATH);
  b.hline(1, 13, 14, T.PATH); b.hline(0, 13, 14, T.PATH);
  defMap('mizuho', {
    name: 'ミズホの街', w: 28, h: 22, t: b.t, bgm: 'town',
    warps: [{ x: 13, y: 21, to: 'route2', tx: 21, ty: 1, dir: 'down' },
            { x: 14, y: 21, to: 'route2', tx: 22, ty: 1, dir: 'down' },
            { x: 7, y: 7, to: 'center', tx: 6, ty: 8, dir: 'up' },
            { x: 19, y: 7, to: 'mart', tx: 6, ty: 8, dir: 'up', shop: 2 },
            { x: 17, y: 15, to: 'gym2', tx: 6, ty: 15, dir: 'up' },
            { x: 18, y: 15, to: 'gym2', tx: 7, ty: 15, dir: 'up' },
            { x: 13, y: 0, to: 'forest', tx: 16, ty: 26, dir: 'up', need: 'badge2',
              needMsg: 'けいびいん「樹海は 危険だ。\nアクアバッジを 見せてくれ！」' },
            { x: 14, y: 0, to: 'forest', tx: 17, ty: 26, dir: 'up', need: 'badge2',
              needMsg: 'けいびいん「樹海は 危険だ。\nアクアバッジを 見せてくれ！」' }],
    npcs: [
      { x: 13, y: 3, dir: 'down', look: LOOK.hiker, name: 'けいびいん', id: 'guard2',
        special: 'guard', need: 'badge2',
        block: '北の 樹海は 迷いやすい。\n水のバッジを 持つ者だけ\n通してよいと 言われている。',
        pass: 'ナギ様に 勝ったか。\n樹海は 気をつけて な。' },
      { x: 6, y: 12, dir: 'right', look: LOOK.boy, name: 'まちのひと',
        lines: ['ナギさんは 水の いやし手。\n回復されると なかなか 倒せないよ。',
                'いっきに たたみかけるんだ！'] },
      { x: 23, y: 18, dir: 'left', look: LOOK.old, name: 'ふなのり',
        lines: ['むかし 湖の主 サメイルを 見たよ。\n銀色の ヒレが 月を切ってた…'] }
    ],
    signs: {
      '12,8': '『ヒーリングセンター』', '21,8': '『マナショップ』',
      '12,16': '『ミズホジム』\nリーダー ナギ　―― 静かなる激流'
    }
  });
}

/* =========================================================
   9. ミズホジム（室内）
   ========================================================= */
{
  const b = new MB(14, 18, T.WALL);
  b.room(1, 1, 12, 16);
  b.at(6, 17, T.DOOR); b.at(7, 17, T.DOOR);
  b.rect(2, 3, 4, 6, T.WATER); b.rect(9, 3, 11, 6, T.WATER);
  b.rect(2, 10, 4, 13, T.WATER); b.rect(9, 10, 11, 13, T.WATER);
  b.rect(6, 2, 7, 2, T.COUNTER);
  defMap('gym2', {
    name: 'ミズホジム', w: 14, h: 18, t: b.t, indoor: true, bgm: 'gym',
    warps: [{ x: 6, y: 17, to: 'mizuho', tx: 17, ty: 16, dir: 'down' },
            { x: 7, y: 17, to: 'mizuho', tx: 18, ty: 16, dir: 'down' }],
    npcs: [
      { x: 6, y: 12, dir: 'down', look: LOOK.fish, name: 'ジムトレーナー ウミ',
        lines: ['流れに さからえるかな？'],
        trainer: { id: 'g2a', team: [[22, 15], [30, 15]], money: 900,
          win: 'ながされた…！' } },
      { x: 7, y: 8, dir: 'up', look: LOOK.boy, name: 'ジムトレーナー シオ',
        lines: ['水は かたちを 変えて せまる！'],
        trainer: { id: 'g2b', team: [[8, 16], [22, 15]], money: 900,
          win: 'きみの 勢いには かなわないな。' } },
      { x: 6, y: 4, dir: 'down', look: LOOK.gym2, name: 'ナギ', id: 'leader2',
        special: 'leader', badge: 'badge2', badgeName: 'アクアバッジ',
        lines: ['ようこそ ミズホジムへ。\nわたしが リーダーの ナギ。',
                'water は 静かに すべてを のみこむ。\n…さあ 見せてもらうわ。'],
        trainer: { id: 'leader2', team: [[30, 17], [8, 18], [23, 20]], money: 3000,
          win: 'みごと…\nあなたの 流れは 止められなかった。' },
        after: '樹海の 奥には 大樹の 守り手が いる。\n気をつけて いってらっしゃい。',
        reward: { item: 'potion3', n: 3 } }
    ],
    signs: {}
  });
}

/* =========================================================
   10. 樹海（ジム3：シオン）
   ========================================================= */
{
  const b = new MB(32, 28, T.GRASS);
  b.border(T.TREE, 2);
  for (let i = 0; i < 90; i++) { b.scatter(T.TREE, 1, T.GRASS); }
  b.rect(4, 4, 27, 23, T.TALL);
  b.vline(16, 4, 26, T.PATH); b.vline(17, 4, 26, T.PATH);
  b.hline(20, 6, 17, T.PATH); b.hline(21, 6, 17, T.PATH);
  b.vline(6, 12, 21, T.PATH); b.vline(7, 12, 21, T.PATH);
  b.hline(12, 6, 12, T.PATH); b.hline(13, 6, 12, T.PATH);
  b.hline(9, 16, 26, T.PATH); b.hline(10, 16, 26, T.PATH);
  b.vline(26, 9, 18, T.PATH); b.vline(25, 9, 18, T.PATH);
  b.rect(11, 2, 22, 7, T.GRASS);
  b.rect(13, 3, 20, 5, T.FLOWER);
  b.rect(15, 2, 18, 2, T.SHRINE);
  b.scatter(T.TREE, 10, T.TALL);
  b.vline(16, 25, 27, T.PATH); b.vline(17, 25, 27, T.PATH);
  b.at(15, 25, T.SIGN);
  defMap('forest', {
    name: '樹海', w: 32, h: 28, t: b.t, bgm: 'forest',
    enc: { rate: .14, table: [[24, 14, 18, 20], [26, 14, 17, 16], [1, 14, 18, 12],
                              [27, 16, 19, 10], [18, 15, 18, 12], [33, 16, 19, 10],
                              [2, 17, 20, 8], [11, 15, 18, 12]] },
    warps: [{ x: 16, y: 27, to: 'mizuho', tx: 13, ty: 1, dir: 'down' },
            { x: 17, y: 27, to: 'mizuho', tx: 14, ty: 1, dir: 'down' },
            { x: 20, y: 2, to: 'mountain', tx: 15, ty: 28, dir: 'up', need: 'badge3',
              needMsg: 'ここから先は 大樹の 守り手\nシオンに みとめられた者だけが\n通れる 道だ。' },
            { x: 21, y: 2, to: 'mountain', tx: 16, ty: 28, dir: 'up', need: 'badge3',
              needMsg: 'ここから先は 大樹の 守り手\nシオンに みとめられた者だけが\n通れる 道だ。' }],
    npcs: [
      { x: 16, y: 18, dir: 'down', look: LOOK.hiker, name: 'きこり ゲン',
        lines: ['森を なめるなよ 若いの！'],
        trainer: { id: 't5', team: [[28, 18], [17, 18]], money: 1000,
          win: 'その根性 気に入った！' } },
      { x: 9, y: 12, dir: 'right', look: LOOK.girl, name: 'アロマガール ハナ',
        lines: ['いい香り でしょ？\nねむらせて あげる。'],
        trainer: { id: 't6', team: [[25, 19], [27, 18]], money: 1100,
          win: '目が さめちゃった…！' } },
      { x: 26, y: 14, dir: 'left', look: LOOK.dark, name: 'ふしんしゃ',
        lines: ['ククッ… 闇の神殿へ 行くつもりか？\nその前に 力を 見せてみろ。'],
        trainer: { id: 't7', team: [[18, 19], [33, 20]], money: 1200,
          win: 'ぐっ… ノクス様が お待ちだ…' } },
      { x: 13, y: 6, dir: 'down', look: LOOK.rival, name: 'カイ', id: 'rival3',
        special: 'rival3' },
      { x: 16, y: 4, dir: 'down', look: LOOK.gym3, name: 'シオン', id: 'leader3',
        special: 'leader', badge: 'badge3', badgeName: 'リーフバッジ',
        lines: ['ここは 大樹の 祠。\nぼくは 森の 守り手 シオン。',
                'この先の 山道は きけんだ。\n通りたければ ぼくを 越えていって。'],
        trainer: { id: 'leader3', team: [[27, 20], [25, 21], [3, 23]], money: 4000,
          win: 'すごい…\n森が きみを みとめたよ。' },
        after: '北の 雷鳴の山には ライガさんがいる。\n気をつけて。',
        reward: { item: 'full', n: 2 } }
    ],
    signs: { '15,25': '『樹海』\n道を それると 迷うので 注意' }
  });
}

/* =========================================================
   11. 雷鳴の山道（ジム4：ライガ）
   ========================================================= */
{
  const b = new MB(30, 30, T.ROCK);
  b.rect(2, 2, 27, 27, T.CAVE);
  b.rect(2, 2, 27, 10, T.SNOW);
  b.vline(15, 3, 28, T.PATH); b.vline(16, 3, 28, T.PATH);
  b.hline(22, 5, 16, T.PATH); b.hline(23, 5, 16, T.PATH);
  b.vline(5, 14, 23, T.PATH); b.vline(6, 14, 23, T.PATH);
  b.hline(14, 5, 12, T.PATH); b.hline(15, 5, 12, T.PATH);
  b.hline(12, 15, 25, T.PATH); b.hline(13, 15, 25, T.PATH);
  b.vline(24, 6, 13, T.PATH); b.vline(25, 6, 13, T.PATH);
  b.hline(6, 16, 25, T.PATH); b.hline(7, 16, 25, T.PATH);
  b.rect(8, 16, 13, 21, T.CAVEG);
  b.rect(19, 15, 26, 21, T.CAVEG);
  b.rect(8, 24, 13, 27, T.CAVEG);
  b.rect(19, 24, 26, 27, T.CAVEG);
  b.rect(3, 3, 12, 5, T.ICE);
  b.scatter(T.ROCK, 24, T.CAVE);
  b.scatter(T.ROCK, 10, T.SNOW);
  b.rect(14, 2, 18, 3, T.SNOW);
  b.at(14, 2, T.SHRINE); b.at(18, 2, T.SHRINE);
  b.hline(29, 15, 16, T.PATH); b.hline(28, 15, 16, T.PATH);
  b.at(13, 27, T.SIGN);
  defMap('mountain', {
    name: '雷鳴の山道', w: 30, h: 30, t: b.t, bgm: 'mountain',
    enc: { rate: .14, table: [[16, 20, 24, 20], [14, 20, 24, 18], [28, 21, 24, 14],
                              [29, 22, 25, 12], [31, 22, 25, 12], [11, 20, 23, 12],
                              [13, 22, 25, 8], [32, 26, 28, 4]] },
    warps: [{ x: 15, y: 29, to: 'forest', tx: 20, ty: 3, dir: 'down' },
            { x: 16, y: 29, to: 'forest', tx: 21, ty: 3, dir: 'down' },
            { x: 15, y: 2, to: 'temple', tx: 15, ty: 26, dir: 'up', need: 'badge4',
              needMsg: '闇の神殿の 門は かたく とじている。\n4つの バッジの 光が 必要だ…' },
            { x: 16, y: 2, to: 'temple', tx: 16, ty: 26, dir: 'up', need: 'badge4',
              needMsg: '闇の神殿の 門は かたく とじている。\n4つの バッジの 光が 必要だ…' }],
    npcs: [
      { x: 15, y: 24, dir: 'down', look: LOOK.hiker, name: 'やまおとこ イワオ',
        lines: ['この先は 雷が おちる。\n覚悟が あるやつだけ 通れ！'],
        trainer: { id: 't8', team: [[17, 23], [29, 23]], money: 1600,
          win: 'ぬぅ… 見上げた やつだ。' } },
      { x: 24, y: 10, dir: 'down', look: LOOK.girl, name: 'たんけんか ミオ',
        lines: ['山の 電気は ビリビリ するわ！'],
        trainer: { id: 't9', team: [[15, 24], [13, 24]], money: 1700,
          win: 'しびれる 強さね…' } },
      { x: 6, y: 18, dir: 'right', look: LOOK.dark, name: 'やみのしもべ',
        lines: ['ノクス様が 目覚める。\nここで 消えてもらう！'],
        trainer: { id: 't10', team: [[19, 24], [31, 24], [23, 25]], money: 2000,
          win: 'ばかな… 光など…！' } },
      { x: 20, y: 5, dir: 'left', look: LOOK.old, name: 'せんにん',
        lines: ['よくぞ ここまで 来た。\nこれを 持っていくがよい。'],
        give: { item: 'ball3', n: 5, flag: 'gift_ball3' } },
      { x: 16, y: 4, dir: 'down', look: LOOK.gym4, name: 'ライガ', id: 'leader4',
        special: 'leader', badge: 'badge4', badgeName: 'ボルトバッジ',
        lines: ['ここまで 来たか 若き トレーナー！\nおれは 山の 番人 ライガ！',
                '闇の神殿へ 行くなら\nおれの 雷を 受けてから 行け！'],
        trainer: { id: 'leader4', team: [[15, 26], [13, 27], [32, 29]], money: 6000,
          win: 'ハハハ！ しびれたぞ！\n神殿の 扉は もう 開いている！' },
        after: '闇の神殿の 奥に ノクスがいる。\n世界を たのんだぞ！',
        reward: { item: 'full', n: 3 } }
    ],
    signs: { '13,27': '『雷鳴の山道』\nこの先 落雷注意' }
  });
}

/* =========================================================
   12. 闇の神殿（ラストダンジョン）
   ========================================================= */
{
  const b = new MB(30, 28, T.CWALL);
  b.rect(2, 2, 27, 25, T.CAVE);
  b.vline(15, 3, 26, T.PATH); b.vline(16, 3, 26, T.PATH);
  b.rect(4, 4, 11, 10, T.CAVEG);
  b.rect(19, 4, 26, 10, T.CAVEG);
  b.rect(4, 14, 11, 22, T.CAVEG);
  b.rect(19, 14, 26, 22, T.CAVEG);
  b.hline(12, 3, 27, T.PATH); b.hline(13, 3, 27, T.PATH);
  b.hline(22, 3, 27, T.PATH); b.hline(23, 3, 27, T.PATH);
  b.vline(3, 12, 23, T.PATH); b.vline(27, 12, 23, T.PATH);
  b.scatter(T.CWALL, 26, T.CAVE);
  b.rect(10, 2, 20, 6, T.CAVE);
  b.rect(12, 2, 18, 2, T.SHRINE);
  b.rect(11, 3, 12, 4, T.SHRINE); b.rect(18, 3, 19, 4, T.SHRINE);
  b.vline(15, 2, 6, T.PATH); b.vline(16, 2, 6, T.PATH);
  b.at(14, 3, T.SHRINE); b.at(17, 3, T.SHRINE);
  b.hline(9, 2, 27, T.CWALL);                   // 上層への関門（通れるのは x=16 のみ）
  b.at(16, 9, T.PATH);
  b.at(15, 8, T.CWALL); b.at(15, 4, T.CWALL);   // ライバル／ノクスが道をふさぐ
  b.hline(27, 15, 16, T.PATH); b.hline(26, 15, 16, T.PATH);
  defMap('temple', {
    name: '闇の神殿', w: 30, h: 28, t: b.t, bgm: 'temple', dark: true,
    enc: { rate: .15, table: [[18, 26, 30, 18], [33, 26, 30, 16], [19, 28, 32, 12],
                              [34, 29, 32, 8], [31, 27, 30, 14], [23, 28, 31, 12],
                              [6, 28, 30, 6], [9, 28, 30, 6], [3, 28, 30, 6]] },
    warps: [{ x: 15, y: 27, to: 'mountain', tx: 15, ty: 3, dir: 'down' },
            { x: 16, y: 27, to: 'mountain', tx: 16, ty: 3, dir: 'down' }],
    npcs: [
      { x: 16, y: 20, dir: 'down', look: LOOK.dark, name: 'しんかん ヨル',
        lines: ['光を もつ者よ。\nここから 先は 闇の領域。'],
        trainer: { id: 't11', team: [[19, 29], [34, 29]], money: 3000,
          win: '…この 神殿でさえ\nお前を 止められぬのか。' } },
      { x: 8, y: 12, dir: 'down', look: LOOK.dark, name: 'しんかん シノ',
        lines: ['引き返すなら 今のうちだ！'],
        trainer: { id: 't12', team: [[23, 29], [31, 29], [6, 30]], money: 3200,
          win: 'ノクス様… おゆるしを…' } },
      { x: 16, y: 8, dir: 'down', look: LOOK.rival, name: 'カイ', id: 'rival4',
        special: 'rival4', gone: 'rival4' },
      { x: 16, y: 4, dir: 'down', look: LOOK.boss, name: 'やみの王 ノクス', id: 'boss',
        special: 'boss', gone: 'bossdone' },
      { x: 15, y: 3, dir: 'down', look: LOOK.lumi, name: '？？？', id: 'lumina',
        special: 'lumina', hideUntil: 'bossdone' }
    ],
    signs: {}
  });
}

/* =========================================================
   13. ヒーリングセンター（共通室内）
   ========================================================= */
{
  const b = new MB(13, 10, T.WALL);
  b.room(1, 1, 11, 8);
  b.at(6, 9, T.DOOR);
  b.rect(4, 3, 8, 3, T.COUNTER);
  b.rect(1, 6, 2, 7, T.COUNTER); b.rect(10, 6, 11, 7, T.COUNTER);
  defMap('center', {
    name: 'ヒーリングセンター', w: 13, h: 10, t: b.t, indoor: true, bgm: 'center',
    warps: [{ x: 6, y: 9, to: '@back' }],
    npcs: [
      { x: 6, y: 2, dir: 'down', look: LOOK.nurse, name: 'ヒーラー', special: 'nurse' },
      { x: 3, y: 7, dir: 'up', look: LOOK.boy, name: 'たびびと',
        lines: ['ここは タダで 回復できる。\nありがたいねえ。'] }
    ],
    signs: {}
  });
}

/* =========================================================
   14. マナショップ（共通室内）
   ========================================================= */
{
  const b = new MB(13, 10, T.WALL);
  b.room(1, 1, 11, 8);
  b.at(6, 9, T.DOOR);
  b.rect(2, 3, 6, 3, T.COUNTER);
  b.rect(9, 2, 11, 5, T.COUNTER);
  defMap('mart', {
    name: 'マナショップ', w: 13, h: 10, t: b.t, indoor: true, bgm: 'center',
    warps: [{ x: 6, y: 9, to: '@back' }],
    npcs: [
      { x: 4, y: 2, dir: 'down', look: LOOK.clerk, name: 'てんいん', special: 'shop' },
      { x: 8, y: 7, dir: 'left', look: LOOK.girl, name: 'きゃく',
        lines: ['げんきのかけらは 高いけど\n持っておくと 安心よ。'] }
    ],
    signs: {}
  });
}

/* ---------------- ショップ品ぞろえ ---------------- */
const SHOPS = {
  1: ['ball1', 'ball2', 'potion', 'potion2', 'antidote', 'paralyz', 'awake', 'burnheal'],
  2: ['ball1', 'ball2', 'potion', 'potion2', 'potion3', 'allcure', 'revive', 'xatk', 'xdef'],
  3: ['ball2', 'ball3', 'potion2', 'potion3', 'full', 'allcure', 'revive', 'xatk', 'xdef', 'xspd', 'candy']
};
function shopStock(n) {
  const g = window.game;
  if (g && g.flags.badge3) return SHOPS[3];
  if (g && g.flags.badge2) return SHOPS[2];
  return SHOPS[n] || SHOPS[1];
}
