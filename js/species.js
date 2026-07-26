/* =========================================================
   species.js — マナビースト図鑑（全36種）
   art: { arch:体型, s:大きさ, eyeStyle, mouth, crest, horn, accent }
   ========================================================= */

const SPECIES = {};
function S(id, o) { o.id = id; SPECIES[id] = o; }

/* --- 001-003 くさ 御三家 --- */
S(1, {
  no: 1, name: 'リフィー', type1: 'grass', cry: 220,
  base: { hp: 46, atk: 49, def: 49, spd: 45 }, rate: 45, xp: 64, evo: { lv: 16, to: 2 },
  art: { arch: 'plant', s: .82, eyeStyle: 'round', accent: '#8ee06a' },
  learn: [[1, 'tackle'], [1, 'vine'], [5, 'growl'], [9, 'absorb'], [13, 'razor'],
          [18, 'harden'], [23, 'megadr'], [29, 'slam'], [36, 'solar']],
  info: '若葉のかおりがする小さなマナビースト。日なたでうたた寝するのが好き。'
});
S(2, {
  no: 2, name: 'リーフォン', type1: 'grass', cry: 200,
  base: { hp: 62, atk: 65, def: 66, spd: 60 }, rate: 22, xp: 142, evo: { lv: 32, to: 3 },
  art: { arch: 'beast', s: .95, eyeStyle: 'round', horn: true, accent: '#8ee06a' },
  learn: [[1, 'vine'], [1, 'razor'], [16, 'harden'], [20, 'megadr'], [26, 'bite'],
          [32, 'slam'], [38, 'sharpen'], [44, 'solar']],
  info: '背中の若葉が日光をたくわえる。走るとあまい香りが風にのる。'
});
S(3, {
  no: 3, name: 'フォレスタ', type1: 'grass', type2: 'earth', cry: 150,
  base: { hp: 84, atk: 88, def: 92, spd: 78 }, rate: 12, xp: 245, evo: null,
  art: { arch: 'dragon', s: 1.05, eyeStyle: 'sharp', accent: '#3f8f3a' },
  learn: [[1, 'megadr'], [1, 'razor'], [1, 'quake'], [34, 'harden'], [40, 'ram'],
          [46, 'solar'], [52, 'rest']],
  info: '森そのものが立ち上がった姿ともいわれる。守りぬく心が力に変わる。'
});

/* --- 004-006 ほのお 御三家 --- */
S(4, {
  no: 4, name: 'ポワニャ', type1: 'fire', cry: 300,
  base: { hp: 43, atk: 54, def: 42, spd: 58 }, rate: 45, xp: 64, evo: { lv: 16, to: 5 },
  art: { arch: 'feline', s: .82, eyeStyle: 'round', accent: '#ffd27a' },
  learn: [[1, 'scratch'], [1, 'ember'], [5, 'growl'], [10, 'quick'], [14, 'firefang'],
          [19, 'sharpen'], [24, 'flame'], [30, 'slam'], [37, 'burst']],
  info: 'しっぽの先に小さな火が灯る子ねこ。ごきげんだと火の粉がはねる。'
});
S(5, {
  no: 5, name: 'フレイニャ', type1: 'fire', cry: 270,
  base: { hp: 58, atk: 72, def: 56, spd: 78 }, rate: 22, xp: 142, evo: { lv: 32, to: 6 },
  art: { arch: 'feline', s: 1.0, eyeStyle: 'sharp', accent: '#ffb03a' },
  learn: [[1, 'ember'], [1, 'quick'], [16, 'firefang'], [21, 'sharpen'], [27, 'flame'],
          [33, 'agility'], [39, 'ram'], [45, 'burst']],
  info: '走ったあとに炎の足あとが残る。とても気位が高い。'
});
S(6, {
  no: 6, name: 'バーンリオ', type1: 'fire', type2: 'dark', cry: 180,
  base: { hp: 78, atk: 100, def: 72, spd: 96 }, rate: 12, xp: 245, evo: null,
  art: { arch: 'beast', s: 1.1, eyeStyle: 'sharp', horn: true, accent: '#ff8a2a' },
  learn: [[1, 'flame'], [1, 'firefang'], [1, 'shadow'], [34, 'agility'], [40, 'darkness'],
          [47, 'burst'], [53, 'ram']],
  info: 'たてがみが陽炎のようにゆらぐ。ひと吠えで岩が赤く焼ける。'
});

/* --- 007-009 みず 御三家 --- */
S(7, {
  no: 7, name: 'アクアト', type1: 'water', cry: 260,
  base: { hp: 48, atk: 46, def: 54, spd: 45 }, rate: 45, xp: 64, evo: { lv: 16, to: 8 },
  art: { arch: 'blob', s: .85, eyeStyle: 'round', crest: true, accent: '#bff0ff' },
  learn: [[1, 'tackle'], [1, 'bubble'], [6, 'harden'], [10, 'aqjet'], [15, 'mist'],
          [20, 'surf'], [26, 'bite'], [32, 'slam'], [38, 'hydro']],
  info: '澄んだ水でできたからだ。よろこぶと頭のしずくがぷるぷる揺れる。'
});
S(8, {
  no: 8, name: 'マリノス', type1: 'water', cry: 230,
  base: { hp: 66, atk: 62, def: 72, spd: 58 }, rate: 22, xp: 142, evo: { lv: 34, to: 9 },
  art: { arch: 'fish', s: 1.0, eyeStyle: 'round', accent: '#9adcff' },
  learn: [[1, 'bubble'], [1, 'aqjet'], [16, 'mist'], [22, 'surf'], [28, 'bite'],
          [34, 'slam'], [40, 'hydro'], [46, 'rest']],
  info: '海流にのって遠くまで旅をする。歌うような鳴き声で仲間を呼ぶ。'
});
S(9, {
  no: 9, name: 'リヴァイア', type1: 'water', type2: 'wind', cry: 140,
  base: { hp: 90, atk: 84, def: 90, spd: 82 }, rate: 12, xp: 245, evo: null,
  art: { arch: 'serpent', s: 1.1, eyeStyle: 'sharp', accent: '#5fe0e0' },
  learn: [[1, 'surf'], [1, 'aqjet'], [1, 'gust'], [36, 'airslash'], [42, 'mist'],
          [48, 'hydro'], [54, 'tempest']],
  info: '大海をひとまたぎする巨大な蛇。とぐろを解けば嵐が生まれる。'
});

/* --- 010-012 序盤ノーマル・鳥 --- */
S(10, {
  no: 10, name: 'ノミィ', type1: 'none', cry: 380,
  base: { hp: 40, atk: 46, def: 36, spd: 62 }, rate: 255, xp: 40, evo: { lv: 18, to: 11 },
  art: { arch: 'beast', s: .7, eyeStyle: 'round', accent: '#e8dcc0' },
  learn: [[1, 'tackle'], [1, 'growl'], [6, 'quick'], [11, 'bite'], [17, 'sharpen'], [24, 'slam']],
  info: 'どこにでもいる小さなけもの。人なつっこく、荷物をあさる。'
});
S(11, {
  no: 11, name: 'ノミラット', type1: 'none', cry: 320,
  base: { hp: 62, atk: 74, def: 56, spd: 88 }, rate: 90, xp: 128, evo: null,
  art: { arch: 'beast', s: .95, eyeStyle: 'sharp', accent: '#cfc0a0' },
  learn: [[1, 'quick'], [1, 'bite'], [18, 'sharpen'], [24, 'slam'], [31, 'agility'], [38, 'ram']],
  info: '前歯は鉄をも噛みちぎる。群れの結束はとても固い。'
});
S(12, {
  no: 12, name: 'ピュル', type1: 'wind', cry: 400,
  base: { hp: 42, atk: 48, def: 40, spd: 66 }, rate: 200, xp: 46, evo: { lv: 20, to: 13 },
  art: { arch: 'bird', s: .78, eyeStyle: 'round', crest: true, accent: '#c8f4ee' },
  learn: [[1, 'tackle'], [1, 'gust'], [7, 'quick'], [12, 'sandatk'], [18, 'airslash'], [25, 'feather']],
  info: '風をよむのが得意な小鳥。旅人の頭にとまってついてくる。'
});
S(13, {
  no: 13, name: 'ソアリオ', type1: 'wind', type2: 'none', cry: 300,
  base: { hp: 68, atk: 78, def: 62, spd: 96 }, rate: 70, xp: 155, evo: null,
  art: { arch: 'bird', s: 1.05, eyeStyle: 'sharp', crest: true, accent: '#a0e8ff' },
  learn: [[1, 'gust'], [1, 'quick'], [20, 'airslash'], [26, 'agility'], [33, 'feather'],
          [40, 'ram'], [47, 'tempest']],
  info: '雲より高く舞う。翼のひとふりで小舟がひっくり返る。'
});

/* --- 014-015 でんき --- */
S(14, {
  no: 14, name: 'ビリット', type1: 'bolt', cry: 420,
  base: { hp: 44, atk: 52, def: 42, spd: 72 }, rate: 150, xp: 62, evo: { lv: 22, to: 15 },
  art: { arch: 'blob', s: .8, eyeStyle: 'round', crest: true, accent: '#fff0a0' },
  learn: [[1, 'tackle'], [1, 'spark'], [8, 'wave'], [13, 'quick'], [19, 'boltfang'],
          [25, 'agility'], [31, 'thunder']],
  info: '静電気のかたまり。さわるとバチッとくるが、悪気はない。'
});
S(15, {
  no: 15, name: 'ボルテック', type1: 'bolt', cry: 260,
  base: { hp: 66, atk: 82, def: 62, spd: 100 }, rate: 60, xp: 168, evo: null,
  art: { arch: 'humanoid', s: 1.0, eyeStyle: 'glow', crest: true, accent: '#ffe95e' },
  learn: [[1, 'spark'], [1, 'wave'], [22, 'boltfang'], [28, 'agility'], [34, 'thunder'],
          [42, 'focus'], [49, 'plasma']],
  info: '体内で雷を練りあげる。近づくと髪がさかだつ。'
});

/* --- 016-017 じめん --- */
S(16, {
  no: 16, name: 'イワゴロ', type1: 'earth', cry: 160,
  base: { hp: 56, atk: 62, def: 78, spd: 26 }, rate: 150, xp: 66, evo: { lv: 24, to: 17 },
  art: { arch: 'rock', s: .85, eyeStyle: 'glow', accent: '#a8a09a' },
  learn: [[1, 'tackle'], [1, 'pebble'], [8, 'harden'], [14, 'sandatk'], [20, 'slam'], [27, 'quake']],
  info: '道ばたの岩にまぎれている。ころがって移動する。'
});
S(17, {
  no: 17, name: 'ロックガイ', type1: 'earth', cry: 110,
  base: { hp: 82, atk: 92, def: 116, spd: 34 }, rate: 55, xp: 180, evo: null,
  art: { arch: 'rock', s: 1.15, eyeStyle: 'glow', accent: '#8f8880' },
  learn: [[1, 'pebble'], [1, 'harden'], [24, 'quake'], [31, 'slam'], [38, 'focus'],
          [45, 'ram'], [52, 'crush']],
  info: '山ひとつぶんの記憶をもつ。動きは遅いが決して倒れない。'
});

/* --- 018-019 やみ --- */
S(18, {
  no: 18, name: 'シャドル', type1: 'dark', cry: 340,
  base: { hp: 46, atk: 58, def: 44, spd: 64 }, rate: 130, xp: 70, evo: { lv: 28, to: 19 },
  art: { arch: 'ghost', s: .82, eyeStyle: 'glow', accent: '#c9a8ff' },
  learn: [[1, 'shadow'], [1, 'growl'], [9, 'bite'], [15, 'curse'], [22, 'darkness'], [29, 'nightmare']],
  info: '影から生まれた小さないたずら者。人のかげにまぎれて笑う。'
});
S(19, {
  no: 19, name: 'ナイトメア', type1: 'dark', cry: 150,
  base: { hp: 74, atk: 94, def: 70, spd: 88 }, rate: 45, xp: 192, evo: null,
  art: { arch: 'ghost', s: 1.15, eyeStyle: 'glow', accent: '#a56cff' },
  learn: [[1, 'shadow'], [1, 'darkness'], [28, 'curse'], [34, 'nightmare'], [41, 'agility'], [48, 'abyss']],
  info: '悪夢をたべて力にする。出会った者は昨夜の夢を思い出せない。'
});

/* --- 020-021 ひかり --- */
S(20, {
  no: 20, name: 'ヒカリム', type1: 'light', cry: 440,
  base: { hp: 50, atk: 50, def: 52, spd: 58 }, rate: 120, xp: 72, evo: { lv: 30, to: 21 },
  art: { arch: 'orb', s: .8, eyeStyle: 'glow', accent: '#fff6c8' },
  learn: [[1, 'lumen'], [1, 'harden'], [10, 'flashb'], [17, 'bless'], [24, 'focus'], [31, 'saintray']],
  info: '朝いちばんの光が固まって生まれる。そばにいると心が落ち着く。'
});
S(21, {
  no: 21, name: 'セラフィム', type1: 'light', type2: 'wind', cry: 200,
  base: { hp: 82, atk: 82, def: 86, spd: 86 }, rate: 40, xp: 205, evo: null,
  art: { arch: 'humanoid', s: 1.1, eyeStyle: 'glow', crest: true, accent: '#fff0b0' },
  learn: [[1, 'lumen'], [1, 'flashb'], [1, 'gust'], [30, 'bless'], [36, 'airslash'],
          [43, 'saintray'], [50, 'tempest']],
  info: '六枚の光の羽をもつ。祈りの声にこたえて舞い降りるという。'
});

/* --- 022-023 みず（魚） --- */
S(22, {
  no: 22, name: 'スイミィ', type1: 'water', cry: 360,
  base: { hp: 44, atk: 56, def: 40, spd: 60 }, rate: 190, xp: 52, evo: { lv: 26, to: 23 },
  art: { arch: 'fish', s: .75, eyeStyle: 'round', accent: '#8ff0d8' },
  learn: [[1, 'bubble'], [1, 'tackle'], [7, 'aqjet'], [13, 'bite'], [20, 'surf'], [26, 'sandatk']],
  info: '川の浅瀬で群れをつくる。逃げ足だけは一人前。'
});
S(23, {
  no: 23, name: 'サメイル', type1: 'water', type2: 'dark', cry: 130,
  base: { hp: 76, atk: 100, def: 66, spd: 82 }, rate: 50, xp: 185, evo: null,
  art: { arch: 'fish', s: 1.15, eyeStyle: 'sharp', accent: '#4a6a9a' },
  learn: [[1, 'aqjet'], [1, 'bite'], [26, 'shadow'], [32, 'surf'], [39, 'darkness'],
          [46, 'ram'], [52, 'hydro']],
  info: '深い湖の主。銀のヒレが月光を切りさく。'
});

/* --- 024-025 くさ（花） --- */
S(24, {
  no: 24, name: 'ツボミン', type1: 'grass', cry: 350,
  base: { hp: 52, atk: 44, def: 56, spd: 42 }, rate: 170, xp: 58, evo: { lv: 20, to: 25 },
  art: { arch: 'plant', s: .8, eyeStyle: 'closed', accent: '#ff9ac8' },
  learn: [[1, 'absorb'], [1, 'growl'], [8, 'toxspore'], [14, 'razor'], [20, 'spore'], [27, 'megadr']],
  info: 'まだ花はひらかない。夜になると小さな寝息が聞こえる。'
});
S(25, {
  no: 25, name: 'ブルーメ', type1: 'grass', type2: 'light', cry: 240,
  base: { hp: 76, atk: 68, def: 82, spd: 62 }, rate: 60, xp: 172, evo: null,
  art: { arch: 'plant', s: 1.1, eyeStyle: 'closed', crest: true, accent: '#ff7ab8' },
  learn: [[1, 'megadr'], [1, 'spore'], [20, 'lumen'], [27, 'bless'], [34, 'flashb'],
          [41, 'solar'], [48, 'saintray']],
  info: '満開の花から光の花粉をまく。花粉をあびると傷が癒える。'
});

/* --- 026-027 むし系（風・地） --- */
S(26, {
  no: 26, name: 'パピヨ', type1: 'wind', cry: 390,
  base: { hp: 42, atk: 40, def: 46, spd: 58 }, rate: 200, xp: 44, evo: { lv: 18, to: 27 },
  art: { arch: 'bug', s: .78, eyeStyle: 'round', accent: '#b8f0d8' },
  learn: [[1, 'tackle'], [1, 'gust'], [6, 'harden'], [12, 'toxspore'], [18, 'airslash']],
  info: 'まだ飛ぶのが下手で、よく葉っぱにぶつかる。'
});
S(27, {
  no: 27, name: 'モルフォ', type1: 'wind', type2: 'grass', cry: 280,
  base: { hp: 68, atk: 64, def: 68, spd: 92 }, rate: 70, xp: 160, evo: null,
  art: { arch: 'moth', s: 1.05, eyeStyle: 'round', accent: '#7ee0ff' },
  learn: [[1, 'gust'], [1, 'toxspore'], [18, 'airslash'], [24, 'spore'], [30, 'megadr'],
          [38, 'agility'], [46, 'tempest']],
  info: '虹色の翅は見る角度で色が変わる。鱗粉はねむりを誘う。'
});
S(28, {
  no: 28, name: 'ハガネムシ', type1: 'earth', type2: 'none', cry: 210,
  base: { hp: 66, atk: 84, def: 96, spd: 50 }, rate: 80, xp: 158, evo: null,
  art: { arch: 'bug', s: 1.05, eyeStyle: 'sharp', accent: '#9aa8b8' },
  learn: [[1, 'pebble'], [1, 'harden'], [16, 'bite'], [23, 'focus'], [30, 'quake'],
          [38, 'slam'], [46, 'crush']],
  info: '鋼のような外殻をもつ。角で岩を割って寝床にする。'
});

/* --- 029-031 ほのお／みず／じめんの中堅 --- */
S(29, {
  no: 29, name: 'マグマル', type1: 'fire', type2: 'earth', cry: 190,
  base: { hp: 72, atk: 88, def: 82, spd: 48 }, rate: 70, xp: 170, evo: null,
  art: { arch: 'rock', s: 1.05, eyeStyle: 'glow', accent: '#ff8a3a' },
  learn: [[1, 'ember'], [1, 'pebble'], [18, 'harden'], [25, 'flame'], [32, 'quake'],
          [40, 'willowisp'], [48, 'burst']],
  info: '溶岩がかたまってできた体。夜になるとひび割れが赤く光る。'
});
S(30, {
  no: 30, name: 'コオリム', type1: 'water', type2: 'wind', cry: 330,
  base: { hp: 64, atk: 62, def: 78, spd: 74 }, rate: 80, xp: 162, evo: null,
  art: { arch: 'orb', s: .95, eyeStyle: 'round', accent: '#d8f8ff' },
  learn: [[1, 'bubble'], [1, 'gust'], [16, 'mist'], [23, 'airslash'], [30, 'surf'],
          [38, 'feather'], [46, 'hydro']],
  info: '山の湧き水から生まれる。まわりの空気がひんやりする。'
});
S(31, {
  no: 31, name: 'サンドラ', type1: 'earth', type2: 'dark', cry: 175,
  base: { hp: 70, atk: 90, def: 70, spd: 78 }, rate: 70, xp: 168, evo: null,
  art: { arch: 'serpent', s: 1.0, eyeStyle: 'sharp', accent: '#d8b878' },
  learn: [[1, 'sandatk'], [1, 'bite'], [18, 'pebble'], [26, 'shadow'], [33, 'quake'],
          [41, 'darkness'], [49, 'crush']],
  info: '砂の下に身をひそめる。獲物の足音を鱗で聞きわける。'
});

/* --- 032-034 上位・準伝説 --- */
S(32, {
  no: 32, name: 'ライガル', type1: 'bolt', type2: 'none', cry: 120,
  base: { hp: 88, atk: 104, def: 78, spd: 104 }, rate: 25, xp: 230, evo: null,
  art: { arch: 'beast', s: 1.15, eyeStyle: 'sharp', horn: true, accent: '#ffe95e' },
  learn: [[1, 'boltfang'], [1, 'quick'], [30, 'thunder'], [37, 'agility'], [44, 'ram'],
          [50, 'plasma'], [56, 'focus']],
  info: '雷雲とともに現れる獣。走った跡には焦げた足あとだけが残る。'
});
S(33, {
  no: 33, name: 'ゴスト', type1: 'dark', type2: 'wind', cry: 300,
  base: { hp: 56, atk: 70, def: 52, spd: 86 }, rate: 90, xp: 150, evo: { lv: 30, to: 34 },
  art: { arch: 'ghost', s: .9, eyeStyle: 'glow', accent: '#9adcff' },
  learn: [[1, 'shadow'], [1, 'gust'], [14, 'curse'], [21, 'airslash'], [28, 'darkness']],
  info: '夜霧といっしょに漂う。話しかけるとうれしそうに揺れる。'
});
S(34, {
  no: 34, name: 'ファントム', type1: 'dark', type2: 'wind', cry: 130,
  base: { hp: 80, atk: 96, def: 74, spd: 108 }, rate: 35, xp: 218, evo: null,
  art: { arch: 'ghost', s: 1.2, eyeStyle: 'glow', accent: '#7ee0ff' },
  learn: [[1, 'darkness'], [1, 'airslash'], [30, 'nightmare'], [37, 'agility'],
          [44, 'tempest'], [51, 'abyss']],
  info: '風より速く音もなく現れる。その姿を見た者は数えるほどしかいない。'
});

/* --- 035-036 伝説 --- */
S(35, {
  no: 35, name: 'ルミナ', type1: 'light', cry: 500,
  base: { hp: 100, atk: 100, def: 100, spd: 100 }, rate: 6, xp: 320, evo: null,
  art: { arch: 'orb', s: 1.2, eyeStyle: 'glow', accent: '#fffbe0' },
  learn: [[1, 'saintray'], [1, 'bless'], [1, 'flashb'], [45, 'focus'], [50, 'agility'], [55, 'tempest']],
  info: '世界にひとつだけの光のかけら。闇を照らすために生まれたという。'
});
S(36, {
  no: 36, name: 'ノクスドラゴン', type1: 'dark', type2: 'fire', cry: 90,
  base: { hp: 112, atk: 118, def: 100, spd: 92 }, rate: 3, xp: 400, evo: null,
  art: { arch: 'dragon', s: 1.25, eyeStyle: 'glow', accent: '#6a3aa8' },
  learn: [[1, 'abyss'], [1, 'burst'], [1, 'nightmare'], [1, 'darkness'], [50, 'agility'], [58, 'ram']],
  info: '世界を影に沈めるといわれる古き竜。その咆哮は星をも震わせる。'
});

const SPECIES_LIST = Object.values(SPECIES).sort((a, b) => a.no - b.no);

/* ---------------- 個体生成 ---------------- */
let _uidSeq = 1;
function makeMon(spId, lv, opt) {
  const sp = SPECIES[spId];
  const st = calcStats(sp, lv);
  // 覚えているわざ = そのレベルまでに覚える最後の4つ
  let pool = sp.learn.filter(l => l[0] <= lv).map(l => l[1]);
  pool = pool.filter((v, i) => pool.indexOf(v) === i);
  const moves = pool.slice(-4).map(id => ({ id, pp: MOVES[id].pp, max: MOVES[id].pp }));
  if (moves.length === 0) moves.push({ id: 'tackle', pp: 35, max: 35 });
  return Object.assign({
    uid: _uidSeq++, sp: spId, lv, xp: 0, hp: st.hp, max: st.hp,
    atk: st.atk, def: st.def, spd: st.spd, moves, st: null, slpT: 0,
    nick: null, met: opt && opt.met || null
  }, opt || {});
}
function monName(m) { return m.nick || SPECIES[m.sp].name; }
function refreshStats(m) {
  const st = calcStats(SPECIES[m.sp], m.lv);
  const diff = st.hp - m.max;
  m.max = st.hp; m.hp = Math.min(m.max, m.hp + Math.max(0, diff));
  m.atk = st.atk; m.def = st.def; m.spd = st.spd;
}
