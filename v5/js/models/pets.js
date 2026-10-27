// Питомцы: низкополигональные модели из примитивов. Вперёд — +x, начало координат — между лап на полу.
// userData: legs (группы-ноги, качаются при ходьбе), tail, head, body — для анимаций в js/pets.js.
import * as THREE from "three";
import { mesh, cyl, box } from "./kit.js";

const std = o => new THREE.MeshStandardMaterial(o);
const rnd = (a, b) => a + Math.random() * (b - a);
function cv(w, h, draw) {
  const c = Object.assign(document.createElement("canvas"), { width: w, height: h }), x = c.getContext("2d");
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// шерсть: базовый цвет + полоски / крапинки + мелкий ворс
const fur = (base, extra) => std({ roughness: 0.95, map: cv(128, 64, (x, w, h) => {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  if (extra) extra(x, w, h);
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},.07)`; x.fillRect(Math.random() * w, Math.random() * h, 1, 2); }
}) });
const stripes = col => (x, w, h) => { x.fillStyle = col; for (let i = 0; i < 9; i++) { const px = i * 14 + rnd(-3, 3); x.fillRect(px, 0, rnd(3, 6), h * rnd(0.5, 0.9)); } };
const rosettes = (x, w, h) => { for (let i = 0; i < 40; i++) { const px = rnd(0, w), py = rnd(0, h); x.strokeStyle = "#2a2420"; x.lineWidth = 1.6; x.beginPath(); x.arc(px, py, rnd(2, 4), 0, 6.28); x.stroke(); x.fillStyle = "rgba(160,110,50,.6)"; x.fill(); } };

// Мех «оболочками» (shell fur): поверх тела ещё N чуть больших копий с картой ворсинок — шерсть объёмная и
// непрозрачная, без дыр. len — длина ворса в долях радиуса, clump — насколько пряди лохматые.
let strandsTex = null;
function strands() {
  if (strandsTex) return strandsTex;
  const c = Object.assign(document.createElement("canvas"), { width: 256, height: 256 }), x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 60 + Math.random() * 195 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 0.6 + Math.random() * 1.1, 0, 6.28); x.fill(); }
  strandsTex = new THREE.CanvasTexture(c); strandsTex.wrapS = strandsTex.wrapT = THREE.RepeatWrapping; strandsTex.repeat.set(3, 3);
  return strandsTex;
}
// пёстрая «шерстяная» подложка: прядки разного тона, чтобы и сверху (куда смотрит камера) было видно ворс
const furMaps = {};
function furMap(base, tip) {
  const k = base + "|" + tip; if (furMaps[k]) return furMaps[k];
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 }), x = c.getContext("2d");
  const b = new THREE.Color(base), t = new THREE.Color(tip);
  x.fillStyle = "#" + b.getHexString(); x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) {
    const col = b.clone().lerp(t, Math.random()).multiplyScalar(0.75 + Math.random() * 0.4);
    x.strokeStyle = "#" + col.getHexString(); x.lineWidth = 1; const px = Math.random() * 128, py = Math.random() * 128, a = 1.2 + Math.random() * 0.7;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 5, py + Math.sin(a) * 5); x.stroke();
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3, 3);
  return (furMaps[k] = tx);
}
function furry(parent, geo, base, tip, x, y, z, { shells = 9, len = 0.18, sx = 1, sy = 1, sz = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(sx, sy, sz); parent.add(g);
  const map = furMap(base, tip);
  mesh(geo, std({ map, roughness: 1 }), 0, 0, 0, g);
  for (let i = 1; i <= shells; i++) {
    const k = i / shells, m = std({ map, color: new THREE.Color(0xffffff).lerp(new THREE.Color(1.35, 1.35, 1.35), k), roughness: 1, alphaMap: strands(), alphaTest: 0.2 + k * 0.72 });
    const sh = mesh(geo, m, 0, -k * len * 0.15, 0, g); sh.scale.setScalar(1 + k * len); sh.castShadow = i === 1;
  }
  return g;
}

function leg(parent, mat, x, z, h, r) {
  const l = new THREE.Group(); l.position.set(x, h, z); parent.add(l);
  mesh(cyl(r, r * 0.85, h, 8), mat, 0, -h / 2, 0, l);
  return l;
}
function eyes(parent, col, x, y, z, r = 0.012) {
  const m = std({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.2 }), pup = std({ color: 0x111111, roughness: 0.2 });
  return [-1, 1].map(s => { const e = mesh(new THREE.SphereGeometry(r, 10, 8), m, x, y, s * z, parent); mesh(new THREE.SphereGeometry(r * 0.5, 8, 6), pup, x + r * 0.7, y, s * z, parent); return e; });
}

function cat(furMat, eyeCol) {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const body = mesh(new THREE.SphereGeometry(0.1, 16, 12), furMat, 0, 0.14, 0, b); body.scale.set(1.7, 0.85, 0.85);
  const head = new THREE.Group(); head.position.set(0.17, 0.22, 0); b.add(head);
  mesh(new THREE.SphereGeometry(0.065, 14, 12), furMat, 0, 0, 0, head);
  [-1, 1].forEach(s => { const ear = mesh(new THREE.ConeGeometry(0.025, 0.05, 4), furMat, -0.01, 0.06, s * 0.035, head); ear.rotation.x = s * 0.25; });
  mesh(new THREE.SphereGeometry(0.03, 10, 8), furMat, 0.05, -0.02, 0, head).scale.set(1, 0.7, 1.1);
  mesh(new THREE.SphereGeometry(0.008, 6, 6), std({ color: 0xd88a8a }), 0.078, -0.008, 0, head);
  const ey = eyes(head, eyeCol, 0.05, 0.015, 0.025);
  const tail = new THREE.Group(); tail.position.set(-0.16, 0.17, 0); b.add(tail);
  const tc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.1, 0.02, 0), new THREE.Vector3(-0.12, 0.16, 0));
  mesh(new THREE.TubeGeometry(tc, 10, 0.016, 6), furMat, 0, 0, 0, tail);
  const legs = [[0.09, 1], [0.09, -1], [-0.09, 1], [-0.09, -1]].map(([x0, s]) => leg(b, furMat, x0, s * 0.045, 0.1, 0.018));
  g.userData = { legs, tail, head, body: b, eyes: ey, speed: 0.32, gait: 9 };
  return g;
}

export const PETS = {
  dobraya() { return cat(fur("#e08a3a", stripes("#b55a1e")), 0x7ac04a); },
  machka() { return cat(fur("#9a9690", rosettes), 0xd8c040); },
  sglaz() {
    const g = cat(fur("#1c1a1e"), 0xf0d040);
    // сверкающий глаз: вспышка-звёздочка иногда (js/pets.js)
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cv(32, 32, x => {
      x.translate(16, 16); x.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 4); x.fillRect(-1, -15, 2, 30); }
      const r = x.createRadialGradient(0, 0, 0, 0, 0, 8); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(-8, -8, 16, 16);
    }), color: 0xfff2a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    sp.scale.set(0.09, 0.09, 1); g.userData.eyes[1].add(sp); g.userData.glint = sp;
    return g;
  },
  // Матвей: серый мохнатый пёс — мех оболочками (раньше был «гранёный» и просвечивал)
  matvey() {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    const G = 0x5e5b57, TIP = 0x9a958e, m = std({ color: G, roughness: 1 });
    const sph = r => new THREE.SphereGeometry(r, 20, 14);
    furry(b, sph(0.14), G, TIP, 0, 0.25, 0, { sx: 1.75, sy: 0.95, sz: 0.95, len: 0.22 });
    const head = new THREE.Group(); head.position.set(0.27, 0.35, 0); b.add(head);
    furry(head, sph(0.085), G, TIP, 0, 0, 0, { len: 0.25 });
    furry(head, sph(0.05), G, TIP, 0.08, -0.03, 0, { sx: 1.3, sy: 0.8, sz: 0.9, len: 0.2, shells: 6 });
    mesh(new THREE.SphereGeometry(0.019, 10, 8), std({ color: 0x151515, roughness: 0.25 }), 0.148, -0.02, 0, head);
    mesh(new THREE.SphereGeometry(0.02, 8, 6), std({ color: 0xd86a7a, roughness: 0.6 }), 0.12, -0.07, 0, head).scale.set(1, 0.4, 0.8); // язык
    [-1, 1].forEach(s => furry(head, sph(0.04), G, TIP, -0.01, -0.01, s * 0.085, { sx: 0.55, sy: 1.5, sz: 0.4, len: 0.3, shells: 6 }));
    const ey = eyes(head, 0x3a2410, 0.07, 0.03, 0.035, 0.011);
    // хвост растёт из крупа: основание утоплено в тело (раньше висел над ним отдельно), сам хвост задран вверх
    const tail = new THREE.Group(); tail.position.set(-0.215, 0.3, 0); b.add(tail);
    furry(tail, sph(0.035), G, TIP, -0.015, 0.0, 0, { sx: 1.1, sy: 1, sz: 1, len: 0.3, shells: 6 });
    const tailUp = new THREE.Group(); tailUp.rotation.z = -0.7; tail.add(tailUp);
    furry(tailUp, sph(0.04), G, TIP, -0.06, 0, 0, { sx: 1.75, sy: 0.72, sz: 0.72, len: 0.4, shells: 7 });
    const legs = [[0.15, 1], [0.15, -1], [-0.15, 1], [-0.15, -1]].map(([x0, s]) => {
      const l = leg(b, m, x0, s * 0.07, 0.17, 0.032);
      furry(l, new THREE.CylinderGeometry(0.03, 0.026, 0.14, 10), G, TIP, 0, -0.07, 0, { len: 0.35, shells: 5 });
      return l;
    });
    g.userData = { legs, tail, head, body: b, eyes: ey, speed: 0.4, gait: 8 };
    return g;
  },
  // Чирик: черепаха, ползёт очень медленно
  chirik() {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    const skin = std({ color: 0x8a9a5a, roughness: 0.8 });
    const shell = std({ roughness: 0.4, map: cv(128, 64, (x, w, h) => {
      x.fillStyle = "#5a4020"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) { const cx = (i % 6) * 22 + 10, cy = ((i / 6) | 0) * 30 + 15; x.beginPath(); for (let a = 0; a <= 6.3; a += 1.05) x.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10); x.fillStyle = "#8a6a30"; x.fill(); x.strokeStyle = "#2a1a08"; x.lineWidth = 2; x.stroke(); }
    }) });
    const sh = mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.03, 0, b); sh.scale.set(1.3, 0.75, 1);
    mesh(cyl(0.13, 0.13, 0.015, 16), shell, 0, 0.03, 0, b).scale.set(1, 1, 0.78);
    const head = new THREE.Group(); head.position.set(0.14, 0.05, 0); b.add(head);
    mesh(new THREE.SphereGeometry(0.03, 10, 8), skin, 0.01, 0, 0, head).scale.set(1.4, 0.9, 0.9);
    const ey = eyes(head, 0x222222, 0.03, 0.012, 0.018, 0.006);
    const legs = [[0.08, 1], [0.08, -1], [-0.08, 1], [-0.08, -1]].map(([x0, s]) => { const l = new THREE.Group(); l.position.set(x0, 0.03, s * 0.08); b.add(l); mesh(new THREE.SphereGeometry(0.025, 8, 6), skin, 0, -0.01, s * 0.01, l).scale.set(1, 0.6, 1.3); return l; });
    const tail = new THREE.Group(); tail.position.set(-0.13, 0.03, 0); b.add(tail);
    mesh(new THREE.ConeGeometry(0.012, 0.04, 6), skin, -0.015, 0, 0, tail).rotation.z = Math.PI / 2;
    g.userData = { legs, tail, head, body: b, eyes: ey, speed: 0.025, gait: 2 };
    return g;
  },
  // Тарантиныч живёт в аквариуме на табуретке: песок, коряга, поилка. Сам ходит по аквариуму (userData.tick),
  // по комнате не гуляет (caged)
  tarantul() {
    const g = new THREE.Group(), spider = new THREE.Group(), b = new THREE.Group(); spider.add(b);
    const dark = std({ color: 0x2a1c14, roughness: 1 }), band = std({ color: 0xd8742a, roughness: 1 });
    const hair = std({ color: 0x3a2a1e, roughness: 1, alphaMap: strands(), alphaTest: 0.5 });
    const abd = mesh(new THREE.SphereGeometry(0.05, 14, 10), dark, -0.06, 0.06, 0, b); abd.scale.set(1.3, 1, 1.1);
    const abdH = mesh(new THREE.SphereGeometry(0.055, 14, 10), hair, -0.06, 0.06, 0, b); abdH.scale.set(1.3, 1, 1.1);
    mesh(new THREE.SphereGeometry(0.035, 12, 10), dark, 0.025, 0.05, 0, b);
    const ey = eyes(b, 0x111111, 0.055, 0.065, 0.012, 0.006);
    const legs = [];
    for (let i = 0; i < 4; i++) [-1, 1].forEach(s => {
      const l = new THREE.Group(); l.position.set(0.04 - i * 0.025, 0.05, s * 0.025); l.rotation.y = s * (0.5 - i * 0.35) + (s < 0 ? Math.PI : 0); b.add(l);
      const up = mesh(cyl(0.007, 0.007, 0.07, 5), dark, 0, 0.015, 0.03, l); up.rotation.x = Math.PI / 2 - 0.5;
      mesh(cyl(0.008, 0.008, 0.012, 5), band, 0, 0.03, 0.06, l);
      const lo = mesh(cyl(0.006, 0.004, 0.08, 5), dark, 0, -0.015, 0.08, l); lo.rotation.x = 0.4;
      legs.push(l);
    });
    // табуретка и аквариум 0.6 × 0.35 × 0.35
    const wood = std({ color: 0xb08a5a, roughness: 0.7 }), AW = 0.6, AD = 0.36, AH = 0.34, Y = 0.45;
    mesh(box(0.5, 0.04, 0.34), wood, 0, Y - 0.02, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => mesh(box(0.04, Y - 0.04, 0.04), wood, a * 0.21, (Y - 0.04) / 2, c * 0.13, g));
    mesh(box(AW, 0.03, AD), std({ color: 0x1a1a1a, roughness: 0.5 }), 0, Y + 0.015, 0, g);
    mesh(box(AW - 0.02, 0.05, AD - 0.02), std({ color: 0xc8a870, roughness: 1 }), 0, Y + 0.055, 0, g); // песок
    const twig = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22, 0, 0.06), new THREE.Vector3(-0.05, 0.1, -0.02), new THREE.Vector3(0.12, 0.05, 0.08)]), 12, 0.015, 6), std({ color: 0x5a3a20, roughness: 1 }), 0, Y + 0.08, 0, g);
    mesh(cyl(0.04, 0.04, 0.015, 16), std({ color: 0x6a9ad8, roughness: 0.1, metalness: 0.2 }), 0.2, Y + 0.088, -0.1, g); // поилка
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.16, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
    const gl = new THREE.Mesh(new THREE.BoxGeometry(AW, AH, AD), glass); gl.position.y = Y + 0.03 + AH / 2; g.add(gl);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(AW, AH, AD)), new THREE.LineBasicMaterial({ color: 0x222222 })); edges.position.copy(gl.position); g.add(edges);
    mesh(box(AW + 0.01, 0.012, AD + 0.01), std({ color: 0x222222, roughness: 0.6, transparent: true, opacity: 0.6 }), 0, Y + 0.03 + AH, 0, g); // сетчатая крышка
    spider.position.set(0, Y + 0.08, 0); g.add(spider);
    // ходит по песку: выбирает точку, поворачивается, семенит; иногда замирает или залезает на корягу
    let to = new THREE.Vector3(), wait = 0, last = performance.now();
    g.userData = { legs, head: b, body: b, eyes: ey, speed: 0, gait: 16, spider: true, caged: true };
    g.userData.tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (now < wait) { legs.forEach(l => { l.rotation.z *= 0.8; }); return; }
      const d = to.clone().sub(spider.position); d.y = 0;
      if (d.length() < 0.01) { to.set((Math.random() - 0.5) * (AW - 0.16), 0, (Math.random() - 0.5) * (AD - 0.14)); to.y = Y + 0.08; wait = now + 800 + Math.random() * 3500; return; }
      const want = Math.atan2(-d.z, d.x); let dr = want - spider.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); spider.rotation.y += dr * Math.min(1, dt * 5);
      spider.position.addScaledVector(d.normalize(), Math.min(d.length(), 0.06 * dt));
      legs.forEach((l, i) => { l.rotation.z = Math.sin(now / 60 + (i % 2) * Math.PI) * 0.25; });
    };
    g.userData.hop = p => { spider.position.y = Y + 0.08 + Math.sin(p * Math.PI) * 0.04; };
    return g;
  },
  // бобёр Михалыч: пушистый (мех оболочками), рыжие резцы, хвост-лопата с чешуёй — растёт из спины и лежит на полу
  mihalych() {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    const BR = 0x5a3a20, TIP = 0x8a6040, m = std({ color: BR, roughness: 1 });
    const tailM = std({ roughness: 0.75, map: cv(64, 64, (x, w, h) => { x.fillStyle = "#2a1c14"; x.fillRect(0, 0, w, h); x.strokeStyle = "#4a3424"; x.lineWidth = 1.5; for (let i = -8; i < 16; i++) { x.beginPath(); x.moveTo(0, i * 6); x.lineTo(w, i * 6 + w * 0.6); x.moveTo(w, i * 6); x.lineTo(0, i * 6 + w * 0.6); x.stroke(); } }) });
    furry(b, new THREE.SphereGeometry(0.12, 20, 14), BR, TIP, 0, 0.13, 0, { sx: 1.45, sy: 0.95, sz: 1, len: 0.16 });
    const head = new THREE.Group(); head.position.set(0.17, 0.17, 0); b.add(head);
    furry(head, new THREE.SphereGeometry(0.072, 16, 12), BR, TIP, 0, 0, 0, { sx: 1.15, sy: 0.95, len: 0.16, shells: 7 });
    furry(head, new THREE.SphereGeometry(0.036, 12, 10), BR, TIP, 0.06, -0.02, 0, { len: 0.12, shells: 5 });
    mesh(new THREE.SphereGeometry(0.013, 8, 6), std({ color: 0x111111, roughness: 0.3 }), 0.096, -0.005, 0, head);
    [-1, 1].forEach(s => mesh(new THREE.SphereGeometry(0.016, 8, 6), m, -0.02, 0.065, s * 0.05, head));
    mesh(new THREE.BoxGeometry(0.008, 0.03, 0.028), std({ color: 0xf08a1a, roughness: 0.3 }), 0.088, -0.052, 0, head);
    const ey = eyes(head, 0x111111, 0.055, 0.025, 0.04, 0.01);
    // хвост: овальная плоская лопата, начинается у крупа (без зазора) и полого ложится на пол
    const tail = new THREE.Group(); tail.position.set(-0.15, 0.07, 0); b.add(tail);
    const paddle = mesh(new THREE.SphereGeometry(0.1, 20, 10), tailM, -0.12, -0.035, 0, tail); paddle.scale.set(1.15, 0.14, 0.55); paddle.rotation.z = 0.18;
    mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.08, 10), m, -0.02, 0, 0, tail).rotation.z = Math.PI / 2 + 0.3;
    const legs = [[0.09, 1], [0.09, -1], [-0.09, 1], [-0.09, -1]].map(([x0, s]) => leg(b, m, x0, s * 0.07, 0.06, 0.026));
    g.userData = { legs, tail, head, body: b, eyes: ey, speed: 0.22, gait: 7, tailSlap: true };
    return g;
  },
};
