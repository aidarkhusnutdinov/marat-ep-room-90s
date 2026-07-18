/* Комната 90-х — прототип. Механика предметов + телевизор + Web Audio SFX. */
(() => {
  "use strict";

  // ---------- Web Audio (весь звук синтезируется, без файлов) ----------
  let AC = null, master = null, hissNode = null;
  function audio() {
    if (AC) return AC;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
    return AC;
  }
  const now = () => AC.currentTime;

  function noiseBuffer(sec) {
    const n = Math.floor(AC.sampleRate * sec);
    const buf = AC.createBuffer(1, n, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Шипение телевизора (луп)
  function hissOn() {
    audio();
    if (hissNode) return;
    const src = AC.createBufferSource(); src.buffer = noiseBuffer(2); src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200;
    const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
    const g = AC.createGain(); g.gain.value = 0.11;
    src.connect(hp).connect(lp).connect(g).connect(master); src.start();
    hissNode = { src, g };
  }
  function hissOff() {
    if (!hissNode) return;
    const { src, g } = hissNode; hissNode = null;
    g.gain.linearRampToValueAtTime(0, now() + 0.15);
    src.stop(now() + 0.2);
  }

  // «Ба-дум тссс!» — два тома + шейкер-«тссс»
  function rimshot() {
    audio();
    const drum = (t, f) => {
      const o = AC.createOscillator(); o.type = "sine";
      const g = AC.createGain();
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.24);
    };
    const t = now();
    drum(t, 220);          // ба
    drum(t + 0.15, 165);   // дум
    // тссс — всплеск отфильтрованного шума с затуханием
    const s = AC.createBufferSource(); s.buffer = noiseBuffer(0.5);
    const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
    const g = AC.createGain();
    const ts = t + 0.30;
    g.gain.setValueAtTime(0.0001, ts);
    g.gain.exponentialRampToValueAtTime(0.5, ts + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.45);
    s.connect(hp).connect(g).connect(master); s.start(ts); s.stop(ts + 0.5);
  }

  // «Ку-ку» — две флейтовые ноты (нисходящая терция), дважды
  function cuckoo() {
    audio();
    const note = (t, f) => {
      const o = AC.createOscillator(); o.type = "triangle"; o.frequency.value = f;
      const o2 = AC.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2;
      const g = AC.createGain(); const g2 = AC.createGain(); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
      g.gain.setValueAtTime(0.6, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(master); o2.connect(g2).connect(g);
      o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
    };
    const t = now();
    [0, 1].forEach(k => { note(t + k * 0.55, 784); note(t + k * 0.55 + 0.26, 622); });
  }

  // Клик кнопки / тумблера
  function blip(freq = 1200, dur = 0.05) {
    audio();
    const o = AC.createOscillator(); o.type = "square"; o.frequency.value = freq;
    const g = AC.createGain(); g.gain.value = 0.0001;
    const t = now();
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  // Короткий тон (для «настройки» / полос)
  function tone(freq, dur) {
    audio();
    const o = AC.createOscillator(); o.type = "sine"; o.frequency.value = freq;
    const g = AC.createGain(); g.gain.value = 0.0001;
    const t = now();
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.setValueAtTime(0.18, t + dur - 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  // ---------- Помехи на canvas ----------
  const canvas = document.getElementById("noise");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  let noiseRAF = null;
  function drawNoise() {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    noiseRAF = requestAnimationFrame(drawNoise);
  }
  function noiseRun(on) {
    if (on && !noiseRAF) drawNoise();
    if (!on && noiseRAF) { cancelAnimationFrame(noiseRAF); noiseRAF = null; }
  }

  // ---------- Телевизор / каналы ----------
  const screen = document.getElementById("screen");
  const tv = document.getElementById("tv");
  const hint = document.getElementById("tv-hint");
  const powerBtn = document.getElementById("btn-power");

  // 5 «каналов» = 5 кнопок. Пока видео нет — разный контент, чтобы нажатие было видно.
  const CHANNELS = ["static", "bars", "ep", "info", "nosig"];
  let poweredOn = true;
  let curChan = 0;
  let hinted = false;

  function applyChannel() {
    if (!poweredOn) {
      screen.dataset.ch = "off";
      noiseRun(false); hissOff(); tv.classList.remove("playing");
      return;
    }
    const ch = CHANNELS[curChan];
    screen.dataset.ch = ch;
    noiseRun(ch === "static");
    if (ch === "static") { hissOn(); tv.classList.remove("playing"); }
    else { hissOff(); tv.classList.add("playing"); }
    if (ch === "bars") tone(1000, 0.4);
  }

  function setChannel(i) {
    curChan = (i + CHANNELS.length) % CHANNELS.length;
    dismissHint();
    // «щелчок» переключения: белая вспышка кадра
    screen.animate(
      [{ filter: "brightness(3)" }, { filter: "brightness(1)" }],
      { duration: 140, easing: "ease-out" }
    );
    applyChannel();
  }

  function dismissHint() {
    if (hinted) return; hinted = true;
    hint.classList.add("gone");
  }

  // Первая инициализация звука по первому жесту (autoplay policy)
  let started = false;
  function firstGesture() {
    if (started) return; started = true;
    audio(); if (AC.state === "suspended") AC.resume();
    applyChannel();
  }
  window.addEventListener("pointerdown", firstGesture, { once: true });

  // Клик по телевизору → следующий канал
  tv.addEventListener("click", (e) => {
    if (e.target.closest(".panel")) return;
    firstGesture();
    if (!poweredOn) { poweredOn = true; blip(700); applyChannel(); return; }
    blip(900, 0.04);
    setChannel(curChan + 1);
  });

  // Кнопки каналов
  document.querySelectorAll(".btn-ch").forEach(b => {
    b.addEventListener("click", () => {
      firstGesture();
      b.classList.add("press"); setTimeout(() => b.classList.remove("press"), 120);
      blip(1100, 0.045);
      if (!poweredOn) { poweredOn = true; powerBtn.classList.add("on"); }
      setChannel(parseInt(b.dataset.ch, 10) - 1);
    });
  });

  // Тумблер питания
  powerBtn.addEventListener("click", () => {
    firstGesture();
    poweredOn = !poweredOn;
    powerBtn.classList.toggle("on", poweredOn);
    blip(poweredOn ? 700 : 400, 0.06);
    applyChannel();
  });
  powerBtn.classList.add("on");

  // ---------- Предметы ----------
  const vympel = document.getElementById("vympel");
  vympel.addEventListener("click", () => {
    firstGesture();
    vympel.classList.remove("swing"); void vympel.offsetWidth;
    vympel.classList.add("swing");
    rimshot();
  });
  vympel.addEventListener("animationend", (e) => {
    if (e.animationName === "swing") vympel.classList.remove("swing");
  });

  const chasy = document.getElementById("chasy");
  chasy.addEventListener("click", () => {
    firstGesture();
    chasy.classList.remove("cuckooing", "ring"); void chasy.offsetWidth;
    chasy.classList.add("cuckooing", "ring");
    cuckoo();
  });
  chasy.addEventListener("animationend", (e) => {
    if (e.animationName === "pop") chasy.classList.remove("cuckooing");
    if (e.animationName === "chshake") chasy.classList.remove("ring");
  });

  // ---------- Аффорданс: экран периодически «почти настраивается» ----------
  setInterval(() => {
    if (!poweredOn || CHANNELS[curChan] !== "static" || hinted) return;
    // мелькание «пойманной картинки»
    screen.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(1.8) contrast(1.4)" },
       { filter: "brightness(1)" }],
      { duration: 320, easing: "ease-in-out" }
    );
    if (started) tone(440 + Math.random() * 300, 0.12);
  }, 6500);

  // Стартовый канал — помехи (звук включится после первого жеста)
  applyChannel();
})();
