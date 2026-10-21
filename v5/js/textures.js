// Текстуры: фото из папки «картинки» + процедурные (паркет, дерево, ковры, ткань, книги).
import * as THREE from "three";

const rnd = (a, b) => a + Math.random() * (b - a);

function canvas(w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}
function speckle(ctx, w, h, n, a = 0.08) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random(), 1 + Math.random());
  }
}
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  return t;
}

// Паркет: доски с разным тоном, волокна, тёмные щели
export function parquet() {
  const S = 1024, [c, x] = canvas(S, S);
  const rowH = 64;
  for (let y = 0; y < S; y += rowH) {
    let px = -Math.random() * 400;
    while (px < S) {
      const len = rnd(280, 560);
      x.fillStyle = `hsl(${rnd(24, 32)} ${rnd(38, 52)}% ${rnd(30, 44)}%)`;
      x.fillRect(px, y, len, rowH);
      for (let k = 0; k < 9; k++) {
        x.strokeStyle = `rgba(50,25,8,${rnd(0.06, 0.2)})`; x.lineWidth = rnd(0.6, 1.6);
        x.beginPath();
        const yy = y + rnd(4, rowH - 4), ph = rnd(0, 6), am = rnd(1, 4);
        for (let t = 0; t <= len; t += 16) x.lineTo(px + t, yy + Math.sin(t / 60 + ph) * am);
        x.stroke();
      }
      const g = x.createLinearGradient(px, y, px, y + rowH);
      g.addColorStop(0, "rgba(255,240,210,.08)"); g.addColorStop(1, "rgba(0,0,0,.08)");
      x.fillStyle = g; x.fillRect(px, y, len, rowH);
      x.fillStyle = "rgba(25,12,4,.75)"; x.fillRect(px, y, 2, rowH);
      px += len;
    }
    x.fillStyle = "rgba(25,12,4,.75)"; x.fillRect(0, y, S, 2);
  }
  speckle(x, S, S, 30000, 0.05);
  return tex(c);
}

// Дерево: вертикальные волокна
export function wood(h, s, l, S = 512) {
  const [c, x] = canvas(S, S);
  x.fillStyle = `hsl(${h} ${s}% ${l}%)`; x.fillRect(0, 0, S, S);
  for (let k = 0; k < 70; k++) {
    x.strokeStyle = Math.random() < 0.7 ? `rgba(20,8,2,${rnd(0.05, 0.22)})` : `rgba(255,220,180,${rnd(0.03, 0.08)})`;
    x.lineWidth = rnd(0.8, 3);
    x.beginPath();
    const xx = rnd(0, S), ph = rnd(0, 6), am = rnd(2, 10);
    for (let t = 0; t <= S; t += 8) x.lineTo(xx + Math.sin(t / rnd(50, 120) + ph) * am, t);
    x.stroke();
  }
  speckle(x, S, S, 8000, 0.04);
  return tex(c);
}

// Ковёр: каймы, поле с орнаментом, центральный медальон, шерстяной шум
export function rug(pal) {
  const W = 1024, H = 720, [c, x] = canvas(W, H);
  const band = (i, col) => { x.fillStyle = col; x.fillRect(i, i, W - 2 * i, H - 2 * i); };
  band(0, pal.edge); band(18, pal.gold); band(26, pal.border); band(88, pal.gold); band(96, pal.field);
  // мелкий орнамент каймы
  x.fillStyle = pal.motif;
  for (let t = 40; t < W - 40; t += 44) { diamond(x, t, 57, 16); diamond(x, t, H - 57, 16); }
  for (let t = 40; t < H - 40; t += 44) { diamond(x, 57, t, 16); diamond(x, W - 57, t, 16); }
  // поле
  for (let yy = 130; yy < H - 120; yy += 52)
    for (let xx = 130; xx < W - 120; xx += 52) {
      x.fillStyle = pal.motif; diamond(x, xx, yy, 10);
      x.fillStyle = pal.gold; x.fillRect(xx - 2, yy - 2, 4, 4);
    }
  // медальон
  const cx = W / 2, cy = H / 2;
  [[250, pal.gold], [238, pal.border], [190, pal.edge], [180, pal.motif], [120, pal.gold], [110, pal.field], [55, pal.border], [24, pal.gold]]
    .forEach(([r, col]) => { x.fillStyle = col; lozenge(x, cx, cy, r * 1.25, r * 0.85); });
  // углы
  [[96, 96], [W - 96, 96], [96, H - 96], [W - 96, H - 96]].forEach(([qx, qy]) => {
    x.fillStyle = pal.border; lozenge(x, qx, qy, 90, 64); x.fillStyle = pal.gold; lozenge(x, qx, qy, 40, 28);
  });
  speckle(x, W, H, 90000, 0.07);
  const g = x.createRadialGradient(cx, cy, 100, cx, cy, W * 0.7);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.25)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return tex(c);
}
function diamond(x, cx, cy, r) { lozenge(x, cx, cy, r, r); }
function lozenge(x, cx, cy, rx, ry) {
  x.beginPath(); x.moveTo(cx, cy - ry); x.lineTo(cx + rx, cy); x.lineTo(cx, cy + ry); x.lineTo(cx - rx, cy); x.closePath(); x.fill();
}

// Обивочная ткань: мелкая «ёлочка» + шум
export function fabric(base, line, rep = 4) {
  const S = 256, [c, x] = canvas(S, S);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  x.strokeStyle = line; x.lineWidth = 1.2;
  for (let i = -S; i < S * 2; i += 6) {
    x.globalAlpha = 0.35; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + S / 2, S / 2); x.lineTo(i, S); x.stroke();
  }
  x.globalAlpha = 1;
  speckle(x, S, S, 9000, 0.06);
  return tex(c, rep, rep);
}

// Нормал-карта из карты высот (серый холст): разности соседей → RGB
export function normalMap(hc, strength = 2) {
  const W = hc.width, H = hc.height, src = hc.getContext("2d").getImageData(0, 0, W, H).data;
  const [c, x] = canvas(W, H), out = x.createImageData(W, H), d = out.data;
  const h = (i, j) => src[(((j + H) % H) * W + ((i + W) % W)) * 4] / 255;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = (h(i + 1, j) - h(i - 1, j)) * strength, dy = (h(i, j + 1) - h(i, j - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), k = (j * W + i) * 4;
    d[k] = (-dx / l * 0.5 + 0.5) * 255; d[k + 1] = (dy / l * 0.5 + 0.5) * 255; d[k + 2] = (1 / l * 0.5 + 0.5) * 255; d[k + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// потёртости: светлые размытые пятна в центре (там, где сидят) и по краям
function wear(x, S, col, n = 5) {
  for (let i = 0; i < n; i++) {
    const cx = S * rnd(0, 1), cy = S * rnd(0, 1), r = S * rnd(0.04, 0.1); // мелкие — текстура тайлится
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${col},${rnd(0.12, 0.22)})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
}
// Рогожка: переплетение «корзинкой» из двухцветных нитей + нормал-карта + потёртость
export function rogozhka(base, alt, rep = 6) {
  const S = 256, cell = 8, [c, x] = canvas(S, S), [hc, hx] = canvas(S, S);
  hx.fillStyle = "#000"; hx.fillRect(0, 0, S, S);
  for (let j = 0; j < S / cell; j++) for (let i = 0; i < S / cell; i++) {
    const horiz = (i + j) % 2 === 0;
    for (let k = 0; k < 3; k++) { // три нити в ячейке
      const o = 1 + k * (cell / 3);
      x.fillStyle = Math.random() < 0.3 ? alt : base;
      const [rx, ry, rw, rh] = horiz ? [i * cell, j * cell + o, cell, cell / 3 - 0.6] : [i * cell + o, j * cell, cell / 3 - 0.6, cell];
      x.fillRect(rx, ry, rw, rh);
      const g = horiz ? hx.createLinearGradient(0, ry, 0, ry + rh) : hx.createLinearGradient(rx, 0, rx + rw, 0);
      g.addColorStop(0, "#333"); g.addColorStop(0.5, "#fff"); g.addColorStop(1, "#333");
      hx.fillStyle = g; hx.fillRect(rx, ry, rw, rh);
    }
  }
  wear(x, S, "225,215,180", 14);
  x.fillStyle = "rgba(0,0,0,.25)"; // тень в зазорах
  for (let p = 0; p < S; p += cell) { x.fillRect(p, 0, 0.8, S); x.fillRect(0, p, S, 0.8); }
  speckle(x, S, S, 6000, 0.06);
  const t = tex(c, rep, rep), n = normalMap(hc, 3); n.repeat.set(rep, rep);
  return { map: t, normal: n };
}
// Велюр: мягкий ворс с полосами «против шерсти», вытертые светлые места
export function velour(base, rep = 3) {
  const S = 256, [c, x] = canvas(S, S), [hc, hx] = canvas(S, S);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  hx.fillStyle = "#808080"; hx.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) { // полосы ворса
    const px = rnd(0, S), w = rnd(6, 30), a = rnd(0.015, 0.045), light = Math.random() < 0.5;
    x.fillStyle = light ? `rgba(255,220,200,${a})` : `rgba(0,0,0,${a})`; x.fillRect(px, 0, w, S);
    hx.fillStyle = light ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.15)"; hx.fillRect(px, 0, w, S);
  }
  wear(x, S, "235,190,160", 12);
  for (let i = 0; i < 9000; i++) { const v = Math.random() < 0.5 ? 0 : 255; hx.fillStyle = `rgba(${v},${v},${v},.25)`; hx.fillRect(rnd(0, S), rnd(0, S), 1, 2); }
  speckle(x, S, S, 8000, 0.05);
  const t = tex(c, rep, rep), n = normalMap(hc, 1.5); n.repeat.set(rep, rep);
  return { map: t, normal: n };
}

// Малахит: концентрические зелёные полосы
export function malachite() {
  const S = 256, [c, x] = canvas(S, S);
  x.fillStyle = "#0e5a3a"; x.fillRect(0, 0, S, S);
  for (let r = 180; r > 2; r -= rnd(2, 6)) {
    x.strokeStyle = Math.random() < 0.5 ? "rgba(20,120,80,.8)" : "rgba(5,50,30,.8)"; x.lineWidth = rnd(1, 3);
    x.beginPath();
    for (let a = 0; a <= 6.3; a += 0.2) { const rr = r * (1 + 0.08 * Math.sin(a * 3 + r * 0.1)); x.lineTo(S * 0.4 + Math.cos(a) * rr, S * 0.6 + Math.sin(a) * rr); }
    x.stroke();
  }
  return tex(c);
}

// Корешки ПСС: красные тома с золотыми полосками
export function spines(n = 12) {
  const W = 512, H = 256, [c, x] = canvas(W, H), w = W / n;
  for (let i = 0; i < n; i++) {
    x.fillStyle = `hsl(${rnd(356, 362)} ${rnd(62, 72)}% ${rnd(26, 34)}%)`; x.fillRect(i * w, 0, w, H);
    x.fillStyle = "#d6ac4c";
    x.fillRect(i * w + 3, 22, w - 6, 5); x.fillRect(i * w + 3, H - 30, w - 6, 5);
    x.fillRect(i * w + w / 2 - 6, 60, 12, 26);
    x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(i * w + w - 2, 0, 2, H);
  }
  speckle(x, W, H, 4000, 0.06);
  return tex(c);
}

// Шкала радиолы с городами
export function dial() {
  const [c, x] = canvas(512, 96);
  const g = x.createLinearGradient(0, 0, 0, 96); g.addColorStop(0, "#f6e2a8"); g.addColorStop(1, "#d8b56a");
  x.fillStyle = g; x.fillRect(0, 0, 512, 96);
  x.fillStyle = "#3a2410"; x.font = "bold 17px Nunito, sans-serif";
  ["МОСКВА", "КИЕВ", "РИГА", "ВАРШАВА", "ПРАГА", "ЛОНДОН"].forEach((s, i) => x.fillText(s, 14 + i * 84, 34));
  for (let i = 0; i < 64; i++) x.fillRect(10 + i * 7.8, 52, 1.5, i % 4 ? 10 : 18);
  x.fillStyle = "#b3261e"; x.fillRect(300, 44, 3, 40);
  return tex(c);
}

// Надпись карандашом на обоях: «сюда бы телек…»
export async function scribble(text) {
  try { await document.fonts.load("64px Neucha"); } catch (e) {}
  const [c, x] = canvas(512, 160);
  x.fillStyle = "rgba(70,55,40,.85)"; x.font = "64px Neucha, cursive"; x.textAlign = "center";
  x.fillText(text, 256, 70);
  x.strokeStyle = "rgba(70,55,40,.85)"; x.lineWidth = 4; x.beginPath();
  x.moveTo(250, 92); x.quadraticCurveTo(270, 120, 256, 150); x.moveTo(242, 138); x.lineTo(256, 152); x.lineTo(268, 136); x.stroke();
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

// Мягкие пятна: тёмные/светлые размытые кляксы (с переносом через край, чтобы тайлилось)
function blotches(x, W, H, n, rMin, rMax, dark, light) {
  for (let i = 0; i < n; i++) {
    const cx = rnd(0, W), cy = rnd(0, H), r = rnd(rMin, rMax), d = Math.random() < 0.55;
    const col = d ? dark : light, a = rnd(0.04, 0.14);
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
    }
  }
}

// Серая штукатурка: пятна, следы шпателя, потёки сверху, редкие трещины. Холст = 2.6 м стены.
export function plaster() {
  const S = 1024, [c, x] = canvas(S, S);
  x.fillStyle = "#a9a69e"; x.fillRect(0, 0, S, S);
  blotches(x, S, S, 160, 40, 200, "60,58,54", "235,232,222");
  // следы шпателя: короткие светлые дуги
  for (let i = 0; i < 260; i++) {
    const cx = rnd(0, S), cy = rnd(0, S), r = rnd(30, 90), a0 = rnd(0, 6.28);
    x.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,250,${rnd(0.04, 0.1)})` : `rgba(40,38,34,${rnd(0.03, 0.08)})`;
    x.lineWidth = rnd(2, 8); x.beginPath(); x.arc(cx, cy, r, a0, a0 + rnd(0.4, 1.2)); x.stroke();
  }
  // потёки от потолка
  for (let i = 0; i < 26; i++) {
    const px = rnd(10, S - 10), len = rnd(120, 620), w = rnd(3, 14);
    const g = x.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0, `rgba(70,60,45,${rnd(0.12, 0.28)})`); g.addColorStop(1, "rgba(70,60,45,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(px - w, 0);
    for (let t = 0; t <= len; t += 20) x.lineTo(px - w * (1 - t / len) + Math.sin(t / 40) * 2, t);
    for (let t = len; t >= 0; t -= 20) x.lineTo(px + w * (1 - t / len) * 0.7 + Math.sin(t / 40) * 2, t);
    x.fill();
  }
  // трещины
  for (let i = 0; i < 5; i++) {
    let px = rnd(0, S), py = rnd(0, S);
    x.strokeStyle = "rgba(45,42,38,.35)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 14; k++) { px += rnd(-14, 14); py += rnd(4, 16); x.lineTo(px, py); }
    x.stroke();
  }
  speckle(x, S, S, 60000, 0.07);
  return tex(c, 1 / 2.6, 1 / 2.6);
}

// Голая комната по фото (раунд 2): фото-плитка штукатурки/стяжки 2×2 на холсте + мелкая процедурная
// фактура поверх (зерно, следы шпателя, пятна) — фото маленькое, без этого вблизи мыло.
function photoTile(img, S, n) {
  const [c, x] = canvas(S, S), w = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) x.drawImage(img, i * w, j * w, w, w);
  return [c, x];
}
export function plasterPhoto(img) { // холст = 2.6 м стены
  const S = 1024, [c, x] = photoTile(img, S, 2);
  blotches(x, S, S, 70, 40, 220, "55,52,48", "240,238,230");
  for (let i = 0; i < 160; i++) {
    const cx = rnd(0, S), cy = rnd(0, S), r = rnd(30, 90), a0 = rnd(0, 6.28);
    x.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,250,${rnd(0.03, 0.07)})` : `rgba(40,38,34,${rnd(0.03, 0.06)})`;
    x.lineWidth = rnd(2, 8); x.beginPath(); x.arc(cx, cy, r, a0, a0 + rnd(0.4, 1.2)); x.stroke();
  }
  for (let i = 0; i < 9; i++) { // редкие потёки от потолка
    const px = rnd(10, S - 10), len = rnd(100, 420), w = rnd(3, 10);
    const g = x.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0, `rgba(70,62,50,${rnd(0.08, 0.16)})`); g.addColorStop(1, "rgba(70,62,50,0)");
    x.fillStyle = g; x.fillRect(px - w / 2, 0, w, len);
  }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(40,38,35,${rnd(0.15, 0.4)})`; x.beginPath(); x.arc(rnd(0, S), rnd(0, S), rnd(0.6, 2.2), 0, 6.28); x.fill(); } // раковины
  speckle(x, S, S, 90000, 0.06);
  return tex(c, 1 / 2.6, 1 / 2.6);
}
export function concretePhoto(img) { // холст = 2×2 м, стяжка без плит
  const S = 1024, [c, x] = photoTile(img, S, 2);
  blotches(x, S, S, 90, 30, 200, "45,42,38", "215,210,200");
  for (let i = 0; i < 4; i++) { // мокрые пятна
    const cx = rnd(0, S), cy = rnd(0, S), r = rnd(50, 120);
    for (let k = 0; k < 9; k++) {
      const px = cx + rnd(-r, r) * 0.6, py = cy + rnd(-r, r) * 0.4, pr = r * rnd(0.3, 0.6), g = x.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, "rgba(40,34,28,.08)"); g.addColorStop(1, "rgba(40,34,28,0)"); x.fillStyle = g; x.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
  }
  for (let i = 0; i < 6000; i++) { const v = rnd(70, 200) | 0; x.fillStyle = `rgba(${v},${v - 3},${v - 7},${rnd(0.12, 0.35)})`; x.fillRect(rnd(0, S), rnd(0, S), rnd(1, 3), rnd(1, 2.5)); } // щебень
  for (let i = 0; i < 4; i++) { // волосяные трещины в стяжке
    let px = rnd(0, S), py = rnd(0, S); x.strokeStyle = "rgba(35,32,28,.35)"; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 18; k++) { px += rnd(-12, 16); py += rnd(-12, 16); x.lineTo(px, py); } x.stroke();
  }
  speckle(x, S, S, 80000, 0.07);
  return tex(c);
}

// Бетонный пол: плиты 1×1 м со швами, пятна, ржавые капли, мелкий щебень. Холст = 2×2 м.
export function concrete() {
  const S = 1024, [c, x] = canvas(S, S);
  x.fillStyle = "#8d8b85"; x.fillRect(0, 0, S, S);
  // плиты чуть разного тона
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    x.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},${rnd(0.02, 0.06)})`;
    x.fillRect(i * 512, j * 512, 512, 512);
  }
  blotches(x, S, S, 120, 30, 160, "40,38,34", "220,216,205");
  // масляные и мокрые пятна
  for (let i = 0; i < 4; i++) { // пятно = кучка мягких клякс неровной формы
    const cx = rnd(0, S), cy = rnd(0, S), r = rnd(40, 110);
    for (let k = 0; k < 9; k++) {
      const px = cx + rnd(-r, r) * 0.6, py = cy + rnd(-r, r) * 0.4, pr = r * rnd(0.3, 0.6);
      const g = x.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, "rgba(40,34,28,.09)"); g.addColorStop(1, "rgba(40,34,28,0)");
      x.fillStyle = g; x.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
  }
  for (let i = 0; i < 10; i++) { x.fillStyle = `rgba(130,80,40,${rnd(0.06, 0.14)})`; x.beginPath(); x.arc(rnd(0, S), rnd(0, S), rnd(1.5, 4), 0, 6.28); x.fill(); }
  // щебень
  for (let i = 0; i < 5000; i++) {
    const v = rnd(70, 190) | 0; x.fillStyle = `rgba(${v},${v - 4},${v - 8},${rnd(0.15, 0.4)})`;
    x.fillRect(rnd(0, S), rnd(0, S), rnd(1, 3.5), rnd(1, 3));
  }
  // швы плит
  x.fillStyle = "rgba(35,33,30,.75)";
  [0, 512].forEach(p => { x.fillRect(p, 0, 4, S); x.fillRect(0, p, S, 4); });
  x.fillStyle = "rgba(255,255,255,.12)";
  [0, 512].forEach(p => { x.fillRect(p + 4, 0, 1, S); x.fillRect(0, p + 4, S, 1); });
  speckle(x, S, S, 50000, 0.08);
  return tex(c);
}

// Паркет-ёлочка: тон планок — средний цвет фото, рисунок дерева процедурный (волокна, «соборы» годичных колец,
// поры, сучки). Отдаёт цвет + нормал-карту (швы между планками утоплены) + карту шероховатости (лак блестит,
// вытертое — матовое). old — покоцанный: щели, вытертые до серого дорожки, пятна, царапины, выбитые и заменённые
// планки, капли краски. Период — 8 планок, текстура бесшовная.
export function herringbone(img, old) {
  const S = 2048, Wp = S / 16, Lp = Wp * 4, [c, x] = canvas(S, S), [hc, hx] = canvas(S, S), [rc, rx] = canvas(S, S); // холст = 2.2 м
  const [pc, px1] = canvas(1, 1); px1.drawImage(img, 0, 0, 1, 1);
  const [r0, g0, b0] = px1.getImageData(0, 0, 1, 1).data;
  hx.fillStyle = "#000"; hx.fillRect(0, 0, S, S);
  rx.fillStyle = old ? "#b0b0b0" : "#5a5a5a"; rx.fillRect(0, 0, S, S);
  const plank = (px, py, vert) => {
    for (const [ctx, kind] of [[x, "c"], [hx, "h"], [rx, "r"]]) {
      ctx.save(); ctx.translate(px, py); if (vert) { ctx.translate(Wp, 0); ctx.rotate(Math.PI / 2); }
      ctx.beginPath(); ctx.rect(0, 0, Lp, Wp); ctx.clip();
      if (kind === "h") { ctx.fillStyle = "#c8c8c8"; ctx.fillRect(2, 2, Lp - 4, Wp - 4); }
      ctx.restore();
    }
    x.save(); x.translate(px, py); if (vert) { x.translate(Wp, 0); x.rotate(Math.PI / 2); }
    x.beginPath(); x.rect(0, 0, Lp, Wp); x.clip();
    const swap = old && Math.random() < 0.05; // заменённая планка другого дерева
    const k = swap ? rnd(0.55, 0.7) : rnd(0.78, 1.14), warm = swap ? 0.85 : rnd(0.95, 1.04);
    x.fillStyle = `rgb(${r0 * k * warm | 0},${g0 * k | 0},${b0 * k * rnd(0.88, 1.05) | 0})`; x.fillRect(0, 0, Lp, Wp);
    if (Math.random() < 0.45) { // «собор»: вложенные дуги годичных колец
      const cx = rnd(0.2, 0.8) * Lp, cy = rnd(0.2, 0.8) * Wp;
      for (let r = 6; r < Lp; r += rnd(5, 11)) { x.strokeStyle = `rgba(60,28,8,${rnd(0.08, 0.22)})`; x.lineWidth = rnd(0.8, 2.2); x.beginPath(); x.ellipse(cx, cy, r * 2.4, r * 0.55, 0, 0, 6.28); x.stroke(); }
    } else for (let i = 0; i < 16; i++) { // прямые волокна
      x.strokeStyle = Math.random() < 0.75 ? `rgba(45,20,6,${rnd(0.08, 0.26)})` : `rgba(255,225,180,${rnd(0.05, 0.12)})`;
      x.lineWidth = rnd(0.7, 2.4); x.beginPath();
      const yy = rnd(2, Wp - 2), ph = rnd(0, 6), am = rnd(0.5, 3), fr = rnd(30, 90);
      for (let t = 0; t <= Lp; t += 8) x.lineTo(t, yy + Math.sin(t / fr + ph) * am);
      x.stroke();
    }
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(40,18,5,${rnd(0.15, 0.35)})`; x.fillRect(rnd(0, Lp), rnd(0, Wp), rnd(2, 6), 0.8); } // поры
    if (Math.random() < 0.25) { x.fillStyle = "rgba(50,22,6,.45)"; x.beginPath(); x.ellipse(rnd(20, Lp - 20), rnd(8, Wp - 8), rnd(4, 9), rnd(2, 4), 0, 0, 6.28); x.fill(); }
    const g = x.createLinearGradient(0, 0, 0, Wp);
    g.addColorStop(0, `rgba(255,240,215,${old ? 0.03 : 0.12})`); g.addColorStop(1, "rgba(0,0,0,.12)");
    x.fillStyle = g; x.fillRect(0, 0, Lp, Wp);
    if (old && Math.random() < 0.04) { const gx = x.createLinearGradient(0, 0, Lp * 0.3, 0); gx.addColorStop(0, "rgba(20,10,4,.45)"); gx.addColorStop(1, "rgba(20,10,4,0)"); x.fillStyle = gx; x.fillRect(0, 0, Lp * 0.3, Wp); } // почерневший торец
    x.strokeStyle = old ? "rgba(18,9,3,.95)" : "rgba(40,20,8,.6)"; x.lineWidth = old ? rnd(2.5, 5) : 1.6; x.strokeRect(0, 0, Lp, Wp);
    x.restore();
  };
  for (let b = -5; b <= 5; b++) for (let k = -24; k <= 40; k++) {
    const hxp = (k + 4 * b) * Wp, hyp = (k - 4 * b) * Wp;
    if (hxp > -2 * Lp && hxp < S + Lp && hyp > -2 * Lp && hyp < S + Lp) { plank(hxp, hyp, false); plank(hxp, hyp + Wp, true); }
  }
  if (old) {
    // вытертые до серого дерева дорожки (без лака: светлые, матовые)
    for (let i = 0; i < 60; i++) {
      const cx = rnd(0, S), cy = rnd(0, S), r = rnd(60, 220);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(205,185,155,${rnd(0.25, 0.45)})`); g.addColorStop(1, "rgba(205,185,155,0)");
        x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
        const rg = rx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); rg.addColorStop(0, "rgba(255,255,255,.6)"); rg.addColorStop(1, "rgba(255,255,255,0)");
        rx.fillStyle = rg; rx.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
      }
    }
    blotches(x, S, S, 90, 30, 140, "35,18,6", "235,205,165");
    for (let i = 0; i < 16; i++) { // тёмные пятна (пролитое, от горшка)
      const cx = rnd(0, S), cy = rnd(0, S), r = rnd(14, 40);
      x.fillStyle = `rgba(30,14,4,${rnd(0.3, 0.5)})`; x.beginPath(); x.ellipse(cx, cy, r, r * rnd(0.5, 1), rnd(0, 3), 0, 6.28); x.fill();
      if (Math.random() < 0.5) { x.strokeStyle = "rgba(30,14,4,.4)"; x.lineWidth = 3; x.beginPath(); x.arc(cx + r * 2, cy, r * 0.8, 0, 6.28); x.stroke(); } // след от кастрюли
    }
    for (let i = 0; i < 1500; i++) { // царапины: светлые и тёмные, от ножек мебели — дугами
      const light = Math.random() < 0.65; x.strokeStyle = `rgba(${light ? "245,222,185" : "20,10,3"},${rnd(0.2, 0.55)})`; x.lineWidth = rnd(0.5, 1.8);
      const qx = rnd(0, S), qy = rnd(0, S), a = rnd(0, 6.28), l = rnd(8, 90);
      x.beginPath(); x.moveTo(qx, qy); x.quadraticCurveTo(qx + Math.cos(a + 0.3) * l / 2, qy + Math.sin(a + 0.3) * l / 2, qx + Math.cos(a) * l, qy + Math.sin(a) * l); x.stroke();
      if (!light) { hx.strokeStyle = "rgba(0,0,0,.5)"; hx.lineWidth = 1.2; hx.beginPath(); hx.moveTo(qx, qy); hx.lineTo(qx + Math.cos(a) * l, qy + Math.sin(a) * l); hx.stroke(); }
    }
    for (let i = 0; i < (Math.random() < 0.5 ? 1 : 0); i++) { // выбитая планка (редко): дыра до стяжки
      const qx = rnd(0, S - Lp), qy = rnd(0, S - Wp), vert = Math.random() < 0.5, w = vert ? Wp * 0.9 : Lp * 0.9, h = vert ? Lp * 0.9 : Wp * 0.9;
      x.fillStyle = "#3a332a"; x.fillRect(qx, qy, w, h); x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(qx, qy, w, 4); x.fillRect(qx, qy, 4, h);
      for (let k = 0; k < 120; k++) { x.fillStyle = `rgba(${rnd(90, 150) | 0},${rnd(85, 140) | 0},${rnd(80, 130) | 0},.6)`; x.fillRect(qx + rnd(0, w), qy + rnd(0, h), 2, 2); }
      hx.fillStyle = "#000"; hx.fillRect(qx, qy, w, h);
    }
    for (let i = 0; i < 50; i++) { x.fillStyle = Math.random() < 0.6 ? "rgba(240,238,228,.85)" : "rgba(170,40,35,.8)"; x.beginPath(); x.arc(rnd(0, S), rnd(0, S), rnd(1.5, 5), 0, 6.28); x.fill(); } // капли краски с ремонта
  }
  speckle(x, S, S, 100000, 0.045);
  const t = tex(c), n = normalMap(hc, old ? 5 : 3); n.wrapS = n.wrapT = THREE.RepeatWrapping;
  const r = new THREE.CanvasTexture(rc); r.wrapS = r.wrapT = THREE.RepeatWrapping;
  t.userData = { normal: n, rough: r };
  return t;
}

// Пол «Версаль»: кремовый мрамор с прожилками, золотые вензеля и бордюр. Холст = 2×2 м, 4 плиты.
export function goldFloor() {
  const S = 1024, [c, x] = canvas(S, S);
  x.fillStyle = "#efe3c8"; x.fillRect(0, 0, S, S);
  blotches(x, S, S, 80, 30, 140, "160,130,90", "255,250,235");
  for (let i = 0; i < 40; i++) { // прожилки
    let px = rnd(0, S), py = rnd(0, S);
    x.strokeStyle = `rgba(150,120,80,${rnd(0.1, 0.3)})`; x.lineWidth = rnd(0.6, 2); x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 20; k++) { px += rnd(-20, 30); py += rnd(-12, 18); x.lineTo(px, py); }
    x.stroke();
  }
  const gold = x.createLinearGradient(0, 0, S, S);
  gold.addColorStop(0, "#b8862e"); gold.addColorStop(0.5, "#f3d27a"); gold.addColorStop(1, "#a8761e");
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const ox = i * 512, oy = j * 512, cx = ox + 256, cy = oy + 256;
    x.strokeStyle = gold; x.lineWidth = 10; x.strokeRect(ox + 24, oy + 24, 464, 464);
    x.lineWidth = 3; x.strokeRect(ox + 42, oy + 42, 428, 428);
    // вензель: четыре завитка и ромб
    x.lineWidth = 7;
    for (let k = 0; k < 4; k++) {
      x.save(); x.translate(cx, cy); x.rotate(k * Math.PI / 2);
      x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(60, -60, 120, -20, 90, 30); x.bezierCurveTo(70, 60, 40, 30, 60, 10); x.stroke();
      x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(-60, -60, -120, -20, -90, 30); x.bezierCurveTo(-70, 60, -40, 30, -60, 10); x.stroke();
      x.restore();
    }
    x.fillStyle = gold; lozenge(x, cx, cy, 34, 34);
    x.fillStyle = "#efe3c8"; lozenge(x, cx, cy, 16, 16);
    [[ox + 24, oy + 24], [ox + 488, oy + 24], [ox + 24, oy + 488], [ox + 488, oy + 488]].forEach(([qx, qy]) => { x.fillStyle = gold; lozenge(x, qx, qy, 18, 18); });
  }
  x.fillStyle = "rgba(90,70,40,.5)"; [0, 512].forEach(p => { x.fillRect(p, 0, 2, S); x.fillRect(0, p, S, 2); });
  speckle(x, S, S, 20000, 0.04);
  return tex(c);
}

// Вид из окна по умолчанию: хрущёвка напротив (фото). Граффити теперь рисуются на голых стенах комнаты.
export function neighborWall(img) {
  const [c, x] = canvas(1024, 768);
  x.drawImage(img, 0, 0, 1024, 768);
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return { tex: t, canvas: c, ctx: x };
}

// ---------- Граффити на голых стенах комнаты: баллончик и мел ----------
function sprayPath(x, pts, col, w, drips = true) {
  x.save();
  x.strokeStyle = col; x.lineWidth = w; x.lineCap = x.lineJoin = "round";
  x.shadowColor = col; x.shadowBlur = w * 0.9;
  x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke();
  x.shadowBlur = 0; x.fillStyle = col;
  for (const [px, py] of pts) for (let k = 0; k < 10; k++) { // напыление
    const a = rnd(0, 6.28), r = w * rnd(0.6, 1.6); x.globalAlpha = rnd(0.2, 0.6);
    x.fillRect(px + Math.cos(a) * r, py + Math.sin(a) * r, 1.5, 1.5);
  }
  x.globalAlpha = 0.8;
  if (drips) for (const [px, py] of pts) if (Math.random() < 0.12) { // подтёки
    const len = rnd(10, 55); x.lineWidth = w * 0.28; x.beginPath(); x.moveTo(px, py); x.lineTo(px + rnd(-1, 1), py + len); x.stroke();
    x.beginPath(); x.arc(px, py + len, w * 0.2, 0, 6.28); x.fill();
  }
  x.restore();
}
function chalkPath(x, pts, w) {
  x.save(); x.strokeStyle = "rgba(245,245,238,.55)"; x.lineCap = "round";
  for (let pass = 0; pass < 3; pass++) {
    x.lineWidth = w * rnd(0.5, 1); x.beginPath();
    pts.forEach(([px, py], i) => { const jx = px + rnd(-2, 2), jy = py + rnd(-2, 2); i ? x.lineTo(jx, jy) : x.moveTo(jx, jy); });
    x.stroke();
  }
  x.globalCompositeOperation = "destination-out"; // крошащийся мел: выбоины
  for (const [px, py] of pts) for (let k = 0; k < 3; k++) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(px + rnd(-w, w), py + rnd(-w, w), 2, 2); }
  x.restore();
}
const circle = (cx, cy, r, a0 = 0, a1 = 6.2832, n = 28) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});
const DRAW = {
  // солнышко баллончиком: круг, лучи, улыбка
  sun(x, cx, cy, s) {
    const Y = "rgba(255,196,40,.92)";
    sprayPath(x, circle(cx, cy, 55 * s), Y, 14 * s);
    for (let i = 0; i < 10; i++) { const a = i * 0.628 + rnd(-0.1, 0.1); sprayPath(x, [[cx + Math.cos(a) * 78 * s, cy + Math.sin(a) * 78 * s], [cx + Math.cos(a) * 112 * s, cy + Math.sin(a) * 112 * s]], Y, 10 * s); }
    sprayPath(x, circle(cx, cy + 5 * s, 30 * s, 0.4, 2.74, 12), "rgba(220,60,40,.9)", 7 * s, false);
    [-1, 1].forEach(d => sprayPath(x, [[cx + d * 18 * s, cy - 14 * s], [cx + d * 18 * s + 1, cy - 12 * s]], "rgba(40,30,30,.9)", 9 * s, false));
  },
  // бармалейская рожа мелом: голова, злые брови, усищи, зубы
  barmaley(x, cx, cy, s) {
    const w = 6 * s;
    chalkPath(x, circle(cx, cy, 70 * s), w);
    chalkPath(x, [[cx - 45 * s, cy - 40 * s], [cx - 12 * s, cy - 22 * s]], w);
    chalkPath(x, [[cx + 45 * s, cy - 40 * s], [cx + 12 * s, cy - 22 * s]], w);
    [-1, 1].forEach(d => chalkPath(x, circle(cx + d * 26 * s, cy - 8 * s, 8 * s, 0, 6.28, 10), w));
    chalkPath(x, [[cx, cy - 5 * s], [cx - 8 * s, cy + 14 * s], [cx + 6 * s, cy + 16 * s]], w);
    chalkPath(x, [[cx - 4 * s, cy + 24 * s], [cx - 40 * s, cy + 18 * s], [cx - 70 * s, cy + 2 * s]], w);
    chalkPath(x, [[cx + 4 * s, cy + 24 * s], [cx + 40 * s, cy + 18 * s], [cx + 70 * s, cy + 2 * s]], w);
    chalkPath(x, [[cx - 26 * s, cy + 40 * s], [cx - 13 * s, cy + 50 * s], [cx, cy + 40 * s], [cx + 13 * s, cy + 50 * s], [cx + 26 * s, cy + 40 * s]], w);
    for (let i = 0; i < 9; i++) { const a = 0.5 + i * 0.27; chalkPath(x, [[cx + Math.cos(a) * 66 * s, cy + Math.sin(a) * 66 * s], [cx + Math.cos(a) * 92 * s, cy + Math.sin(a) * 96 * s]], w * 0.8); }
  },
  // флаг Татарстана баллончиком: зелёный / белая полоска / красный
  flag(x, cx, cy, s) {
    const w = 200 * s, h = 120 * s, l = cx - w / 2, tp = cy - h / 2;
    const band = (y0, y1, col) => { for (let y = y0; y <= y1; y += 9 * s) sprayPath(x, [[l, y], [l + w * 0.5, y + rnd(-2, 2)], [l + w, y]], col, 12 * s, y > y1 - 10 * s); };
    band(tp, tp + h * 0.45, "rgba(0,150,70,.9)");
    band(tp + h * 0.5, tp + h * 0.52, "rgba(245,245,240,.95)");
    band(tp + h * 0.56, tp + h, "rgba(220,30,40,.9)");
    sprayPath(x, [[l - 8 * s, tp - 10 * s], [l - 8 * s, tp + h + 70 * s]], "rgba(60,50,45,.9)", 8 * s, false);
  },
};
export const GRAFFITI = Object.keys(DRAW);
// Рисует случайный (или заданный) рисунок на отдельном холсте 512×420 (центр — 256, 210): стена комнаты
// проявляет его полосой слева направо, как будто красят прямо сейчас.
export function graffitiLayer(kind) {
  kind = kind || GRAFFITI[(Math.random() * GRAFFITI.length) | 0];
  const [c, x] = canvas(512, 420);
  DRAW[kind](x, 256, 210, rnd(0.8, 1.1));
  return { kind, canvas: c };
}

export async function photo(loader, url, rx, ry) {
  const t = await loader.loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}

export async function makeTextures(opts = {}) {
  const L = new THREE.TextureLoader();
  const U = "assets/items/ussr/";
  const [wallpaper, window, tv, vympel, clock, begonia, kover1, kover2, kover3, bust, fishSet, boxClosed, boxOpen] = await Promise.all([
    photo(L, "assets/wallpaper.jpg", 1 / 1.1, 1 / 1.34), photo(L, "assets/window.jpg"), photo(L, "assets/tv.png"),
    photo(L, "assets/vympel.png"), photo(L, "assets/chasy.png"), photo(L, "assets/begonia.png"),
    photo(L, U + "kover1.jpg"), photo(L, U + "kover2.jpg"), photo(L, U + "kover3.jpg"), photo(L, U + "bust.png"),
    photo(L, U + "fish.png"), photo(L, U + "box_closed.png"), photo(L, U + "box_open.png")]);
  const N = "assets/items/neformal/";
  const [nefMusic, nefRug, nefPad, nefPoster, nefCool] = await Promise.all(
    ["music.png", "rug_egypt.jpg", "pad_marley.jpg", "poster_prodigy.jpg", "cool.jpg"].map(f => photo(L, N + f)));
  const K = "assets/items/kapital/";
  const [kapLeopard, kapRug, kapYeltsin, kapSafe, kapBrain, kapRuble, kapAudio, kapSquare] = await Promise.all(
    ["leopard.png", "rug_lux.jpg", "yeltsin.jpg", "safe.png", "brain.png", "ruble.png", "audio_front.jpg", "square.jpg"].map(f => photo(L, K + f)));
  const [roomWall, roomFloor, brick] = await Promise.all(["assets/room/wall.jpg", "assets/room/floor.jpg", "assets/room/brick.jpg"].map(u => photo(L, u)));
  try { await document.fonts.load("17px Nunito"); } catch (e) {}
  return {
    nefMusic, nefRug, nefPad, nefPoster, nefCool,
    kapLeopard, kapRug, kapYeltsin, kapSafe, kapBrain, kapRuble, kapAudio, kapSquare,
    wallpaper, window, tv, vympel, clock, begonia, kover1, kover2, kover3, bust, fishSet, boxClosed, boxOpen,
    rogozhka: rogozhka("#6a7440", "#59622f", 9),
    velour: velour("#8e3f26", 3),
    malachite: malachite(),
    parquet: parquet(),
    plaster: plasterPhoto(roomWall.image),
    concrete: concretePhoto(roomFloor.image),
    street: neighborWall(brick.image),
    walnut: wood(18, 50, 30),
    oak: wood(30, 45, 45),
    rugWall: rug({ edge: "#1d2a4a", gold: "#c99a45", border: "#7c1620", field: "#8f1d26", motif: "#1f3e6e" }),
    rugFloor: rug({ edge: "#3a1a10", gold: "#d3a85a", border: "#24406a", field: "#6b2b20", motif: "#d9c39a" }),
    sofa: fabric("#5f6b3a", "#2f3a18", 3),
    chair: fabric("#9a4b2a", "#4f1f0f", 3),
    shade: fabric("#f1dfb8", "#b89a68", 2),
    grille: fabric("#c9b48a", "#6b5534", 6),
    spines: spines(),
    dial: dial(),
    scribble: await scribble(opts.scribble || "сюда бы телек…"),
  };
}
