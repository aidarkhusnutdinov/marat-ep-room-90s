// Весь звук синтезируется Web Audio, без файлов: эффекты из v2/v3, птицы за окном, часы, лаунж «как в режиме покупок».
let AC = null, master = null, sfx = null, musicBus = null, muted = false, hissNode = null;
let clockOn = () => false;
export const setClockGetter = f => { clockOn = f; };

function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.7; master.connect(AC.destination);
    sfx = AC.createGain(); sfx.connect(master);
    musicBus = AC.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}
const now = () => AC.currentTime;
function noiseBuf(sec) {
  const n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function env(node, t, peak, dur, out = sfx, att = 0.005) {
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g).connect(out); return g;
}
function osc(type, f, t, peak, dur, f2, out, att) {
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  env(o, t, peak, dur, out, att); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, peak, type = "lowpass", f = 800, out = sfx) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
  const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
  env(s.connect(fl), t, peak, dur, out); s.start(t); s.stop(t + dur + 0.05);
}

export function wake() {
  ac();
  if (!wake.done) { wake.done = true; ambience(); }
}
export function toggleMute() { ac(); muted = !muted; master.gain.value = muted ? 0 : 0.7; return muted; }

export function blip(f = 1200, d = 0.05) { ac(); osc("square", f, now(), 0.12, d); }
export function tone(f, d) { ac(); osc("sine", f, now(), 0.18, d); }
export function coins() { ac(); const t = now(); [2093, 2637, 3136, 4186].forEach((f, i) => osc("triangle", f, t + i * 0.05, 0.18, 0.18)); }
export function sad() { ac(); osc("sawtooth", 320, now(), 0.12, 0.4, 150); }
export function thunk() { ac(); const t = now(); osc("sine", 120, t, 0.7, 0.18, 55); noise(t, 0.12, 0.4, "lowpass", 600); }
export function rimshot() {
  ac(); const t = now();
  osc("sine", 220, t, 0.8, 0.22, 110); osc("sine", 165, t + 0.15, 0.8, 0.22, 82); noise(t + 0.3, 0.45, 0.45, "highpass", 6000);
}
export function bloop() { ac(); const t = now(); [0, 0.15, 0.3].forEach((d, i) => osc("sine", 300 + i * 120, t + d, 0.45, 0.14, 900 + i * 200)); }
export function dzyn() { ac(); const t = now(); osc("triangle", 2600, t, 0.35, 0.9); osc("sine", 3710, t, 0.18, 0.6); }
export function thump() { ac(); const t = now(); [0, 0.28, 0.5].forEach(d => noise(t + d, 0.22, 0.9, "lowpass", 450)); }
export function creak() { ac(); osc("sawtooth", 140, now(), 0.1, 0.55, 260); }
export function boing() { ac(); const t = now(); [0, 0.3].forEach(d => osc("sine", 180, t + d, 0.5, 0.3, 420)); }
export function knock() { ac(); const t = now(); [0, 0.14].forEach(d => { osc("sine", 340, t + d, 0.6, 0.08, 200); noise(t + d, 0.05, 0.3, "bandpass", 1500); }); }
export function page() { ac(); noise(now(), 0.35, 0.25, "highpass", 3000); }
export function water() { ac(); const t = now(); noise(t, 1.1, 0.25, "bandpass", 1200); for (let i = 0; i < 6; i++) osc("sine", 600 + Math.random() * 700, t + i * 0.15, 0.12, 0.08, 1400); }
export function flap() { ac(); const t = now(); for (let i = 0; i < 5; i++) noise(t + i * 0.09, 0.07, 0.35, "bandpass", 900); }
export function cuckoo() {
  ac(); const t = now();
  const note = (tt, f) => { osc("triangle", f, tt, 0.5, 0.28, null, sfx, 0.02); osc("sine", f * 2, tt, 0.1, 0.25); };
  [0, 1].forEach(k => { note(t + k * 0.55, 784); note(t + k * 0.55 + 0.26, 622); });
}
export function hissOn() {
  ac(); if (hissNode) return;
  const s = AC.createBufferSource(); s.buffer = noiseBuf(2); s.loop = true;
  const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200;
  const g = AC.createGain(); g.gain.value = 0.1;
  s.connect(hp).connect(lp).connect(g).connect(sfx); s.start(); hissNode = { s, g };
}
export function hissOff() {
  if (!hissNode) return; const { s, g } = hissNode; hissNode = null;
  g.gain.linearRampToValueAtTime(0, now() + 0.15); s.stop(now() + 0.2);
}

// ---------- Фон: птицы за окном и тиканье часов ----------
function ambience() {
  const bird = () => {
    if (!muted) {
      const t = now(), n = 2 + Math.floor(Math.random() * 4), f = 3000 + Math.random() * 1800;
      for (let i = 0; i < n; i++) osc("sine", f, t + i * 0.11, 0.025, 0.07, f * (1.2 + Math.random() * 0.4));
    }
    setTimeout(bird, 2500 + Math.random() * 6000);
  };
  setTimeout(bird, 1500);
  setInterval(() => { if (clockOn() && !muted) { const t = now(); osc("square", 2400, t, 0.02, 0.012); } }, 1000);
}

// ---------- Музыка: мягкий лаунж на электропиано ----------
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const PROG = [[53, 57, 60, 64, 67], [52, 55, 59, 62], [50, 53, 57, 60, 64], [43, 53, 57, 59, 64]];
const BASS = [41, 40, 38, 43];
const SCALE = [72, 74, 76, 79, 81, 84];
let musicTimer = null, nextT = 0, step = 0, buyOn = false, radioOn = false;
function ep(f, t, peak, dur) {
  const o = AC.createOscillator(), o2 = AC.createOscillator();
  o.type = "sine"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f * 2.003;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
  const g2 = AC.createGain(); g2.gain.value = 0.25; o2.connect(g2).connect(lp); o.connect(lp);
  env(lp, t, peak, dur, musicBus, 0.01); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
}
function schedule() {
  const beat = 60 / 86;
  while (nextT < now() + 0.4) {
    const bar = Math.floor(step / 8) % 4, e = step % 8, t = nextT;
    if (e === 0 || e === 5) PROG[bar].forEach(n => ep(midi(n), t + Math.random() * 0.02, 0.06, beat * 3));
    if (e === 0 || e === 4) osc("triangle", midi(BASS[bar] - 12), t, 0.22, beat * 1.6, null, musicBus, 0.01);
    if (e === 6) osc("triangle", midi(BASS[bar] - 5), t, 0.16, beat * 0.8, null, musicBus, 0.01);
    if (e % 2 === 1) noise(t, 0.09, 0.05, "highpass", 7000, musicBus);
    if (Math.random() < 0.32) ep(midi(SCALE[Math.floor(Math.random() * SCALE.length)]), t, 0.05, beat * 1.2);
    nextT += beat / 2; step++;
  }
}
function musicUpdate() {
  const on = buyOn || radioOn;
  if (on && !musicTimer) { nextT = now() + 0.1; musicTimer = setInterval(schedule, 100); }
  if (!on && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  musicBus.gain.cancelScheduledValues(now());
  musicBus.gain.linearRampToValueAtTime(on ? 0.9 : 0, now() + 0.6);
}
export function buyMusic(on) { ac(); buyOn = on; musicUpdate(); }
export function radio() { ac(); radioOn = !radioOn; musicUpdate(); return radioOn; }
