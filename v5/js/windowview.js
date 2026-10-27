// Вид из окна: процедурные картинки (пожар революции, парад) и живой слой поверх фото:
// языки пламени, марширующие пионеры, скейтер, самолёт с баннером «Марат Сулейманов — Новый день!».
const rnd = (a, b) => a + Math.random() * (b - a);
export const VW = 512, VH = 384; // холст слоя ≈ пропорции окна

function cv(w = VW, h = VH) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }

// ---------- Процедурные виды ----------
function skyline(x, y0, col, seed) {
  x.fillStyle = col; x.beginPath(); x.moveTo(0, VH);
  let px = 0;
  while (px < VW) {
    const w = 30 + ((seed = (seed * 9301 + 49297) % 233280) / 233280) * 60, h = 40 + (seed % 90);
    x.lineTo(px, y0 - h); x.lineTo(px + w, y0 - h);
    if (seed % 5 === 0) { x.lineTo(px + w * 0.5, y0 - h - 26); x.lineTo(px + w * 0.5 + 2, y0 - h - 50); x.lineTo(px + w * 0.5 + 4, y0 - h - 26); } // шпиль
    px += w;
  }
  x.lineTo(VW, VH); x.fill();
}
export const GEN = {
  // пожар революции: багровое небо, дым, силуэты крыш, красные знамёна
  fire() {
    const [c, x] = cv();
    const g = x.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#2a0a12"); g.addColorStop(0.5, "#8a1e14"); g.addColorStop(1, "#ff8a2a");
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 40; i++) { // клубы дыма
      const px = rnd(0, VW), py = rnd(0, VH * 0.55), r = rnd(30, 90), sg = x.createRadialGradient(px, py, 0, px, py, r);
      sg.addColorStop(0, "rgba(30,10,12,.35)"); sg.addColorStop(1, "rgba(30,10,12,0)"); x.fillStyle = sg; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    skyline(x, VH * 0.82, "#3a0c0c", 7);
    skyline(x, VH * 0.95, "#140405", 3);
    [[90, 0.62], [300, 0.58], [430, 0.66]].forEach(([fx, fy]) => { // знамёна на крышах
      x.fillStyle = "#140405"; x.fillRect(fx, VH * fy - 60, 3, 60);
      x.fillStyle = "#d81e1e"; x.beginPath(); x.moveTo(fx + 3, VH * fy - 60); x.quadraticCurveTo(fx + 25, VH * fy - 66, fx + 45, VH * fy - 56); x.lineTo(fx + 45, VH * fy - 34); x.quadraticCurveTo(fx + 25, VH * fy - 44, fx + 3, VH * fy - 38); x.fill();
    });
    return c;
  },
  // площадь для парада: голубое небо, сталинские фасады, брусчатка, флажки
  parade() {
    const [c, x] = cv();
    const g = x.createLinearGradient(0, 0, 0, VH * 0.6);
    g.addColorStop(0, "#7fb4e8"); g.addColorStop(1, "#d8ecff");
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(255,255,255,.7)"; const cx = rnd(0, VW), cy = rnd(20, 90); [0, 22, 44].forEach(d => { x.beginPath(); x.arc(cx + d, cy + (d === 22 ? -8 : 0), 18, 0, 6.28); x.fill(); }); }
    // фасады
    for (let b = 0; b < 4; b++) {
      const bx = b * 132 - 10, bw = 124, top = 120 + (b % 2) * 18;
      x.fillStyle = ["#e9d5b0", "#e0c69a", "#ead9bc", "#dcc08e"][b]; x.fillRect(bx, top, bw, 260 - top);
      x.fillStyle = "#c9ab78"; x.fillRect(bx, top, bw, 8); x.fillRect(bx, top + 60, bw, 4);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { x.fillStyle = "#5a7090"; x.fillRect(bx + 12 + k * 28, top + 20 + r * 30, 14, 20); }
      if (b === 1) { x.fillStyle = "#c22"; x.fillRect(bx + 50, top - 40, 3, 40); x.fillRect(bx + 53, top - 40, 26, 16); }
    }
    // брусчатка
    x.fillStyle = "#6a6a72"; x.fillRect(0, 260, VW, VH - 260);
    x.strokeStyle = "rgba(0,0,0,.18)";
    for (let y = 266; y < VH; y += 10) for (let px = (y / 10 % 2) * 9; px < VW; px += 18) x.strokeRect(px, y, 18, 10);
    // гирлянда флажков
    x.strokeStyle = "#444"; x.beginPath(); x.moveTo(0, 150); x.quadraticCurveTo(VW / 2, 200, VW, 150); x.stroke();
    for (let i = 0; i < 18; i++) {
      const t = i / 17, fx = t * VW, fy = 150 + Math.sin(t * Math.PI) * 25;
      x.fillStyle = ["#d22", "#fc3", "#d22", "#fff"][i % 4]; x.beginPath(); x.moveTo(fx - 7, fy); x.lineTo(fx + 7, fy); x.lineTo(fx, fy + 16); x.fill();
    }
    return c;
  },
};

// ---------- Живой слой ----------
function pioneer(x, px, py, t, kind) {
  const step = Math.sin(t * 6 + px * 0.05), s = 1;
  x.save(); x.translate(px, py);
  x.strokeStyle = "#f0c8a0"; x.lineWidth = 4; x.lineCap = "round";
  x.beginPath(); x.moveTo(0, -18); x.lineTo(step * 8, 0); x.moveTo(0, -18); x.lineTo(-step * 8, 0); x.stroke(); // ноги
  x.fillStyle = "#1d2a5a"; x.fillRect(-7, -26, 14, 10); // шорты
  x.fillStyle = "#fbfbf6"; x.fillRect(-8, -48, 16, 23); // рубашка
  x.fillStyle = "#d81e1e"; x.beginPath(); x.moveTo(-6, -48); x.lineTo(6, -48); x.lineTo(0, -38); x.fill(); // галстук
  x.fillStyle = "#f0c8a0"; x.beginPath(); x.arc(0, -56, 7, 0, 6.28); x.fill(); // голова
  x.fillStyle = "#d81e1e"; x.fillRect(-7, -64, 14, 4); // пилотка
  x.strokeStyle = "#f0c8a0"; x.lineWidth = 3;
  if (kind === "flag") {
    x.beginPath(); x.moveTo(6, -44); x.lineTo(10, -60); x.stroke();
    x.fillStyle = "#5a3a1a"; x.fillRect(10, -100, 2.5, 72);
    const w = Math.sin(t * 4) * 3; x.fillStyle = "#d81e1e"; x.beginPath(); x.moveTo(12.5, -100); x.quadraticCurveTo(26, -104 + w, 40, -98); x.lineTo(40, -80); x.quadraticCurveTo(26, -86 + w, 12.5, -82); x.fill();
  } else if (kind === "bugle") { // горнист: горн к губам, когда трубит — поднят выше
    x.fillStyle = "#e8c040"; x.beginPath(); x.moveTo(4, -56); x.lineTo(22, -60); x.lineTo(30, -66); x.lineTo(30, -52); x.lineTo(22, -56); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(7, -44); x.lineTo(12, -56); x.stroke();
  } else if (kind === "drum") {
    x.fillStyle = "#e8e0d0"; x.fillRect(-9, -36, 18, 11); x.fillStyle = "#c22"; x.fillRect(-9, -36, 18, 3); x.fillRect(-9, -28, 18, 3);
    const h = Math.abs(Math.sin(t * 6)) * 6; x.beginPath(); x.moveTo(-6, -44); x.lineTo(-2, -40 - h); x.moveTo(6, -44); x.lineTo(2, -40 - h); x.stroke();
  } else {
    x.beginPath(); x.moveTo(-7, -44); x.lineTo(-9 - step * 4, -30); x.moveTo(7, -44); x.lineTo(9 + step * 4, -30); x.stroke(); // руки
  }
  x.restore();
}
function skater(x, px, py, ang) {
  x.save(); x.translate(px, py); x.rotate(ang);
  x.fillStyle = "#222"; x.fillRect(-16, -3, 32, 4); x.fillStyle = "#ddd"; [-10, 10].forEach(d => { x.beginPath(); x.arc(d, 3, 2.5, 0, 6.28); x.fill(); });
  x.strokeStyle = "#2a3a6a"; x.lineWidth = 4; x.lineCap = "round"; x.beginPath(); x.moveTo(-6, -3); x.lineTo(-2, -18); x.lineTo(6, -3); x.stroke();
  x.fillStyle = "#e84a2a"; x.fillRect(-6, -34, 11, 17); // футболка
  x.strokeStyle = "#e0b090"; x.lineWidth = 3; x.beginPath(); x.moveTo(-5, -30); x.lineTo(-16, -24); x.moveTo(4, -30); x.lineTo(15, -36); x.stroke();
  x.fillStyle = "#e0b090"; x.beginPath(); x.arc(0, -40, 6, 0, 6.28); x.fill();
  x.fillStyle = "#222"; x.fillRect(-7, -47, 14, 5); // кепка
  x.restore();
}
// дельфин: выпрыгивает дугой из моря и уходит обратно, брызги на входе и выходе
function dolphin(x, px, py, ang, s) {
  x.save(); x.translate(px, py); x.rotate(ang); x.scale(s, s);
  const g = x.createLinearGradient(0, -10, 0, 8); g.addColorStop(0, "#4a5a6e"); g.addColorStop(0.6, "#7d90a6"); g.addColorStop(1, "#dfe6ee");
  x.fillStyle = g; x.beginPath();
  x.moveTo(-26, 0); x.quadraticCurveTo(-10, -11, 12, -6); x.quadraticCurveTo(22, -4, 28, -1); x.lineTo(33, 0); // спина и рострум
  x.lineTo(28, 2); x.quadraticCurveTo(8, 8, -18, 4); x.closePath(); x.fill();
  x.fillStyle = "#4a5a6e";
  x.beginPath(); x.moveTo(-2, -9); x.quadraticCurveTo(2, -19, -8, -20); x.quadraticCurveTo(-7, -13, -10, -8); x.fill(); // плавник
  x.beginPath(); x.moveTo(-24, 0); x.lineTo(-34, -7); x.lineTo(-31, 1); x.lineTo(-35, 7); x.closePath(); x.fill();  // хвост
  x.fillStyle = "#111"; x.beginPath(); x.arc(20, -3, 1.2, 0, 6.28); x.fill();
  x.restore();
}
function splash(x, px, py, q) {
  x.fillStyle = `rgba(255,255,255,${0.9 * (1 - q)})`;
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8), r = 6 + q * 16; x.beginPath(); x.arc(px + Math.cos(a) * r, py - Math.sin(a) * r * 1.3 + q * q * 10, 1.8 * (1 - q) + 0.6, 0, 6.28); x.fill(); }
  x.strokeStyle = `rgba(255,255,255,${0.6 * (1 - q)})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(px, py + 2, 6 + q * 18, 2 + q * 3, 0, 0, 6.28); x.stroke();
}
function flame(x, px, py, h, t, k) {
  const f = 0.7 + 0.3 * Math.sin(t * 9 + k * 1.7) + 0.15 * Math.sin(t * 23 + k);
  const hh = h * f, w = h * 0.32;
  const g = x.createLinearGradient(0, py, 0, py - hh);
  g.addColorStop(0, "rgba(255,240,150,.95)"); g.addColorStop(0.4, "rgba(255,150,40,.85)"); g.addColorStop(1, "rgba(200,30,10,0)");
  x.fillStyle = g; x.beginPath(); x.moveTo(px - w, py);
  x.quadraticCurveTo(px - w * 0.8, py - hh * 0.5, px + Math.sin(t * 5 + k) * w * 0.6, py - hh);
  x.quadraticCurveTo(px + w * 0.8, py - hh * 0.5, px + w, py); x.fill();
}

// Самолёт с баннером: баннер рисуется один раз, потом режется на полосы для «волны».
function makeBanner(text, photo) {
  const [c, x] = cv(380, 64);
  x.fillStyle = "#fff8e6"; x.fillRect(0, 0, 380, 64);
  x.strokeStyle = "#d8362a"; x.lineWidth = 4; x.strokeRect(2, 2, 376, 60);
  if (photo) { x.save(); x.beginPath(); x.arc(36, 32, 25, 0, 6.28); x.clip(); x.drawImage(photo, 11, 7, 50, 50); x.restore(); }
  x.fillStyle = "#2a1f3d"; x.font = "900 21px Nunito, sans-serif"; x.textBaseline = "middle";
  let fs = 21; while (x.measureText(text).width > 300 && fs > 12) { fs--; x.font = `900 ${fs}px Nunito, sans-serif`; }
  x.fillText(text, 70, 33);
  return c;
}
function plane(x, px, py, dir, t) {
  x.save(); x.translate(px, py); x.scale(dir, 1);
  x.fillStyle = "#d8362a"; x.beginPath(); x.ellipse(0, 0, 34, 8, 0, 0, 6.28); x.fill(); // фюзеляж
  x.fillStyle = "#b02018"; x.beginPath(); x.moveTo(-28, -2); x.lineTo(-40, -18); x.lineTo(-32, -18); x.lineTo(-20, -3); x.fill(); // киль
  x.fillStyle = "#f2efe6"; x.fillRect(-6, -3, 22, 6); x.fillStyle = "#e84a3a"; x.fillRect(-4, -12, 12, 24); // крылья
  x.fillStyle = "#7ab8e8"; x.beginPath(); x.ellipse(14, -4, 7, 4, 0, 0, 6.28); x.fill(); // кабина
  x.fillStyle = `rgba(60,60,60,${0.3 + 0.3 * Math.abs(Math.sin(t * 40))})`; x.fillRect(33, -12, 3, 24); // пропеллер
  x.restore();
}

export function createViewLayer(opts) {
  const [c, x] = cv();
  let anim = null, banner = null, last = 0;
  let nextPlane = performance.now() + rnd(25000, 40000), flight = null;
  let nextSkater = 0, ride = null, skDir = Math.random() < 0.5 ? 1 : -1;
  let nextDolphin = 0, jump = null, nextCall = 0, bugleT = -1e9, cheerT = -1e9;
  const photo = new Image(); photo.src = "assets/items/window/marat.jpg";
  photo.onload = () => { banner = makeBanner(opts.bannerText, photo); };
  const ready = () => banner || (banner = makeBanner(opts.bannerText, null));

  function draw(now) {
    const t = now / 1000;
    x.clearRect(0, 0, VW, VH);
    if (anim === "fire") {
      for (let k = 0; k < 14; k++) flame(x, k * 40 + 10, VH * (k % 3 ? 0.93 : 0.8), 60 + (k * 37 % 50), t, k);
      x.fillStyle = "rgba(255,200,100,.8)";
      for (let k = 0; k < 24; k++) { const life = (t * 0.4 + k * 0.137) % 1; x.globalAlpha = 1 - life; x.fillRect((k * 71 + Math.sin(t + k) * 12) % VW, VH * (0.85 - life * 0.7), 2, 2); }
      x.globalAlpha = 1;
    } else if (anim === "pioneers") {
      const sp = 38, gap = 46, n = 9, period = (VW + n * gap + 80) / sp;
      const base = ((t % period) * sp) - n * gap;
      for (let i = 0; i < n; i++) pioneer(x, base + i * gap, 330 + (i % 2) * 8, t, i === n - 1 ? "flag" : i === n - 2 ? "drum" : i === 0 ? "bugle" : "");
      // изредка горнист трубит, а отряд кричит «Ура!»
      if (now > nextCall) { nextCall = now + rnd(14000, 30000); if (Math.random() < 0.5) { opts.onBugle && opts.onBugle(); bugleT = now; } else { opts.onHurrah && opts.onHurrah(); cheerT = now; } }
      if (now - cheerT < 1600) { x.fillStyle = "#d81e1e"; x.font = "900 26px Nunito, sans-serif"; x.globalAlpha = 1 - (now - cheerT) / 1600; x.fillText("УРА-А-А!", VW / 2 - 70, 250 - (now - cheerT) / 40); x.globalAlpha = 1; }
    } else if (anim === "skate") {
      // туда — обратно по очереди, паузы короче
      if (!ride && now > nextSkater) { skDir = -skDir; ride = { t0: now, dur: rnd(3200, 4600), dir: skDir }; opts.onSkater && opts.onSkater(); }
      if (ride) {
        const p = (now - ride.t0) / ride.dur;
        if (p >= 1) { ride = null; nextSkater = now + rnd(2500, 7000); }
        else {
          const u = ride.dir > 0 ? p : 1 - p, px = -30 + u * (VW + 60);
          const py = 250 + Math.sin(u * Math.PI) * 60 - Math.max(0, Math.sin(u * Math.PI * 3)) * 18;
          skater(x, px, py, Math.cos(u * Math.PI) * 0.35 * ride.dir);
        }
      }
    } else if (anim === "dolphin") {
      if (!jump && now > nextDolphin) jump = { t0: now, dur: rnd(1300, 1700), x0: rnd(40, 230), dir: Math.random() < 0.5 ? 1 : -1, s: rnd(0.8, 1.1) };
      if (jump) {
        const p = (now - jump.t0) / jump.dur, sea = 286, len = 70 * jump.s;
        if (p >= 1.25) { jump = null; nextDolphin = now + rnd(5000, 12000); }
        else {
          const q = Math.min(1, p), px = jump.x0 + jump.dir * q * len, py = sea - Math.sin(q * Math.PI) * 46 * jump.s;
          if (p < 1) { x.save(); x.translate(px, py); x.scale(jump.dir, 1); dolphin(x, 0, 0, (q - 0.5) * 1.8, jump.s); x.restore(); }
          if (p < 0.35) splash(x, jump.x0, sea, p / 0.35);
          if (p > 0.85) splash(x, jump.x0 + jump.dir * len, sea, (p - 0.85) / 0.4);
        }
      }
    }
    // самолёт летит прямо перед окном: крупно (S), в нижней половине — под горизонтальной перекладиной рамы
    // (она на 30% от верха, ≈ y 115), чтобы баннер с лицом и надписью читался в любом виде. Тонкие вертикальные
    // стойки рамы баннер проезжает насквозь — читать не мешают.
    if (!flight && now > nextPlane) { flight = { t0: now, dur: rnd(11000, 13000), dir: Math.random() < 0.5 ? 1 : -1, y: rnd(218, 238) }; opts.onPlane && opts.onPlane(); }
    if (flight) {
      const p = (now - flight.t0) / flight.dur;
      if (p >= 1) { flight = null; nextPlane = now + rnd(60000, 120000); }
      else {
        const S = 1.75, b = ready(), d = flight.dir, bw = b.width * S, bh = b.height * S, gap = 95 * S;
        const span = VW + 70 * S + bw + gap;
        const px = d > 0 ? -60 * S + p * span : VW + 60 * S - p * span, py = flight.y + Math.sin(t * 1.5) * 3;
        x.save(); x.translate(px, py); x.scale(S, S); plane(x, 0, 0, d, t); x.restore();
        // трос и баннер позади самолёта, полосами с волной
        const bx = d > 0 ? px - gap - bw : px + gap;
        x.strokeStyle = "#555"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px - d * 34 * S, py); x.lineTo(d > 0 ? bx + bw : bx, py); x.stroke();
        for (let s = 0; s < b.width; s += 8) {
          const sx = d > 0 ? s : b.width - 8 - s;
          const wave = Math.sin(t * 5 + s * 0.04) * 4 * (s / b.width);
          x.drawImage(b, sx, 0, 8, b.height, bx + sx * S, py - bh / 2 + wave, 8.6 * S, bh);
        }
      }
    }
  }
  return {
    canvas: c,
    setAnim(a) { anim = a || null; if (a === "skate") nextSkater = performance.now() + 1500; if (a === "pioneers") nextCall = performance.now() + 4000; if (a === "dolphin") nextDolphin = performance.now() + 2500; },
    // true — холст поменялся, текстуру надо обновить
    tick(now) {
      const busy = anim || flight || now > nextPlane;
      if (!busy) { if (last) { x.clearRect(0, 0, VW, VH); last = 0; return true; } return false; }
      draw(now); last = now; return true;
    },
    planeNow() { nextPlane = 0; },
  };
}
