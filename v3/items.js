/* Каталог и отрисовка комнаты. Изометрия 2:1, пол 8×8 клеток, стена 280 px.
   Координаты предмета: u — вдоль правой стены, v — вдоль левой, h — высота в px. */
(() => {
  "use strict";

  const CATALOG = [
    { id: "tv",     name: "Телевизор «Сапфир 401-1»", note: "переносной, ч/б, с антенной", price: 300, must: true },
    { id: "tumba",  name: "Тумба под телевизор",      note: "ДСП, лак",                    price: 60 },
    { id: "stenka", name: "Стенка «Хельга»",          note: "ГДР, полированная",           price: 350 },
    { id: "bust",   name: "Бюст Ленина",              note: "гипс, тонированный",          price: 120 },
    { id: "pss",    name: "Ленин. ПСС в 55 томах",    note: "красный переплёт",            price: 150 },
    { id: "kover",  name: "Ковёр на стену",           note: "шерсть, 2 × 1,5 м",           price: 180 },
    { id: "vympel", name: "Вымпел «Ударнику соцтруда»", note: "бархат, бахрома",           price: 40 },
    { id: "flags",  name: "Флажки красные",           note: "к Первомаю, 2 шт.",           price: 30 },
    { id: "kreslo", name: "Кресло",                   note: "мягкое, на ножках",           price: 200 },
    { id: "fish",   name: "Рыбки фарфоровые",         note: "кобальт, набор из трёх",      price: 70 },
    { id: "mug",    name: "Кружка алюминиевая",       note: "зелёная, слегка помятая",     price: 10 },
  ];

  // ---------- Изометрия ----------
  const OX = 590, OY = 330;
  const P = (u, v, h = 0) => [OX + 50 * u - 50 * v, OY + 25 * u + 25 * v - h];
  const pts = a => a.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const LINE = 'stroke="#2b1d14" stroke-width="1.6" stroke-linejoin="round"';

  // Параллелепипед: видны верх, грань +v (слева-спереди) и грань +u (справа-спереди)
  function box(u, v, h, du, dv, dh, c) {
    const top = [P(u, v, h + dh), P(u + du, v, h + dh), P(u + du, v + dv, h + dh), P(u, v + dv, h + dh)];
    const fv = [P(u, v + dv, h), P(u + du, v + dv, h), P(u + du, v + dv, h + dh), P(u, v + dv, h + dh)];
    const fu = [P(u + du, v, h), P(u + du, v + dv, h), P(u + du, v + dv, h + dh), P(u + du, v, h + dh)];
    return `<polygon points="${pts(fu)}" fill="${c[2]}" ${LINE}/>` +
           `<polygon points="${pts(fv)}" fill="${c[1]}" ${LINE}/>` +
           `<polygon points="${pts(top)}" fill="${c[0]}" ${LINE}/>`;
  }
  // Локальная система W×H на грани, параллельной правой стене (плоскость v=const), чтение по +u
  function faceV(u, v, h, du, dh, W, H) {
    const [e, f] = P(u, v, h + dh);
    return { a: 50 * du / W, b: 25 * du / W, d: dh / H, e, f };
  }
  // На грани, параллельной левой стене (u=const), чтение к дальнему углу (−v)
  function faceL(u, v, h, dv, dh, W, H) {
    const [e, f] = P(u, v + dv, h + dh);
    return { a: 50 * dv / W, b: -25 * dv / W, d: dh / H, e, f };
  }
  const mtx = m => `matrix(${m.a} ${m.b} 0 ${m.d} ${m.e} ${m.f})`;
  const fpt = (m, x, y) => [m.e + m.a * x, m.f + m.b * x + m.d * y];
  // Плоский спрайт, стоящий нижним центром в точке p
  const sprite = (p, w, h, inner) =>
    `<g transform="translate(${(p[0] - w / 2).toFixed(1)} ${(p[1] - h).toFixed(1)})">${inner}</g>`;

  // ---------- Общие определения ----------
  const DEFS = `<defs>
    <pattern id="wp" width="40" height="56" patternUnits="userSpaceOnUse">
      <rect width="40" height="56" fill="#e9dcb4"/>
      <path d="M20 6 q-6 8 0 16 q6 -8 0 -16 M20 22 v10 M20 28 q-7 -2 -9 4 M20 28 q7 -2 9 4" fill="#9fb38a" stroke="#7d9467" stroke-width="1.2"/>
      <circle cx="0" cy="42" r="2.2" fill="#c98b6b"/><circle cx="40" cy="42" r="2.2" fill="#c98b6b"/>
    </pattern>
    <pattern id="parq" width="1" height="0.5" patternUnits="userSpaceOnUse">
      <rect width="1" height="0.25" fill="#c08a52"/><rect y="0.25" width="1" height="0.25" fill="#b07b45"/>
      <rect x="0.5" width="0.5" height="0.25" fill="#ba844c"/><rect y="0.25" width="0.5" height="0.25" fill="#a8723f"/>
      <path d="M0 0.25 H1 M0 0.5 H1 M0.5 0 V0.25 M0 0.25 V0.5" stroke="#7d5229" stroke-width="0.012"/>
    </pattern>
    <pattern id="rug" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="#8e1f27"/>
      <path d="M17 3 L31 17 L17 31 L3 17 Z" fill="none" stroke="#d9a94f" stroke-width="2"/>
      <path d="M17 10 L24 17 L17 24 L10 17 Z" fill="#1f3a5c"/>
      <circle cx="17" cy="17" r="2.5" fill="#efd9a6"/>
    </pattern>
    <filter id="tvn" x="0" y="0" width="1" height="1">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="1">
        <animate attributeName="seed" values="1;7;3;9;5;2;8;4" dur="0.48s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .6  0 0 0 0 .75  1.6 0 0 0 -.3"/>
    </filter>
    <radialGradient id="glowg"><stop offset="0" stop-color="#bfd6ff" stop-opacity=".85"/><stop offset="1" stop-color="#bfd6ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa9e8"/><stop offset="1" stop-color="#c9e7fb"/></linearGradient>
  </defs>`;

  // ---------- Комната: стены, пол, окно ----------
  function shell() {
    const L = faceL(0, 0, 0, 8, 280, 800, 280);
    const R = faceV(0, 0, 0, 8, 280, 800, 280);
    const floor = [P(0, 0), P(8, 0), P(8, 8), P(0, 8)];
    const win = faceL(0.02, 5.6, 85, 1.9, 150, 190, 150);
    return `
      <polygon points="${pts([P(0, 8, 0), P(0, 8, -18), P(8, 8, -18), P(8, 0, -18), P(8, 0, 0)])}" fill="#3a2a1d" ${LINE}/>
      <g transform="matrix(50 25 -50 25 ${OX} ${OY})"><rect width="8" height="8" fill="url(#parq)"/></g>
      <polygon points="${pts(floor)}" fill="none" ${LINE}/>
      <polygon points="${pts([P(0.6, 5.5), P(0.6, 7.7), P(3.4, 7.4), P(3.4, 5.8)])}" fill="#fff1b8" opacity=".22"/>
      <g transform="${mtx(L)}">
        <rect width="800" height="280" fill="url(#wp)"/>
        <rect y="262" width="800" height="18" fill="#7a4e2a"/>
      </g>
      <g transform="${mtx(R)}">
        <rect width="800" height="280" fill="url(#wp)"/>
        <rect width="800" height="280" fill="#3b2a18" opacity=".14"/>
        <rect y="262" width="800" height="18" fill="#6a4323"/>
      </g>
      <polygon points="${pts([P(0, 8, 0), P(0, 0, 0), P(8, 0, 0), P(8, 0, 280), P(0, 0, 280), P(0, 8, 280)])}" fill="none" ${LINE}/>
      <polyline points="${pts([P(0, 0, 0), P(0, 0, 280)])}" ${LINE}/>
      <g transform="${mtx(win)}">
        <rect x="-8" y="-8" width="206" height="172" fill="#f5f1e6" stroke="#2b1d14" stroke-width="3"/>
        <rect width="190" height="150" fill="url(#sky)"/>
        <circle cx="140" cy="38" r="20" fill="#ffd84a"/>
        <path d="M30 60 q10 -14 24 -6 q12 -10 22 4 q12 2 8 10 h-58 q-6 -6 4 -8z" fill="#fff"/>
        <path d="M95 0 V150 M0 58 H190" stroke="#f5f1e6" stroke-width="7"/>
        <path d="M0 0 q28 70 6 150 H0z M190 0 q-28 70 -6 150 H190z" fill="#fff" opacity=".55"/>
        <rect x="-14" y="150" width="218" height="10" fill="#efe8d6" stroke="#2b1d14" stroke-width="2"/>
        <path d="M120 150 l4 -16 h14 l4 16z" fill="#b5532c" stroke="#2b1d14" stroke-width="1.5"/>
        <circle cx="124" cy="126" r="7" fill="#e0303b"/><circle cx="136" cy="122" r="8" fill="#ff4b55"/>
        <circle cx="131" cy="114" r="6" fill="#e0303b"/><path d="M118 132 q-8 -2 -10 6 M144 130 q8 -2 10 6" stroke="#3c7a33" stroke-width="4" fill="none"/>
      </g>`;
  }

  // ---------- Предметы ----------
  function kover() {
    const m = faceL(0.04, 2.8, 60, 2.65, 175, 280, 175);
    let fringe = "";
    for (let y = 4; y < 175; y += 7) fringe += `M0 ${y} h-7 M280 ${y} h7 `;
    return `<g data-id="kover" class="click" transform="${mtx(m)}">
      <path d="${fringe}" stroke="#e8d9b0" stroke-width="2"/>
      <rect width="280" height="175" fill="#6e1a20" stroke="#2b1d14" stroke-width="3"/>
      <rect x="12" y="12" width="256" height="151" fill="url(#rug)"/>
      <rect x="12" y="12" width="256" height="151" fill="none" stroke="#d9a94f" stroke-width="5"/>
      <ellipse cx="140" cy="87" rx="62" ry="48" fill="#6e1a20" stroke="#d9a94f" stroke-width="4"/>
      <path d="M140 47 L182 87 L140 127 L98 87Z" fill="#1f3a5c" stroke="#efd9a6" stroke-width="3"/>
      <circle cx="140" cy="87" r="10" fill="#d9a94f"/>
    </g>`;
  }
  function flags() {
    const m = faceL(0.04, 1.15, 172, 1.3, 100, 130, 100);
    return `<g data-id="flags" class="click" transform="${mtx(m)}">
      <path d="M30 100 L82 8 M100 100 L48 8" stroke="#6b4423" stroke-width="5"/>
      <path d="M82 8 l42 8 l-6 14 l8 14 l-46 -4z" fill="#d62a1f" stroke="#2b1d14" stroke-width="2"/>
      <path d="M48 8 l-42 8 l6 14 l-8 14 l46 -4z" fill="#e33b2a" stroke="#2b1d14" stroke-width="2"/>
      <path d="M94 18 l3 6 l6 1 l-4.5 4 l1.2 6 l-5.7 -3 l-5.7 3 l1.2 -6 l-4.5 -4 l6 -1z" fill="#ffd84a"/>
      <circle cx="82" cy="7" r="4" fill="#d9a94f"/><circle cx="48" cy="7" r="4" fill="#d9a94f"/>
    </g>`;
  }
  function vympel() {
    const m = faceL(0.04, 1.3, 55, 0.95, 100, 123, 200);
    return `<g data-id="vympel" class="click" transform="${mtx(m)}">
      <path d="M61 0 v-8" stroke="#2b1d14" stroke-width="3"/>
      <image href="assets/vympel.png" width="123" height="200"/>
    </g>`;
  }

  function stenka(st) {
    const u = 0.3, du = 3.6, dv = 1.25, H = 210;
    const wood = ["#8a5530", "#74431f", "#4f2c17"];
    const m = faceV(u, dv, 0, du, H, 360, H);
    let books = "";
    if (st.owned.pss) {
      for (let i = 0; i < 18; i++) {
        if (i >= 5 && i <= 7) continue; // тома 12–17 потерялись
        const x = 128 + i * 5.8;
        books += `<rect x="${x}" y="64" width="5.4" height="40" fill="${i % 2 ? "#b3261e" : "#9c1f18"}" stroke="#4a0e0a" stroke-width=".6"/>
                  <rect x="${x}" y="70" width="5.4" height="2" fill="#e2b84a"/>`;
      }
    }
    const scratch = st.scratched
      ? `<path d="M20 30 l40 34 l-12 -2 l38 40 M30 112 l50 -26" stroke="#f3dcc0" stroke-width="2.4" fill="none"/>` : "";
    let out = `<g data-id="stenka" class="click">${box(u, 0, 0, du, dv, H, wood)}
      <g transform="${mtx(m)}">
        <rect x="6" y="6" width="112" height="148" fill="#7f4a26" stroke="#2b1d14" stroke-width="2"/>
        <rect x="18" y="18" width="88" height="124" fill="none" stroke="#5a3218" stroke-width="2"/>
        <rect x="122" y="6" width="116" height="148" fill="#2d3c3e" stroke="#2b1d14" stroke-width="2"/>
        <rect x="122" y="6" width="116" height="148" fill="#bcd9dc" opacity=".25"/>
        <path d="M122 56 h116 M122 104 h116" stroke="#c99a68" stroke-width="3"/>
        <rect x="242" y="6" width="112" height="148" fill="#7f4a26" stroke="#2b1d14" stroke-width="2"/>
        <rect x="254" y="18" width="88" height="124" fill="none" stroke="#5a3218" stroke-width="2"/>
        <rect x="6" y="160" width="348" height="44" fill="#6e3f20" stroke="#2b1d14" stroke-width="2"/>
        <path d="M122 160 v44 M238 160 v44" stroke="#2b1d14" stroke-width="2"/>
        <rect x="104" y="74" width="5" height="16" fill="#e6c27a"/><rect x="251" y="74" width="5" height="16" fill="#e6c27a"/>
        <rect x="56" y="180" width="16" height="5" fill="#e6c27a"/><rect x="172" y="180" width="16" height="5" fill="#e6c27a"/><rect x="288" y="180" width="16" height="5" fill="#e6c27a"/>
        ${books}${scratch}
        <path d="M126 10 l26 40 M136 10 l20 30" stroke="#fff" stroke-width="2" opacity=".35"/>
      </g></g>`;
    if (st.owned.fish) out += fish(fpt(m, 180, 54));
    if (st.owned.bust) out += bust(P(u + du / 2, dv / 2, H));
    return out;
  }

  // Синие фарфоровые рыбки, стоят на хвостах
  function fish(p) {
    const one = (x, s, flip) => `<g transform="translate(${x} 44) scale(${flip ? -s : s} ${s})">
      <path d="M0 0 c-10 -6 -6 -16 0 -18 c-12 -6 -14 -24 -2 -40 c4 -6 10 -8 12 -2 c6 14 4 30 -6 40 c6 2 8 12 -4 20z" fill="#1b48b8" stroke="#0c1f5a" stroke-width="1.4"/>
      <path d="M6 -48 c3 6 3 14 0 20" stroke="#fff" stroke-width="2.5" fill="none"/>
      <circle cx="7" cy="-50" r="2" fill="#fff"/>
      <path d="M-3 -34 c4 2 6 6 4 10 M-1 -24 c4 2 5 5 3 8" stroke="#8fb0ff" stroke-width="1.5" fill="none"/>
      <rect x="-9" y="0" width="18" height="3" rx="1.5" fill="#0c1f5a"/></g>`;
    return `<g data-id="fish" class="click">${sprite(p, 70, 46,
      `<g>${one(14, .62, true)}${one(52, .7, false)}${one(33, .82, false)}</g>`)}</g>`;
  }
  function bust(p) {
    return `<g data-id="bust" class="click">${sprite(p, 60, 72, `
      <rect x="12" y="60" width="36" height="12" fill="#b3261e" stroke="#2b1d14" stroke-width="1.6"/>
      <path d="M8 60 q2 -20 22 -24 q20 4 22 24z" fill="#d8d2c4" stroke="#2b1d14" stroke-width="1.6"/>
      <ellipse cx="30" cy="22" rx="13" ry="16" fill="#e4ded0" stroke="#2b1d14" stroke-width="1.6"/>
      <path d="M20 30 q10 16 20 0 q-2 10 -10 12 q-8 -2 -10 -12z" fill="#bdb5a4"/>
      <path d="M22 26 q8 4 16 0" stroke="#8b8473" stroke-width="1.5" fill="none"/>
      <path d="M22 12 q8 -6 16 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`)}</g>`;
  }
  function pssPile(p) {
    let s = "";
    for (let i = 0; i < 6; i++) s += `<rect x="${4 + (i % 2) * 3}" y="${52 - i * 9}" width="44" height="9" fill="${i % 2 ? "#b3261e" : "#9c1f18"}" stroke="#4a0e0a" stroke-width="1"/><rect x="${8 + (i % 2) * 3}" y="${55 - i * 9}" width="3" height="3" fill="#e2b84a"/>`;
    return `<g data-id="pss" class="click">${sprite(p, 56, 62, s)}</g>`;
  }
  function mug(p) {
    return `<g data-id="mug" class="click">${sprite(p, 34, 34, `
      <path d="M24 10 q10 0 10 9 q0 9 -10 9" fill="none" stroke="#3f7d4a" stroke-width="3.5"/>
      <path d="M3 6 h22 v22 q-11 6 -22 0z" fill="#5f9e5a" stroke="#1e3d22" stroke-width="1.6"/>
      <ellipse cx="14" cy="6" rx="11" ry="3" fill="#8cc486" stroke="#1e3d22" stroke-width="1.4"/>
      <path d="M8 14 q3 3 0 7" stroke="#2f6635" stroke-width="1.5" fill="none"/>
      <path d="M19 10 v14" stroke="#c9ecc4" stroke-width="2" opacity=".6"/>`)}</g>`;
  }

  function tumba() {
    const m = faceV(4.3, 1.45, 0, 3.0, 70, 300, 70);
    return `<g data-id="tumba" class="click">${box(4.3, 0, 0, 3.0, 1.45, 70, ["#b57c45", "#9a6435", "#774b25"])}
      <g transform="${mtx(m)}">
        <rect x="8" y="8" width="138" height="54" fill="none" stroke="#5e3a1b" stroke-width="2"/>
        <rect x="154" y="8" width="138" height="54" fill="none" stroke="#5e3a1b" stroke-width="2"/>
        <circle cx="136" cy="35" r="4" fill="#e6c27a"/><circle cx="164" cy="35" r="4" fill="#e6c27a"/>
      </g></g>`;
  }

  // Тот самый телевизор: фото «Сапфира» на передней грани, корпус дорисован
  function tv(h0, hint) {
    const u = 4.5, v = 0.08, du = 2.2, dv = 1.15, dh = 96;
    const m = faceV(u, v + dv, h0, du, dh, 1100, 858);
    const glowAt = P(u + du / 2, v + dv + 1.6, 0);
    return `
      <ellipse class="glow" cx="${glowAt[0]}" cy="${glowAt[1]}" rx="190" ry="80" fill="url(#glowg)" style="mix-blend-mode:screen"/>
      <g data-id="tv" class="click">
        <path d="M${P(u + 1.4, v + .5, h0 + dh)[0]} ${P(u + 1.4, v + .5, h0 + dh)[1]} l-34 -78 M${P(u + 1.5, v + .5, h0 + dh)[0]} ${P(u + 1.5, v + .5, h0 + dh)[1]} l46 -64" stroke="#c9c9c9" stroke-width="2.5"/>
        ${box(u + 0.05, v, h0, du - 0.1, dv, dh - 6, ["#f0cf55", "#d9b23a", "#c49a2a"])}
        <g transform="${mtx(m)}">
          <image href="assets/tv.png" width="1100" height="858"/>
          <rect x="80" y="131" width="711" height="562" rx="64" ry="62" fill="#000" filter="url(#tvn)"/>
          <rect x="80" y="131" width="711" height="562" rx="64" ry="62" fill="#9cc2ff" opacity=".18"/>
        </g>
      </g>
      ${hint ? `<g class="tv-hint" pointer-events="none">
        <text x="${P(u + du / 2, v, h0 + dh + 70)[0]}" y="${P(u + du / 2, v, h0 + dh + 70)[1]}" text-anchor="middle"
          font-family="Neucha, cursive" font-size="30" fill="#b3261e" stroke="#fff8e2" stroke-width="5" paint-order="stroke">жми на телек ↓</text></g>` : ""}`;
  }
  function socket() {
    const s = faceV(5.3, 0, 26, 0.5, 26, 50, 26);
    const t = faceV(4.4, 0, 70, 3.2, 70, 320, 70);
    return `<g transform="${mtx(s)}"><rect width="50" height="26" rx="4" fill="#f4f1e8" stroke="#2b1d14" stroke-width="2"/>
        <circle cx="18" cy="13" r="3" fill="#2b1d14"/><circle cx="32" cy="13" r="3" fill="#2b1d14"/></g>
      <g transform="${mtx(t)}"><text x="160" y="36" text-anchor="middle" font-family="Neucha, cursive" font-size="34" fill="#5b4a3a">сюда бы телек…</text>
        <path d="M150 46 q10 10 4 20 M154 66 l-8 -4 M154 66 l3 -8" stroke="#5b4a3a" stroke-width="2.5" fill="none"/></g>`;
  }

  function kreslo() {
    const fab = ["#d27443", "#b8582c", "#8e3f1e"], wood = ["#a26a38", "#86542a", "#653d1c"];
    return `<g data-id="kreslo" class="click">
      ${box(1.0, 4.5, 0, 0.4, 1.7, 125, fab)}
      ${box(1.4, 4.5, 22, 1.5, 0.22, 52, wood)}
      ${box(1.4, 4.72, 22, 1.45, 1.26, 30, fab)}
      ${box(1.4, 5.98, 22, 1.5, 0.22, 52, wood)}
      ${box(2.7, 5.98, 0, 0.12, 0.12, 22, wood)}
    </g>`;
  }

  // Полная комната по состоянию. Порядок отрисовки — от дальнего к ближнему.
  function renderRoom(st) {
    const o = st.owned;
    let s = DEFS + shell();
    if (o.kover) s += kover();
    if (o.flags) s += flags();
    if (o.vympel) s += vympel();
    if (o.stenka) s += stenka(st);
    else {
      if (o.bust) s += bust(P(1.2, 1.7));
      if (o.pss) s += pssPile(P(2.3, 2.0));
      if (o.fish) s += fish(P(3.3, 1.7));
    }
    if (!o.tv) s += socket();
    if (o.tumba) s += tumba();
    const h0 = o.tumba ? 70 : 0;
    if (o.tv) s += tv(h0, !st.watched);
    if (o.mug) s += mug(o.tumba ? P(7.0, 0.75, 70) : P(7.2, 1.7));
    if (o.kreslo) s += kreslo();
    return s;
  }

  window.ROOM = { CATALOG, renderRoom };
})();
