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

export async function photo(loader, url, rx, ry) {
  const t = await loader.loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}

export async function makeTextures() {
  const L = new THREE.TextureLoader();
  const [wallpaper, window, tv, vympel, clock, begonia] = await Promise.all([
    photo(L, "assets/wallpaper.jpg", 1 / 1.1, 1 / 1.34), photo(L, "assets/window.jpg"), photo(L, "assets/tv.png"),
    photo(L, "assets/vympel.png"), photo(L, "assets/chasy.png"), photo(L, "assets/begonia.png")]);
  try { await document.fonts.load("17px Nunito"); } catch (e) {}
  return {
    wallpaper, window, tv, vympel, clock, begonia,
    parquet: parquet(),
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
    scribble: await scribble("сюда бы телек…"),
  };
}
