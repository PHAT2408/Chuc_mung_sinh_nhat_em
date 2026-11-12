(() => {
'use strict';
/* ============================================================
   Bảo Liên's Birthday Surprise — app.js
   The content (name, birthday, letter, photos, music) lives in
   config.js. This file is the behaviour, in this order:
   helpers · content · scenes · sound · canvas effects · balloons
   · tap hearts · name · cake · gift · wish · gallery · letter
   · finale · photo loading · ?check · boot.
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
const isSmall = Math.min(innerWidth, innerHeight) < 520;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- Content ---------- */
const DEFAULT_LETTER = 'Dear Bảo Liên,\n\nHôm nay là một ngày thật đặc biệt, vì đó là ngày một người tuyệt vời xuất hiện trên thế giới này.\n\nChúc Liên tuổi mới luôn vui vẻ, bình an và gặp thật nhiều điều may mắn. Mong rằng những điều tốt đẹp nhất sẽ luôn đến với Liên, những ước mơ sẽ dần trở thành hiện thực và mỗi ngày đều có lý do để mỉm cười.\n\nHy vọng tuổi mới sẽ mang đến thật nhiều kỷ niệm đẹp, những chuyến đi thú vị và những người chân thành bên cạnh.\n\nEnjoy your special day!\n\nHappy Birthday, Bảo Liên! ❤️';
/* config.js sets window.GIFT_CONFIG. Anything missing or mistyped falls back to the defaults here. */
const USER = window.GIFT_CONFIG && typeof window.GIFT_CONFIG === 'object' ? window.GIFT_CONFIG : null;
const textOr = (v, d) => (typeof v === 'string' && v.trim() ? v : d);
const cfg = {
  name: textOr(USER && USER.name, 'Bảo Liên').trim(),
  dob: USER && /^\d{4}-\d{2}-\d{2}$/.test(USER.dob) ? USER.dob : '2007-11-15',
  letter: textOr(USER && USER.letter, DEFAULT_LETTER),
  signature: USER && typeof USER.signature === 'string' ? USER.signature.trim() : ''
};
let media = { photos: [] };
let mediaReady = false;
let mediaResolve;
const waitMedia = new Promise(r => { mediaResolve = r; });

function fmtDob(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; }
function ageFor(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const now = new Date();
  let best = now.getFullYear(), diff = Infinity;
  for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const d = Math.abs(new Date(y, +m[2] - 1, +m[3]) - now);
    if (d < diff) { diff = d; best = y; }
  }
  const age = best - +m[1];
  return age > 0 && age < 130 ? age : null;
}
function applyText() {
  $$('[data-bind="name"]').forEach(el => { el.textContent = cfg.name; });
  $$('[data-bind="dob"]').forEach(el => { el.textContent = fmtDob(cfg.dob); });
  $$('[data-bind="hey"]').forEach(el => { el.textContent = `Hey ${cfg.name}! 💗`; });
}

/* ---------- Scenes + progress ---------- */
const STEPS = ['Gift', 'Celebrate', 'Wish', 'Memories', 'Letter', 'Finale'];
const scenes = {
  intro: $('#scene-intro'), celebrate: $('#scene-celebrate'), memories: $('#scene-memories'),
  letter: $('#scene-letter'), finale: $('#scene-finale')
};
let current = 'intro';
const onEnter = {}, onLeave = {};
const sceneTimers = [];
function later(fn, ms) { const id = setTimeout(fn, ms); sceneTimers.push(id); return id; }
function clearSceneTimers() { while (sceneTimers.length) clearTimeout(sceneTimers.pop()); }
function setStep(i) {
  $$('#progress-list li').forEach((li, k) => {
    li.classList.toggle('is-done', k < i);
    li.classList.toggle('is-current', k === i);
    if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('#progress-label').textContent = `${i + 1} / ${STEPS.length} · ${STEPS[i]}`;
}
function setSky(name) { $$('.sky-layer').forEach(l => l.classList.toggle('is-on', l.dataset.sky === name)); }
function showOnly(name) {
  for (const [k, el] of Object.entries(scenes)) {
    const on = k === name;
    el.classList.toggle('is-active', on);
    el.inert = !on;
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
}
function goTo(name) {
  if (name === current) return;
  const prev = current;
  current = name;
  clearSceneTimers();
  FX.stopModes();
  if (onLeave[prev]) onLeave[prev]();
  showOnly(name);
  scenes[name].scrollTop = 0;
  if (onEnter[name]) onEnter[name]();
  setTimeout(() => { try { scenes[name].focus({ preventScroll: true }); } catch (e) {} }, 80);
}
function appear(btn, delaySec = 0) {
  btn.hidden = false;
  btn.disabled = false;
  btn.classList.remove('is-appearing', 'is-pulse');
  void btn.offsetWidth;
  btn.style.animationDelay = `${delaySec}s, ${delaySec + 0.8}s`;
  btn.classList.add('is-appearing', 'is-pulse');
}
let toastTimer = 0;
function toast(msg, ms = 3400) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), ms);
}

/* ---------- Sound: generated piano, effects, optional MP3 ---------- */
const Snd = (() => {
  const el = $('#music-el');
  const btn = $('#music-btn');
  const PREF = 'bl-sound';
  const hasSession = !!navigator.audioSession;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const keepAlive = isIOS && !hasSession;
  const SILENT = (() => {
    const n = 1600, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
    w(36, 'data'); dv.setUint32(40, n, true); buf.fill(128, 44);
    let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return 'data:audio/wav;base64,' + btoa(s);
  })();
  let ctx = null, master, musicBus, pianoBus, sfxBus, reverb, noiseBuf, wave, elNode = null;
  let on = false, unlocked = false, mode = 'piano', sched = 0, nextT = 0, step = -16;
  let cands = [], ci = 0;
  const canRoute = location.protocol !== 'file:';

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.3; reverb.connect(wet); wet.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    pianoBus = ctx.createGain(); pianoBus.gain.value = 1; pianoBus.connect(musicBus); pianoBus.connect(reverb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.75; sfxBus.connect(master); sfxBus.connect(reverb);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const real = new Float32Array([0, 1, 0.42, 0.2, 0.12, 0.06, 0.035, 0.02, 0.01]);
    wave = ctx.createPeriodicWave(real, new Float32Array(real.length));
    return ctx;
  }
  /* Call from inside a tap/click so iOS and autoplay rules allow sound later. */
  function unlock() {
    if (!ensure()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (hasSession) { try { navigator.audioSession.type = 'playback'; } catch (e) {} }
    if (unlocked) return;
    unlocked = true;
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {}
    if (!el.getAttribute('src')) el.src = SILENT;
    el.loop = true;
    const p = el.play();
    if (p && p.then) p.then(() => { if (!keepAlive && el.src === SILENT) el.pause(); }).catch(() => {});
  }
  function fade(target, dur) {
    if (!ctx) return;
    const g = musicBus.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(target, t + dur);
  }

  /* -- piano -- */
  function pianoNote(t, midi, vel, len) {
    const f = mtof(midi), o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.setPeriodicWave(wave); o.frequency.value = f;
    lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(8000, f * 6 + 900), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(220, f * 1.6), t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.45, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(lp); lp.connect(g); g.connect(pianoBus);
    o.start(t); o.stop(t + len + 0.05);
  }
  function bell(t, midi, vel, dest, len = 1.4) {
    const f = mtof(midi), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.76;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.003); g2.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.35);
    o.connect(g); o2.connect(g2); g.connect(dest || sfxBus); g2.connect(dest || sfxBus);
    o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  }
  function pad(t, notes, len) {
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + 0.9);
    g.gain.setValueAtTime(0.02, t + len - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + len + 1.2);
    lp.connect(g); g.connect(pianoBus);
    for (const m of notes) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(lp); o.start(t); o.stop(t + len + 1.3);
    }
  }
  // Original gentle piece in F major over F–C–Dm–Am–B♭–F–B♭–C. [eighth position, midi note, length in eighths]
  const BPM = 66, E = 60 / BPM / 2;
  const PROG = [[41, 4], [48, 4], [50, 3], [45, 3], [46, 4], [41, 4], [46, 4], [48, 4]];
  const MA = [[[0, 81, 3], [3, 79, 1], [4, 77, 4]], [[0, 76, 3], [3, 77, 1], [4, 79, 4]], [[0, 77, 3], [3, 76, 1], [4, 74, 4]], [[0, 72, 4], [4, 76, 4]],
    [[0, 74, 3], [3, 72, 1], [4, 70, 4]], [[0, 69, 2], [2, 72, 2], [4, 77, 4]], [[0, 74, 3], [3, 77, 1], [4, 79, 2], [6, 77, 2]], [[0, 76, 4], [4, 79, 4]]];
  const MB = [[[0, 84, 2], [2, 81, 2], [4, 77, 2], [6, 81, 2]], [[0, 79, 4], [4, 76, 2], [6, 79, 2]], [[0, 81, 3], [3, 77, 1], [4, 74, 4]], [[0, 76, 2], [2, 72, 2], [4, 69, 4]],
    [[0, 74, 2], [2, 77, 2], [4, 82, 4]], [[0, 81, 3], [3, 79, 1], [4, 77, 4]], [[0, 74, 2], [2, 77, 2], [4, 81, 4]], [[0, 79, 6], [6, 76, 2]]];
  function scheduleStep(s, t) {
    const bar = Math.floor(s / 8), pos = ((s % 8) + 8) % 8;
    const [b, third] = PROG[bar < 0 ? 8 + bar : bar % 8];
    const arp = [b, b + 7, b + 12, b + 12 + third, b + 19, b + 12 + third, b + 12, b + 7];
    const hum = () => (Math.random() - 0.5) * 0.012;
    pianoNote(t + hum(), arp[pos], pos === 0 ? 0.2 : 0.1 + Math.random() * 0.03, pos === 0 ? 3.4 : 2.2);
    if (pos === 0) pad(t, [b + 12, b + 12 + third, b + 19], E * 8);
    if (bar < 0) return;
    const sec = Math.floor(bar / 8) % 4, phrase = sec % 2 === 0 ? MA : MB;
    for (const [p, m, d] of phrase[bar % 8]) {
      if (p !== pos) continue;
      const v = (sec === 0 ? 0.16 : 0.2) * (0.92 + Math.random() * 0.14);
      pianoNote(t + hum(), m, v, Math.min(3.2, d * E + 1.4));
      if (sec >= 2 && Math.random() < 0.55) bell(t + E * 0.5, m + 12, 0.035, pianoBus, 1.2);
    }
  }
  function tick() {
    if (!ctx) return;
    if (nextT < ctx.currentTime - 0.1) nextT = ctx.currentTime + 0.05;
    const ahead = ctx.currentTime + 0.35;
    while (nextT < ahead) { scheduleStep(step, nextT); nextT += E; step++; }
  }
  function startPiano() { if (sched) return; nextT = ctx.currentTime + 0.12; sched = setInterval(tick, 60); tick(); }
  function stopPiano() { clearInterval(sched); sched = 0; }

  /* -- your own MP3 (music/ folder, named in config.js) -- */
  const cur = () => cands[ci] || '';
  function routeEl() {
    if (elNode) return true;
    if (!ctx || !canRoute) return false;
    try { elNode = ctx.createMediaElementSource(el); elNode.connect(musicBus); return true; } catch (e) { return false; }
  }
  function usePiano() {
    if (el.src && el.src !== SILENT && !el.paused) el.pause();
    if (keepAlive) {
      if (el.src !== SILENT) el.src = SILENT;
      el.loop = true; el.play().catch(() => {});
    }
    startPiano(); fade(0.55, 1.6);
  }
  function useCustom() {
    stopPiano();
    const routed = routeEl();
    if (el.getAttribute('src') !== cur()) el.src = cur();
    el.loop = true;
    const p = el.play(); if (p && p.catch) p.catch(() => {});
    if (routed) fade(0.9, 1.4);
  }
  /* A missing or misnamed file: try the next spelling, then fall back to the built-in piano. */
  el.addEventListener('error', () => {
    if (mode !== 'custom' || el.getAttribute('src') !== cur()) return;
    if (ci + 1 < cands.length) { ci++; el.src = cur(); if (on) el.play().catch(() => {}); }
    else { mode = 'piano'; if (on) usePiano(); }
  });
  function setCustom(list) {
    cands = (Array.isArray(list) ? list : [list]).filter(Boolean); ci = 0;
    const was = mode;
    mode = cands.length ? 'custom' : 'piano';
    if (!on) return;
    if (mode === 'custom') useCustom(); else if (was === 'custom') usePiano();
  }

  /* -- on / off -- */
  function updateBtn() {
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Turn music off' : 'Play music');
  }
  function turnOn() {
    on = true; updateBtn();
    if (!ensure()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (mode === 'custom' && cur()) useCustom(); else usePiano();
  }
  function turnOff() {
    on = false; updateBtn();
    if (!ctx) { el.pause(); return; }
    if (!elNode && mode === 'custom') el.pause();
    fade(0, 0.8);
    setTimeout(() => { if (!on) { stopPiano(); if (!el.paused) el.pause(); } }, 900);
  }
  btn.addEventListener('click', () => {
    unlock();
    if (on) { turnOff(); store.set(PREF, 'off'); } else { turnOn(); store.set(PREF, 'on'); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) { ctx.suspend().catch(() => {}); if (!el.paused) el.pause(); }
    else {
      ctx.resume().catch(() => {});
      if (mode === 'custom' && cur()) el.play().catch(() => {});
      else if (keepAlive) el.play().catch(() => {});
    }
  });

  /* -- effects -- */
  function noise(t, dur, o) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1800, t); f.Q.value = o.q == null ? 0.8 : o.q;
    if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vel || 0.3, t + (o.attack || 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.05);
  }
  let lastPop = 0;
  const fx = {
    gift(t) { noise(t, 1.2, { type: 'highpass', freq: 2500, sweepTo: 9000, q: 0.3, vel: 0.12, attack: 0.25 }); [77, 81, 84, 86, 89, 93, 96, 98].forEach((m, i) => bell(t + 0.15 + i * 0.06, m, 0.12, sfxBus, 1.8)); },
    paper(t) { noise(t, 0.14, { freq: 2600, q: 0.9, vel: 0.2, attack: 0.01 }); noise(t + 0.16, 0.18, { freq: 3200, q: 1, vel: 0.16 }); noise(t + 0.4, 0.25, { freq: 2200, q: 0.7, vel: 0.12, attack: 0.03 }); bell(t + 0.55, 84, 0.1, sfxBus, 1.6); bell(t + 0.75, 89, 0.09, sfxBus, 1.8); },
    blow(t) { noise(t, 0.45, { freq: 900, q: 0.5, vel: 0.32, attack: 0.04, sweepTo: 500 }); noise(t, 0.2, { type: 'lowpass', freq: 400, q: 0.3, vel: 0.2, attack: 0.01 }); },
    wish(t) { [65, 69, 72, 77, 81, 84, 89].forEach((m, i) => bell(t + i * 0.09, m, 0.11, sfxBus, 2)); },
    chime(t) { bell(t, 84, 0.08, sfxBus, 1.6); bell(t + 0.12, 88, 0.07, sfxBus, 1.8); },
    pop(t) { const n = performance.now(); if (n - lastPop < 120) return; lastPop = n; bell(t, pick([84, 86, 89, 91, 93, 96]), 0.045, sfxBus, 0.5); }
  };
  const sfx = {};
  for (const k of Object.keys(fx)) sfx[k] = () => { if (!on || !ctx || ctx.state === 'closed') return; try { fx[k](ctx.currentTime + 0.02); } catch (e) {} };

  return { unlock, on: turnOn, off: turnOff, isOn: () => on, pref: () => store.get(PREF), setCustom, sfx };
})();

/* ---------- Canvas effects: sky, confetti, hearts, fireworks ---------- */
const FX = (() => {
  const bg = $('#bg-canvas'), fg = $('#fx-canvas');
  const bx = bg.getContext('2d'), fx = fg.getContext('2d');
  let W = innerWidth, H = innerHeight, bd = 1, fd = 1;
  const stars = [], dust = [], amb = [];
  let back = [], front = [];
  const modes = { confetti: false, hearts: false, fireworks: false, shooting: false };
  const nextAt = { confetti: 0, hearts: 0, fireworks: 0, shooting: 0, amb: 0 };
  const timers = [];
  const CONF = ['#f6b8cf', '#ffd6e5', '#cbb6ef', '#e9cf9a', '#fff4e6', '#ec95b6', '#b9a3f0', '#f3d9a4'];
  const HEARTC = ['#f6b8cf', '#ff9fc2', '#ffd1e1', '#cbb6ef', '#e9cf9a', '#ff86b0'];
  const FWC = ['#ffc2d9', '#e9cf9a', '#cbb6ef', '#fff1d6', '#ff9fc2', '#c9e8ff'];
  const MAXP = 900;
  const scale = () => clamp(Math.min(W, H) / 720, 0.7, 1.25);
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function sprite(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return c; }
  const glowCache = {}, heartCache = {};
  function glow(c) {
    return glowCache[c] || (glowCache[c] = sprite(64, (x, s) => {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.16, hexA(c, 1)); g.addColorStop(0.42, hexA(c, 0.32)); g.addColorStop(1, hexA(c, 0));
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }));
  }
  function heartPath(x, cx, cy, w) {
    const t = w / 2;
    x.beginPath(); x.moveTo(cx, cy + t * 0.9);
    x.bezierCurveTo(cx - t * 1.3, cy + t * 0.05, cx - t * 0.62, cy - t * 1.02, cx, cy - t * 0.35);
    x.bezierCurveTo(cx + t * 0.62, cy - t * 1.02, cx + t * 1.3, cy + t * 0.05, cx, cy + t * 0.9);
    x.closePath();
  }
  function heart(c) {
    return heartCache[c] || (heartCache[c] = sprite(72, (x, s) => {
      x.shadowColor = hexA(c, 0.9); x.shadowBlur = 12; x.fillStyle = c;
      heartPath(x, s / 2, s / 2 + 3, s * 0.56); x.fill();
      x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.5)';
      x.beginPath(); x.ellipse(s * 0.4, s * 0.39, s * 0.06, s * 0.035, -0.6, 0, Math.PI * 2); x.fill();
    }));
  }
  const starSprite = sprite(64, (x, s) => {
    const c = s / 2, g = x.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.2, 'rgba(255,240,220,.35)'); g.addColorStop(1, 'rgba(255,240,220,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.moveTo(c, 2);
    x.quadraticCurveTo(c + 2, c - 2, s - 2, c); x.quadraticCurveTo(c + 2, c + 2, c, s - 2);
    x.quadraticCurveTo(c - 2, c + 2, 2, c); x.quadraticCurveTo(c - 2, c - 2, c, 2); x.fill();
  });

  function newDust(anywhere) {
    return { x: rand(0, W), y: anywhere ? rand(0, H) : H + 10, vx: rand(-0.12, 0.12), vy: rand(-0.32, -0.08), r: rand(1.2, 3), a: rand(0.25, 0.7), ph: rand(0, 6.28), c: pick(['#e9cf9a', '#f6b8cf', '#fff4e6', '#cbb6ef']) };
  }
  function seed() {
    stars.length = 0;
    const n = clamp(Math.round((W * H) / 6800), 60, 180);
    for (let i = 0; i < n; i++) {
      const big = Math.random() < 0.07;
      stars.push({ x: Math.random(), y: Math.pow(Math.random(), 1.4) * 0.85, r: big ? rand(1.6, 2.4) : rand(0.5, 1.4), a: rand(0.35, 0.95), sp: rand(0.5, 1.8), ph: rand(0, 6.28), big, c: pick(['#ffffff', '#fff1d6', '#ffe0ee', '#e6dcff']) });
    }
    dust.length = 0;
    for (let i = 0, dn = isSmall ? 22 : 38; i < dn; i++) dust.push(newDust(true));
  }
  function resize() {
    W = innerWidth; H = innerHeight;
    bd = Math.min(window.devicePixelRatio || 1, 1.5); fd = Math.min(window.devicePixelRatio || 1, 2);
    bg.width = Math.round(W * bd); bg.height = Math.round(H * bd);
    fg.width = Math.round(W * fd); fg.height = Math.round(H * fd);
    bx.setTransform(bd, 0, 0, bd, 0, 0); fx.setTransform(fd, 0, 0, fd, 0, 0);
    seed();
  }

  /* -- spawners -- */
  function confettiPiece(x, y, vx, vy) {
    return { k: 'c', x, y, vx, vy, w: rand(5, 9), h: rand(8, 14), c: pick(CONF), rot: rand(0, 6.28), vr: rand(-0.12, 0.12), ph: rand(0, 6.28), vph: rand(0.06, 0.16), round: Math.random() < 0.25, life: 0 };
  }
  function burstConfetti(x, y, n) {
    n = reduceMotion ? Math.round(n / 3) : n;
    for (let i = 0; i < n && front.length < MAXP; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05), sp = rand(5, 13) * scale();
      front.push(confettiPiece(x, y, Math.cos(a) * sp, Math.sin(a) * sp));
    }
  }
  function rainConfetti(n) {
    n = reduceMotion ? Math.round(n / 3) : n;
    for (let i = 0; i < n && front.length < MAXP; i++) front.push(confettiPiece(rand(0, W), rand(-H * 0.6, -10), rand(-0.6, 0.6), rand(1, 2.6)));
  }
  function hearts(x, y, n, o = {}) {
    n = reduceMotion ? Math.ceil(n / 2) : n;
    const pw = o.power || 1;
    for (let i = 0; i < n && front.length < MAXP; i++) {
      const a = rand(-Math.PI * 0.92, -Math.PI * 0.08), sp = rand(2, 6) * pw * scale();
      front.push({ k: 'h', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: rand(12, 26), rot: rand(-0.4, 0.4), vr: rand(-0.03, 0.03), c: pick(HEARTC), life: 0, max: rand(70, 110), drag: 0.955, lift: -0.04 });
    }
  }
  function sparkle(x, y, n, o = {}) {
    for (let i = 0; i < n && front.length < MAXP; i++) {
      const a = rand(0, 6.28), sp = o.burst ? rand(1.5, 5) * scale() : rand(0.2, 1.1);
      front.push({ k: 's', x: x + rand(-3, 3), y: y + rand(-3, 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.ember ? 0.6 : 0), r: o.soft ? rand(1.5, 3) : rand(2, 4.5), c: o.ember ? '#ffd38a' : pick(['#fff4e6', '#e9cf9a', '#f6b8cf', '#ffffff']), life: 0, max: o.soft ? rand(26, 40) : rand(34, 60) });
    }
  }
  function firework(tx, ty) {
    if (back.length > 1100) return;
    const x = tx == null ? rand(0.14, 0.86) * W : tx, y = ty == null ? rand(0.1, 0.38) * H : ty;
    const sx = x + rand(-50, 50);
    back.push({ k: 'r', x: sx, y: H + 10, sx, sy: H + 10, tx: x, ty: y, p: 0, dur: rand(48, 70), c: pick(FWC) });
  }
  function explode(x, y, c) {
    const n = reduceMotion ? 24 : (isSmall ? 52 : 76), s = scale(), heartShape = Math.random() < 0.34, c2 = pick(FWC);
    back.push({ k: 'f', x, y, life: 0, max: 18, c });
    for (let i = 0; i < n; i++) {
      let vx, vy;
      if (heartShape) {
        const t = (i / n) * Math.PI * 2;
        vx = (16 * Math.pow(Math.sin(t), 3)) / 16 * 3.1 * s;
        vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * 3.1 * s;
      } else {
        const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05), sp = rand(1.4, 3.6) * s;
        vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
      }
      back.push({ k: 'p', x, y, vx, vy, c: i % 3 === 0 ? c2 : c, r: rand(1.6, 2.6), life: 0, max: rand(55, 85), g: heartShape ? 0.018 : 0.035, drag: heartShape ? 0.975 : 0.982 });
    }
  }
  function fireworkShow(count, overMs) {
    for (let i = 0; i < count; i++) timers.push(setTimeout(firework, i === 0 ? 0 : rand(0, overMs)));
  }
  function setModes(o) {
    const t = performance.now();
    for (const k of Object.keys(o)) { if (o[k] && !modes[k]) nextAt[k] = t + (k === 'fireworks' ? 2600 : 200); modes[k] = !!o[k]; }
  }
  function stopModes() {
    for (const k of Object.keys(modes)) modes[k] = false;
    while (timers.length) clearTimeout(timers.pop());
  }

  /* -- update -- */
  function update(dt, t) {
    if (modes.confetti && t > nextAt.confetti) { nextAt.confetti = t + (isSmall ? 260 : 150); if (!reduceMotion && front.length < MAXP) front.push(confettiPiece(rand(0, W), -12, rand(-0.5, 0.5), rand(1, 2.2))); }
    if (modes.hearts && t > nextAt.hearts) {
      nextAt.hearts = t + (reduceMotion ? 1400 : (isSmall ? 340 : 220));
      if (front.length < MAXP) front.push({ k: 'h', rise: true, x: rand(0, W), y: H + 24, vx: rand(-0.3, 0.3), vy: rand(-1.1, -2.2) * scale(), size: rand(12, 30), rot: rand(-0.3, 0.3), vr: rand(-0.01, 0.01), c: pick(HEARTC), life: 0, max: 2000 });
    }
    if (modes.fireworks && t > nextAt.fireworks) { nextAt.fireworks = t + rand(2200, 4300) * (reduceMotion ? 2 : 1); firework(); }
    if (modes.shooting && !reduceMotion && t > nextAt.shooting) { nextAt.shooting = t + rand(5000, 11000); back.push({ k: 'ss', x: rand(0.08, 0.7) * W, y: rand(0.04, 0.3) * H, vx: rand(7, 10) * scale(), vy: rand(2.4, 3.6) * scale(), life: 0, max: 46 }); }
    if (!reduceMotion && t > nextAt.amb && amb.length < 7) { nextAt.amb = t + rand(1800, 3200); amb.push({ x: rand(0, W), y: H + 30, vy: rand(-0.3, -0.6), sw: rand(0.3, 1), ph: rand(0, 6.28), size: rand(16, 34), a: rand(0.12, 0.3), c: pick(HEARTC), rot: rand(-0.3, 0.3) }); }

    for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.ph += 0.02 * dt; if (d.y < -10 || d.x < -10 || d.x > W + 10) Object.assign(d, newDust(false)); }
    for (let i = amb.length - 1; i >= 0; i--) { const h = amb[i]; h.y += h.vy * dt; h.ph += 0.015 * dt; if (h.y < -40) amb.splice(i, 1); }

    let j = 0;
    for (let i = 0; i < back.length; i++) {
      const p = back[i]; let alive = true;
      if (p.k === 'r') {
        p.p += dt / p.dur;
        const e = 1 - Math.pow(1 - Math.min(p.p, 1), 3);
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e;
        if (back.length < 1300) back.push({ k: 't', x: p.x, y: p.y, life: 0, max: 18, c: p.c });
        if (p.p >= 1) { explode(p.tx, p.ty, p.c); alive = false; }
      } else if (p.k === 'p') {
        const dr = Math.pow(p.drag, dt);
        p.vx *= dr; p.vy = p.vy * dr + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
        alive = p.life < p.max;
      } else if (p.k === 'ss') { p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt; alive = p.life < p.max; }
      else { p.life += dt; alive = p.life < p.max; }
      if (alive) back[j++] = p;
    }
    back.length = j;

    j = 0;
    for (let i = 0; i < front.length; i++) {
      const p = front[i]; let alive = true;
      if (p.k === 'c') {
        p.vx *= Math.pow(0.985, dt); p.vy = Math.min(p.vy + 0.16 * dt, 2.8);
        p.x += (p.vx + Math.sin(p.ph) * 0.5) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += p.vph * dt; p.life += dt;
        alive = p.y < H + 30 && p.life < 1400;
      } else if (p.k === 'h') {
        if (p.rise) { p.x += (p.vx + Math.sin(p.life * 0.03) * 0.4) * dt; p.y += p.vy * dt; p.life += dt; alive = p.y > -50; }
        else { const dr = Math.pow(p.drag, dt); p.vx *= dr; p.vy = p.vy * dr + p.lift * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt; alive = p.life < p.max; }
        p.rot += p.vr * dt;
      } else {
        const dr = Math.pow(0.96, dt); p.vx *= dr; p.vy = p.vy * dr - 0.01 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
        alive = p.life < p.max;
      }
      if (alive) front[j++] = p;
    }
    front.length = j;
  }

  /* -- draw -- */
  function drawBack(t) {
    bx.clearRect(0, 0, W, H);
    const tw = t * 0.001;
    for (const s of stars) {
      const a = reduceMotion ? s.a : s.a * (0.5 + 0.5 * Math.sin(tw * s.sp + s.ph));
      if (a < 0.03) continue;
      const sz = s.big ? s.r * 9 : s.r * 5;
      bx.globalAlpha = a; bx.drawImage(s.big ? starSprite : glow(s.c), s.x * W - sz / 2, s.y * H - sz / 2, sz, sz);
    }
    for (const d of dust) { const sz = d.r * 5; bx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(d.ph)); bx.drawImage(glow(d.c), d.x - sz / 2, d.y - sz / 2, sz, sz); }
    for (const h of amb) {
      const x = h.x + Math.sin(h.ph) * 18 * h.sw, r = h.rot + Math.sin(h.ph) * 0.15, cs = Math.cos(r) * bd, sn = Math.sin(r) * bd;
      bx.globalAlpha = h.a; bx.setTransform(cs, sn, -sn, cs, x * bd, h.y * bd);
      bx.drawImage(heart(h.c), -h.size / 2, -h.size / 2, h.size, h.size);
    }
    bx.setTransform(bd, 0, 0, bd, 0, 0);
    bx.globalCompositeOperation = 'lighter';
    for (const p of back) {
      if (p.k === 'p') {
        let a = Math.pow(1 - p.life / p.max, 1.2);
        if (p.life > p.max * 0.6 && Math.random() < 0.12) a *= 0.3;
        const sz = p.r * 6; bx.globalAlpha = a; bx.drawImage(glow(p.c), p.x - sz / 2, p.y - sz / 2, sz, sz);
      } else if (p.k === 't') {
        bx.globalAlpha = 1 - p.life / p.max; bx.drawImage(glow(p.c), p.x - 2.5, p.y - 2.5, 5, 5);
      } else if (p.k === 'r') {
        bx.globalAlpha = 1; bx.drawImage(glow(p.c), p.x - 5, p.y - 5, 10, 10);
      } else if (p.k === 'f') {
        const k = 1 - p.life / p.max, sz = 30 + 90 * k; bx.globalAlpha = 0.55 * k; bx.drawImage(glow(p.c), p.x - sz / 2, p.y - sz / 2, sz, sz);
      } else if (p.k === 'ss') {
        const a = 1 - p.life / p.max, ex = p.x - p.vx * 9, ey = p.y - p.vy * 9;
        const g = bx.createLinearGradient(p.x, p.y, ex, ey);
        g.addColorStop(0, `rgba(255,250,240,${a})`); g.addColorStop(1, 'rgba(255,250,240,0)');
        bx.globalAlpha = 1; bx.strokeStyle = g; bx.lineWidth = 1.6; bx.beginPath(); bx.moveTo(p.x, p.y); bx.lineTo(ex, ey); bx.stroke();
        bx.globalAlpha = a; bx.drawImage(glow('#fff4e6'), p.x - 6, p.y - 6, 12, 12);
      }
    }
    bx.globalCompositeOperation = 'source-over'; bx.globalAlpha = 1;
  }
  let frontHad = false;
  function drawFront() {
    if (!front.length && !frontHad) return;
    fx.setTransform(fd, 0, 0, fd, 0, 0);
    fx.clearRect(0, 0, W, H);
    frontHad = front.length > 0;
    for (const p of front) {
      if (p.k === 'c') {
        const cs = Math.cos(p.rot), sn = Math.sin(p.rot), sy = Math.cos(p.ph);
        fx.globalAlpha = 1; fx.setTransform(cs * fd, sn * fd, -sn * sy * fd, cs * sy * fd, p.x * fd, p.y * fd);
        fx.fillStyle = p.c;
        if (p.round) { fx.beginPath(); fx.arc(0, 0, p.w * 0.45, 0, 6.283); fx.fill(); } else fx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.k === 'h') {
        const a = p.rise ? clamp(p.y / (H * 0.35), 0, 1) * 0.9 : 1 - Math.pow(p.life / p.max, 2);
        const cs = Math.cos(p.rot) * fd, sn = Math.sin(p.rot) * fd, sz = p.size * 1.7;
        fx.globalAlpha = a; fx.setTransform(cs, sn, -sn, cs, p.x * fd, p.y * fd);
        fx.drawImage(heart(p.c), -sz / 2, -sz / 2, sz, sz);
      }
    }
    fx.setTransform(fd, 0, 0, fd, 0, 0);
    fx.globalCompositeOperation = 'lighter';
    for (const p of front) if (p.k === 's') { const sz = p.r * 5; fx.globalAlpha = 1 - p.life / p.max; fx.drawImage(glow(p.c), p.x - sz / 2, p.y - sz / 2, sz, sz); }
    fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1;
  }

  let raf = 0, last = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let dt = last ? (t - last) / 16.667 : 1; last = t;
    if (dt > 3) dt = 3;
    update(dt, t); drawBack(t); drawFront();
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

  return { init() { resize(); start(); }, burstConfetti, rainConfetti, hearts, sparkle, firework, fireworkShow, setModes, stopModes };
})();

/* ---------- Balloons (DOM, behind the scenes) ---------- */
const Balloons = (() => {
  const box = $('#balloons');
  const PAL = [['#ffd6e5', '#ec8fb3'], ['#e6dbff', '#a688d8'], ['#fbefd2', '#c9a462'], ['#fff6ea', '#e2c7a2'], ['#ffc9d8', '#e27a9e']];
  let timer = 0;
  function spawn(delay) {
    if (box.childElementCount > 10) return;
    const [c1, c2] = pick(PAL), s = rand(0.75, 1.15), dur = rand(11, 17) * (reduceMotion ? 1.6 : 1);
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.cssText = `--x:${rand(2, 88).toFixed(1)}%;--s:${s.toFixed(2)};--dur:${dur.toFixed(1)}s;--sw:${rand(2.6, 4).toFixed(1)}s;--drift:${rand(-40, 40).toFixed(0)}px;--c1:${c1};--c2:${c2};animation-delay:${delay || 0}ms`;
    b.innerHTML = '<div class="balloon-sway"><div class="balloon-body"></div><svg viewBox="0 0 26 92" aria-hidden="true"><path d="M13 0 C4 20 22 38 13 56 S6 82 13 92" fill="none" stroke="rgba(233,207,154,.75)" stroke-width="1.2"/></svg></div>';
    b.addEventListener('animationend', e => { if (e.target === b) b.remove(); });
    box.appendChild(b);
  }
  return {
    release(n) { for (let i = 0; i < n; i++) spawn(i * 380); },
    start() { clearInterval(timer); timer = setInterval(() => spawn(0), reduceMotion ? 7000 : 3600); },
    stop() { clearInterval(timer); timer = 0; },
    dim(on) { box.classList.toggle('is-dim', !!on); }
  };
})();

/* ---------- Tap hearts + soft cursor light ---------- */
function initInteractions() {
  document.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('.editor, .edit-fab, input, textarea, label, .lb-figure, .letter-paper')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    FX.hearts(e.clientX, e.clientY, isSmall ? 6 : 8);
    FX.sparkle(e.clientX, e.clientY, 5, { burst: true });
    if (!(e.target.closest && e.target.closest('button'))) Snd.sfx.pop();
  }, { passive: true });
  if (!finePointer || reduceMotion) return;
  const glowEl = $('#cursor-glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, lastSpark = 0, active = false;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!active) { active = true; gx = tx; gy = ty; glowEl.classList.add('is-on'); }
    const n = performance.now();
    if (n - lastSpark > 55) { lastSpark = n; FX.sparkle(tx, ty, 1, { soft: true }); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { active = false; glowEl.classList.remove('is-on'); });
  (function loop() {
    gx += (tx - gx) * 0.18; gy += (ty - gy) * 0.18;
    glowEl.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Fonts (needed before measuring the handwritten name) ---------- */
const fontsReady = (async () => {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([
          document.fonts.load('400 100px "Great Vibes"', cfg.name + ' 0123456789'),
          document.fonts.load('500 20px "Dancing Script"', 'Hôm nay là một ngày'),
          document.fonts.load('600 16px "Josefin Sans"', 'HAPPY BIRTHDAY')
        ]),
        sleep(2500)
      ]);
    }
  } catch (e) {}
})();

/* ---------- Handwritten name ---------- */
let nameRaf = 0;
function buildNameSvg() {
  const n = esc(cfg.name);
  const mask = id => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="9000" height="9000"><rect id="${id}r" x="0" y="-400" width="0" height="1200" fill="url(#nmg)"/></mask>`;
  $('#name-svg').innerHTML = `<defs><linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6ea"/><stop offset=".5" stop-color="#f8c6da"/><stop offset="1" stop-color="#ecd29e"/></linearGradient><linearGradient id="nmg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>${mask('nm1')}${mask('nm2')}</defs><text class="n-fill" x="0" y="100" font-size="100" fill="url(#ng)" mask="url(#nm2)">${n}</text><text class="n-stroke" x="0" y="100" font-size="100" mask="url(#nm1)">${n}</text>`;
}
function nameBox() {
  let bb = null;
  try { bb = $('#name-svg .n-fill').getBBox(); } catch (e) {}
  return bb && bb.width ? bb : { x: 0, y: 22, width: 400, height: 100 };
}
function revealName(instant) {
  cancelAnimationFrame(nameRaf);
  const svg = $('#name-svg'), bb = nameBox(), pad = 16;
  svg.setAttribute('viewBox', `${(bb.x - pad).toFixed(1)} ${(bb.y - pad * 0.6).toFixed(1)} ${(bb.width + pad * 2).toFixed(1)} ${(bb.height + pad * 1.2).toFixed(1)}`);
  const r1 = $('#nm1r'), r2 = $('#nm2r'), x0 = bb.x - pad, total = (bb.width + pad * 2) * 1.18;
  r1.setAttribute('x', x0); r2.setAttribute('x', x0);
  if (instant || reduceMotion) { r1.setAttribute('width', total); r2.setAttribute('width', total); return; }
  r1.setAttribute('width', 0); r2.setAttribute('width', 0);
  const dur = 2600, lag = 520, t0 = performance.now();
  const ease = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  let lastSpark = 0;
  const step = now => {
    const p1 = clamp((now - t0) / dur, 0, 1), p2 = clamp((now - t0 - lag) / dur, 0, 1), w1 = total * ease(p1);
    r1.setAttribute('width', w1.toFixed(1));
    r2.setAttribute('width', (total * ease(p2)).toFixed(1));
    if (p1 < 0.97 && now - lastSpark > 45) {
      lastSpark = now;
      const rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      if (vb && vb.width) FX.sparkle(rc.left + ((x0 + w1 * 0.86 - vb.x) / vb.width) * rc.width, rc.top + rc.height * rand(0.25, 0.8), 2);
    }
    if (p2 < 1) nameRaf = requestAnimationFrame(step);
  };
  nameRaf = requestAnimationFrame(step);
}

/* ---------- Cake (generated SVG) ---------- */
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const TIERS = [
  { cx: 150, top: 190, rx: 112, ry: 17, h: 64, body: ['#d97ea5', '#f3abc7', '#ffd6e5', '#f3abc7', '#d27aa0'], face: '#ffc9dc', icing: '#fff6f9', shade: '#f6d8e5', drip: [7, 20], seed: 3 },
  { cx: 150, top: 134, rx: 84, ry: 13, h: 58, body: ['#9a7bd0', '#c5afee', '#e7ddfc', '#c5afee', '#987ace'], face: '#dccff9', icing: '#fffaf3', shade: '#efe3f6', drip: [5, 16], seed: 7 },
  { cx: 150, top: 86, rx: 56, ry: 10, h: 50, body: ['#d9bd8b', '#f5e6c8', '#fff8ea', '#f5e6c8', '#d6b987'], face: '#fff3df', icing: '#ffffff', shade: '#f3e6d0', drip: [4, 12], seed: 11 }
];
const f1 = n => n.toFixed(1);
function icingPath(T) {
  const { cx, top, rx, ry } = T, rnd = mulberry32(T.seed), drips = [];
  for (let x = cx - rx + 8; x < cx + rx - 8;) { const w = 7 + rnd() * 8; drips.push({ xc: x + w / 2, hw: w / 2, d: T.drip[0] + rnd() * (T.drip[1] - T.drip[0]) }); x += w + 4 + rnd() * 10; }
  let d = `M${f1(cx - rx)},${f1(top)} A${rx},${ry} 0 0 1 ${f1(cx + rx)},${f1(top)}`;
  for (let x = cx + rx; x >= cx - rx - 0.01; x -= 1.5) {
    const t = (x - cx) / rx, s = Math.sqrt(Math.max(0, 1 - t * t));
    let extra = 0;
    for (const dr of drips) { const hw = dr.hw * (0.55 + 0.45 * s), u = (x - dr.xc) / hw; if (u > -1 && u < 1) extra = Math.max(extra, dr.d * s * Math.sqrt(1 - u * u)); }
    d += ` L${f1(x)},${f1(top + ry * s + 3 * s + 1 + extra)}`;
  }
  return d + ' Z';
}
function arcPoints(cx, y, rx, ry, n, from = 0.08, to = 0.92) {
  const pts = [];
  for (let k = 0; k < n; k++) { const th = Math.PI * (from + (to - from) * (k / (n - 1))); pts.push({ x: cx - rx * Math.cos(th), y: y + ry * Math.sin(th), s: Math.sin(th) }); }
  return pts;
}
function buildCake() {
  const age = ageFor(cfg.dob);
  let defs = `<radialGradient id="ck-pearl" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff8e6"/><stop offset=".5" stop-color="#e9cf9a"/><stop offset="1" stop-color="#b88f4b"/></radialGradient>
<linearGradient id="ck-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c49a55"/><stop offset=".3" stop-color="#f7e7bf"/><stop offset=".55" stop-color="#d9b778"/><stop offset=".8" stop-color="#f3dfae"/><stop offset="1" stop-color="#c49a55"/></linearGradient>
<linearGradient id="ck-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6bf"/><stop offset="1" stop-color="#cfae6c"/></linearGradient>
<radialGradient id="ck-shadow"><stop offset="0" stop-color="rgba(6,2,16,.55)"/><stop offset="1" stop-color="rgba(6,2,16,0)"/></radialGradient>
<radialGradient id="ck-warm"><stop offset="0" stop-color="rgba(255,214,150,.55)"/><stop offset="1" stop-color="rgba(255,214,150,0)"/></radialGradient>
<radialGradient id="ck-flame" cx=".5" cy=".72" r=".65"><stop offset="0" stop-color="#fff8d6"/><stop offset=".45" stop-color="#ffd166"/><stop offset=".8" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ff7a59" stop-opacity=".85"/></radialGradient>
<radialGradient id="ck-halo"><stop offset="0" stop-color="#ffe8b0" stop-opacity=".8"/><stop offset=".5" stop-color="#ffd38a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></radialGradient>`;
  ['#f39bbf', '#b79ae6', '#e2c27f'].forEach((c, k) => { defs += `<pattern id="ck-cs${k}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="#fff6ee"/><rect width="3.5" height="7" fill="${c}"/></pattern>`; });
  let body = `<ellipse cx="150" cy="282" rx="146" ry="12" fill="url(#ck-shadow)"/><ellipse cx="150" cy="268" rx="134" ry="18" fill="#b88f4b"/><ellipse cx="150" cy="264" rx="134" ry="18" fill="url(#ck-plate)"/><ellipse cx="150" cy="262" rx="118" ry="13" fill="rgba(255,255,255,.25)"/>`;
  TIERS.forEach((T, i) => {
    const { cx, top, rx, ry, h } = T;
    defs += `<linearGradient id="ck-b${i}" x1="0" y1="0" x2="1" y2="0">${T.body.map((c, k) => `<stop offset="${[0, 0.28, 0.55, 0.8, 1][k]}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="ck-i${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.icing}"/><stop offset="1" stop-color="${T.shade}"/></linearGradient>`;
    body += `<path d="M${cx - rx},${top} L${cx - rx},${top + h} A${rx},${ry} 0 0 0 ${cx + rx},${top + h} L${cx + rx},${top} Z" fill="url(#ck-b${i})"/>`;
    if (i === 0) {
      const y0 = top + h * 0.5;
      body += `<path d="M${cx - rx},${y0} A${rx},${ry} 0 0 0 ${cx + rx},${y0} L${cx + rx},${y0 + 8} A${rx},${ry} 0 0 1 ${cx - rx},${y0 + 8} Z" fill="url(#ck-gold)"/>`;
      body += `<path transform="translate(${cx} ${y0 + ry + 5})" d="M0 5 C-7 0 -6 -6 -2 -6 C-1 -6 0 -5 0 -4 C0 -5 1 -6 2 -6 C6 -6 7 0 0 5Z" fill="#fff4e6" stroke="#c49a55" stroke-width=".8"/>`;
    }
    if (i === 1) {
      const pts = arcPoints(cx, top + 20, rx, ry, 6, 0.12, 0.88);
      let sw = '';
      for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1]; sw += `M${f1(a.x)},${f1(a.y)} Q${f1((a.x + b.x) / 2)},${f1((a.y + b.y) / 2 + 12 * Math.max(a.s, b.s))} ${f1(b.x)},${f1(b.y)} `; }
      body += `<path d="${sw}" fill="none" stroke="#fffaf3" stroke-width="2.4" stroke-linecap="round"/>`;
      body += pts.map(p => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(2.8 * (0.6 + 0.4 * p.s))}" fill="url(#ck-pearl)"/>`).join('');
    }
    if (i === 2) {
      body += `<text x="${cx}" y="${top + h * 0.62 + ry * 0.6}" text-anchor="middle" font-size="30" fill="url(#ck-gold)" stroke="#b88f4b" stroke-width=".4" style="font-family:var(--font-script)">${age ? age : '♥'}</text>`;
    }
    body += arcPoints(cx, top + h - 2, rx, ry, i === 0 ? 13 : i === 1 ? 10 : 8).map(p => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(2.8 * (0.55 + 0.45 * p.s))}" fill="url(#ck-pearl)"/>`).join('');
    body += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${T.face}"/>`;
    body += `<path d="${icingPath(T)}" fill="url(#ck-i${i})"/>`;
    body += `<ellipse cx="${cx}" cy="${top - ry * 0.15}" rx="${rx * 0.82}" ry="${ry * 0.55}" fill="rgba(255,255,255,.35)"/>`;
  });
  body += `<ellipse class="cake-glow" cx="150" cy="70" rx="120" ry="72" fill="url(#ck-warm)"/>`;
  const xs = [-34, -17, 0, 17, 34], ys = [88, 86.5, 85.5, 86.5, 88], pat = [0, 1, 2, 1, 0];
  xs.forEach((dx, i) => {
    body += `<g class="candle" data-i="${i}" transform="translate(${150 + dx} ${ys[i]})">
<ellipse cx="0" cy="0.5" rx="5" ry="1.6" fill="rgba(80,40,40,.15)"/>
<rect x="-3.5" y="-34" width="7" height="34" rx="1.6" fill="url(#ck-cs${pat[i]})"/>
<rect x="-3.5" y="-34" width="2.2" height="34" fill="rgba(255,255,255,.35)"/>
<path d="M0 -34 L0 -38.5" stroke="#4b3a33" stroke-width="1.1" stroke-linecap="round"/>
<g class="flame-g"><circle class="halo" cx="0" cy="-46" r="15" fill="url(#ck-halo)"/><path d="M0,-58 C4.6,-51 6.2,-46.5 5,-42.8 C4,-39.8 1.8,-38.2 0,-38.2 C-1.8,-38.2 -4,-39.8 -5,-42.8 C-6.2,-46.5 -4.6,-51 0,-58 Z" fill="url(#ck-flame)"/><path d="M0,-49 C1.9,-46.4 2.6,-44.2 2,-42.3 C1.5,-40.8 .8,-40 0,-40 C-.8,-40 -1.5,-40.8 -2,-42.3 C-2.6,-44.2 -1.9,-46.4 0,-49 Z" fill="#fffdf2"/></g>
<g class="smoke"><circle cx="0" cy="-42" r="3"/><circle cx="1" cy="-42" r="2.4"/><circle cx="-1" cy="-41" r="2"/></g>
<rect class="hit" x="-11" y="-62" width="22" height="66" fill="transparent" pointer-events="all"/></g>`;
  });
  $('#cake-holder').innerHTML = `<svg class="cake-svg" viewBox="0 16 300 280" role="img" aria-label="A three-tier birthday cake with five candles"><defs>${defs}</defs>${body}</svg>`;
}

/* ---------- Scene 1: the gift ---------- */
let opening = false;
function resetGift() {
  $('#gift').classList.remove('is-open', 'is-shaking');
  $('#gift-wrap').classList.remove('is-open');
  $('#btn-open').disabled = false;
  opening = false;
}
onEnter.intro = () => { setSky('intro'); setStep(0); FX.setModes({ shooting: true }); resetGift(); };
async function openGift() {
  if (opening) return;
  opening = true;
  $('#btn-open').disabled = true;
  Snd.unlock();
  if (Snd.pref() !== 'off' && !Snd.isOn()) Snd.on();
  const gift = $('#gift'), wrap = $('#gift-wrap');
  gift.classList.add('is-shaking');
  Snd.sfx.chime();
  await sleep(reduceMotion ? 60 : 620);
  gift.classList.remove('is-shaking');
  gift.classList.add('is-open'); wrap.classList.add('is-open');
  Snd.sfx.gift();
  const r = gift.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height * 0.12;
  FX.burstConfetti(ox, oy, isSmall ? 90 : 140);
  FX.hearts(ox, oy, 14, { power: 1.6 });
  FX.sparkle(ox, oy, 30, { burst: true });
  await sleep(reduceMotion ? 300 : 1250);
  const flash = $('#flash');
  flash.style.setProperty('--fx', (ox / innerWidth * 100).toFixed(1) + '%');
  flash.style.setProperty('--fy', (oy / innerHeight * 100).toFixed(1) + '%');
  flash.classList.add('is-on');
  await sleep(650);
  goTo('celebrate');
  await sleep(250);
  flash.classList.remove('is-on');
}

/* ---------- Scenes 2–3: celebrate, cake and wish ---------- */
let wishState = 'idle', blowing = false;
function resetCelebrate() {
  const sc = scenes.celebrate;
  sc.classList.remove('is-wishing', 'is-wished');
  wishState = 'idle'; blowing = false;
  const msg = $('#wish-msg'); msg.classList.remove('is-on'); msg.textContent = '';
  $('#btn-wish').hidden = false; $('#btn-blow').hidden = true; $('#btn-to-memories').hidden = true;
  $('#cake-wrap').classList.remove('is-out');
  $$('.candle').forEach(c => c.classList.remove('is-out'));
  const r1 = $('#nm1r'), r2 = $('#nm2r');
  if (r1 && r2 && !reduceMotion) { r1.setAttribute('width', 0); r2.setAttribute('width', 0); }
}
onEnter.celebrate = () => {
  setSky('celebrate'); setStep(1);
  resetCelebrate();
  later(async () => { await fontsReady; if (current === 'celebrate') revealName(false); }, 550);
  Balloons.dim(false); Balloons.release(isSmall ? 6 : 8); Balloons.start();
  FX.setModes({ confetti: true, fireworks: true });
  FX.rainConfetti(isSmall ? 60 : 110);
  FX.fireworkShow(5, 3200);
  appear($('#btn-wish'), 2.9);
};
onLeave.celebrate = () => { Balloons.stop(); Balloons.dim(false); cancelAnimationFrame(nameRaf); };
function startWish() {
  if (wishState !== 'idle') return;
  wishState = 'wishing';
  Snd.unlock(); Snd.sfx.chime();
  scenes.celebrate.classList.add('is-wishing');
  setSky('wish'); setStep(2);
  FX.setModes({ confetti: false, fireworks: false, shooting: true });
  Balloons.stop(); Balloons.dim(true);
  $('#btn-wish').hidden = true;
  const msg = $('#wish-msg'); msg.textContent = 'Close your eyes… and make a wish 🌙'; msg.classList.add('is-on');
  later(() => { if (wishState === 'wishing') { wishState = 'ready'; appear($('#btn-blow'), 0); } }, reduceMotion ? 800 : 3300);
}
function blowOne(i) {
  const c = $(`.candle[data-i="${i}"]`);
  if (!c || c.classList.contains('is-out')) return false;
  c.classList.add('is-out');
  Snd.sfx.blow();
  const r = c.getBoundingClientRect();
  FX.sparkle(r.left + r.width / 2, r.top + r.height * 0.15, 5, { ember: true });
  return true;
}
function checkAllOut() {
  if ($$('.candle:not(.is-out)').length || wishState === 'done') return;
  wishState = 'done';
  wishDone();
}
async function blowAll() {
  if (blowing || (wishState !== 'ready' && wishState !== 'wishing')) return;
  blowing = true;
  $('#btn-blow').disabled = true;
  for (const c of $$('.candle:not(.is-out)')) { if (current !== 'celebrate') break; blowOne(+c.dataset.i); await sleep(reduceMotion ? 120 : 380); }
  blowing = false;
  checkAllOut();
}
async function wishDone() {
  $('#btn-blow').hidden = true;
  $('#cake-wrap').classList.add('is-out');
  const msg = $('#wish-msg'); msg.classList.remove('is-on');
  await sleep(700);
  if (current !== 'celebrate') return;
  scenes.celebrate.classList.remove('is-wishing'); scenes.celebrate.classList.add('is-wished');
  setSky('celebrate');
  msg.textContent = 'May all your wishes come true! ✨'; msg.classList.add('is-on');
  Snd.sfx.wish();
  FX.rainConfetti(isSmall ? 90 : 160);
  FX.fireworkShow(4, 2400);
  FX.setModes({ confetti: true, fireworks: true });
  Balloons.dim(false); Balloons.release(5); Balloons.start();
  later(() => appear($('#btn-to-memories'), 0), 1500);
}

/* ---------- Scene 4: memory gallery ---------- */
let artUid = 0;
const ART = [
  { cap: 'Dreamy nights 🌙', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a1d52"/><stop offset="1" stop-color="#7a5aa6"/></linearGradient></defs><rect width="160" height="200" fill="url(#${u})"/><g fill="#fff6e0"><circle cx="24" cy="30" r="1.6"/><circle cx="52" cy="58" r="1.1"/><circle cx="34" cy="96" r="1.3"/><circle cx="140" cy="118" r="1.2"/><circle cx="76" cy="22" r="1"/><circle cx="128" cy="24" r="1.4"/></g><circle cx="104" cy="66" r="28" fill="#fff1cf"/><circle cx="116" cy="56" r="26" fill="url(#${u})"/><ellipse cx="40" cy="132" rx="26" ry="7" fill="#fff" opacity=".18"/><ellipse cx="122" cy="142" rx="22" ry="6" fill="#fff" opacity=".14"/><path d="M0 162 C30 148 52 150 80 160 C108 170 130 156 160 150 V200 H0Z" fill="#4b3478"/><path d="M0 178 C40 166 70 172 100 180 C126 186 146 178 160 174 V200 H0Z" fill="#35255a"/></svg>` },
  { cap: 'Adventures ahead 🎈', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9dc"/><stop offset="1" stop-color="#fbe9cf"/></linearGradient></defs><rect width="160" height="200" fill="url(#${u})"/><circle cx="122" cy="152" r="30" fill="#fff3d9" opacity=".85"/><g fill="#fff" opacity=".85"><ellipse cx="38" cy="152" rx="26" ry="9"/><ellipse cx="56" cy="146" rx="16" ry="9"/><ellipse cx="128" cy="62" rx="20" ry="7"/></g><path d="M80 34 C108 34 118 58 112 78 C107 94 92 104 86 112 L74 112 C68 104 53 94 48 78 C42 58 52 34 80 34Z" fill="#f39bbf"/><path d="M80 34 C92 34 96 58 94 78 C92 94 88 104 84 112 L76 112 C72 104 68 94 66 78 C64 58 68 34 80 34Z" fill="#cbb6ef"/><path d="M80 34 C84 40 85 60 84 80 C83 96 81 106 80 112 C79 106 77 96 76 80 C75 60 76 40 80 34Z" fill="#fff4e6"/><path d="M74 112 L76 124 M86 112 L84 124" stroke="#a0784a" stroke-width="1.2"/><rect x="74" y="124" width="12" height="10" rx="2" fill="#c9a462"/></svg>` },
  { cap: 'Sweet days 🧁', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="${u}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#fde7ef"/><circle cx="5" cy="5" r="2" fill="#f8c9da"/><circle cx="15" cy="15" r="2" fill="#e9defa"/></pattern></defs><rect width="160" height="200" fill="url(#${u})"/><ellipse cx="80" cy="170" rx="44" ry="7" fill="rgba(120,60,90,.12)"/><path d="M50 120 L110 120 L102 168 L58 168 Z" fill="#f39bbf"/><g stroke="#e27fa6" stroke-width="2"><path d="M61 120 L64 168"/><path d="M71 120 L72 168"/><path d="M80 120 L80 168"/><path d="M89 120 L88 168"/><path d="M99 120 L96 168"/></g><ellipse cx="80" cy="118" rx="34" ry="12" fill="#fff4ea"/><ellipse cx="80" cy="104" rx="28" ry="12" fill="#fffaf4"/><ellipse cx="80" cy="91" rx="20" ry="10" fill="#fff4ea"/><path d="M80 72 C88 76 90 84 80 86 C70 84 72 76 80 72Z" fill="#fffaf4"/><g stroke-width="2.4" stroke-linecap="round"><path d="M64 110 l4 -2" stroke="#cbb6ef"/><path d="M92 100 l3 3" stroke="#e9cf9a"/><path d="M74 96 l-3 2" stroke="#f39bbf"/><path d="M96 114 l4 1" stroke="#cbb6ef"/><path d="M84 106 l2 -3" stroke="#f39bbf"/></g><circle cx="80" cy="68" r="7" fill="#e8577f"/><circle cx="77.5" cy="65.5" r="2" fill="#fff" opacity=".6"/><path d="M80 61 C82 54 88 50 92 48" stroke="#7a9a6a" stroke-width="1.6" fill="none"/></svg>` },
  { cap: 'Blooming joy 🌷', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece2ff"/><stop offset="1" stop-color="#ffe3ee"/></linearGradient></defs><rect width="160" height="200" fill="url(#${u})"/><ellipse cx="80" cy="182" rx="70" ry="12" fill="#d9ccef"/><g fill="none" stroke="#8fb08a" stroke-width="3" stroke-linecap="round"><path d="M56 178 C56 150 58 126 60 106"/><path d="M80 180 C80 146 81 116 82 88"/><path d="M106 178 C106 152 104 132 102 114"/></g><path d="M58 168 C42 156 40 138 44 126 C54 136 60 150 58 168Z" fill="#a7c4a0"/><path d="M82 170 C98 160 102 140 98 128 C88 138 82 152 82 170Z" fill="#a7c4a0"/><path d="M104 170 C118 162 122 148 120 138 C110 146 104 156 104 170Z" fill="#9dbb96"/><path d="M48 106 C48 90 54 82 60 80 C66 82 72 90 72 106 C66 112 54 112 48 106Z" fill="#f39bbf"/><path d="M60 80 C56 90 56 100 60 110 C64 100 64 90 60 80Z" fill="#ffc1d6"/><path d="M70 88 C70 72 76 64 82 62 C88 64 94 72 94 88 C88 94 76 94 70 88Z" fill="#b79ae6"/><path d="M82 62 C78 72 78 82 82 92 C86 82 86 72 82 62Z" fill="#d6c6f6"/><path d="M90 114 C90 98 96 90 102 88 C108 90 114 98 114 114 C108 120 96 120 90 114Z" fill="#e8c98d"/><path d="M102 88 C98 98 98 108 102 118 C106 108 106 98 102 88Z" fill="#f5e2b5"/></svg>` },
  { cap: 'Golden sunsets 🌅', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb8cc"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient></defs><rect width="160" height="122" fill="url(#${u})"/><circle cx="80" cy="120" r="30" fill="#fff1c9"/><rect y="120" width="160" height="80" fill="#a685cf"/><g stroke="#fff1c9" stroke-linecap="round" opacity=".85"><path d="M58 131 H102" stroke-width="3"/><path d="M64 141 H96" stroke-width="2.5"/><path d="M70 151 H90" stroke-width="2"/><path d="M75 161 H85" stroke-width="1.6"/></g><g fill="none" stroke="#cbb6ef" stroke-width="1.6" stroke-linecap="round"><path d="M10 176 q10 -6 20 0 t20 0"/><path d="M104 184 q10 -6 20 0 t20 0"/></g><path d="M120 128 L120 100 L134 126 Z" fill="#fff6ee"/><path d="M112 130 L140 130 L134 137 L116 137Z" fill="#6f5094"/><g fill="none" stroke="#7d5b9e" stroke-width="1.4" stroke-linecap="round"><path d="M34 52 q4 -4 8 0 q4 -4 8 0"/><path d="M52 40 q3 -3 6 0 q3 -3 6 0"/></g></svg>` },
  { cap: 'New journeys ✈️', svg: u => `<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7defc"/><stop offset="1" stop-color="#fbe6ef"/></linearGradient></defs><rect width="160" height="200" fill="url(#${u})"/><g fill="#fff" opacity=".9"><ellipse cx="36" cy="150" rx="24" ry="9"/><ellipse cx="52" cy="144" rx="14" ry="9"/><ellipse cx="124" cy="164" rx="22" ry="8"/><ellipse cx="118" cy="40" rx="18" ry="6"/></g><path d="M20 168 C50 158 46 128 76 126 C96 124 98 140 86 144 C74 148 70 132 92 108" fill="none" stroke="#c9a462" stroke-width="1.6" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M92 108 L142 70 L112 120 Z" fill="#fff"/><path d="M92 108 L142 70 L104 106 Z" fill="#efe6fb"/><path d="M104 106 L142 70 L108 118 Z" fill="#ddd0f6"/><path d="M40 62 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4z" fill="#f39bbf"/></svg>` }
];
function galleryItems() {
  if (!mediaReady) return null;
  if (media.photos.length) return media.photos.map(p => ({ kind: 'photo', src: p.src, cap: p.caption || '' }));
  return ART.map(a => ({ kind: 'art', art: a.svg, cap: a.cap }));
}
function visualFor(it) { return it.kind === 'photo' ? `<img src="${esc(it.src)}" alt="" decoding="async" draggable="false">` : it.art('art' + (++artUid)); }
function wire(i) {
  const a = i % 2 ? '#ffd2e2' : '#ffe6a8', b = i % 2 ? '#e6dbff' : '#ffd2e2';
  return `<svg class="wire" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10 Q50 30 100 10" fill="none" stroke="rgba(233,207,154,.7)" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg><span class="bulb" style="left:18%;--c:${a};animation-delay:-${((i * 0.7) % 2.6).toFixed(1)}s" aria-hidden="true"></span><span class="bulb" style="left:82%;--c:${b};animation-delay:-${((i * 1.1 + 1) % 2.6).toFixed(1)}s" aria-hidden="true"></span>`;
}
function renderGallery() {
  const track = $('#garland-track'), items = galleryItems();
  if (!items) {
    track.innerHTML = '<p class="gallery-loading">Loading memories…</p>';
    updateGalleryUi();
    waitMedia.then(() => { if (current === 'memories') renderGallery(); });
    return;
  }
  const rots = [-4, 3, -2.5, 4, -3, 2.2];
  track.innerHTML = items.map((it, i) => {
    const label = it.cap ? `Photo ${i + 1}: ${it.cap}` : `Photo ${i + 1}`;
    return `<figure class="slide" role="listitem" style="--i:${Math.min(i, 6)}">${wire(i)}<span class="hang"><button class="polaroid" type="button" data-index="${i}" style="--r:${rots[i % rots.length]}deg;--sw:${(3.8 + (i % 3) * 0.5).toFixed(1)}s" aria-label="${esc(label)}"><span class="pin" aria-hidden="true"></span><span class="photo">${visualFor(it)}</span><span class="caption">${esc(it.cap)}</span></button></span></figure>`;
  }).join('');
  track.scrollLeft = 0;
  updateGalleryUi();
}
function slideState() {
  const track = $('#garland-track'), slides = $$('.slide', track);
  if (!slides.length) return { i: 0, n: 0, slides, track };
  const mid = track.scrollLeft + track.clientWidth / 2;
  let best = 0, bestD = Infinity;
  slides.forEach((s, k) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = k; } });
  return { i: best, n: slides.length, slides, track };
}
function updateGalleryUi() {
  const { i, n } = slideState();
  $('#garland-count').textContent = n ? `${i + 1} / ${n}` : '';
  $('#g-prev').disabled = !n || i === 0;
  $('#g-next').disabled = !n || i === n - 1;
}
function goSlide(delta) {
  const { i, n, slides, track } = slideState();
  if (!n) return;
  const s = slides[clamp(i + delta, 0, n - 1)];
  track.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
}
onEnter.memories = () => { setSky('memories'); setStep(3); renderGallery(); };
function initGallery() {
  const track = $('#garland-track');
  let ticking = false;
  track.addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; updateGalleryUi(); }); }, { passive: true });
  $('#g-prev').addEventListener('click', () => goSlide(-1));
  $('#g-next').addEventListener('click', () => goSlide(1));
  track.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); goSlide(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); goSlide(1); } });
  track.addEventListener('click', e => {
    const p = e.target.closest('.polaroid');
    if (!p) return;
    openLightbox(+p.dataset.index, p);
  });
  addEventListener('resize', () => { if (current === 'memories') updateGalleryUi(); });
}

/* ---------- Lightbox ---------- */
let lbIndex = 0, lbItems = [], lbReturn = null;
function openLightbox(i, from) {
  lbItems = galleryItems() || [];
  if (!lbItems.length) return;
  lbReturn = from || document.activeElement;
  const lb = $('#lightbox');
  lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add('is-on'));
  showLb(i);
  setTimeout(() => { try { $('#lb-close').focus({ preventScroll: true }); } catch (e) {} }, 30);
}
function showLb(i) {
  const n = lbItems.length;
  lbIndex = ((i % n) + n) % n;
  const it = lbItems[lbIndex];
  $('#lb-frame').innerHTML = it.kind === 'photo' ? `<img src="${esc(it.src)}" alt="${esc(it.cap || 'Photo ' + (lbIndex + 1))}">` : visualFor(it);
  $('#lb-cap').textContent = it.cap;
  $('#lb-count').textContent = `${lbIndex + 1} / ${n}`;
  $('#lb-prev').hidden = n < 2; $('#lb-next').hidden = n < 2;
}
function closeLightbox() {
  const lb = $('#lightbox');
  if (lb.hidden) return;
  lb.classList.remove('is-on');
  setTimeout(() => { lb.hidden = true; $('#lb-frame').innerHTML = ''; }, 320);
  if (lbReturn && lbReturn.focus) { try { lbReturn.focus({ preventScroll: true }); } catch (e) {} }
}
function initLightbox() {
  const lb = $('#lightbox');
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
  $('#lb-next').addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  let sx = null, sy = 0;
  lb.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  lb.addEventListener('pointerup', e => {
    if (sx == null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && lbItems.length > 1) showLb(lbIndex + (dx < 0 ? 1 : -1));
  });
}

/* ---------- Scene 5: the letter ---------- */
let typing = null, userScrolled = false;
function stopTyping() { if (typing) { clearTimeout(typing.timer); typing.done = true; typing = null; } }
function resetLetter() {
  stopTyping();
  const env = $('#envelope');
  env.classList.remove('is-open', 'is-away'); env.disabled = false;
  $('#letter-card').classList.remove('is-on');
  $('#letter-body').innerHTML = '';
  $('#btn-skip').hidden = false; $('#btn-to-finale').hidden = true;
  $('#letter-hint').textContent = 'Tap the envelope to open 💌';
}
onEnter.letter = () => { setSky('letter'); setStep(4); resetLetter(); };
onLeave.letter = () => { stopTyping(); };
let envBusy = false;
async function openEnvelope() {
  const env = $('#envelope');
  if (envBusy || env.classList.contains('is-open')) return;
  envBusy = true;
  Snd.unlock();
  env.classList.add('is-open');
  Snd.sfx.paper();
  $('#letter-hint').textContent = 'Written just for you…';
  const r = env.getBoundingClientRect();
  FX.sparkle(r.left + r.width / 2, r.top + r.height * 0.55, 18, { burst: true });
  FX.hearts(r.left + r.width / 2, r.top + r.height * 0.4, 8);
  await sleep(reduceMotion ? 200 : 1500);
  env.classList.add('is-away'); env.disabled = true;
  $('#letter-card').classList.add('is-on');
  await sleep(reduceMotion ? 100 : 700);
  envBusy = false;
  if (current === 'letter') startTyping();
}
function letterItems() {
  const text = String(cfg.letter || '').replace(/\r\n?/g, '\n').normalize('NFC').trim();
  const paras = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const items = paras.map((p, i) => ({ text: p, cls: paras.length > 1 && i === 0 ? 'l-greet' : (paras.length > 1 && i === paras.length - 1 ? 'l-close' : '') }));
  if (cfg.signature && cfg.signature.trim()) items.push({ text: '— ' + cfg.signature.trim(), cls: 'l-sign' });
  return items;
}
function graphemes(str) {
  if (window.Intl && Intl.Segmenter) { try { return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str), s => s.segment); } catch (e) {} }
  return Array.from(str);
}
function startTyping() {
  stopTyping();
  const body = $('#letter-body'), paper = $('#letter-paper'), items = letterItems();
  body.innerHTML = ''; userScrolled = false; paper.scrollTop = 0;
  if (reduceMotion) { renderWholeLetter(); return; }
  const caret = document.createElement('span'); caret.className = 'caret';
  const st = { timer: 0, done: false };
  typing = st;
  let pi = 0, ci = 0, chars = null, node = null, n = 0;
  const next = () => {
    if (st.done) return;
    if (!node) {
      if (pi >= items.length) { finishLetter(); return; }
      const p = document.createElement('p');
      if (items[pi].cls) p.className = items[pi].cls;
      node = document.createTextNode(''); p.appendChild(node); p.appendChild(caret); body.appendChild(p);
      chars = graphemes(items[pi].text); ci = 0;
    }
    if (ci < chars.length) {
      const ch = chars[ci++];
      node.data += ch;
      if (!userScrolled && (++n % 3 === 0 || ch === ' ')) paper.scrollTop = paper.scrollHeight;
      let d = isSmall ? 30 : 34;
      if (/[.!?…]/.test(ch)) d += 260; else if (/[,;:]/.test(ch)) d += 120;
      st.timer = setTimeout(next, d);
    } else { pi++; node = null; st.timer = setTimeout(next, 380); }
  };
  next();
}
function renderWholeLetter() {
  stopTyping();
  $('#letter-body').innerHTML = letterItems().map(it => `<p${it.cls ? ` class="${it.cls}"` : ''}>${esc(it.text)}</p>`).join('');
  finishLetter();
}
function finishLetter() {
  if (typing) { clearTimeout(typing.timer); typing.done = true; typing = null; }
  $$('#letter-body .caret').forEach(c => c.remove());
  $('#btn-skip').hidden = true;
  if ($('#btn-to-finale').hidden) appear($('#btn-to-finale'), 0.3);
}
function initLetter() {
  $('#envelope').addEventListener('click', openEnvelope);
  $('#btn-skip').addEventListener('click', () => { if ($('#letter-card').classList.contains('is-on')) renderWholeLetter(); });
  const paper = $('#letter-paper');
  paper.addEventListener('scroll', () => { userScrolled = paper.scrollTop + paper.clientHeight < paper.scrollHeight - 40; }, { passive: true });
}

/* ---------- Scene 6: finale ---------- */
onEnter.finale = () => {
  setSky('finale'); setStep(5);
  FX.setModes({ hearts: true, fireworks: true, shooting: true });
  FX.fireworkShow(isSmall ? 6 : 9, 5200);
  later(() => FX.rainConfetti(isSmall ? 50 : 90), 900);
  Snd.sfx.wish();
};

/* ---------- Photos + music listed in config.js ---------- */
const CHECK = /(?:^|[?&#])check\b/i.test(location.search + location.hash);
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'];
/* "photos/1.jpg" -> also try 1.jpeg, 1.png, 1.JPG ... so a different extension or capital letters still work. */
function variants(src, exts) {
  const out = [src];
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || /[?#]/.test(src)) return out;
  const m = /^(.*?)(\.[A-Za-z0-9]{2,5})?$/.exec(src);
  for (const e of exts) { const v = m[1] + e; if (out.indexOf(v) === -1) out.push(v); }
  return out;
}
function probe(url, ms) {
  return new Promise(res => {
    const im = new Image();
    let done = false;
    const fin = ok => { if (done) return; done = true; clearTimeout(t); res(ok ? im : null); };
    const t = setTimeout(() => fin(false), ms);
    im.onload = () => fin(im.naturalWidth > 0);
    im.onerror = () => fin(false);
    im.src = url;
  });
}
/* Phone cameras make 12-megapixel files; showing several of those at once can crash mobile Safari.
   Anything larger than 1600px is redrawn smaller before it goes into the album. */
function shrink(img, url) {
  const w = img.naturalWidth, h = img.naturalHeight, MAX = 1600;
  if (Math.max(w, h) <= MAX) return Promise.resolve(url);
  return new Promise(res => {
    try {
      const k = MAX / Math.max(w, h), c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { c.width = c.height = 0; res(b ? URL.createObjectURL(b) : url); }, 'image/jpeg', 0.86);
    } catch (e) { res(url); }
  });
}
function photoList() {
  const raw = USER && Array.isArray(USER.photos) ? USER.photos : [];
  return raw.map(p => (typeof p === 'string' ? { src: p, caption: '' } : p))
    .filter(p => p && typeof p.src === 'string' && p.src.trim())
    .map(p => ({ src: p.src.trim(), caption: typeof p.caption === 'string' ? p.caption : '' }));
}
function musicList() {
  const m = USER && typeof USER.music === 'string' ? USER.music.trim() : '';
  return m ? variants(m, ['.mp3', '.MP3', '.m4a']) : [];
}
async function loadPhotos(list) {
  const found = [], missing = [];
  for (const p of list) {
    let got = null;
    for (const url of variants(p.src, IMG_EXT)) {
      const img = await probe(url, 30000);
      if (img) { got = { src: await shrink(img, url), caption: p.caption }; break; }
    }
    if (got) found.push(got); else missing.push(p.src);
  }
  return { found, missing };
}

/* ---------- ?check: a report for the page's creator (add ?check to the link) ---------- */
async function runCheck(res) {
  const lines = [], err = window.__GIFT_CONFIG_ERROR;
  const show = () => { $('#toast').classList.add('is-check'); toast(lines.join('\n'), 25000); };
  if (err || !USER) {
    lines.push(err ? '✗ config.js có lỗi: ' + err : '✗ Không đọc được config.js.');
    lines.push(err ? 'Thường là thiếu dấu phẩy hoặc dấu ngoặc kép ở dòng đó hay dòng ngay phía trên.' : 'Kiểm tra file config.js có nằm cạnh index.html không.');
    lines.push('Trang đang dùng nội dung mặc định, chưa đọc ảnh và nhạc của bạn. Sửa xong hãy kiểm tra lại.');
    return show();
  }
  lines.push('✓ config.js đọc tốt. Tên: ' + cfg.name + ' · Ngày sinh: ' + fmtDob(cfg.dob));
  if (USER && USER.dob && USER.dob !== cfg.dob) lines.push('✗ Ngày sinh phải viết dạng 2007-11-15 (Năm-Tháng-Ngày).');
  const total = res.found.length + res.missing.length;
  if (!total) lines.push('Ảnh: chưa khai báo ảnh nào, album dùng 6 khung tranh minh hoạ.');
  else if (!res.missing.length) lines.push('✓ Ảnh: hiện đủ ' + total + '/' + total + '.');
  else lines.push('Ảnh: hiện ' + res.found.length + '/' + total + '. Chưa thấy: ' + res.missing.join(', ') + (res.found.length ? '' : ' (album dùng khung tranh minh hoạ)'));
  const ml = musicList();
  if (!ml.length) lines.push('Nhạc: dùng piano có sẵn.');
  else if (!/^https?:$/.test(location.protocol)) lines.push('Nhạc: ' + ml[0] + ' (mở qua link GitHub Pages để kiểm tra).');
  else {
    let hit = '';
    for (const u of ml) { try { const r = await fetch(u, { method: 'HEAD', cache: 'no-store' }); if (r.ok) { hit = u; break; } } catch (e) {} }
    lines.push(hit ? '✓ Nhạc: ' + hit : '✗ Nhạc: không thấy ' + ml[0] + ', trang dùng piano có sẵn.');
  }
  show();
}

/* ---------- Boot ---------- */
document.title = cfg.name + "'s Birthday Surprise";
applyText();
buildNameSvg();
buildCake();
showOnly('intro');
setStep(0);
FX.init();
FX.setModes({ shooting: true });
initInteractions(); initGallery(); initLightbox(); initLetter();
Snd.setCustom(musicList());
$('#btn-open').addEventListener('click', openGift);
$('#btn-wish').addEventListener('click', startWish);
$('#btn-blow').addEventListener('click', blowAll);
$('#cake-holder').addEventListener('click', e => {
  const c = e.target.closest('.candle');
  if (!c || (wishState !== 'wishing' && wishState !== 'ready')) return;
  if (blowOne(+c.dataset.i)) checkAllOut();
});
$('#btn-to-memories').addEventListener('click', () => goTo('memories'));
$('#btn-to-letter').addEventListener('click', () => goTo('letter'));
$('#btn-to-finale').addEventListener('click', () => goTo('finale'));
$('#btn-replay').addEventListener('click', () => { Snd.unlock(); goTo('intro'); });
document.addEventListener('keydown', e => {
  if ($('#lightbox').hidden) return;
  if (e.key === 'Escape') closeLightbox();
  else if (lbItems.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) showLb(lbIndex + (e.key === 'ArrowRight' ? 1 : -1));
});
/* Photos load quietly in the background while the gift, cake and wish play. */
setTimeout(async () => {
  let res = { found: [], missing: [] };
  try { res = await loadPhotos(photoList()); } catch (e) {}
  media.photos = res.found;
  mediaReady = true;
  mediaResolve();
  if (CHECK) runCheck(res);
}, 400);
})();
