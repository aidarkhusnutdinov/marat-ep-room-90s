/* Комната-игра v3: магазин, бюджет, торг, пресет, телевизор. Звук — Web Audio, без файлов. */
(() => {
  "use strict";
  const { CATALOG, renderRoom } = window.ROOM;
  const BUDGET = 1000;
  const PRESET_USSR = ["tv", "tumba", "stenka", "bust", "flags", "vympel", "fish", "mug"];
  const $ = id => document.getElementById(id);

  // ---------- Масштаб сцены ----------
  const stage = $("stage");
  function fit() { stage.style.setProperty("--k", Math.min(innerWidth / 1600, innerHeight / 900)); }
  addEventListener("resize", fit); fit();

  // ---------- Web Audio (из v2 + новые звуки) ----------
  let AC = null, master = null, hissNode = null;
  function audio() {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }
  const now = () => AC.currentTime;
  function noiseBuffer(sec) {
    const n = Math.floor(AC.sampleRate * sec), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function hissOn() {
    audio(); if (hissNode) return;
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
    g.gain.linearRampToValueAtTime(0, now() + 0.15); src.stop(now() + 0.2);
  }
  function env(node, t, peak, dur) {
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g).connect(master);
  }
  function osc(type, f, t, peak, dur, f2) {
    const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(o, t, peak, dur); o.start(t); o.stop(t + dur + 0.02);
  }
  function rimshot() {
    audio(); const t = now();
    osc("sine", 220, t, 0.9, 0.22, 110); osc("sine", 165, t + 0.15, 0.9, 0.22, 82);
    const s = AC.createBufferSource(); s.buffer = noiseBuffer(0.5);
    const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
    env(s.connect(hp), t + 0.3, 0.5, 0.45); s.start(t + 0.3); s.stop(t + 0.8);
  }
  function blip(f = 1200, dur = 0.05) { audio(); osc("square", f, now(), 0.2, dur); }
  function tone(f, dur) { audio(); osc("sine", f, now(), 0.18, dur); }
  function coins() { audio(); const t = now(); [1800, 2400, 3000].forEach((f, i) => osc("triangle", f, t + i * 0.06, 0.25, 0.12)); }
  function sad() { audio(); const t = now(); osc("sawtooth", 300, t, 0.15, 0.35, 150); }
  function bloop() { audio(); const t = now(); [0, 0.16, 0.32].forEach((d, i) => osc("sine", 300 + i * 120, t + d, 0.5, 0.14, 900 + i * 200)); }
  function dzyn() { audio(); const t = now(); osc("triangle", 2600, t, 0.4, 0.9); osc("sine", 3710, t, 0.2, 0.6); osc("sine", 5400, t, 0.08, 0.3); }
  function thump() {
    audio(); const t = now();
    [0, 0.28].forEach(d => {
      const s = AC.createBufferSource(); s.buffer = noiseBuffer(0.3);
      const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
      env(s.connect(lp), t + d, 0.9, 0.25); s.start(t + d); s.stop(t + d + 0.3);
    });
  }
  function creak() { audio(); const t = now(); osc("sawtooth", 140, t, 0.12, 0.5, 260); }

  // ---------- Помехи на canvas (режим ТВ крупно) ----------
  const canvas = $("noise"), ctx = canvas.getContext("2d");
  let noiseRAF = null;
  function drawNoise() {
    const img = ctx.createImageData(canvas.width, canvas.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    noiseRAF = requestAnimationFrame(drawNoise);
  }
  function noiseRun(on) {
    if (on && !noiseRAF) drawNoise();
    if (!on && noiseRAF) { cancelAnimationFrame(noiseRAF); noiseRAF = null; }
  }

  // ---------- Состояние ----------
  const st = { money: BUDGET, owned: {}, price: {}, haggle: {}, scratched: false, watched: false };
  const base = id => CATALOG.find(i => i.id === id).price;
  const priceOf = id => st.price[id] ?? base(id);
  let justAdded = null;

  // ---------- Тост ----------
  let toastT = null;
  function toast(msg, ms = 3200) {
    const el = $("toast"); el.innerHTML = msg; el.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), ms);
  }

  // ---------- Покупки ----------
  function buy(id, quiet) {
    const p = priceOf(id);
    if (st.owned[id] != null) return false;
    if (p > st.money) {
      if (!quiet) { sad(); toast("Не хватает денег. Можно что-нибудь <b>вернуть</b> или <b>поторговаться</b>."); }
      return false;
    }
    st.money -= p; st.owned[id] = p; justAdded = id;
    let msg = null;
    if (id === "stenka" && Math.random() < 0.3) {
      st.scratched = true; st.money += 50; st.owned[id] = p - 50;
      msg = "Стенку привезли <b>поцарапанной</b>. Грузчики вернули 50 ₽ и ушли.";
    }
    if (id === "pss") msg = "Тома 12–17 <b>потеряли на складе</b>." + (st.owned.stenka ? " Полка всё равно смотрится солидно." : "");
    if (id === "tv") msg = st.owned.tumba ? "Телевизор встал на тумбу. Теперь можно смотреть!" : "Телек стоит на полу. Как у студента. Но работает!";
    if (id === "mug") msg = "Кружка помятая. Это не брак, это характер.";
    if (["bust", "pss", "fish"].includes(id) && !st.owned.stenka) msg = (msg ? msg + "<br>" : "") + "Ставить некуда, пока лежит на полу.";
    if (!quiet) { coins(); if (msg) toast(msg); }
    return msg || true;
  }
  function giveBack(id) {
    if (st.owned[id] == null) return;
    st.money += st.owned[id]; delete st.owned[id];
    if (id === "stenka") st.scratched = false;
    blip(600, 0.08);
  }
  function haggle(id) {
    const n = (st.haggle[id] || 0) + 1; st.haggle[id] = n;
    const b = base(id), name = CATALOG.find(i => i.id === id).name;
    if (n === 1) toast("Продавец: «Цена государственная, молодой человек»");
    else if (n === 2) toast("Продавец: «…Ну не знаю. Только для вас»");
    else if (n === 3) { st.price[id] = Math.round(b * 0.8 / 10) * 10 || b - 2; coins(); toast(`«Ладно, ${name} за ${st.price[id]} ₽. Себе в убыток»`); }
    else if (n === 4) { st.price[id] = Math.round(b * 1.1 / 10) * 10 || b + 1; sad(); toast(`«Ах так? Теперь ${st.price[id]} ₽. Следующий!»`); }
    else toast("Продавец демонстративно читает газету «Правда».");
    blip(900, 0.04);
  }
  function preset() {
    Object.keys(st.owned).forEach(giveBack);
    const notes = [];
    PRESET_USSR.forEach(id => { const r = buy(id, true); if (typeof r === "string" && id === "stenka") notes.push("стенку привезли поцарапанной (−50 ₽)"); });
    justAdded = "all";
    coins();
    toast("Комната «Фанат СССР» готова!<br>ПСС Ленина <b>не завезли</b>: дефицит" + (notes.length ? ", а " + notes.join(", ") : "") + ".", 4500);
    update();
  }

  // ---------- Отрисовка ----------
  const room = $("room");
  function update() {
    room.innerHTML = renderRoom(st);
    if (justAdded) {
      room.querySelectorAll(justAdded === "all" ? "[data-id]" : `[data-id="${justAdded}"]`).forEach(g => g.classList.add("pop"));
      justAdded = null;
    }
    const m = $("money"); m.textContent = st.money; m.classList.remove("flash"); void m.offsetWidth; m.classList.add("flash");
    const goal = $("goal");
    goal.classList.toggle("done", st.watched);
    goal.textContent = st.watched ? "✓ Клип посмотрели (почти). Теперь обставляй как хочешь"
      : st.owned.tv ? "Телевизор есть. Включи его!" : "Задача: поставить телевизор и включить клип";
    renderShop();
  }
  function renderShop() {
    $("catalog").innerHTML = CATALOG.map(it => {
      const owned = st.owned[it.id] != null, p = priceOf(it.id);
      const priceHtml = owned ? `${st.owned[it.id]} ₽` : (p !== it.price ? `<s>${it.price}</s>${p} ₽` : `${p} ₽`);
      return `<li class="${owned ? "owned" : ""} ${it.must ? "must" : ""}">
        <div class="name">${it.name}<small>${it.note}</small></div>
        <div class="price">${priceHtml}</div>
        <div class="btns">${owned
          ? `<button data-act="ret" data-id="${it.id}">Вернуть</button>`
          : `<button class="buy" data-act="buy" data-id="${it.id}">Купить</button><button data-act="hag" data-id="${it.id}">Торг</button>`}</div>
      </li>`;
    }).join("");
  }

  $("catalog").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const { act, id } = b.dataset;
    if (act === "buy") { if (buy(id)) update(); }
    if (act === "ret") { giveBack(id); update(); }
    if (act === "hag") { haggle(id); renderShop(); }
  });
  $("preset").addEventListener("click", preset);
  $("reset").addEventListener("click", () => {
    Object.keys(st.owned).forEach(giveBack);
    st.price = {}; st.haggle = {}; st.watched = false; update(); toast("Комната пустая. Новый день — новая попытка.");
  });

  // ---------- Клики по предметам в комнате ----------
  const wobble = el => { el.classList.remove("wobble", "pop"); void el.getBBox(); el.classList.add("wobble"); };
  const QUOTES = ["«Учиться, учиться и ещё раз учиться»", "Бюст смотрит на телевизор с одобрением.", "Бюст сурово молчит."];
  room.addEventListener("click", e => {
    const g = e.target.closest("[data-id]"); if (!g) return;
    const id = g.dataset.id;
    if (id === "tv") return openTV();
    wobble(g);
    if (id === "vympel") rimshot();
    else if (id === "fish") { bloop(); toast("Буль-буль-буль."); }
    else if (id === "mug") {
      dzyn();
      const bb = g.getBBox();
      room.insertAdjacentHTML("beforeend", `<path class="steam" d="M${bb.x + 12} ${bb.y} q-6 -10 0 -20 q6 -10 0 -20 M${bb.x + 20} ${bb.y} q6 -10 0 -20" stroke="#fff" stroke-width="3" fill="none" opacity=".9" pointer-events="none"/>`);
    }
    else if (id === "kover") { thump(); toast("Выбил ковёр. Пыль 1987 года."); }
    else if (id === "bust") { blip(400, 0.1); toast(QUOTES[Math.floor(Math.random() * QUOTES.length)]); }
    else if (id === "kreslo") { creak(); toast("Кресло скрипнуло."); }
    else if (id === "stenka") { blip(500, 0.06); toast(st.scratched ? "Царапину можно закрыть салфеточкой." : "Полировка блестит. Дышать на неё нельзя."); }
    else blip(1100, 0.05);
  });

  // ---------- Телевизор крупно ----------
  const zoom = $("tvzoom"), screen = $("screen");
  const CHANNELS = ["static", "bars", "ep", "nosig"];
  let ch = 0;
  function applyChannel() {
    const c = CHANNELS[ch]; screen.dataset.ch = c;
    noiseRun(c === "static");
    if (c === "static") hissOn(); else hissOff();
    if (c === "bars") tone(1000, 0.4);
  }
  function openTV() {
    audio(); zoom.hidden = false; ch = 0; applyChannel();
    if (!st.watched) { st.watched = true; update(); }
  }
  function closeTV() { zoom.hidden = true; noiseRun(false); hissOff(); }
  screen.addEventListener("click", () => {
    ch = (ch + 1) % CHANNELS.length;
    screen.animate([{ filter: "brightness(3)" }, { filter: "brightness(1)" }], { duration: 140 });
    blip(); applyChannel();
  });
  $("tvz-close").addEventListener("click", closeTV);
  addEventListener("keydown", e => { if (e.key === "Escape" && !zoom.hidden) closeTV(); });

  update();
  toast("Новый день. 1000 ₽ в кармане. Обставь комнату и посмотри клип.", 4000);
})();
