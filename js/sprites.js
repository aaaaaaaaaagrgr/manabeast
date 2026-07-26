/* =========================================================
   sprites.js  —  手描き素材ゼロのピクセルアート生成エンジン
   32x32 のインデックスバッファに図形を描き、
   自動でシェーディング＋アウトラインを付けて完成させる。
   ========================================================= */

// カラーインデックス
const C_BODY = 1, C_SHADE = 2, C_LIGHT = 3, C_ACC = 4, C_ACC2 = 5,
      C_EYE = 6, C_PUPIL = 7, C_LINE = 8, C_SHINE = 9;

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex2rgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgb2hex(r, g, b) {
  const f = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function shade(hex, amt) { // amt<1 暗く, >1 明るく
  const [r, g, b] = hex2rgb(hex);
  if (amt < 1) return rgb2hex(r * amt, g * amt, b * amt);
  return rgb2hex(r + (255 - r) * (amt - 1), g + (255 - g) * (amt - 1), b + (255 - b) * (amt - 1));
}
function mix(h1, h2, t) {
  const a = hex2rgb(h1), b = hex2rgb(h2);
  return rgb2hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

/* ---------------- ピクセルバッファ ---------------- */
class Px {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  ell(cx, cy, rx, ry, c) {
    if (rx <= 0 || ry <= 0) return;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
  }
  rect(x0, y0, x1, y1, c) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++)
      for (let x = Math.round(x0); x <= Math.round(x1); x++) this.set(x, y, c);
  }
  tri(ax, ay, bx, by, cx2, cy2, c) {
    const minx = Math.floor(Math.min(ax, bx, cx2)), maxx = Math.ceil(Math.max(ax, bx, cx2));
    const miny = Math.floor(Math.min(ay, by, cy2)), maxy = Math.ceil(Math.max(ay, by, cy2));
    const s = (x, y, x1, y1, x2, y2) => (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2);
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx2, cy2), d3 = s(px, py, cx2, cy2, ax, ay);
      const neg = (d1 < 0) || (d2 < 0) || (d3 < 0), pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      if (!(neg && pos)) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, w) {
    w = w || 1;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (w === 1) this.set(Math.round(x), Math.round(y), c);
      else this.ell(x + 0.5, y + 0.5, w / 2, w / 2, c);
    }
  }
  // 左半分を右へミラー（対称キャラ用）
  mirror() {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w / 2; x++)
        this.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
  }
  // 本体色に上下グラデのシェーディングを付ける
  autoShade() {
    for (let x = 0; x < this.w; x++) {
      let top = -1, bot = -1;
      for (let y = 0; y < this.h; y++) if (this.get(x, y) === C_BODY) { if (top < 0) top = y; bot = y; }
      if (top < 0) continue;
      const hgt = bot - top + 1;
      const lightN = Math.max(1, Math.round(hgt * 0.18));
      const shadeN = Math.max(1, Math.round(hgt * 0.26));
      for (let y = top; y < top + lightN; y++) if (this.get(x, y) === C_BODY) this.set(x, y, C_LIGHT);
      for (let y = bot; y > bot - shadeN; y--) if (this.get(x, y) === C_BODY) this.set(x, y, C_SHADE);
    }
  }
  // シルエットの外側1pxにアウトライン
  outline() {
    const src = this.d.slice();
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : src[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (at(x, y) !== 0) continue;
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.set(x, y, C_LINE);
    }
  }
  toCanvas(pal, scale) {
    scale = scale || 1;
    const cv = document.createElement('canvas');
    cv.width = this.w * scale; cv.height = this.h * scale;
    const g = cv.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.d[y * this.w + x];
      if (!c) continue;
      g.fillStyle = pal[c] || '#f0f';
      g.fillRect(x * scale, y * scale, scale, scale);
    }
    return cv;
  }
}

/* ---------------- 属性パレット ---------------- */
const TYPE_COLOR = {
  fire:   '#f4703a', water: '#46a6f2', grass: '#5cc455',
  bolt:   '#f5d43a', earth: '#b5824e', wind:  '#7ed8cf',
  light:  '#ffe38f', dark:  '#8a63d2', none:  '#c9c1b0'
};

function makePalette(base, accent) {
  const line = mix(shade(base, 0.30), '#160f22', 0.45);
  return {
    1: base,
    2: shade(base, 0.68),
    3: shade(base, 1.28),
    4: accent || shade(base, 1.5),
    5: shade(accent || base, 0.7),
    6: '#ffffff',
    7: '#241a33',
    8: line,
    9: '#fffbe8'
  };
}

/* ---------------- 目 ---------------- */
function drawEyes(px, o) {
  const ex = o.ex, ey = o.ey, style = o.eyeStyle || 'round';
  const put = (x, y, c) => px.set(x, y, c);
  const both = (dx, dy, c) => { put(ex + dx, ey + dy, c); put(px.w - 1 - (ex + dx), ey + dy, c); };
  if (style === 'closed') {
    for (let i = 0; i < 4; i++) { both(i, 0, C_PUPIL); }
    both(0, -1, C_PUPIL); both(3, -1, C_PUPIL);
    return;
  }
  if (style === 'sharp') {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) both(i, j, C_EYE);
    both(1, 0, C_PUPIL); both(1, 1, C_PUPIL); both(2, 1, C_PUPIL);
    both(0, -1, C_LINE); both(1, -1, C_LINE); both(2, -1, C_LINE); both(3, -1, C_LINE);
    both(0, 0, C_SHINE);
    return;
  }
  if (style === 'glow') {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) both(i, j, C_ACC);
    both(1, 1, C_SHINE); both(2, 1, C_SHINE);
    return;
  }
  // round
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) both(i, j, C_EYE);
  both(0, 0, 0); both(3, 0, 0); both(0, 3, 0); both(3, 3, 0);
  for (let i = 1; i < 3; i++) for (let j = 1; j < 4; j++) both(i, j, C_PUPIL);
  both(1, 1, C_SHINE);
}
function drawMouth(px, o) {
  const mx = o.mx, my = o.my;
  if (o.mouth === 'none') return;
  if (o.mouth === 'fang') {
    px.set(mx - 1, my, C_PUPIL); px.set(mx, my, C_PUPIL); px.set(mx + 1, my, C_PUPIL); px.set(mx + 2, my, C_PUPIL);
    px.set(mx - 1, my + 1, C_EYE); px.set(mx + 2, my + 1, C_EYE);
  } else if (o.mouth === 'beak') {
    px.tri(mx - 2, my - 1, mx + 3, my - 1, mx + 0.5, my + 3, C_ACC);
  } else {
    px.set(mx, my, C_PUPIL); px.set(mx + 1, my, C_PUPIL);
    px.set(mx - 1, my - 1, C_PUPIL); px.set(mx + 2, my - 1, C_PUPIL);
  }
}

/* ---------------- アーキタイプ（体型）---------------- */
const ARCH = {};

ARCH.blob = (px, o) => {
  const s = o.s;
  px.ell(16, 24 - 1 * s, 10 * s, 7 * s, C_BODY);
  px.ell(16, 17, 7.5 * s, 7 * s, C_BODY);
  if (o.crest) { px.ell(16, 9.5 - 1.5 * s, 2.4, 3.2, C_ACC); px.ell(16, 7 - 1.5 * s, 1.6, 1.6, C_ACC); }
  o.ex = 10; o.ey = 15; o.mx = 15; o.my = 21;
};

ARCH.beast = (px, o) => {
  const s = o.s;
  // 4本脚（胴と色を変えて埋もれないように）
  px.rect(7, 22, 9, 29, C_SHADE); px.rect(22, 22, 24, 29, C_SHADE);
  px.rect(12, 23, 14, 29, C_SHADE); px.rect(17, 23, 19, 29, C_SHADE);
  px.rect(7, 28, 9, 29, C_LIGHT); px.rect(22, 28, 24, 29, C_LIGHT);
  px.rect(12, 28, 14, 29, C_LIGHT); px.rect(17, 28, 19, 29, C_LIGHT);
  px.ell(16, 19.5, 8.6 * s, 5.4 * s, C_BODY);       // 胴
  px.line(25, 22, 29, 15, C_BODY, 2.6);             // しっぽ
  px.ell(29, 14, 2, 2.2, C_ACC);
  px.tri(8.4, 10.5, 11.2, 1.2, 14.6, 9, C_BODY);    // 耳
  px.tri(23.6, 10.5, 20.8, 1.2, 17.4, 9, C_BODY);
  px.tri(10.2, 9.4, 11.6, 4.0, 13.4, 8.6, C_ACC);
  px.tri(21.8, 9.4, 20.4, 4.0, 18.6, 8.6, C_ACC);
  px.ell(16, 11.5, 6.8 * s, 6 * s, C_BODY);         // 頭
  px.ell(16, 15.4, 4.0, 2.6, C_LIGHT);              // マズル
  if (o.horn) { px.tri(12.6, 6, 14.2, -0.5, 15.6, 6, C_ACC); px.tri(19.4, 6, 17.8, -0.5, 16.4, 6, C_ACC); }
  o.ex = 11; o.ey = 10; o.mx = 15; o.my = 16; o.mouth = o.mouth || 'fang';
};

ARCH.feline = (px, o) => {
  const s = o.s;
  px.rect(10, 24, 12, 29, C_SHADE); px.rect(19, 24, 21, 29, C_SHADE);
  px.rect(10, 28, 12, 29, C_LIGHT); px.rect(19, 28, 21, 29, C_LIGHT);
  px.ell(16, 21.5, 7.2 * s, 5.6 * s, C_BODY);
  px.line(24, 24, 28, 15, C_BODY, 2.4);             // しっぽ
  px.ell(28, 14, 1.9, 2.1, C_ACC);
  px.tri(8.6, 11, 11.0, 0.8, 14.8, 8.6, C_BODY);    // 大きな耳
  px.tri(23.4, 11, 21.0, 0.8, 17.2, 8.6, C_BODY);
  px.tri(10.4, 9.6, 11.6, 3.6, 13.6, 8.4, C_ACC);
  px.tri(21.6, 9.6, 20.4, 3.6, 18.4, 8.4, C_ACC);
  px.ell(16, 12, 6.2 * s, 5.6 * s, C_BODY);
  px.ell(16, 15.6, 4.2, 2.4, C_LIGHT);
  o.ex = 11; o.ey = 10.5; o.mx = 15; o.my = 16; o.mouth = 'fang'; o.eyeStyle = o.eyeStyle || 'sharp';
};

ARCH.bird = (px, o) => {
  const s = o.s;
  px.ell(8.2, 20, 3.8, 6.6 * s, C_ACC);             // 翼
  px.ell(23.8, 20, 3.8, 6.6 * s, C_ACC);
  px.ell(16, 20.5, 6.4 * s, 6.6 * s, C_BODY);       // 胴
  px.ell(16, 22, 3.6, 4.4, C_LIGHT);
  px.tri(11, 27, 16, 25, 21, 27, C_SHADE);          // 尾羽の付け根
  px.rect(12, 28, 13, 30, C_ACC); px.rect(18, 28, 19, 30, C_ACC);
  px.rect(11, 30, 14, 30, C_ACC); px.rect(17, 30, 20, 30, C_ACC);
  px.ell(16, 9.5, 5.2 * s, 4.9 * s, C_BODY);        // 頭
  if (o.crest) { px.tri(13.6, 6, 16, -1, 18.4, 6, C_ACC); }
  o.ex = 10.5; o.ey = 8; o.mx = 14.5; o.my = 13.4; o.mouth = 'beak';
};

ARCH.fish = (px, o) => {
  const s = o.s;
  px.tri(16, 3, 6, 12, 26, 12, C_ACC);             // 背びれ
  px.ell(16, 18, 8 * s, 8 * s, C_BODY);
  px.ell(16, 20, 4.5, 5, C_LIGHT);
  px.tri(4, 20, 4, 31, 12, 26, C_ACC);
  px.tri(28, 20, 28, 31, 20, 26, C_ACC);
  o.ex = 9; o.ey = 14; o.mx = 15; o.my = 21; o.mouth = 'fang';
};

ARCH.bug = (px, o) => {
  const s = o.s;
  px.line(9, 21, 3, 25, C_LINE, 1.6); px.line(23, 21, 29, 25, C_LINE, 1.6);
  px.line(10, 25, 5, 30, C_LINE, 1.6); px.line(22, 25, 27, 30, C_LINE, 1.6);
  px.ell(16, 22.5, 8.4 * s, 8 * s, C_BODY);         // 腹
  px.ell(16, 23, 4.8, 6, C_ACC);
  px.ell(16, 26.5, 8.0 * s, 3.0, C_SHADE);
  px.line(12, 8, 7.5, 1.5, C_LINE, 1.4); px.line(20, 8, 24.5, 1.5, C_LINE, 1.4);
  px.ell(7.5, 1.5, 1.8, 1.8, C_ACC); px.ell(24.5, 1.5, 1.8, 1.8, C_ACC);
  px.ell(16, 11.5, 6.2 * s, 5.6 * s, C_BODY);       // 頭
  o.ex = 11; o.ey = 10; o.mx = 15; o.my = 16; o.mouth = 'none';
};

ARCH.moth = (px, o) => {
  const s = o.s;
  px.ell(6.5, 14, 6.5 * s, 8 * s, C_ACC);          // 翅
  px.ell(25.5, 14, 6.5 * s, 8 * s, C_ACC);
  px.ell(7, 24, 4.5, 5, C_ACC2); px.ell(25, 24, 4.5, 5, C_ACC2);
  px.ell(16, 19, 3.4, 9, C_BODY);
  px.ell(16, 10, 4.4, 4.2, C_BODY);
  px.line(13, 7, 10, 2, C_LINE, 1); px.line(19, 7, 22, 2, C_LINE, 1);
  o.ex = 11; o.ey = 9; o.mx = 15; o.my = 13; o.mouth = 'none';
};

ARCH.dragon = (px, o) => {
  const s = o.s;
  px.tri(6, 4, 2, 22, 14, 18, C_ACC);              // 翼
  px.tri(26, 4, 30, 22, 18, 18, C_ACC);
  px.ell(16, 21, 8 * s, 8 * s, C_BODY);
  px.ell(16, 23, 4.6, 5.4, C_LIGHT);
  px.ell(16, 11, 6 * s, 5.5 * s, C_BODY);
  px.tri(10, 8, 8, 0, 14, 6, C_ACC);               // 角
  px.tri(22, 8, 24, 0, 18, 6, C_ACC);
  px.rect(10, 27, 12, 30, C_BODY); px.rect(20, 27, 22, 30, C_BODY);
  o.ex = 10; o.ey = 10; o.mx = 15; o.my = 15; o.mouth = 'fang'; o.eyeStyle = o.eyeStyle || 'sharp';
};

ARCH.serpent = (px, o) => {
  const s = o.s;
  px.ell(16, 27, 10.4 * s, 4.4, C_BODY);
  px.ell(16, 21.4, 8.4 * s, 4.0, C_BODY);
  px.ell(16, 16.2, 6.6 * s, 3.6, C_BODY);
  px.ell(16, 27, 6.0 * s, 2.2, C_LIGHT);            // 腹
  px.ell(16, 21.4, 4.6 * s, 1.9, C_LIGHT);
  px.ell(16, 23.6, 9.6 * s, 1.1, C_SHADE);          // とぐろの すきま
  px.ell(16, 18.4, 7.6 * s, 1.0, C_SHADE);
  px.ell(16, 13.4, 5.8 * s, 0.9, C_SHADE);
  px.ell(16, 9.5, 5.8 * s, 5.2 * s, C_BODY);        // 頭
  px.tri(12.8, 5.5, 15.2, 0, 16, 5.5, C_ACC);
  px.tri(19.2, 5.5, 16.8, 0, 16, 5.5, C_ACC);
  o.ex = 10.5; o.ey = 8; o.mx = 15; o.my = 13; o.mouth = 'fang'; o.eyeStyle = o.eyeStyle || 'sharp';
};

ARCH.humanoid = (px, o) => {
  const s = o.s;
  px.rect(8, 15, 10, 23, C_SHADE); px.rect(21, 15, 23, 23, C_SHADE);   // 腕
  px.ell(9, 24, 2.2, 2.2, C_LIGHT); px.ell(22, 24, 2.2, 2.2, C_LIGHT); // 手
  px.rect(12, 24, 14, 30, C_SHADE); px.rect(17, 24, 19, 30, C_SHADE);  // 脚
  px.rect(11, 29, 14, 30, C_LIGHT); px.rect(17, 29, 20, 30, C_LIGHT);
  px.rect(12, 13, 19, 24, C_BODY);                                     // 胴
  px.ell(16, 13.5, 4.4, 2.2, C_BODY);
  px.rect(13, 16, 18, 20, C_ACC);
  px.ell(16, 8, 5.6 * s, 5.4 * s, C_BODY);                             // 頭
  if (o.crest) {
    px.tri(10.5, 5, 15.4, -2.5, 15.8, 4, C_ACC);
    px.tri(21.5, 5, 16.6, -2.5, 16.2, 4, C_ACC);
  }
  o.ex = 11; o.ey = 6.5; o.mx = 15; o.my = 11.5; o.mouth = 'none';
};

ARCH.plant = (px, o) => {
  const s = o.s;
  px.ell(16, 24, 8.5 * s, 6.5 * s, C_BODY);
  px.tri(8, 20, 0, 12, 12, 14, C_ACC);             // 葉
  px.tri(24, 20, 32, 12, 20, 14, C_ACC);
  px.ell(16, 14, 5.4 * s, 5 * s, C_BODY);
  if (o.crest) {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      px.ell(16 + Math.cos(a) * 4.6, 8 + Math.sin(a) * 4.2, 2.4, 2.4, C_ACC2);
    }
    px.ell(16, 8, 2.4, 2.4, C_SHINE);
  } else { px.line(16, 9, 16, 4, C_ACC, 1); px.ell(16, 3.5, 2, 2, C_ACC2); }
  o.ex = 10; o.ey = 13; o.mx = 15; o.my = 18; o.mouth = 'none';
};

ARCH.rock = (px, o) => {
  const s = o.s;
  px.rect(3, 18, 6, 27, C_SHADE); px.rect(25, 18, 28, 27, C_SHADE);   // 腕
  px.rect(3, 25, 7, 27, C_LIGHT); px.rect(24, 25, 28, 27, C_LIGHT);
  px.rect(9, 27, 13, 30, C_SHADE); px.rect(18, 27, 22, 30, C_SHADE);  // 脚
  px.rect(7, 20, 24, 28, C_BODY);
  px.rect(9, 14, 22, 20, C_BODY);
  px.rect(11, 8, 20, 14, C_BODY);
  px.set(7, 20, 0); px.set(24, 20, 0); px.set(9, 14, 0); px.set(22, 14, 0);
  px.set(11, 8, 0); px.set(20, 8, 0);
  px.line(12, 22, 19, 22, C_SHADE, 1);                                 // ひび
  px.line(15, 22, 13, 27, C_SHADE, 1);
  px.rect(13, 24, 18, 26, C_ACC);
  o.ex = 11; o.ey = 10; o.mx = 15; o.my = 16; o.mouth = 'fang'; o.eyeStyle = o.eyeStyle || 'glow';
};

ARCH.ghost = (px, o) => {
  const s = o.s;
  px.ell(16, 16, 8.5 * s, 9 * s, C_BODY);
  px.rect(8, 16, 23, 26, C_BODY);
  for (let i = 0; i < 4; i++) {
    const cx = 9.5 + i * 4.4;
    px.ell(cx, 26, 2.4, 3.2, C_BODY);
  }
  o.ex = 10; o.ey = 13; o.mx = 15; o.my = 19; o.mouth = 'fang'; o.eyeStyle = o.eyeStyle || 'glow';
};

ARCH.orb = (px, o) => {
  const s = o.s;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + 0.4;
    px.ell(16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11, 2.6, 2.6, C_ACC);
  }
  px.ell(16, 16, 8.5 * s, 8.5 * s, C_BODY);
  o.ex = 10; o.ey = 13; o.mx = 15; o.my = 20; o.mouth = 'none'; o.eyeStyle = o.eyeStyle || 'glow';
};

/* ---------------- モンスター描画 ---------------- */
const _spriteCache = {};
function creatureCanvas(sp, scale, flip) {
  const key = sp.id + '_' + scale + '_' + (flip ? 1 : 0);
  if (_spriteCache[key]) return _spriteCache[key];
  const px = new Px(32, 32);
  const o = Object.assign({ s: 1, eyeStyle: 'round', mouth: 'smile' }, sp.art);
  (ARCH[o.arch] || ARCH.blob)(px, o);
  px.autoShade();
  drawEyes(px, o);
  drawMouth(px, o);
  px.outline();
  const base = TYPE_COLOR[sp.type1] || '#ccc';
  const acc = sp.art.accent || TYPE_COLOR[sp.type2 || sp.type1];
  let cv = px.toCanvas(makePalette(base, acc), scale);
  if (flip) {
    const f = document.createElement('canvas');
    f.width = cv.width; f.height = cv.height;
    const g = f.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(f.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0);
    cv = f;
  }
  _spriteCache[key] = cv;
  return cv;
}

/* ---------------- 人物（オーバーワールド 16x16）---------------- */
const _charCache = {};
function charCanvas(look, dir, frame) {
  const key = look.hair + look.skin + look.shirt + look.pants + dir + frame;
  if (_charCache[key]) return _charCache[key];
  const px = new Px(16, 16);
  const P = { 1: look.shirt, 2: shade(look.shirt, 0.7), 3: shade(look.shirt, 1.2),
              4: look.hair, 5: shade(look.hair, 0.7), 6: '#ffffff', 7: '#241a33',
              8: '#1a1426', 9: look.skin, 10: look.pants, 11: shade(look.pants, 0.7),
              12: look.acc || look.hair };
  const S = 9, HAIR = 4, SH = 1, PA = 10;
  // 脚
  const swing = frame === 1 ? 1 : (frame === 3 ? -1 : 0);
  px.rect(6, 13, 7, 15, PA); px.rect(8, 13, 9, 15, PA);
  if (swing === 1) { px.rect(6, 15, 7, 15, 0); px.rect(8, 12, 9, 15, PA); }
  if (swing === -1) { px.rect(8, 15, 9, 15, 0); px.rect(6, 12, 7, 15, PA); }
  // 胴
  px.rect(5, 8, 10, 13, SH);
  px.rect(4, 9, 4, 12, SH); px.rect(11, 9, 11, 12, SH);
  px.rect(4, 12, 4, 12, S); px.rect(11, 12, 11, 12, S);
  // 頭
  px.ell(8, 5, 4, 4.2, S);
  if (dir === 'down') {
    px.rect(4, 1, 11, 3, HAIR); px.ell(8, 3.5, 4, 3, HAIR);
    px.rect(4, 4, 5, 5, HAIR); px.rect(10, 4, 11, 5, HAIR);
    px.rect(6, 5, 6, 6, 7); px.rect(9, 5, 9, 6, 7);
    px.set(6, 5, 8); px.set(9, 5, 8);
  } else if (dir === 'up') {
    px.ell(8, 4.5, 4.2, 4.2, HAIR); px.rect(4, 1, 11, 5, HAIR);
    px.rect(6, 7, 9, 7, HAIR);
  } else { // side（左向き。右向きは反転）
    px.ell(8, 5, 4, 4.2, S);
    px.rect(4, 1, 11, 3, HAIR); px.ell(8, 3.2, 4.1, 3, HAIR);
    px.rect(9, 3, 11, 6, HAIR);
    px.rect(5, 5, 5, 6, 7);
    px.rect(4, 9, 5, 12, SH);
  }
  px.outline();
  let cv = px.toCanvas(P, 1);
  if (dir === 'right') {
    const f = document.createElement('canvas'); f.width = 16; f.height = 16;
    const g = f.getContext('2d'); g.imageSmoothingEnabled = false;
    g.translate(16, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); cv = f;
  }
  _charCache[key] = cv;
  return cv;
}

/* ---------------- タイル（16x16）---------------- */
const _tileCache = {};
function tileCanvas(kind, variant) {
  const key = kind + '_' + (variant || 0);
  if (_tileCache[key]) return _tileCache[key];
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  const g = cv.getContext('2d');
  const rnd = mulberry(kind.length * 977 + (variant || 0) * 131 + kind.charCodeAt(0) * 31);
  const dots = (col, n, sz) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) g.fillRect((rnd() * 16) | 0, (rnd() * 16) | 0, sz || 1, sz || 1);
  };
  switch (kind) {
    case 'grass':
      g.fillStyle = '#4f9a44'; g.fillRect(0, 0, 16, 16);
      dots('#5cb04e', 26); dots('#448a3c', 18);
      g.fillStyle = '#63bb55';
      for (let i = 0; i < 4; i++) { const x = (rnd() * 14) | 0, y = (rnd() * 14) | 0; g.fillRect(x, y + 1, 1, 2); g.fillRect(x + 1, y, 1, 2); }
      break;
    case 'tall':
      g.fillStyle = '#3f8438'; g.fillRect(0, 0, 16, 16);
      dots('#357030', 20);
      g.fillStyle = '#57a84a';
      for (let i = 0; i < 9; i++) {
        const x = (rnd() * 15) | 0, y = 4 + ((rnd() * 10) | 0);
        g.fillRect(x, y, 1, 16 - y); g.fillRect(x + 1, y + 2, 1, 14 - y);
      }
      g.fillStyle = '#6cc25c';
      for (let i = 0; i < 5; i++) { const x = (rnd() * 15) | 0; g.fillRect(x, 3 + ((rnd() * 5) | 0), 1, 3); }
      break;
    case 'path':
      g.fillStyle = '#c9a978'; g.fillRect(0, 0, 16, 16);
      dots('#d9bd8e', 24); dots('#b3915f', 16);
      break;
    case 'sand':
      g.fillStyle = '#e2cf9a'; g.fillRect(0, 0, 16, 16);
      dots('#efe0b4', 20); dots('#cdb47c', 12);
      break;
    case 'water':
      g.fillStyle = '#2f74c8'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#3f8ade'; g.fillRect(0, (variant % 2) ? 3 : 9, 16, 3);
      g.fillStyle = '#79bdf4';
      for (let i = 0; i < 3; i++) { const x = (rnd() * 12) | 0, y = (rnd() * 14) | 0; g.fillRect(x + (variant % 2 ? 1 : 0), y, 3, 1); }
      break;
    case 'tree': {
      g.fillStyle = '#4f9a44'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#6b4a24'; g.fillRect(7, 10, 3, 6);
      const blob = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
      blob(8, 7, 7, '#1f5c26'); blob(6, 6, 5, '#2a7a30'); blob(10, 8, 4.5, '#2a7a30');
      blob(6, 4.5, 3, '#3d9b3f');
      break;
    }
    case 'rock':
      g.fillStyle = '#7f7a72'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#98938a'; g.fillRect(2, 4, 12, 10); g.fillRect(4, 2, 8, 3);
      g.fillStyle = '#6a655e'; g.fillRect(2, 12, 12, 2); g.fillRect(3, 10, 3, 2);
      g.fillStyle = '#b0aba1'; g.fillRect(4, 4, 5, 2);
      break;
    case 'cavefloor':
      g.fillStyle = '#5b5566'; g.fillRect(0, 0, 16, 16);
      dots('#6a6376', 20); dots('#4c4757', 14);
      break;
    case 'cavegrass': {
      g.fillStyle = '#4a4458'; g.fillRect(0, 0, 16, 16);
      dots('#565068', 18); dots('#3c3748', 12);
      g.fillStyle = '#3f7a68';
      for (let i = 0; i < 7; i++) {
        const x = (rnd() * 15) | 0, y = 5 + ((rnd() * 9) | 0);
        g.fillRect(x, y, 1, 16 - y); g.fillRect(x + 1, y + 2, 1, 14 - y);
      }
      g.fillStyle = '#6ad0b0';
      for (let i = 0; i < 3; i++) { const x = (rnd() * 15) | 0, y = 4 + ((rnd() * 6) | 0); g.fillRect(x, y, 1, 2); }
      break;
    }
    case 'cavewall':
      g.fillStyle = '#332f3d'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#413c4d'; g.fillRect(0, 0, 16, 5); g.fillRect(0, 8, 9, 5);
      g.fillStyle = '#282433'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 13, 16, 1); g.fillRect(9, 8, 1, 5);
      break;
    case 'floor':
      g.fillStyle = '#c8a888'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#b8987a'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1);
      g.fillStyle = '#d6b998'; g.fillRect(0, 0, 16, 1);
      break;
    case 'wall':
      g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#d2c9b6'; g.fillRect(0, 12, 16, 4);
      g.fillStyle = '#bdb2a0'; g.fillRect(0, 15, 16, 1);
      if ((variant || 0) === 1) {          // まど
        g.fillStyle = '#8a7a62'; g.fillRect(3, 2, 10, 8);
        g.fillStyle = '#8fd0f4'; g.fillRect(4, 3, 8, 6);
        g.fillStyle = '#c8ecff'; g.fillRect(4, 3, 4, 3);
        g.fillStyle = '#8a7a62'; g.fillRect(7, 3, 1, 6); g.fillRect(4, 5, 8, 1);
      }
      break;
    case 'roof':
      g.fillStyle = '#c0503c'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#a33f2e'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      g.fillStyle = '#d76a52'; for (let y = 1; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      break;
    case 'roof2':
      g.fillStyle = '#4f7fc0'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#3d67a0'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      g.fillStyle = '#6c9ada'; for (let y = 1; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      break;
    case 'roof3':
      g.fillStyle = '#6a5a8a'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#544672'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      g.fillStyle = '#8676a8'; for (let y = 1; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      g.fillStyle = '#ffd75e'; g.fillRect(0, 6, 16, 1);
      break;
    case 'door':
      g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#6b4a24'; g.fillRect(3, 2, 10, 14);
      g.fillStyle = '#8a6132'; g.fillRect(4, 3, 8, 12);
      g.fillStyle = '#ffd75e'; g.fillRect(10, 9, 2, 2);
      break;
    case 'sign':
      g.fillStyle = '#4f9a44'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#6b4a24'; g.fillRect(7, 9, 2, 7);
      g.fillStyle = '#c99a58'; g.fillRect(2, 3, 12, 7);
      g.fillStyle = '#8a6132'; g.fillRect(2, 3, 12, 1); g.fillRect(2, 9, 12, 1);
      g.fillStyle = '#5c3f1e'; g.fillRect(4, 5, 8, 1); g.fillRect(4, 7, 6, 1);
      break;
    case 'counter':
      g.fillStyle = '#a5763f'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#c08d4d'; g.fillRect(0, 0, 16, 12);
      g.fillStyle = '#8a6132'; g.fillRect(0, 11, 16, 2);
      break;
    case 'flower': {
      g.drawImage(tileCanvas('grass', 1), 0, 0);
      const cols = ['#ff6f8e', '#ffe15e', '#b98cff', '#ffffff'];
      for (let i = 0; i < 3; i++) {
        const x = 2 + ((rnd() * 11) | 0), y = 2 + ((rnd() * 11) | 0), c = cols[(rnd() * 4) | 0];
        g.fillStyle = c; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1);
        g.fillStyle = '#ffe15e'; g.fillRect(x, y, 1, 1);
      }
      break;
    }
    case 'stair':
      g.fillStyle = '#5b5566'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#8a8398'; g.fillRect(2, 3, 12, 4); g.fillRect(2, 9, 12, 4);
      g.fillStyle = '#3b3648'; g.fillRect(2, 7, 12, 2); g.fillRect(2, 13, 12, 2);
      break;
    case 'shrine':
      g.fillStyle = '#2b2438'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#4a3a68'; g.fillRect(1, 1, 14, 14);
      g.fillStyle = '#7d5fc0'; g.fillRect(3, 3, 10, 10);
      g.fillStyle = '#c9a8ff'; g.fillRect(6, 5, 4, 6); g.fillRect(5, 6, 6, 4);
      break;
    case 'snow':
      g.fillStyle = '#e8f0f8'; g.fillRect(0, 0, 16, 16);
      dots('#ffffff', 20); dots('#cfdcea', 12);
      break;
    case 'ice':
      g.fillStyle = '#a8d8ee'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#c6e8f8'; g.fillRect(0, 0, 16, 6);
      g.fillStyle = '#8dc4e0'; g.fillRect(0, 13, 16, 3);
      break;
    default:
      g.fillStyle = '#f0f'; g.fillRect(0, 0, 16, 16);
  }
  _tileCache[key] = cv;
  return cv;
}

/* ---------------- クリスタル（ボール）アイコン ---------------- */
function ballCanvas(tier, scale) {
  const px = new Px(16, 16);
  const cols = [['#e85d5d', '#f6f6f6'], ['#4a9ce8', '#f6f6f6'], ['#b478ff', '#ffe9a8']];
  const c = cols[tier] || cols[0];
  px.ell(8, 8, 6.4, 6.4, C_BODY);
  px.rect(1, 8, 14, 15, C_ACC);
  px.ell(8, 8, 2.6, 2.6, C_SHINE);
  px.ell(8, 8, 1.4, 1.4, C_LIGHT);
  for (let x = 0; x < 16; x++) { if (px.get(x, 7)) px.set(x, 7, C_LINE); if (px.get(x, 8)) px.set(x, 8, C_LINE); }
  px.ell(6, 5, 1.4, 1.2, C_SHINE);
  px.outline();
  return px.toCanvas({ 1: c[0], 2: shade(c[0], .7), 3: '#dddddd', 4: c[1], 5: '#ccc',
                       6: '#fff', 7: '#333', 8: '#1e1a28', 9: '#f4f4f4' }, scale || 1);
}
