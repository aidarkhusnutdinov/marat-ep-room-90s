// Набор «Разгул капитализма»: стол руководителя с креслом-троном, золотой стул, антикварная тумбочка,
// торшер-жираф, шкура леопарда, ковёр luxury, розовый пушистый ковёр, «Чёрный квадрат», золотая аудиосистема,
// квантовый сервер «Вечный мозг», крокодил Мистер Кро, мозаика «Ельцин», сейф-черепаха, «Несгораемый рубль».
// Живые предметы отдают userData.tick(now) — main.js зовёт его каждый кадр.
import * as THREE from "three";
import { M, mesh, rbox, box, cyl, photoPlane, rugWave } from "./kit.js";
import { normalMap } from "../textures.js";

const std = o => new THREE.MeshStandardMaterial(o);
const rnd = (a, b) => a + Math.random() * (b - a);
let MAT = null;
function cv(w, h, draw) {
  const c = Object.assign(document.createElement("canvas"), { width: w, height: h }), x = c.getContext("2d");
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// ---------- Роскошные фактуры (раунд 2): красное дерево, золотой орнамент, кожа со стяжкой, «кожа» жирафа ----------
// Каждая отдаёт цвет + нормал-карту из своей карты высот, поэтому золото и кожа ловят блики рельефом.
function cvH(w, h, draw) { // рисует одновременно цвет (x) и высоту (hx, серое)
  const c = Object.assign(document.createElement("canvas"), { width: w, height: h }), x = c.getContext("2d");
  const hc = Object.assign(document.createElement("canvas"), { width: w, height: h }), hx = hc.getContext("2d");
  hx.fillStyle = "#808080"; hx.fillRect(0, 0, w, h);
  draw(x, hx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return { map: t, normal: normalMap(hc, 4) };
}
function mahoganyTex() {
  return cvH(512, 512, (x, hx, w, h) => {
    x.fillStyle = "#5a1a0e"; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) { // волокна с «пламенем»
      x.strokeStyle = Math.random() < 0.7 ? `rgba(25,5,2,${rnd(0.1, 0.3)})` : `rgba(200,90,50,${rnd(0.05, 0.14)})`; x.lineWidth = rnd(0.8, 3);
      x.beginPath(); const xx = rnd(0, w), ph = rnd(0, 6), am = rnd(3, 16), fr = rnd(40, 110);
      for (let t = 0; t <= h; t += 6) x.lineTo(xx + Math.sin(t / fr + ph) * am, t); x.stroke();
    }
    for (let i = 0; i < 6; i++) { const g = x.createRadialGradient(rnd(0, w), rnd(0, h), 0, rnd(0, w), rnd(0, h), rnd(60, 160)); g.addColorStop(0, "rgba(160,60,30,.18)"); g.addColorStop(1, "rgba(160,60,30,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  });
}
// золотая лепнина: завитки-аканты по полосе, рельеф в карте высот
function ornamentTex() {
  return cvH(512, 128, (x, hx, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f6d77a"); g.addColorStop(0.5, "#c9962e"); g.addColorStop(1, "#8a6216");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const curl = (ctx, cx, cy, s, col, lw) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.beginPath();
      ctx.moveTo(cx - 40 * s, cy + 20 * s); ctx.bezierCurveTo(cx - 30 * s, cy - 40 * s, cx + 30 * s, cy - 40 * s, cx + 20 * s, cy);
      ctx.bezierCurveTo(cx + 12 * s, cy + 18 * s, cx - 6 * s, cy + 10 * s, cx, cy - 6 * s); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 40 * s, cy + 18 * s, 8 * s, 0, 6.28); ctx.stroke();
    };
    for (let i = 0; i < 4; i++) {
      const cx = 64 + i * 128;
      curl(x, cx, 70, 1, "rgba(90,55,10,.8)", 7); curl(x, cx - 2, 68, 1, "rgba(255,240,180,.7)", 3);
      curl(hx, cx, 70, 1, "#fff", 9);
      x.fillStyle = "#fff3c0"; x.beginPath(); x.arc(cx + 64, 64, 6, 0, 6.28); x.fill(); hx.fillStyle = "#fff"; hx.beginPath(); hx.arc(cx + 64, 64, 8, 0, 6.28); hx.fill();
    }
    [[6], [h - 10]].forEach(([y]) => { x.fillStyle = "rgba(255,240,190,.8)"; x.fillRect(0, y, w, 3); hx.fillStyle = "#fff"; hx.fillRect(0, y - 1, w, 5); });
  });
}
// кожа с каретной стяжкой: ромбы, пуговки, складки к пуговкам
function tuftedTex(base, n = 6) {
  return cvH(256, 256, (x, hx, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const s = w / n;
    for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) {
      const cx = i * s + (j % 2 ? s / 2 : 0), cy = j * s * 0.5 * 2;
      const g = hx.createRadialGradient(cx, cy + s / 2, 0, cx, cy + s / 2, s * 0.62); g.addColorStop(0, "#fff"); g.addColorStop(1, "#202020");
      hx.fillStyle = g; hx.beginPath(); hx.moveTo(cx, cy); hx.lineTo(cx + s / 2, cy + s / 2); hx.lineTo(cx, cy + s); hx.lineTo(cx - s / 2, cy + s / 2); hx.fill();
      const lg = x.createRadialGradient(cx - s * 0.1, cy + s * 0.4, 0, cx, cy + s / 2, s * 0.6); lg.addColorStop(0, "rgba(255,210,170,.22)"); lg.addColorStop(1, "rgba(0,0,0,.28)");
      x.fillStyle = lg; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + s / 2, cy + s / 2); x.lineTo(cx, cy + s); x.lineTo(cx - s / 2, cy + s / 2); x.fill();
      x.fillStyle = "rgba(30,8,4,.8)"; x.beginPath(); x.arc(cx, cy, 3, 0, 6.28); x.fill(); hx.fillStyle = "#000"; hx.beginPath(); hx.arc(cx, cy, 4, 0, 6.28); hx.fill();
    }
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,230,210"},.05)`; x.fillRect(rnd(0, w), rnd(0, h), 1, 1); }
  });
}
// «кожа» жирафа как на фото: литое золото, неровные пластины (ячейки Вороного) с глубокими бороздками
function giraffeTex() {
  return cvH(256, 256, (x, hx, w, h) => {
    const pts = Array.from({ length: 42 }, () => [rnd(0, w), rnd(0, h)]);
    const img = x.createImageData(w, h), him = hx.createImageData(w, h);
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let d1 = 1e9, d2 = 1e9;
      for (const [qx, qy] of pts) for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const d = (px - qx - ox) ** 2 + (py - qy - oy) ** 2; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1), k = (py * w + px) * 4;
      const groove = Math.min(1, edge / 4), dome = Math.min(1, edge / 14);
      const v = 0.35 + 0.65 * groove;
      img.data[k] = 240 * v + 15 * dome; img.data[k + 1] = 190 * v + 10 * dome; img.data[k + 2] = 80 * v; img.data[k + 3] = 255;
      const hv = 255 * (0.15 + 0.85 * Math.sqrt(dome)); him.data[k] = him.data[k + 1] = him.data[k + 2] = hv; him.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); hx.putImageData(him, 0, 0);
  });
}
// чешуя крокодила: прямоугольные щитки рядами + бугорки
function crocSkinTex() {
  return cvH(256, 256, (x, hx, w, h) => {
    x.fillStyle = "#3a4a22"; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 10; i++) {
      const sx = i * 26 + (j % 2) * 13, sy = j * 16, sw = rnd(20, 25), sh = rnd(12, 15);
      x.fillStyle = `hsl(${rnd(70, 90)} ${rnd(25, 40)}% ${rnd(16, 28)}%)`; x.fillRect(sx, sy, sw, sh);
      const g = hx.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, sw * 0.6); g.addColorStop(0, "#fff"); g.addColorStop(1, "#333");
      hx.fillStyle = g; hx.fillRect(sx, sy, sw, sh);
      if (Math.random() < 0.3) { x.fillStyle = "rgba(20,25,10,.5)"; x.beginPath(); x.arc(sx + sw / 2, sy + sh / 2, 3, 0, 6.28); x.fill(); }
    }
  });
}
function mats() {
  if (MAT) return MAT;
  const mh = mahoganyTex(), orn = ornamentTex(), tuft = tuftedTex("#b8481e", 4), silk = tuftedTex("#e9b83a", 4), gir = giraffeTex(), cs = crocSkinTex();
  MAT = {
    gold: std({ color: 0xf0c75e, metalness: 1, roughness: 0.22 }),
    goldDark: std({ color: 0xb8902e, metalness: 1, roughness: 0.35 }),
    goldOrn: std({ map: orn.map, normalMap: orn.normal, metalness: 1, roughness: 0.28, color: 0xffffff }),
    mahogany: new THREE.MeshPhysicalMaterial({ map: mh.map, normalMap: mh.normal, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }),
    walnut: new THREE.MeshPhysicalMaterial({ map: mh.map, color: 0xc09070, roughness: 0.35, clearcoat: 0.9 }),
    leather: new THREE.MeshPhysicalMaterial({ map: tuft.map, normalMap: tuft.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: new THREE.Color(0xff9070) }),
    leatherFlat: new THREE.MeshPhysicalMaterial({ color: 0xb8481e, roughness: 0.4, clearcoat: 0.5 }),
    yellowSilk: new THREE.MeshPhysicalMaterial({ map: silk.map, normalMap: silk.normal, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0xfff0a0) }),
    giraffe: std({ map: gir.map, normalMap: gir.normal, normalScale: new THREE.Vector2(1.6, 1.6), metalness: 1, roughness: 0.3, color: 0xffffff }),
    marble: std({ roughness: 0.15, map: cv(128, 128, (x, w, h) => {
      x.fillStyle = "#5a4a42"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { x.strokeStyle = `rgba(230,220,210,${rnd(0.1, 0.4)})`; x.lineWidth = rnd(0.5, 2); x.beginPath(); let px = rnd(0, w), py = rnd(0, h); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += rnd(-15, 20); py += rnd(-10, 15); x.lineTo(px, py); } x.stroke(); }
    }) }),
    blackGlass: new THREE.MeshPhysicalMaterial({ color: 0x0a0a10, roughness: 0.05, clearcoat: 1, metalness: 0.3 }),
    shadeBlack: std({ color: 0x15151a, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x3a2a10, emissiveIntensity: 0.3 }),
    croc: std({ map: cs.map, normalMap: cs.normal, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.55 }), crocBelly: std({ color: 0xc8c090, roughness: 0.75 }),
    mouth: std({ color: 0xd88a80, roughness: 0.5 }),
    teeth: std({ color: 0xf4f0e0, roughness: 0.4 }), eye: std({ color: 0xe8c020, emissive: 0x605000, emissiveIntensity: 0.6, roughness: 0.2 }),
  };
  return MAT;
}
// мягкое свечение-точка для лампочек, бликов и огоньков
let dotTex = null;
const dot = () => dotTex || (dotTex = cv(32, 32, (x) => {
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
}));
function sparkle(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  s.scale.set(size, size, 1); return s;
}
// Кабриоль: изогнутая ножка из трубки
function cabriole(mat, h, r, out, parent, x, z, rotY) {
  const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, h, 0), new THREE.Vector3(out * 1.6, h * 0.6, 0), new THREE.Vector3(-out * 0.6, h * 0.25, 0), new THREE.Vector3(out, 0, 0));
  const l = mesh(new THREE.TubeGeometry(c, 12, r, 8), mat, x, 0, z, parent); l.rotation.y = rotY; return l;
}

// золотая лепная полоса заданной высоты: свой экземпляр текстуры с повтором под размер (u — метры, v — высота)
function ornMat(hM, perM = 2.2) {
  const m = mats().goldOrn.clone(); m.map = m.map.clone(); m.normalMap = m.normalMap.clone();
  [m.map, m.normalMap].forEach(t => { t.repeat.set(perM, 1 / hM); t.needsUpdate = true; });
  return m;
}
// плоская лепная накладка на фасад (PlaneGeometry: uv 0..1 → вся полоса)
function ornPlate(w, h, parent, x, y, z, ry = 0) {
  const m = mats().goldOrn.clone(); m.map = m.map.clone(); m.normalMap = m.normalMap.clone();
  [m.map, m.normalMap].forEach(t => { t.repeat.set(Math.max(1, Math.round(w / h / 4)), 1); t.needsUpdate = true; });
  const p = mesh(new THREE.PlaneGeometry(w, h), m, x, y, z, parent); p.rotation.y = ry; p.castShadow = false; return p;
}
// резная ножка-волюта: золотой завиток + ножка красного дерева
function scrollLeg(parent, x, z, h, rotY) {
  const m = mats(), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; parent.add(g);
  const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, h, 0), new THREE.Vector3(0.09, h * 0.65, 0), new THREE.Vector3(-0.05, h * 0.3, 0), new THREE.Vector3(0.05, 0.03, 0));
  mesh(new THREE.TubeGeometry(c, 16, 0.035, 10), m.mahogany, 0, 0, 0, g);
  mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 16, Math.PI * 1.5), m.gold, 0.05, h * 0.72, 0, g).rotation.z = 0.6;
  mesh(new THREE.SphereGeometry(0.03, 10, 8), m.gold, 0.05, 0.03, 0, g).scale.set(1.3, 0.6, 1);
  mesh(cyl(0.04, 0.04, 0.02, 12), m.gold, 0, h - 0.01, 0, g);
  return g;
}

export const KAPITAL = {
  // стол руководителя по фото: дуга красного дерева на резных ножках, лепная золотая кромка, кожаная вставка,
  // выдвижной ящик с золотыми слитками, кресло-трон со стяжкой поворачивается. Стол смотрит в +z, кресло позади
  bossdesk() {
    const m = mats(), g = new THREE.Group(), W = 1.5, H = 0.78;
    const plan = (w, back, front) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, back); sh.lineTo(w / 2, back); sh.quadraticCurveTo(w / 2 + 0.05, front + 0.1, 0, front); sh.quadraticCurveTo(-w / 2 - 0.05, front + 0.1, -w / 2, back); return sh; };
    const slab = (sh, depth, mat, y) => { const e = mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 32 }), mat, 0, y, 0, g); e.rotation.x = Math.PI / 2; return e; };
    slab(plan(W + 0.04, -0.35, 0.41), 0.045, [m.mahogany, ornMat(0.045)], H); // столешница с лепной кромкой
    slab(plan(W - 0.25, -0.24, 0.27), 0.004, m.leatherFlat, H + 0.004).position.y = H + 0.004; // кожаная вставка
    slab(plan(W - 0.1, -0.3, 0.33), 0.2, [m.mahogany, ornMat(0.2, 1.4)], H - 0.045); // царга с ящиками
    // выдвижной ящик по центру фасада
    const drawer = new THREE.Group(); drawer.position.set(0, H - 0.15, 0.3); g.add(drawer);
    mesh(box(0.42, 0.14, 0.4), m.mahogany, 0, 0, -0.18, drawer);
    mesh(box(0.38, 0.02, 0.36), m.goldDark, 0, 0.055, -0.18, drawer);
    for (let i = 0; i < 5; i++) mesh(box(0.1, 0.035, 0.05), m.gold, -0.13 + (i % 3) * 0.12, 0.08 + (i > 2 ? 0.035 : 0), -0.25 + (i % 2) * 0.1, drawer); // слитки
    mesh(new THREE.SphereGeometry(0.018, 10, 8), m.gold, 0, 0, 0.025, drawer);
    // ножки-волюты и золотая перемычка
    [[-0.62, -0.22], [0.62, -0.22], [-0.45, 0.22], [0.45, 0.22]].forEach(([x0, z0]) => scrollLeg(g, x0, z0, H - 0.245, z0 > 0 ? -Math.PI / 2 : Math.PI / 2));
    const bar = mesh(cyl(0.02, 0.02, 1.1, 10), m.gold, 0, 0.18, 0, g); bar.rotation.z = Math.PI / 2;
    ornPlate(0.5, 0.12, g, 0, 0.2, 0.012);
    // на столе: лампа с кремовым абажуром и золотой письменный прибор
    const lamp = new THREE.Group(); lamp.position.set(0.55, H + 0.045, -0.15); g.add(lamp);
    mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x1d2a5a, roughness: 0.2, clearcoat: 1 }), 0, 0.12, 0, lamp).scale.set(1, 1.4, 1);
    mesh(cyl(0.06, 0.07, 0.03, 16), m.gold, 0, 0.015, 0, lamp); mesh(cyl(0.008, 0.008, 0.16, 8), m.gold, 0, 0.29, 0, lamp);
    const shade = mesh(new THREE.CylinderGeometry(0.07, 0.13, 0.13, 24, 1, true), std({ color: 0xf6ead0, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0.5 }), 0, 0.4, 0, lamp); shade.castShadow = false;
    const pen = new THREE.Group(); pen.position.set(-0.5, H + 0.045, -0.12); g.add(pen);
    mesh(rbox(0.22, 0.03, 0.12, 0.01), m.gold, 0, 0.015, 0, pen); [-0.05, 0.05].forEach(x0 => { mesh(cyl(0.02, 0.025, 0.05, 12), m.goldDark, x0, 0.055, 0, pen); const pn = mesh(cyl(0.004, 0.004, 0.14, 6), M.blackRim, x0, 0.12, 0, pen); pn.rotation.z = x0 * 6; });
    // кресло-трон: стёганая кожа, крылья, золотая резьба, поворотная опора
    const ch = new THREE.Group(); ch.position.set(0, 0, -0.76); g.add(ch);
    mesh(cyl(0.05, 0.06, 0.32, 12), m.gold, 0, 0.2, 0, ch);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, l = mesh(box(0.3, 0.03, 0.05), m.gold, Math.cos(a) * 0.15, 0.04, Math.sin(a) * 0.15, ch); l.rotation.y = -a; }
    const seatG = new THREE.Group(); seatG.position.y = 0.38; ch.add(seatG);
    mesh(rbox(0.68, 0.16, 0.6, 0.07), m.leather, 0, 0.08, 0, seatG);
    const back = mesh(rbox(0.7, 0.95, 0.14, 0.07), m.leather, 0, 0.62, -0.28, seatG); back.rotation.x = -0.08;
    [-1, 1].forEach(sd => { const wing = mesh(rbox(0.12, 0.6, 0.4, 0.05), m.leather, sd * 0.38, 0.5, -0.1, seatG); wing.rotation.y = sd * 0.25; mesh(rbox(0.1, 0.06, 0.5, 0.03), m.gold, sd * 0.38, 0.22, 0.02, seatG); });
    const crest = mesh(new THREE.TorusGeometry(0.34, 0.03, 10, 28, Math.PI), m.goldOrn, 0, 1.08, -0.31, seatG); crest.scale.y = 0.55;
    mesh(new THREE.SphereGeometry(0.04, 10, 8), m.gold, 0, 1.3, -0.31, seatG);
    g.userData.act = play => play(1600, p => {
      const q = Math.sin(p * Math.PI);
      drawer.position.z = 0.3 + q * 0.32;              // ящик со слитками выезжает
      seatG.rotation.y = Math.sin(p * Math.PI * 2) * 0.6; // кресло крутится туда-обратно
    });
    return g;
  },
  // золотой стул: овальная спинка-медальон со стёганым шёлком, лепнина, ножки-кабриоль
  goldchair() {
    const m = mats(), g = new THREE.Group();
    mesh(rbox(0.5, 0.1, 0.48, 0.045), m.yellowSilk, 0, 0.5, 0, g);
    mesh(rbox(0.54, 0.06, 0.52, 0.02), ornMat(0.06, 3), 0, 0.43, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cabriole(m.gold, 0.42, 0.024, 0.05, g, a * 0.21, b * 0.2, Math.atan2(b, a) * -1));
    const back = new THREE.Group(); back.position.set(0, 0.52, -0.23); back.rotation.x = -0.12; g.add(back);
    const oval = mesh(new THREE.CircleGeometry(0.2, 32), m.yellowSilk, 0, 0.34, 0.012, back); oval.scale.y = 1.25;
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.026, 10, 36), m.goldOrn, 0, 0.34, 0.012, back); ring.scale.y = 1.25;
    mesh(new THREE.CircleGeometry(0.2, 32), m.gold, 0, 0.34, 0.0, back).scale.y = 1.25;
    [-1, 1].forEach(sd => { const pst = mesh(cyl(0.02, 0.022, 0.2, 10), m.gold, sd * 0.2, 0.08, 0, back); });
    const crown = mesh(new THREE.ConeGeometry(0.05, 0.08, 6), m.gold, 0, 0.62, 0.01, back);
    g.userData.act = play => play(700, p => { g.rotation.z = Math.sin(p * Math.PI * 4) * 0.05 * (1 - p); });
    return g;
  },
  // антикварная тумбочка: красное дерево, лепнина, мраморная столешница; ящик и дверца открываются
  tumbochka() {
    const m = mats(), g = new THREE.Group(), W = 0.5, H = 0.78, D = 0.4;
    mesh(rbox(W, 0.42, D, 0.02), m.mahogany, 0, H - 0.27, -0.01, g);
    mesh(rbox(W + 0.05, 0.035, D + 0.05, 0.012), m.marble, 0, H - 0.035, 0, g);
    mesh(box(W + 0.02, 0.03, D + 0.02), ornMat(0.03, 4), 0, H - 0.07, 0, g);
    const drawer = new THREE.Group(); drawer.position.set(0, H - 0.135, D / 2 - 0.005); g.add(drawer);
    mesh(box(W - 0.06, 0.1, 0.012), m.mahogany, 0, 0, 0.006, drawer);
    mesh(box(W - 0.08, 0.08, D - 0.06), m.walnut, 0, -0.005, -D / 2 + 0.04, drawer);
    mesh(new THREE.SphereGeometry(0.016, 10, 8), m.gold, 0, 0, 0.022, drawer);
    ornPlate(W - 0.1, 0.05, drawer, 0, 0.0, 0.0125);
    const doorH = new THREE.Group(); doorH.position.set(-W / 2 + 0.03, H - 0.34, D / 2 - 0.005); g.add(doorH); // петля слева
    mesh(box(W - 0.06, 0.24, 0.012), m.mahogany, (W - 0.06) / 2, 0, 0.006, doorH);
    ornPlate(W - 0.12, 0.16, doorH, (W - 0.06) / 2, 0, 0.0125);
    mesh(new THREE.SphereGeometry(0.014, 8, 8), m.gold, W - 0.1, 0, 0.022, doorH);
    mesh(box(W - 0.02, 0.04, D - 0.02), m.mahogany, 0, 0.32, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cabriole(m.mahogany, H - 0.45, 0.02, 0.045, g, a * (W / 2 - 0.04), b * (D / 2 - 0.04), Math.atan2(b, a) * -1));
    [[-1, 1], [1, 1]].forEach(([a, b]) => mesh(new THREE.SphereGeometry(0.02, 8, 6), m.gold, a * (W / 2 - 0.02), 0.02, b * (D / 2 - 0.02), g));
    g.userData.act = play => play(1800, p => {
      const q = Math.sin(Math.min(1, p * 1.25) * Math.PI);
      drawer.position.z = D / 2 - 0.005 + q * 0.26;   // ящик выдвигается
      doorH.rotation.y = -Math.max(0, Math.sin((p - 0.15) / 0.85 * Math.PI)) * 1.4; // дверца следом
    });
    return g;
  },
  // торшер-жираф по фото: литое золото с «кожей» из пластин, длинные ноги, шея вверх, голова над чёрным абажуром
  giraffe() {
    const m = mats(), g = new THREE.Group(), sk = m.giraffe;
    const tube = (pts, r) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 12), sk, 0, 0, 0, g);
    // ноги: от тела к копытам, чуть расставлены
    [[0.12, 0.07], [0.12, -0.07], [-0.12, 0.07], [-0.12, -0.07]].forEach(([x0, z0]) => {
      tube([new THREE.Vector3(x0, 0.95, z0 * 0.6), new THREE.Vector3(x0 * 1.1, 0.55, z0), new THREE.Vector3(x0 * 1.15 + 0.02, 0.06, z0 * 1.2)], 0.022);
      mesh(cyl(0.028, 0.032, 0.05, 10), m.goldDark, x0 * 1.15 + 0.02, 0.025, z0 * 1.2, g);
    });
    const body = mesh(new THREE.SphereGeometry(0.15, 20, 14), sk, 0, 1.0, 0, g); body.scale.set(1.25, 0.85, 0.7);
    tube([new THREE.Vector3(0.12, 1.02, 0), new THREE.Vector3(0.16, 1.4, 0), new THREE.Vector3(0.15, 1.85, 0), new THREE.Vector3(0.13, 2.02, 0)], 0.045);
    const head = new THREE.Group(); head.position.set(0.14, 2.04, 0); g.add(head);
    const skull = mesh(new THREE.SphereGeometry(0.06, 14, 10), sk, 0.05, 0, 0, head); skull.scale.set(1.9, 0.85, 0.75);
    [-1, 1].forEach(sd => {
      mesh(cyl(0.008, 0.01, 0.07, 6), m.goldDark, 0, 0.07, sd * 0.025, head); mesh(new THREE.SphereGeometry(0.014, 6, 6), m.goldDark, 0, 0.105, sd * 0.025, head);
      const ear = mesh(new THREE.ConeGeometry(0.018, 0.06, 6), sk, -0.02, 0.04, sd * 0.05, head); ear.rotation.x = sd * 1.1;
    });
    const tail = mesh(cyl(0.007, 0.012, 0.32, 6), sk, -0.22, 0.86, 0, g); tail.rotation.z = 0.25;
    // абажур на шее: цилиндр, золотая изнанка светится
    const sh = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.34, 32, 1, true), m.shadeBlack, 0.22, 1.72, 0, g); sh.castShadow = false;
    const inner = mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.33, 32, 1, true), std({ color: 0xffd890, emissive: 0xffc060, emissiveIntensity: 0.8, side: THREE.BackSide }), 0.22, 1.72, 0, g); inner.castShadow = false;
    [1.55, 1.89].forEach(y => mesh(new THREE.TorusGeometry(0.21, 0.006, 6, 32), m.gold, 0.22, y, 0, g).rotation.x = Math.PI / 2);
    const l = new THREE.PointLight(0xffc880, 1.6, 4, 1.6); l.position.set(0.22, 1.6, 0); g.add(l); g.userData.light = l; g.userData.inner = inner;
    g.userData.act = play => play(900, p => { head.rotation.z = Math.sin(p * Math.PI * 2) * 0.25; }); // кивает
    return g;
  },
  leopard(T) { const g = new THREE.Group(); const p = mesh(new THREE.PlaneGeometry(0.85, 0.85 * 563 / 353, 12, 18), M.photo(T.kapLeopard), 0, 0, 0, g); p.rotation.x = -Math.PI / 2; p.castShadow = false; rugWave(g, p, 0.85); return g; },
  rug_lux(T) { const g = new THREE.Group(); const p = mesh(new THREE.PlaneGeometry(1.6, 1.6 * 554 / 361, 24, 30), M.photoRug(T.kapRug), 0, 0, 0, g); p.rotation.x = -Math.PI / 2; p.rotation.z = Math.PI / 2; p.castShadow = false; rugWave(g, p, 1.6); return g; },
  // розовый пушистый ковёр: «мех» из 16 слоёв-оболочек (shell fur) — ворсинки становятся тоньше к кончикам;
  // гладишь — по ворсу пробегает волна
  pinkrug() {
    const g = new THREE.Group(), N = 16, S = 256;
    const shape = (a) => 1 + 0.12 * Math.sin(a * 3) + 0.06 * Math.sin(a * 7);
    const base = cv(S, S, (x, w, h) => { // подложка: розовая клякса
      x.beginPath(); for (let a = 0; a <= 6.3; a += 0.1) x.lineTo(w / 2 + Math.cos(a) * w * 0.46 * shape(a), h / 2 + Math.sin(a) * h * 0.44 * shape(a)); x.closePath();
      x.fillStyle = "#d8789e"; x.fill();
    });
    const strands = cv(S * 2, S * 2, (x, w, h) => { // ворсинки: точки разной «высоты» (яркость = длина)
      x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26000; i++) { const v = 40 + Math.random() * 215 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.globalCompositeOperation = "destination-in"; x.beginPath();
      for (let a = 0; a <= 6.3; a += 0.1) x.lineTo(w / 2 + Math.cos(a) * w * 0.46 * shape(a), h / 2 + Math.sin(a) * h * 0.44 * shape(a)); x.closePath(); x.fill();
    });
    strands.colorSpace = THREE.NoColorSpace;
    const W = 1.3, D = 0.98;
    const b = mesh(new THREE.PlaneGeometry(W, D), std({ map: base, transparent: true, alphaTest: 0.5, roughness: 1 }), 0, 0, 0, g); b.rotation.x = -Math.PI / 2; b.castShadow = false;
    const layers = [];
    for (let i = 1; i <= N; i++) {
      const k = i / N, col = new THREE.Color().setHSL(0.94, 0.62, 0.62 + k * 0.22);
      const mtl = new THREE.MeshStandardMaterial({ color: col, alphaMap: strands, alphaTest: 0.16 + k * 0.78, transparent: false, roughness: 1, side: THREE.DoubleSide });
      const L = mesh(new THREE.PlaneGeometry(W, D), mtl, 0, k * 0.035, 0, g); L.rotation.x = -Math.PI / 2; L.castShadow = false; L.receiveShadow = true;
      layers.push(L);
    }
    g.userData.flat = true;
    g.userData.act = play => play(1200, p => layers.forEach((L, i) => { const k = (i + 1) / N; L.position.x = Math.sin(p * Math.PI * 2 - i * 0.15) * 0.012 * k * (1 - p); L.position.z = Math.sin(p * Math.PI * 3) * 0.008 * k * (1 - p); }));
    return g;
  },
  // «Чёрный квадрат» по фото оригинала в лепной золотой раме; «вглядеться» — картина слегка перекашивается и выпрямляется
  square(T) {
    const g = new THREE.Group(), S = 0.62, pic = new THREE.Group(); g.add(pic);
    mesh(new THREE.PlaneGeometry(S, S), std({ map: T.kapSquare, roughness: 0.85 }), 0, 0, 0.012, pic).castShadow = false;
    [[0, S / 2 + 0.04, S + 0.16, 0.08], [0, -S / 2 - 0.04, S + 0.16, 0.08], [S / 2 + 0.04, 0, 0.08, S], [-S / 2 - 0.04, 0, 0.08, S]]
      .forEach(([x0, y0, w, h]) => mesh(box(w, h, 0.04), ornMat(Math.min(w, h), 6), x0, y0, 0.015, pic));
    g.userData.flat = true; // висит на стене
    g.userData.act = play => play(1400, p => { pic.rotation.z = Math.sin(p * Math.PI) * 0.12 * Math.cos(p * 9); });
    return g;
  },
  // золотая аудиосистема с камнями: фото спереди, блики-искорки бегают по корпусу
  audio(T) {
    const m = mats(), g = new THREE.Group(), W = 1.0, H = W * 401 / 1024, D = 0.34;
    mesh(rbox(W, H, D, 0.02), [m.gold, m.gold, m.gold, m.gold, std({ map: T.kapAudio, metalness: 0.6, roughness: 0.3 }), m.gold], 0, H / 2 + 0.03, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(cyl(0.02, 0.025, 0.03, 10), m.goldDark, a * (W / 2 - 0.06), 0.015, b * (D / 2 - 0.05), g));
    const sp = [0xffffff, 0xff6080, 0x80c0ff].map(c => { const s = sparkle(c, 0.07); g.add(s); return s; });
    g.userData.tick = now => sp.forEach((s, i) => {
      const ph = (now / 1400 + i * 0.37) % 1;
      if (ph < 0.02) s.position.set(rnd(-W / 2, W / 2), rnd(0.06, H), D / 2 + 0.02);
      s.material.opacity = Math.max(0, Math.sin(ph * Math.PI * 6)) * (ph < 0.17 ? 1 : 0);
    });
    // «Включить»: колонки «качают» в такт — корпус пульсирует
    g.userData.act = play => play(2400, p => { const k = 1 + Math.max(0, Math.sin(p * Math.PI * 16)) * 0.025 * (1 - p * 0.5); g.scale.set(k, 1 + (k - 1) * 1.5, k); });
    return g;
  },
  // квантовый сервер «Вечный мозг»: фото на постаменте из чёрного стекла, лампочки переливаются
  brain(T) {
    const m = mats(), g = new THREE.Group(), W = 1.05, H = W * 471 / 729, P = 0.4;
    mesh(rbox(0.75, P, 0.45, 0.02), m.blackGlass, 0, P / 2, 0, g);
    mesh(box(0.77, 0.02, 0.47), m.gold, 0, P, 0, g);
    const p = photoPlane(T.kapBrain, W, H); p.children[0].position.y = P + 0.01 + H / 2; p.children[0].material.emissive = new THREE.Color(0x222233); g.add(p);
    const cols = [0x40e0ff, 0xff40c0, 0xffe040, 0x60ff80, 0x8080ff];
    const lights = Array.from({ length: 18 }, (_, i) => {
      const s = sparkle(cols[i % cols.length], rnd(0.03, 0.06));
      s.position.set(rnd(-W * 0.42, W * 0.42), P + rnd(0.15, 0.9) * H, 0.02); g.add(s); return s;
    });
    let burst = 0; // «Спросить»: лампочки бегают в 4 раза быстрее, мозг думает
    g.userData.tick = now => lights.forEach((s, i) => { const f = now < burst ? 4 : 1; s.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(now * f / (180 + i * 23) + i)); s.scale.setScalar((now < burst ? 0.08 : 0.045)); });
    g.userData.act = () => { burst = performance.now() + 2500; };
    return g;
  },
  // крокодил Мистер Кро: чешуя со щитками, гребни на спине, длинная плоская морда, глаза-бугорки. Сам иногда
  // зевает и уползает. Клик — страшно разевает пасть, бросается вперёд и рычит (звук — в main.js)
  croc() {
    const m = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const L = 1.0; // длина туловища; с хвостом и мордой ≈ 1.9 м
    const tor = mesh(new THREE.SphereGeometry(0.16, 24, 14), m.croc, 0, 0.11, 0, body); tor.scale.set(L / 0.32, 0.5, 0.9);
    const belly = mesh(new THREE.SphereGeometry(0.15, 20, 10), m.crocBelly, 0, 0.085, 0, body); belly.scale.set(L / 0.3, 0.32, 0.85);
    const scute = new THREE.SphereGeometry(0.02, 8, 6); scute.scale(1.3, 0.75, 0.9);
    for (let i = 0; i < 16; i++) [-2, -1, 0, 1, 2].forEach(r => { // ряды костяных щитков на спине
      const xx = -L * 0.44 + i * L * 0.058, w = Math.sqrt(Math.max(0, 1 - (xx / (L * 0.5)) ** 2));
      if (Math.abs(r) === 2 && w < 0.6) return;
      mesh(scute, m.croc, xx, 0.11 + 0.075 * w - Math.abs(r) * 0.012, r * 0.034 * (0.5 + w * 0.6), body);
    });
    // хвост: 7 звеньев, сужается и сплющивается с боков, гребень двойной
    const tail = new THREE.Group(); tail.position.set(-L * 0.48, 0.1, 0); body.add(tail);
    const segs = []; let parent = tail;
    for (let i = 0; i < 7; i++) {
      const sg = new THREE.Group(); sg.position.x = i ? -0.1 : 0; parent.add(sg);
      const k = 1 - i * 0.12, s = mesh(new THREE.SphereGeometry(0.075 * k, 12, 8), m.croc, -0.05, 0, 0, sg); s.scale.set(2.2, 0.75, 0.85 - i * 0.06);
      [-1, 1].forEach(sd => mesh(scute, m.croc, -0.05, 0.05 * k, sd * 0.018 * k, sg));
      segs.push(sg); parent = sg;
    }
    // голова: череп + длинная сужающаяся морда, ноздри на кончике, глаза над головой
    const head = new THREE.Group(); head.position.set(L * 0.46, 0.115, 0); body.add(head);
    const up = new THREE.Group(); head.add(up);
    const skull = mesh(new THREE.SphereGeometry(0.1, 16, 10), m.croc, 0.04, 0.02, 0, up); skull.scale.set(1.2, 0.5, 0.95);
    const snoutGeo = new THREE.CylinderGeometry(0.035, 0.075, 0.34, 14, 1); snoutGeo.rotateZ(-Math.PI / 2); snoutGeo.scale(1, 0.45, 1);
    mesh(snoutGeo, m.croc, 0.27, 0.0, 0, up);
    [-1, 1].forEach(sd => {
      mesh(new THREE.SphereGeometry(0.03, 12, 8), m.croc, 0.03, 0.07, sd * 0.055, up).scale.set(1, 0.8, 1);
      mesh(new THREE.SphereGeometry(0.022, 12, 8), m.eye, 0.045, 0.08, sd * 0.06, up);
      mesh(new THREE.SphereGeometry(0.009, 6, 6), M.blackRim, 0.06, 0.085, sd * 0.07, up).scale.set(0.5, 1.4, 1); // вертикальный зрачок
      mesh(new THREE.SphereGeometry(0.01, 6, 6), m.croc, 0.43, 0.025, sd * 0.016, up);
    });
    // нёбо и зубы сверху
    mesh(box(0.36, 0.008, 0.1), m.mouth, 0.24, -0.018, 0, up);
    const jaw = new THREE.Group(); jaw.position.set(-0.02, -0.01, 0); head.add(jaw);
    const jawGeo = new THREE.CylinderGeometry(0.032, 0.07, 0.38, 14, 1); jawGeo.rotateZ(-Math.PI / 2); jawGeo.scale(1, 0.3, 1);
    mesh(jawGeo, m.crocBelly, 0.25, -0.02, 0, jaw);
    mesh(box(0.34, 0.006, 0.09), m.mouth, 0.25, -0.004, 0, jaw);
    const tongue = mesh(new THREE.SphereGeometry(0.04, 10, 6), m.mouth, 0.14, 0.0, 0, jaw); tongue.scale.set(1.8, 0.3, 0.9);
    for (let i = 0; i < 10; i++) [-1, 1].forEach(sd => {
      const w = 0.075 - i * 0.0045, xx = 0.08 + i * 0.036, big = i === 2 || i === 6 ? 1.6 : 1;
      mesh(new THREE.ConeGeometry(0.007, 0.028 * big, 5), m.teeth, xx, 0.012, sd * w * 0.62, jaw);
      const tt = mesh(new THREE.ConeGeometry(0.007, 0.03 * big, 5), m.teeth, xx + 0.018, -0.03, sd * w * 0.6, up); tt.rotation.x = Math.PI;
    });
    // лапы: из боков в стороны и вниз, «полуползком», с когтями
    const legs = [[0.3, 1], [0.3, -1], [-0.3, 1], [-0.3, -1]].map(([x0, sd]) => {
      const l = new THREE.Group(); l.position.set(x0, 0.1, sd * 0.1); body.add(l);
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, -0.03, sd * 0.09), new THREE.Vector3(0.03, -0.085, sd * 0.13)]);
      mesh(new THREE.TubeGeometry(c, 8, 0.03, 8), m.croc, 0, 0, 0, l);
      const foot = mesh(new THREE.SphereGeometry(0.038, 10, 6), m.croc, 0.05, -0.09, sd * 0.14, l); foot.scale.set(1.5, 0.35, 1.1);
      for (let k = -1; k <= 1; k++) mesh(new THREE.ConeGeometry(0.006, 0.03, 4), m.teeth, 0.1, -0.095, sd * 0.14 + k * 0.022, l).rotation.z = -Math.PI / 2;
      return l;
    });
    let state = "idle", t0 = 0, next = performance.now() + rnd(4000, 9000), from = null, to = null, amp = 0.5;
    let home = new THREE.Vector3();
    const roar = () => { if (state === "walk") body.position.copy(to); home = body.position.clone(); state = "roar"; t0 = performance.now(); };
    g.userData.mouth = roar;
    g.userData.tick = now => {
      const t = (now - t0) / 1000;
      segs.forEach((sg, i) => { sg.rotation.y = Math.sin(now / 520 + i * 0.6) * (state === "walk" ? 0.28 : state === "roar" ? 0.3 : 0.06); });
      if (state === "idle" && now > next) {
        if (Math.random() < 0.5) { state = "yawn"; t0 = now; }
        else { state = "walk"; t0 = now; from = body.position.clone(); to = body.position.length() > 0.05 ? new THREE.Vector3() : new THREE.Vector3(rnd(-0.6, 0.6), 0, rnd(-0.4, 0.4)); }
      }
      if (state === "yawn") { // ленивый зевок
        jaw.rotation.z = -Math.max(0, Math.sin(Math.min(1, t / 2) * Math.PI)) * 0.45;
        if (t > 2) { state = "idle"; jaw.rotation.z = 0; next = now + rnd(6000, 12000); }
      } else if (state === "roar") { // разевает пасть до упора, рывок вперёд, мотает головой
        const p = Math.min(1, t / 1.8), open = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
        jaw.rotation.z = -open * 0.95; up.rotation.z = open * 0.18;
        head.rotation.y = open * Math.sin(t * 22) * 0.12; head.rotation.z = open * 0.12;
        const lunge = Math.sin(Math.min(1, p / 0.25) * Math.PI) * 0.12, r = body.rotation.y;
        body.position.set(home.x + Math.cos(r) * lunge, 0, home.z - Math.sin(r) * lunge);
        tongue.scale.y = 0.3 + open * 0.15;
        if (p >= 1) { state = "idle"; jaw.rotation.z = up.rotation.z = head.rotation.y = head.rotation.z = 0; next = now + rnd(6000, 12000); }
      } else if (state === "walk") {
        const dur = from.distanceTo(to) / 0.15 + 0.3, p = Math.min(1, t / dur);
        const dir = to.clone().sub(from);
        if (dir.lengthSq() > 1e-4) body.rotation.y = Math.atan2(-dir.z, dir.x);
        body.position.lerpVectors(from, to, p);
        legs.forEach((l, i) => { l.rotation.z = Math.sin(now / 120 + (i % 3 ? 0 : Math.PI)) * 0.5; });
        if (p >= 1) { state = "idle"; legs.forEach(l => { l.rotation.z = 0; }); next = now + rnd(6000, 14000); }
      }
    };
    return g;
  },
  // мозаика «Ельцин»: смальта блестит; «посмотреть» — по мозаике пробегает блик
  yeltsin(T) {
    const g = new THREE.Group(), H = 0.95 * 768 / 512, pic = new THREE.Group(); g.add(pic);
    mesh(new THREE.PlaneGeometry(0.95, H), std({ map: T.kapYeltsin, roughness: 0.25, metalness: 0.2 }), 0, 0, 0, pic).castShadow = false;
    const gleam = new THREE.Mesh(new THREE.PlaneGeometry(0.18, H * 1.2), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    gleam.rotation.z = 0.4; gleam.position.z = 0.004; pic.add(gleam);
    g.userData.act = play => play(1300, p => { gleam.position.x = -0.6 + p * 1.2; gleam.material.opacity = Math.sin(p * Math.PI) * 0.35 * (Math.abs(gleam.position.x) < 0.42 ? 1 : 0); pic.rotation.z = Math.sin(p * Math.PI * 2) * 0.02; });
    return g;
  },
  // сейф из панциря черепахи: фото спереди, бока «под панцирь», золотые лапы
  safe(T) {
    const m = mats(), g = new THREE.Group(), W = 0.55, H = W * 768 / 611, D = 0.5;
    const shell = std({ color: 0x5a3818, roughness: 0.35, map: cv(128, 128, (x, w, h) => {
      x.fillStyle = "#6a4420"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) { x.strokeStyle = "#2a1808"; x.lineWidth = 3; x.beginPath(); const cx = (i % 3) * 45 + 20, cy = ((i / 3) | 0) * 45 + 20; for (let a = 0; a <= 6.3; a += 1.05) x.lineTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22); x.stroke(); x.fillStyle = "rgba(220,170,90,.25)"; x.fill(); }
    }) });
    mesh(rbox(W * 0.96, H * 0.88, D, 0.06), shell, 0, H * 0.48, -D / 2 + 0.02, g);
    // дверца = фото фасада на петле слева; внутри — золотое сияние и пачки долларов
    const door = new THREE.Group(); door.position.set(-W / 2, 0, 0.03); g.add(door);
    const p = photoPlane(T.kapSafe, W, H); p.children[0].position.y = H / 2; p.position.x = W / 2; door.add(p);
    const inner = mesh(box(W * 0.8, H * 0.7, 0.01), std({ color: 0x2a1a0a, roughness: 0.8 }), 0, H * 0.48, -0.02, g);
    for (let i = 0; i < 6; i++) mesh(box(0.13, 0.03, 0.07), std({ color: 0x5a8a4a, roughness: 0.8 }), -0.1 + (i % 2) * 0.15, H * 0.25 + (i >> 1) * 0.04, -0.06, g);
    for (let i = 0; i < 3; i++) mesh(box(0.12, 0.04, 0.06), m.gold, -0.12 + i * 0.12, H * 0.55, -0.06, g);
    const glow = sparkle(0xffd060, 0.5); glow.position.set(0, H * 0.45, 0.05); glow.material.opacity = 0; g.add(glow);
    g.userData.act = play => play(2600, q => { const o = q < 0.25 ? q / 0.25 : q > 0.75 ? (1 - q) / 0.25 : 1; door.rotation.y = -o * 1.7; glow.material.opacity = o * 0.8; });
    return g;
  },
  // «Несгораемый рубль»: статуэтка, огоньки пламени пляшут сверху
  ruble(T) {
    const g = new THREE.Group(), W = 0.22, H = W * 426 / 305;
    mesh(box(0.2, 0.03, 0.12), mats().blackGlass, 0, 0.015, 0, g);
    const p = photoPlane(T.kapRuble, W, H); p.children[0].position.y = 0.03 + H / 2; g.add(p);
    const fl = [0xff9020, 0xffd040, 0xff5010].map((c, i) => { const s = sparkle(c, 0.06); s.position.set(-0.03 + i * 0.04, H * 0.95, 0.02); g.add(s); return s; });
    let burst = 0; // «Поджечь»: пламя вспыхивает втрое
    g.userData.tick = now => fl.forEach((s, i) => {
      const f = 0.6 + 0.4 * Math.sin(now / (70 + i * 17) + i * 2), b = now < burst ? 2.8 : 1;
      s.material.opacity = f; s.scale.set((0.05 * f + 0.02) * b, (0.08 * f + 0.02) * b, 1); s.position.y = H * 0.95 + f * 0.02 * b + (b - 1) * 0.03;
    });
    g.userData.act = () => { burst = performance.now() + 1800; };
    return g;
  },
};
