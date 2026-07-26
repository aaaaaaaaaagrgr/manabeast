/* =========================================================
   data.js — 属性 / 相性 / わざ / どうぐ
   ========================================================= */

const TYPES = {
  fire:  { name: '炎',  color: '#f4703a' },
  water: { name: '水',  color: '#46a6f2' },
  grass: { name: '草',  color: '#5cc455' },
  bolt:  { name: '雷',  color: '#f5d43a' },
  earth: { name: '地',  color: '#b5824e' },
  wind:  { name: '風',  color: '#7ed8cf' },
  light: { name: '光',  color: '#ffe38f' },
  dark:  { name: '闇',  color: '#8a63d2' },
  none:  { name: '無',  color: '#c9c1b0' }
};

// 攻撃側 → { 防御側: 倍率 }（記載なしは1.0）
const CHART = {
  fire:  { grass: 2, water: .5, fire: .5, earth: .5, wind: .5 },
  water: { fire: 2, earth: 2, water: .5, grass: .5, bolt: .5 },
  grass: { water: 2, earth: 2, fire: .5, grass: .5, wind: .5, dark: .5 },
  bolt:  { water: 2, wind: 2, earth: .5, grass: .5, bolt: .5 },
  earth: { bolt: 2, fire: 2, grass: .5, wind: .5 },
  wind:  { earth: 2, grass: 2, fire: .5, bolt: .5, wind: .5 },
  light: { dark: 2, light: .5, none: 1 },
  dark:  { light: 2, dark: .5 },
  none:  { earth: .5 }
};

function effect(atkType, d1, d2) {
  const c = CHART[atkType] || {};
  let m = (c[d1] === undefined ? 1 : c[d1]);
  if (d2) m *= (c[d2] === undefined ? 1 : c[d2]);
  return m;
}

/* ---------------- 状態異常 ---------------- */
const STATUS = {
  psn: { name: 'どく', short: 'ドク', color: '#a86cd8' },
  par: { name: 'まひ', short: 'マヒ', color: '#e8d24a' },
  slp: { name: 'ねむり', short: 'ネムリ', color: '#8fa8c8' },
  brn: { name: 'やけど', short: 'ヤケド', color: '#e8703a' }
};

/* ---------------- わざ ----------------
   pw:威力 / ac:命中 / pp / pri:優先度
   fx: { st:状態異常, ch:確率, buf:[対象,能力,段階], drain:割合, heal:割合,
         recoil:割合, multi:[最小,最大], crit:追加急所率 }
------------------------------------------ */
const MOVES = {};
function M(id, name, type, pw, ac, pp, fx, pri, desc) {
  MOVES[id] = { id, name, type, pw, ac, pp, fx: fx || null, pri: pri || 0, desc: desc || '' };
}

// 無属性
M('tackle',   'たいあたり',     'none', 40, 100, 35, null, 0, 'からだをぶつけて攻撃する');
M('scratch',  'ひっかき',       'none', 45, 100, 30, null, 0, 'するどいツメでひっかく');
M('bite',     'かみつく',       'none', 62,  98, 20, { st: 'par', ch: 10 }, 0, 'まれにマヒさせる');
M('slam',     'のしかかり',     'none', 82,  92, 15, null, 0, '全体重をかけてのしかかる');
M('ram',      'すてみタックル', 'none', 105, 90, 10, { recoil: .28 }, 0, '反動ダメージを受ける');
M('quick',    'でんこうせっか', 'none', 42, 100, 25, null, 1, '必ず先制できる');
M('focus',    'しゅうちゅう',   'none',  0, 100, 20, { buf: ['self', 'crit', 1] }, 0, '急所に当たりやすくなる');
M('harden',   'かたくなる',     'none',  0, 100, 25, { buf: ['self', 'def', 1] }, 0, '防御を上げる');
M('growl',    'にらみつける',   'none',  0, 100, 25, { buf: ['foe', 'def', -1] }, 0, '相手の防御を下げる');
M('agility',  'こうそくいどう', 'none',  0, 100, 20, { buf: ['self', 'spd', 2] }, 0, '素早さを大きく上げる');
M('sharpen',  'つめとぎ',       'none',  0, 100, 20, { buf: ['self', 'atk', 1] }, 0, '攻撃を上げる');
M('rest',     'いやしのうた',   'none',  0, 100, 10, { heal: .5 }, 0, 'HPを半分回復する');

// 炎
M('ember',    'ひのこ',         'fire', 45, 100, 25, { st: 'brn', ch: 10 }, 0, 'まれにヤケドさせる');
M('flame',    'かえんほうしゃ', 'fire', 78,  98, 15, { st: 'brn', ch: 15 }, 0, '激しい炎を吹きつける');
M('burst',    'だいばくえん',   'fire', 112, 88,  6, { st: 'brn', ch: 20 }, 0, '灼熱の大爆発');
M('willowisp','おにび',         'fire',  0,  88, 15, { st: 'brn', ch: 100 }, 0, '必ずヤケドさせる');
M('firefang', 'ほのおのキバ',   'fire', 60,  96, 20, { st: 'brn', ch: 12 }, 0, '燃えるキバでかみつく');

// 水
M('bubble',   'みずでっぽう',   'water', 45, 100, 25, null, 0, '水を勢いよく発射する');
M('aqjet',    'アクアジェット', 'water', 44, 100, 20, null, 1, '水をまとって先制攻撃');
M('surf',     'なみのり',       'water', 78,  98, 15, null, 0, '大波で相手をおそう');
M('hydro',    'ハイドロブラスト','water',112, 86,  6, null, 0, '超高圧の水流を叩きつける');
M('mist',     'しろいきり',     'water',  0, 100, 20, { buf: ['self', 'def', 1] }, 0, '霧をまとい防御を上げる');

// 草
M('vine',     'つるのムチ',     'grass', 45, 100, 25, null, 0, 'つるでしなやかに打つ');
M('razor',    'はっぱカッター', 'grass', 60,  96, 22, { crit: 1 }, 0, '急所に当たりやすい');
M('absorb',   'すいとる',       'grass', 42, 100, 22, { drain: .5 }, 0, 'ダメージの半分を吸収');
M('megadr',   'メガドレイン',   'grass', 72,  96, 12, { drain: .5 }, 0, 'ダメージの半分を吸収');
M('solar',    'ソーラーブレイズ','grass',112, 88,  6, null, 0, '陽光を集めて撃ち出す');
M('spore',    'ねむりごな',     'grass',  0,  78, 12, { st: 'slp', ch: 100 }, 0, '相手をねむらせる');
M('toxspore', 'どくのこな',     'grass',  0,  86, 15, { st: 'psn', ch: 100 }, 0, '相手をどく状態にする');

// 雷
M('spark',    'でんげき',       'bolt', 45, 100, 25, { st: 'par', ch: 10 }, 0, 'まれにマヒさせる');
M('thunder',  'サンダーボルト', 'bolt', 78,  98, 15, { st: 'par', ch: 15 }, 0, '強い電撃を放つ');
M('plasma',   'プラズマストーム','bolt',112, 86,  6, { st: 'par', ch: 20 }, 0, '雷雲を呼び全てを撃つ');
M('wave',     'でんじは',       'bolt',  0,  90, 20, { st: 'par', ch: 100 }, 0, '必ずマヒさせる');
M('boltfang', 'かみなりのキバ', 'bolt', 60,  96, 20, { st: 'par', ch: 12 }, 0, '帯電したキバでかむ');

// 地
M('pebble',   'いしつぶて',     'earth', 46, 100, 25, null, 0, '小石を投げつける');
M('quake',    'じしん',         'earth', 88,  96, 10, null, 0, '大地を揺らして攻撃');
M('crush',    'グランドクラッシュ','earth',112,84, 6, null, 0, '巨岩ごと叩き潰す');
M('sandatk',  'すなかけ',       'earth',  0, 100, 20, { buf: ['foe', 'spd', -1] }, 0, '砂で相手の素早さを下げる');

// 風
M('gust',     'かぜおこし',     'wind', 45, 100, 25, null, 0, '突風を起こす');
M('airslash', 'エアスラッシュ', 'wind', 76,  96, 15, { crit: 1 }, 0, '風の刃で切り裂く');
M('tempest',  'テンペスト',     'wind', 112, 84,  6, null, 0, '嵐を呼び起こす');
M('feather',  'はねやすめ',     'wind',   0, 100, 10, { heal: .5 }, 0, 'HPを半分回復する');

// 光
M('lumen',    'ひかりのつぶて', 'light', 46, 100, 25, null, 0, '光の粒をぶつける');
M('flashb',   'フラッシュビーム','light',78,  98, 15, { buf: ['foe', 'atk', -1] }, 0, 'まぶしい光で攻撃を下げる');
M('saintray', 'セイントレイ',   'light', 112, 88,  6, null, 0, '聖なる光条を撃ち放つ');
M('bless',    'いやしのひかり', 'light',  0, 100, 10, { heal: .6, cure: true }, 0, 'HP回復＋状態異常を治す');

// 闇
M('shadow',   'かげうち',       'dark', 44, 100, 25, null, 1, '影から先制で切りつける');
M('darkness', 'ダークネス',     'dark', 78,  98, 15, { buf: ['foe', 'def', -1] }, 0, '闇で包み防御を下げる');
M('abyss',    'アビスゲート',   'dark', 112, 86,  6, null, 0, '深淵の門を開き飲み込む');
M('curse',    'のろい',         'dark',   0,  86, 12, { st: 'psn', ch: 100 }, 0, '呪いをかけてどくにする');
M('nightmare','ナイトメア',     'dark',  92,  90, 10, { drain: .35 }, 0, '悪夢を見せて力を吸う');

/* ---------------- どうぐ ---------------- */
const ITEMS = {
  potion:   { name: 'キズぐすり',       price: 250,  kind: 'heal',  amt: 40,  desc: 'HPを40かいふく' },
  potion2:  { name: 'いいキズぐすり',   price: 650,  kind: 'heal',  amt: 100, desc: 'HPを100かいふく' },
  potion3:  { name: 'すごいキズぐすり', price: 1400, kind: 'heal',  amt: 250, desc: 'HPを250かいふく' },
  full:     { name: 'まんたんドリンク', price: 2600, kind: 'heal',  amt: 9999, desc: 'HPを全かいふく' },
  antidote: { name: 'どくけし',         price: 180,  kind: 'cure',  st: 'psn', desc: 'どくを治す' },
  paralyz:  { name: 'まひなおし',       price: 180,  kind: 'cure',  st: 'par', desc: 'まひを治す' },
  awake:    { name: 'ねむけざまし',     price: 180,  kind: 'cure',  st: 'slp', desc: 'ねむりを治す' },
  burnheal: { name: 'やけどなおし',     price: 180,  kind: 'cure',  st: 'brn', desc: 'やけどを治す' },
  allcure:  { name: 'なんでもなおし',   price: 550,  kind: 'cure',  st: 'all', desc: '全ての状態異常を治す' },
  revive:   { name: 'げんきのかけら',   price: 1200, kind: 'revive',amt: .5,  desc: 'ひんしから半分回復' },
  ball1:    { name: 'クリスタル',       price: 200,  kind: 'ball',  rate: 1,   tier: 0, desc: 'マナビーストを捕まえる' },
  ball2:    { name: 'スーパークリスタル',price: 600, kind: 'ball',  rate: 1.6, tier: 1, desc: '捕まえやすいクリスタル' },
  ball3:    { name: 'ハイパークリスタル',price: 1200,kind: 'ball',  rate: 2.4, tier: 2, desc: 'とても捕まえやすい' },
  xatk:     { name: 'ちからのハチマキ', price: 500,  kind: 'buff', stat: 'atk', desc: '戦闘中こうげきを上げる' },
  xdef:     { name: 'まもりのおまもり', price: 500,  kind: 'buff', stat: 'def', desc: '戦闘中ぼうぎょを上げる' },
  xspd:     { name: 'はやてのハネ',     price: 500,  kind: 'buff', stat: 'spd', desc: '戦闘中すばやさを上げる' },
  candy:    { name: 'せいちょうのみ',   price: 4000, kind: 'candy', desc: 'レベルが1あがる' }
};

/* ---------------- 経験値 / ステータス計算 ---------------- */
function xpToNext(lv) { return Math.floor(14 + 7 * Math.pow(lv, 1.72)); }

function calcStats(sp, lv) {
  const b = sp.base;
  return {
    hp:  Math.floor(b.hp * 2 * lv / 100) + lv + 12,
    atk: Math.floor(b.atk * 2 * lv / 100) + 6,
    def: Math.floor(b.def * 2 * lv / 100) + 6,
    spd: Math.floor(b.spd * 2 * lv / 100) + 6
  };
}
