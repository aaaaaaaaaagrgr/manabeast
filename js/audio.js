/* =========================================================
   audio.js — WebAudio チップチューンBGM & SE
   ========================================================= */
const Sound = (() => {
  let ctx = null, master = null, musicGain = null, cur = null, timer = null, on = true;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.42; musicGain.connect(master);
    } catch (e) { ctx = null; }
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const N = {}; // 音名 → 周波数
  (() => {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let o = 1; o <= 7; o++) for (let i = 0; i < 12; i++)
      N[names[i] + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12);
    N['-'] = 0;
  })();

  function blip(freq, t, dur, type, vol, dest) {
    if (!ctx || !freq) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, dest) {
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(dest || musicGain); s.start(t);
  }

  /* ---- 曲データ： { bpm, lead:[[note,len]...], bass:[...], wave } ---- */
  const P = (str) => str.trim().split(/\s+/).map(tok => {
    const m = tok.split('/');
    return [m[0], m[1] ? parseFloat(m[1]) : 1];
  });

  const TRACKS = {
    town: {
      bpm: 132, wave: 'square', drum: false,
      lead: P(`G4 B4 D5 B4 C5/2 B4/2 A4 G4 A4 B4 G4 E4 D4/2 E4/2 G4/2 A4/2 B4 -
               G4 B4 D5 G5 F#5/2 E5/2 D5 B4 C5 A4 B4 G4 A4/2 B4/2 G4 -`),
      bass: P(`G3/2 -/2 D3/2 -/2 G3/2 -/2 D3/2 -/2 C3/2 -/2 G3/2 -/2 D3/2 -/2 G3/2 -/2
               E3/2 -/2 B3/2 -/2 C3/2 -/2 G3/2 -/2 D3/2 -/2 A3/2 -/2 G3/2 -/2 D3/2 -/2
               G3/2 -/2 D3/2 -/2 G3/2 -/2 D3/2 -/2 C3/2 -/2 G3/2 -/2 D3/2 -/2 G3/2 -/2
               E3/2 -/2 B3/2 -/2 C3/2 -/2 G3/2 -/2 D3/2 -/2 A3/2 -/2 G3/2 -/2 G3/2 -/2`)
    },
    route: {
      bpm: 152, wave: 'square', drum: true,
      lead: P(`C5/.5 E5/.5 G5 E5/.5 C5/.5 D5 E5/.5 F5/.5 G5 A5/2
               G5/.5 F5/.5 E5 D5/.5 C5/.5 D5 E5 C5 -/2
               F5/.5 A5/.5 C6 A5/.5 F5/.5 G5 A5/.5 G5/.5 F5 E5/2
               D5/.5 E5/.5 F5 G5/.5 A5/.5 G5 E5 C5 -/2`),
      bass: P(`C3/.5 C3/.5 G3/.5 C3/.5 C3/.5 C3/.5 G3/.5 C3/.5
               A2/.5 A2/.5 E3/.5 A2/.5 F2/.5 F2/.5 C3/.5 F2/.5
               C3/.5 C3/.5 G3/.5 C3/.5 G2/.5 G2/.5 D3/.5 G2/.5
               F2/.5 F2/.5 C3/.5 F2/.5 G2/.5 G2/.5 D3/.5 G2/.5`)
    },
    battle: {
      bpm: 172, wave: 'square', drum: true,
      lead: P(`A4/.5 A4/.5 C5 A4/.5 E5/.5 D5/.5 C5/.5 B4 A4/.5 G4/.5 A4 -/.5 E4/.5
               A4/.5 A4/.5 C5 E5/.5 A5/.5 G5/.5 E5/.5 D5 C5/.5 B4/.5 A4 -/.5 E5/.5
               F5/.5 E5/.5 D5 C5/.5 D5/.5 E5 A4/.5 B4/.5 C5 D5/.5 E5/.5
               A5/.5 G5/.5 E5 D5/.5 C5/.5 B4 A4/2`),
      bass: P(`A2/.5 A2/.5 A2/.5 E3/.5 A2/.5 A2/.5 G2/.5 A2/.5
               A2/.5 A2/.5 A2/.5 E3/.5 C3/.5 C3/.5 G2/.5 C3/.5
               F2/.5 F2/.5 C3/.5 F2/.5 G2/.5 G2/.5 D3/.5 G2/.5
               A2/.5 A2/.5 E3/.5 A2/.5 E2/.5 E2/.5 B2/.5 E2/.5`)
    },
    boss: {
      bpm: 168, wave: 'sawtooth', drum: true,
      lead: P(`D4/.5 D4/.5 F4 D4/.5 A4/.5 G#4/.5 G4/.5 F4 E4 D4/.5 C4/.5 D4/2
               D5/.5 C5/.5 A#4 A4/.5 G4/.5 F4 E4/.5 F4/.5 G4 A4/2
               A#4/.5 A4/.5 G4 F4/.5 E4/.5 D4 C#4/.5 D4/.5 E4 F4/2
               A4/.5 A#4/.5 A4 G4/.5 F4/.5 E4 D4/2 -/2`),
      bass: P(`D2/.5 D2/.5 D2/.5 A2/.5 D2/.5 D2/.5 C2/.5 D2/.5
               A#1/.5 A#1/.5 F2/.5 A#1/.5 A1/.5 A1/.5 E2/.5 A1/.5
               D2/.5 D2/.5 A2/.5 D2/.5 G1/.5 G1/.5 D2/.5 G1/.5
               A1/.5 A1/.5 E2/.5 A1/.5 D2/.5 D2/.5 A2/.5 D2/.5`)
    },
    gym: {
      bpm: 158, wave: 'square', drum: true,
      lead: P(`E5 D5/.5 E5/.5 G5 E5 D5 C5/.5 D5/.5 E5 D5
               C5 B4/.5 C5/.5 D5 C5 B4 A4/.5 B4/.5 C5 -
               E5 G5/.5 A5/.5 B5 A5 G5 E5/.5 G5/.5 A5 G5
               E5 D5 C5 B4 A4/2 E5/2`),
      bass: P(`E2/.5 E2/.5 B2/.5 E2/.5 C3/.5 C3/.5 G2/.5 C3/.5
               A2/.5 A2/.5 E3/.5 A2/.5 B2/.5 B2/.5 F#3/.5 B2/.5
               E2/.5 E2/.5 B2/.5 E2/.5 C3/.5 C3/.5 G2/.5 C3/.5
               A2/.5 A2/.5 E3/.5 A2/.5 B2/.5 B2/.5 E3/.5 E2/.5`)
    },
    forest: {
      bpm: 120, wave: 'triangle', drum: false,
      lead: P(`A4 C5 E5 D5 C5/2 A4/2 B4 G4 A4 -
               E5 D5 C5 B4 A4/2 G4/2 A4 E4 A4 -
               C5 E5 A5 G5 E5/2 D5/2 C5 B4 A4 -
               D5 C5 B4 A4 G4/2 A4/2 B4 A4 A4/2 -/2`),
      bass: P(`A2/2 -/2 E3/2 -/2 F2/2 -/2 C3/2 -/2 G2/2 -/2 D3/2 -/2 A2/2 -/2 E3/2 -/2
               A2/2 -/2 E3/2 -/2 D2/2 -/2 A2/2 -/2 E2/2 -/2 B2/2 -/2 A2/2 -/2 A2/2 -/2
               A2/2 -/2 E3/2 -/2 F2/2 -/2 C3/2 -/2 G2/2 -/2 D3/2 -/2 A2/2 -/2 E3/2 -/2
               D2/2 -/2 A2/2 -/2 E2/2 -/2 B2/2 -/2 A2/2 -/2 E3/2 -/2 A2/2 -/2 A2/2 -/2`)
    },
    mountain: {
      bpm: 138, wave: 'square', drum: true,
      lead: P(`D5 F5 A5 G5 F5/2 D5/2 E5 C5 D5 -
               A5 G5 F5 E5 D5/2 C5/2 D5 A4 D5 -
               F5 A5 D6 C6 A5/2 G5/2 F5 E5 D5 -
               G5 F5 E5 D5 C5/2 D5/2 E5 D5 D5/2 -/2`),
      bass: P(`D2/.5 D2/.5 A2/.5 D2/.5 B1/.5 B1/.5 F2/.5 B1/.5
               G2/.5 G2/.5 D3/.5 G2/.5 A2/.5 A2/.5 E3/.5 A2/.5
               D2/.5 D2/.5 A2/.5 D2/.5 F2/.5 F2/.5 C3/.5 F2/.5
               G2/.5 G2/.5 D3/.5 G2/.5 A2/.5 A2/.5 D3/.5 D2/.5`)
    },
    temple: {
      bpm: 92, wave: 'triangle', drum: false,
      lead: P(`D4/2 F4 E4 D4/2 C4 D4/2 -/2
               A4/2 G4 F4 E4/2 D4 C#4/2 -/2
               D4/2 A4 A#4 A4/2 G4 F4/2 -/2
               E4/2 D4 C4 D4/2 -/2 -/2`),
      bass: P(`D2/2 -/2 D2/2 -/2 A#1/2 -/2 A1/2 -/2
               D2/2 -/2 G1/2 -/2 A1/2 -/2 A1/2 -/2
               D2/2 -/2 F2/2 -/2 A#1/2 -/2 A1/2 -/2
               G1/2 -/2 A1/2 -/2 D2/2 -/2 D2/2 -/2`)
    },
    center: {
      bpm: 116, wave: 'triangle', drum: false,
      lead: P(`C5 E5 G5 E5 F5/2 E5/2 D5 C5 D5 -
               E5 G5 C6 G5 A5/2 G5/2 F5 E5 C5 -`),
      bass: P(`C3/2 -/2 G3/2 -/2 F2/2 -/2 C3/2 -/2 G2/2 -/2 D3/2 -/2 C3/2 -/2 G3/2 -/2
               C3/2 -/2 G3/2 -/2 A2/2 -/2 E3/2 -/2 F2/2 -/2 C3/2 -/2 C3/2 -/2 C3/2 -/2`),
      quiet: true
    },
    victory: {
      bpm: 168, wave: 'square', drum: true, once: true,
      lead: P(`C5/.5 C5/.5 C5/.5 C5 G4 A4 C5/.5 A4/.5 C5/2`),
      bass: P(`C3/.5 C3/.5 C3/.5 C3 C3 F3 C3/.5 G3/.5 C3/2`)
    }
  };

  function stopMusic() { if (timer) { clearTimeout(timer); timer = null; } cur = null; }

  function schedule(name) {
    if (!ctx || !on) return;
    const tr = TRACKS[name];
    if (!tr) return;
    const beat = 60 / tr.bpm;
    let t = ctx.currentTime + 0.06;
    const start = t;
    const play = (seq, wave, vol, oct) => {
      let tt = start;
      for (const [n, l] of seq) {
        const f = N[n] || 0;
        if (f) blip(f * (oct || 1), tt, beat * l * 0.92, wave, vol);
        tt += beat * l;
      }
      return tt - start;
    };
    const dur = Math.max(
      play(tr.lead, tr.wave, tr.quiet ? 0.13 : 0.18),
      play(tr.bass, 'triangle', 0.20)
    );
    if (tr.drum) {
      for (let tt = 0; tt < dur; tt += beat) {
        noise(start + tt, 0.05, 0.10);
        if ((Math.round(tt / beat) % 2) === 1) noise(start + tt, 0.09, 0.055);
      }
    }
    if (tr.once) { timer = setTimeout(() => { if (cur === name) { cur = null; } }, dur * 1000); return; }
    timer = setTimeout(() => { if (cur === name) schedule(name); }, dur * 1000 - 40);
  }

  return {
    resume,
    toggle() { on = !on; if (!on) { stopMusic(); if (master) master.gain.value = 0; } else { if (master) master.gain.value = 0.5; } return on; },
    isOn() { return on; },
    play(name) {
      init(); if (!ctx || !on) return;
      if (cur === name) return;
      stopMusic(); cur = name; schedule(name);
    },
    stop() { stopMusic(); },
    // ---- 効果音 ----
    se(kind) {
      init(); if (!ctx || !on) return;
      const t = ctx.currentTime, d = master;
      switch (kind) {
        case 'cursor': blip(880, t, 0.05, 'square', 0.14, d); break;
        case 'ok':     blip(660, t, 0.05, 'square', 0.16, d); blip(990, t + 0.05, 0.09, 'square', 0.16, d); break;
        case 'cancel': blip(420, t, 0.06, 'square', 0.14, d); blip(300, t + 0.05, 0.08, 'square', 0.14, d); break;
        case 'hit':    noise(t, 0.13, 0.22, d); blip(150, t, 0.11, 'square', 0.16, d); break;
        case 'sup':    noise(t, 0.2, 0.28, d); blip(220, t, 0.18, 'sawtooth', 0.2, d); blip(330, t + .05, 0.16, 'sawtooth', 0.16, d); break;
        case 'weak':   blip(180, t, 0.1, 'triangle', 0.14, d); break;
        case 'faint':  for (let i = 0; i < 10; i++) blip(500 - i * 40, t + i * 0.045, 0.09, 'square', 0.14, d); break;
        case 'heal':   [523, 659, 784, 1047].forEach((f, i) => blip(f, t + i * 0.07, 0.18, 'triangle', 0.18, d)); break;
        case 'ball':   blip(700, t, 0.07, 'square', 0.16, d); blip(500, t + .07, 0.1, 'square', 0.14, d); break;
        case 'shake':  blip(340, t, 0.06, 'square', 0.15, d); break;
        case 'catch':  [523, 659, 784, 1047, 1319].forEach((f, i) => blip(f, t + i * 0.09, 0.22, 'square', 0.2, d)); break;
        case 'levelup':[659, 784, 988, 1319].forEach((f, i) => blip(f, t + i * 0.08, 0.25, 'square', 0.18, d)); break;
        case 'encounter': for (let i = 0; i < 8; i++) blip(200 + i * 90, t + i * 0.05, 0.07, 'square', 0.16, d); break;
        case 'buy':    blip(988, t, 0.07, 'square', 0.16, d); blip(1319, t + .08, 0.12, 'square', 0.16, d); break;
        case 'bump':   blip(120, t, 0.06, 'square', 0.12, d); break;
        case 'warp':   for (let i = 0; i < 6; i++) blip(300 + i * 120, t + i * 0.03, 0.06, 'triangle', 0.13, d); break;
        case 'cry':    break;
      }
    },
    cry(freq) {
      init(); if (!ctx || !on) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * 0.6, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 1.35), t + 0.12);
      o.frequency.exponentialRampToValueAtTime(Math.max(50, freq * 0.75), t + 0.42);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 0.48);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5);
    }
  };
})();
