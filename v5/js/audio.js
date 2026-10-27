// Звук: живые записи из assets/sfx (Freesound, CC0) или синтез Web Audio — переключается кнопкой 🎙.
// Синтез остаётся запасным вариантом для каждого эффекта. Музыка — лупы Марата «Не похож» (assets/music).
import { cfg } from "./texts.js";
let AC = null, master = null, sfx = null, musicBus = null, ambBus = null, muted = false, hissNode = null;
let clockOn = () => false, ambNode = null;
export const setClockGetter = f => { clockOn = f; };

function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.7; master.connect(AC.destination);
    sfx = AC.createGain(); sfx.connect(master);
    musicBus = AC.createGain(); musicBus.connect(master);
    ambBus = AC.createGain(); ambBus.gain.value = VOL.amb; ambBus.connect(master); // звуки за окном: приглушаются, когда играет техника
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

// ---------- Живые записи ----------
const SAMPLES = ["click", "coins", "sad", "thunk", "rimshot", "bloop", "dzyn", "thump", "rug", "ahem", "page", "creak", "boing",
  "knock", "lamp", "door", "flap", "cuckoo", "tick", "radio", "tvon", "tvknob", "static", "beep", "ambience",
  // v5 (этап 10)
  "water", "sit", "sip", "meow1", "meow2", "meow3", "woof", "fart", "turtle", "spider", "beaver", "munch", "croc", "cdtray",
  "modem", "boot", "skate", "plane", "spray", "chalk", "deal", "huff", "right", "wrong", "share", "safe", "brain", "box",
  "porcelain", "beanbag", "sparkle", "metal",
  // раунд 2
  "growl", "amb_city", "amb_fire", "amb_square", "amb_parade", "amb_skate", "amb_garages", "amb_beach", "amb_forest",
  "feed_dog", "feed_turtle", "feed_spider", "beaver_pet", "bugle", "hurrah",
  // раунд 3
  "yeltsin5", "yeltsin_s1", "yeltsin_s2", "yeltsin_s3"];
const buf = {};
let live = true; try { live = localStorage.getItem("sfx-mode") !== "synth"; } catch (e) {}
function loadSamples() {
  SAMPLES.forEach(n => fetch(`assets/sfx/${n}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject(n))
    .then(b => AC.decodeAudioData(b)).then(b => { buf[n] = b; }).catch(() => {}));
}
// Играет запись, если включены живые звуки и файл загрузился; иначе null — и функция играет синтез.
function play(n, { gain = 0.8, rate = 1, vary = 0.06, loop = false } = {}) {
  if (!live || !buf[n]) return null;
  const s = AC.createBufferSource(); s.buffer = buf[n]; s.loop = loop;
  s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
  const g = AC.createGain(); g.gain.value = gain; s.connect(g).connect(sfx); s.start();
  return { s, g };
}
// Петля без шва: копии записи идут внахлёст, одна гаснет, другая проявляется (равная мощность).
const XF = 64, XUP = new Float32Array(XF), XDOWN = new Float32Array(XF);
for (let i = 0; i < XF; i++) { const p = i / (XF - 1); XUP[i] = Math.sin(p * Math.PI / 2); XDOWN[i] = Math.cos(p * Math.PI / 2); }
function loopXfade(n, { gain = 0.5, fade = 3, bus = sfx } = {}) {
  if (!live || !buf[n]) return null;
  const b = buf[n], x = Math.min(fade, b.duration / 3), out = AC.createGain(), srcs = new Set();
  out.gain.value = gain; out.connect(bus);
  let t = now() + 0.05, first = true;
  const one = () => {
    const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; s.connect(g).connect(out);
    if (first) g.gain.setValueAtTime(1, t); else g.gain.setValueCurveAtTime(XUP, t, x);
    g.gain.setValueCurveAtTime(XDOWN, t + b.duration - x, x);
    s.start(t); s.stop(t + b.duration); srcs.add(s); s.onended = () => srcs.delete(s);
    first = false; t += b.duration - x;
  };
  const ahead = () => { while (t < now() + 2) one(); };
  ahead(); const timer = setInterval(ahead, 500);
  return { s: { stop(when) { clearInterval(timer); srcs.forEach(s => s.stop(when)); } }, g: out };
}
export const isLive = () => live;
export function toggleLive() {
  ac(); live = !live;
  try { localStorage.setItem("sfx-mode", live ? "live" : "synth"); } catch (e) {}
  if (hissNode) { hissOff(); hissOn(); }
  return live;
}

export function wake() {
  ac();
  if (!wake.done) { wake.done = true; loadSamples(); loadMusic(); ambience(); }
}
// фоновые события (самолёт, скейтер): звучат только после первого клика, иначе браузер ругается на AudioContext
export const ifAwake = f => { if (wake.done) f(); };
export function toggleMute() { ac(); muted = !muted; master.gain.value = muted ? 0 : 0.7; return muted; }

export function blip(f = 1200, d = 0.05) { ac(); if (play("click", { gain: 0.35, rate: Math.min(1.4, Math.max(0.7, f / 1200)) })) return; osc("square", f, now(), 0.12, d); }
export function tone(f, d) { ac(); if (play("beep", { gain: 0.5, vary: 0 })) return; osc("sine", f, now(), 0.18, d); }
export function coins() { ac(); if (play("coins")) return; const t = now(); [2093, 2637, 3136, 4186].forEach((f, i) => osc("triangle", f, t + i * 0.05, 0.18, 0.18)); }
export function sad() { ac(); if (play("sad")) return; osc("sawtooth", 320, now(), 0.12, 0.4, 150); }
export function thunk() { ac(); if (play("thunk")) return; const t = now(); osc("sine", 120, t, 0.7, 0.18, 55); noise(t, 0.12, 0.4, "lowpass", 600); }
export function rimshot() {
  ac(); if (play("rimshot", { vary: 0 })) return; const t = now();
  osc("sine", 220, t, 0.8, 0.22, 110); osc("sine", 165, t + 0.15, 0.8, 0.22, 82); noise(t + 0.3, 0.45, 0.45, "highpass", 6000);
}
export function bloop() { ac(); if (play("bloop")) return; const t = now(); [0, 0.15, 0.3].forEach((d, i) => osc("sine", 300 + i * 120, t + d, 0.45, 0.14, 900 + i * 200)); }
export function dzyn() { ac(); if (play("dzyn")) return; const t = now(); osc("triangle", 2600, t, 0.35, 0.9); osc("sine", 3710, t, 0.18, 0.6); }
export function thump() { ac(); if (play("thump")) return; const t = now(); [0, 0.28, 0.5].forEach(d => noise(t + d, 0.22, 0.9, "lowpass", 450)); }
export function creak() { ac(); if (play("creak")) return; osc("sawtooth", 140, now(), 0.1, 0.55, 260); }
export function boing() { ac(); if (play("boing")) return; const t = now(); [0, 0.3].forEach(d => osc("sine", 180, t + d, 0.5, 0.3, 420)); }
export function knock() { ac(); if (play("knock")) return; const t = now(); [0, 0.14].forEach(d => { osc("sine", 340, t + d, 0.6, 0.08, 200); noise(t + d, 0.05, 0.3, "bandpass", 1500); }); }
export function page() { ac(); if (play("page")) return; noise(now(), 0.35, 0.25, "highpass", 3000); }
export function water() { ac(); if (play("water", { gain: 0.6 })) return; const t = now(); noise(t, 1.1, 0.25, "bandpass", 1200); for (let i = 0; i < 6; i++) osc("sine", 600 + Math.random() * 700, t + i * 0.15, 0.12, 0.08, 1400); }
export function flap() { ac(); if (play("flap")) return; const t = now(); for (let i = 0; i < 5; i++) noise(t + i * 0.09, 0.07, 0.35, "bandpass", 900); }
export function cuckoo() {
  ac(); if (play("cuckoo", { vary: 0.02 })) return; const t = now();
  const note = (tt, f) => { osc("triangle", f, tt, 0.5, 0.28, null, sfx, 0.02); osc("sine", f * 2, tt, 0.1, 0.25); };
  [0, 1].forEach(k => { note(t + k * 0.55, 784); note(t + k * 0.55 + 0.26, 622); });
}
// питомцы: у каждой кошки свой голос (1 — Добрая, 2 — Мачка, 3 — Сглаз); синтез — скольжение тона, «бррр» и т.п.
export function meow(n = 1) { ac(); if (play("meow" + n, { gain: 0.7 })) return; const k = [1, 1.25, 0.8][n - 1] || 1; osc("sawtooth", 700 * k, now(), 0.12, 0.45, 450 * k); osc("sine", 900 * k, now(), 0.1, 0.4, 600 * k); }
export function woof() { ac(); if (play("woof", { gain: 0.7 })) return; const t = now(); osc("sawtooth", 220, t, 0.25, 0.14, 120); noise(t, 0.12, 0.4, "lowpass", 900); }
export function fart() { ac(); if (play("fart", { gain: 0.7 })) return; const t = now(); for (let i = 0; i < 7; i++) osc("sawtooth", 70 + Math.random() * 30, t + i * 0.06, 0.18, 0.07, 60); }
export function turtle() { ac(); if (play("turtle", { gain: 0.6 })) return; const t = now(); for (let i = 0; i < 4; i++) noise(t + i * 0.2, 0.15, 0.2, "bandpass", 1800); }
export function spider() { ac(); if (play("spider", { gain: 0.6 })) return; const t = now(); for (let i = 0; i < 8; i++) noise(t + i * 0.05, 0.03, 0.2, "highpass", 5000); }
export function beaver() { ac(); if (play("beaver", { gain: 0.7 })) return; const t = now(); for (let i = 0; i < 10; i++) noise(t + i * 0.07, 0.04, 0.35, "bandpass", 2200); }
export function munch() { ac(); if (play("munch", { gain: 0.7 })) return; const t = now(); [0, 0.25, 0.5].forEach(d => noise(t + d, 0.12, 0.4, "bandpass", 1600)); }
// рык крокодила (запись) и щелчок пасти в конце; синтез — низкое рокотание с шумом
export function growl() {
  ac(); setTimeout(croc, 1500);
  if (play("growl", { gain: 0.9, vary: 0.05 })) return;
  const t = now();
  for (let i = 0; i < 3; i++) osc("sawtooth", 55 + i * 9, t, 0.22, 1.3, 42, sfx, 0.15);
  noise(t, 1.3, 0.35, "lowpass", 380);
}
// корм: у каждого зверя свой звук (кошкам — прежний «хрум»)
export function feed(id) {
  ac();
  const k = { matvey: "feed_dog", chirik: "feed_turtle", tarantul: "feed_spider", mihalych: "beaver" }[id];
  if (k && play(k, { gain: 0.7 })) return;
  if (id === "mihalych") return beaver();
  munch();
}
export function beaverPet() { ac(); if (!play("beaver_pet", { gain: 0.6 })) knock(); }
// мозаика «Ельцин» говорит. «настоящий» — его голос из новогоднего обращения 31.12.1999 (Wikimedia Commons, CC BY 4.0):
// оставлена одна фраза — «Я сделал всё, что мог» (yeltsin5); остальные (1–4) лежат в assets/sfx, но не звучат.
// «синтез» — для сравнения: «э-э-э… понимаешь» синтезом речи macOS с пониженным голосом. Выбор — в настройки.txt
let yLast = "";
export function yeltsin() {
  ac();
  const synth = cfg("голос ельцина", "настоящий") === "синтез", list = synth ? ["yeltsin_s1", "yeltsin_s2", "yeltsin_s3"] : ["yeltsin5"];
  let n; do n = list[Math.floor(Math.random() * list.length)]; while (n === yLast && list.length > 1); yLast = n;
  if (!play(n, { gain: 0.9, vary: 0 })) ahem();
}
export function bugle() { ac(); play("bugle", { gain: 0.3, vary: 0.02 }); }
export function hurrah() { ac(); play("hurrah", { gain: 0.35 }); }
export function croc() { ac(); if (play("croc", { gain: 0.9, rate: 0.8 })) return; const t = now(); osc("sine", 160, t, 0.6, 0.12, 70); noise(t, 0.06, 0.5, "lowpass", 2500); }
// кресло: дерево скрипнуло + вздох пружин; кружка: дзынь ложкой, потом прихлёб
export function sit() { ac(); if (play("sit")) return; creak(); }
export function sip() { ac(); setTimeout(() => { if (!play("sip", { gain: 0.6 })) noise(now(), 0.4, 0.15, "bandpass", 1200); }, 650); }
// техника и мелочи
export function cdtray() { ac(); if (!play("cdtray", { gain: 0.6 })) blip(500, 0.08); }
export function modem() { ac(); if (play("modem", { gain: 0.35, vary: 0 })) return; const t = now(); [1200, 2400, 1800].forEach((f, i) => osc("square", f, t + i * 0.25, 0.05, 0.22)); noise(t + 0.75, 0.8, 0.12, "bandpass", 2000); }
export function boot() { ac(); if (play("boot", { gain: 0.6, vary: 0 })) return; const t = now(); [523, 659, 784, 1047].forEach((f, i) => osc("sine", f, t + i * 0.12, 0.15, 0.6)); }
export function skate(gain = 0.6) { ac(); if (play("skate", { gain })) return; noise(now(), 1.2, 0.12 * gain, "lowpass", 400); }
// самолёт: тихо нарастает и уходит (запись или низкий гул пропеллера)
export function plane() {
  ac(); const t = now(), r = play("plane", { gain: 0.001, vary: 0 });
  if (r) { const g = r.g.gain, d = r.s.buffer.duration; g.setValueAtTime(0.001, t); g.linearRampToValueAtTime(0.18, t + d * 0.45); g.linearRampToValueAtTime(0.001, t + d); return; }
  const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain();
  o.type = "sawtooth"; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(58, t + 4);
  lp.type = "lowpass"; lp.frequency.value = 300; g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + 1.8); g.gain.linearRampToValueAtTime(0.0001, t + 4);
  o.connect(lp).connect(g).connect(sfx); o.start(t); o.stop(t + 4.1);
}
export function safe() { ac(); if (!play("safe", { gain: 0.7 })) { const t = now(); for (let i = 0; i < 5; i++) osc("square", 3000, t + i * 0.08, 0.04, 0.01); } }
export function brain() { ac(); if (!play("brain", { gain: 0.5 })) tone(880, 0.3); }
export function box() { ac(); if (play("box", { gain: 0.5, vary: 0.02 })) return; const t = now(); [1568, 1319, 1175, 1047].forEach((f, i) => osc("triangle", f, t + i * 0.2, 0.12, 0.4)); }
export function porcelain() { ac(); if (!play("porcelain", { gain: 0.7 })) dzyn(); }
export function beanbag() { ac(); if (!play("beanbag", { gain: 0.8 })) noise(now(), 0.5, 0.3, "lowpass", 700); }
export function sparkle() { ac(); if (play("sparkle", { gain: 0.5 })) return; const t = now(); for (let i = 0; i < 5; i++) osc("sine", 2500 + i * 400, t + i * 0.05, 0.06, 0.2); }
export function metal() { ac(); if (play("metal", { gain: 0.6 })) return; osc("triangle", 820, now(), 0.3, 0.7); osc("sine", 1230, now(), 0.15, 0.5); }
// заработок: торг, викторина, шеринг
export function deal() { ac(); if (!play("deal", { gain: 0.6, vary: 0 })) { const t = now(); [1319, 1760].forEach((f, i) => osc("triangle", f, t + i * 0.09, 0.15, 0.25)); } }
export function huff() { ac(); if (!play("huff", { gain: 0.8 })) sad(); }
export function right() { ac(); if (!play("right", { gain: 0.6, vary: 0 })) blip(1800, 0.06); }
export function wrong() { ac(); if (!play("wrong", { gain: 0.5, vary: 0 })) sad(); }
export function share() { ac(); if (!play("share", { gain: 0.6 })) noise(now(), 0.3, 0.2, "bandpass", 1500); }
// баллончик: «пшш» с перестуком шарика; мел: сухие короткие шорохи
export function spray() { ac(); if (play("spray", { gain: 0.28 })) return; const t = now(); [0, 0.12].forEach(d => osc("square", 2400, t + d, 0.05, 0.03)); noise(t + 0.25, 0.9, 0.35, "highpass", 4000); }
export function chalk() { ac(); if (play("chalk", { gain: 0.3 })) return; const t = now(); for (let i = 0; i < 6; i++) noise(t + i * 0.13, 0.08, 0.3, "bandpass", 2500 + Math.random() * 1500); }
export function rug() { ac(); if (!play("rug")) blip(500, 0.08); }
export function ahem() { ac(); if (!play("ahem", { vary: 0.03 })) blip(400, 0.1); }
export function lamp() { ac(); if (!play("lamp")) blip(700, 0.04); }
export function door() { ac(); if (!play("door")) blip(600, 0.05); }
export function tvknob() { ac(); if (!play("tvknob")) blip(); }
export function tvon() { ac(); play("tvon", { gain: 0.7, vary: 0 }); }
export function hissOn() {
  ac(); if (hissNode) return;
  const rec = loopXfade("static", { gain: 0.35, fade: 1 });
  if (rec) { hissNode = rec; return; }
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

// ---------- Фон: двор или птицы за окном, тиканье часов ----------
// какой фон звучит за окном: голая стена — улица у хрущёвки, у каждого купленного вида — свой
const VIEW_AMB = { win_green: "ambience", win_fire: "amb_fire", win_mausoleum: "amb_square", win_pioneers: "amb_parade", win_skate: "amb_skate",
  win_garages: "amb_garages", win_beach: "amb_beach", win_borovoe: "amb_forest" };
// записи за окном тихие (≈ −30 дБ), поэтому множители большие; общий уровень — «звуки за окном» в настройки.txt
const AMB_GAIN = { amb_city: 0.3, amb_fire: 0.45, amb_parade: 0.25, amb_beach: 0.4 };
let ambKey = "amb_city";
export function setView(id) { ambKey = VIEW_AMB[id] || "amb_city"; }
function ambience() {
  const bird = () => {
    if (!muted && !ambNode) {
      const t = now(), n = 2 + Math.floor(Math.random() * 4), f = 3000 + Math.random() * 1800;
      for (let i = 0; i < n; i++) osc("sine", f, t + i * 0.11, 0.025, 0.07, f * (1.2 + Math.random() * 0.4), ambBus);
    }
    setTimeout(bird, 2500 + Math.random() * 6000);
  };
  setTimeout(bird, 1500);
  setInterval(() => {
    if (clockOn() && !muted && !play("tick", { gain: 0.06, vary: 0.02 })) osc("square", 2400, now(), 0.02, 0.012);
    // фон за окном: своя запись для каждого вида (setView), синтетические птицы — в старом режиме
    if (live && ambNode && ambNode.key !== ambKey) { const old = ambNode; old.g.gain.setTargetAtTime(0, now(), 0.6); setTimeout(() => old.s.stop(), 2500); ambNode = null; }
    if (live && !ambNode && buf[ambKey]) { ambNode = loopXfade(ambKey, { gain: AMB_GAIN[ambKey] ?? 0.35, fade: 3, bus: ambBus }); if (ambNode) ambNode.key = ambKey; }
    if (!live && ambNode) { ambNode.s.stop(); ambNode = null; }
  }, 1000);
}


// ---------- Музыка: лупы Марата из «Не похож» (85 bpm, assets/music) ----------
// Одновременно звучит один луп: техника (радиола, центр, аудиосистема) > покупки > фон. Фон и покупки идут по общей
// сетке тактов: новый луп вступает на ближайшую долю с того же места в такте — переход звучит как сведение, а не обрыв.
// Громкости — в настройки.txt (в процентах); фон чуть тише звуков игры, как просил Марат.
const BEAT = 60 / 85, LOOPS = ["loop1", "loop2", "loop3", "loop4", "loop5", "loop6"];
// выравниваем громкость лупов между собой (loop5 записан на 8 дБ тише)
const NORM = { loop4: 0.9, loop5: 2.6, loop6: 1.3 };
const BED = ["loop2", "loop2", "loop5", "loop5"]; // фон: 16 тактов второго, 8 тактов пятого — и по кругу
// музыкальный центр: файл из настройки.txt («трек музцентра»), чтобы подложить полный минус без правки кода
const DEVICE = { radiola: "loop3", audio: "loop4", get music() { return cfg("трек музцентра", "loop1"); } };
const VOL = {
  get bed() { return cfg("музыка фоном", 28) / 100; }, get shop() { return cfg("музыка в покупках", 40) / 100; },
  get device() { return cfg("музыка в технике", 70) / 100; }, get amb() { return cfg("звуки за окном", 100) / 100; },
};
const mbuf = {};
let gridT0 = null, voice = null, bedStep = 0, buyOn = false, device = null, tvOn = false, duckUntil = 0;
let musicOn = true; try { musicOn = localStorage.getItem("music") !== "off"; } catch (e) {}
function loadMusic() {
  [...new Set([...LOOPS, DEVICE.music])].forEach(n => fetch(`assets/music/${n}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject(n))
    .then(b => AC.decodeAudioData(b)).then(b => { mbuf[n] = b; musicUpdate(); }).catch(() => {}));
}
const loopOf = n => mbuf[n] ? n : "loop1";
// что должно играть сейчас и как громко
function want() {
  if (device) return { key: loopOf(DEVICE[device]), gain: VOL.device, sync: false };
  if (!musicOn || tvOn) return null;
  if (buyOn) return { key: "loop6", gain: VOL.shop, sync: true };
  return { key: "bed", gain: VOL.bed, sync: true };
}
function startVoice(w) {
  const key = w.key === "bed" ? BED[bedStep % BED.length] : w.key, b = mbuf[key];
  if (!b) return null;
  if (gridT0 == null) gridT0 = now();
  // с долей: ближайшая доля по общей сетке; луп вступает с того места, где «сейчас» в его такте
  let when = now() + 0.05, offset = 0;
  if (w.sync) { const k = Math.ceil((when - gridT0) / BEAT); when = gridT0 + k * BEAT; offset = (when - gridT0) % b.duration; }
  const s = AC.createBufferSource(), g = AC.createGain();
  s.buffer = b; s.loop = w.key !== "bed"; s.connect(g).connect(musicBus);
  g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(w.gain * (NORM[key] || 1), when + 0.6);
  s.start(when, offset);
  const v = { s, g, key: w.key, gain: w.gain };
  // фон — цепочка разных лупов: следующий встык, ровно по окончании этого
  if (w.key === "bed") {
    const end = when + b.duration - offset;
    v.timer = setTimeout(() => { if (voice === v) { bedStep++; const nx = startVoiceAt(w, end); if (nx) { stopVoice(v, end); voice = nx; } } }, Math.max(0, (end - now() - 1) * 1000));
  }
  return v;
}
function startVoiceAt(w, when) { // следующий луп фона встык, без подъёма громкости
  const key = BED[bedStep % BED.length], b = mbuf[key]; if (!b) return null;
  const s = AC.createBufferSource(), g = AC.createGain();
  s.buffer = b; s.connect(g).connect(musicBus); g.gain.value = w.gain * (NORM[key] || 1); s.start(when);
  const v = { s, g, key: "bed", gain: w.gain };
  v.timer = setTimeout(() => { if (voice === v) { bedStep++; const nx = startVoiceAt(w, when + b.duration); if (nx) { stopVoice(v, when + b.duration); voice = nx; } } }, Math.max(0, (when + b.duration - now() - 1) * 1000));
  return v;
}
function stopVoice(v, at = now(), fade = 0.8) {
  if (!v) return; clearTimeout(v.timer);
  v.g.gain.cancelScheduledValues(at); v.g.gain.setTargetAtTime(0.0001, at, fade / 4);
  try { v.s.stop(at + fade + 0.2); } catch (e) {}
}
function musicUpdate() {
  if (!AC) return;
  const w = want();
  if (voice && w && voice.key === w.key) {
    if (voice.gain !== w.gain) { voice.gain = w.gain; voice.g.gain.setTargetAtTime(w.gain * (NORM[voice.key] || 1), now(), 0.3); }
  } else {
    stopVoice(voice); voice = null;
    if (w) voice = startVoice(w);
  }
  // техника играет громко — улица за окном почти не слышна; кратко приглушить фон (duck) тоже можно
  if (ambBus) ambBus.gain.setTargetAtTime(VOL.amb * (device ? 0.35 : 1), now(), 0.4);
  musicBus.gain.setTargetAtTime(now() * 1000 < duckUntil && !device ? 0.35 : 1, now(), 0.5);
}
// покупки открыты/закрыты
export function buyMusic(on) { ac(); buyOn = on; musicUpdate(); }
// кнопка ♪ в пульте: вся фоновая музыка (фон и покупки); техника играет всё равно — её включили руками
export const isMusic = () => musicOn;
export function toggleMusic() {
  ac(); musicOn = !musicOn;
  try { localStorage.setItem("music", musicOn ? "on" : "off"); } catch (e) {}
  musicUpdate(); return musicOn;
}
// техника: радиола / музыкальный центр / аудиосистема. Играет одна; включил другую — первая замолкает
export const playingDevice = () => device;
export function deviceToggle(id) {
  ac(); device = device === id ? null : id;
  if (device === "radiola") play("radio", { gain: 0.5, vary: 0 });
  musicUpdate(); return device === id;
}
export function deviceOff(id) { if (device === id) { device = null; musicUpdate(); } }
// телевизор крупно — фон уходит, чтобы не мешать каналам (и будущему клипу)
export function tvMode(on) { ac(); tvOn = on; musicUpdate(); }
// приглушить музыку на несколько секунд (смотрим в окно — слышно улицу)
export function duck(sec = 6) {
  ac(); duckUntil = now() * 1000 + sec * 1000; musicUpdate();
  setTimeout(musicUpdate, sec * 1000 + 50);
}
// отладка: что играет
export const musicState = () => ({ voice: voice && voice.key, loaded: Object.keys(mbuf), device, buyOn, musicOn, ctx: AC && AC.state });
