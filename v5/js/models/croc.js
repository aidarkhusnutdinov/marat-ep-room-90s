// Крокодил Мистер Кро (раунд 3): не из шариков, а вылепленный — тело и хвост «натянуты» на сечения (лофт),
// плоское брюхо, ряды костяных щитков на спине, двойной гребень на хвосте, тяжёлая голова с зубами внахлёст,
// жёлтые глаза с вертикальным зрачком. Окрас — тёмная олива с бронзой сверху, кремовое брюхо, полосы на хвосте.
// Пасть открывается вверх: поднимается голова и верхняя челюсть, нижняя почти не опускается — под пол не уходит.
// Начало координат — пол под серединой тела, морда смотрит в +x.
import * as THREE from "three";
import { normalMap } from "../textures.js";

const rnd = (a, b) => a + Math.random() * (b - a);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// плавная кривая по опорным точкам [[x, v], …]
const curve = pts => x => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, v0] = pts[i - 1], [x1, v1] = pts[i], t = (x - x0) / (x1 - x0); return v0 + (v1 - v0) * t * t * (3 - 2 * t); }
  return pts[pts.length - 1][1];
};

// ---------- Сечения ----------
// тело и хвост: низ брюха (yb), верх спины (yt), полуширина (w) вдоль x
const BODY = {
  yb: curve([[-1.04, 0.04], [-0.6, 0.032], [-0.2, 0.022], [0.0, 0.018], [0.4, 0.02], [0.66, 0.04]]),
  yt: curve([[-1.04, 0.05], [-0.6, 0.1], [-0.22, 0.165], [0.05, 0.19], [0.32, 0.18], [0.66, 0.135]]),
  w: curve([[-1.04, 0.006], [-0.6, 0.038], [-0.22, 0.105], [0.05, 0.175], [0.32, 0.165], [0.55, 0.115], [0.66, 0.1]]),
};
// голова (координаты от шарнира челюсти): верх головы и нижняя челюсть
const HEAD = {
  w: curve([[-0.07, 0.1], [0.03, 0.118], [0.12, 0.088], [0.26, 0.064], [0.37, 0.05], [0.415, 0.054], [0.455, 0.03]]),
  yt: curve([[-0.07, 0.07], [0.03, 0.078], [0.12, 0.058], [0.26, 0.04], [0.38, 0.032], [0.42, 0.038], [0.455, 0.018]]),
  jb: curve([[-0.06, -0.058], [0.08, -0.044], [0.28, -0.026], [0.44, -0.017]]),
};
// точка сечения по углу f (0 — правый бок +z, π/2 — спина): спина округлая, брюхо плоское
function prof(S, f) {
  const c = Math.cos(f), s = Math.sin(f), ym = S.yb + (S.yt - S.yb) * (S.mid ?? 0.4);
  const z = S.w * Math.sign(c) * Math.abs(c) ** (2 / 2.5);
  const y = s >= 0 ? ym + (S.yt - ym) * Math.abs(s) ** (2 / 2.2) : ym - (ym - S.yb) * Math.abs(s) ** (2 / 4);
  return [y, z];
}
// высота спины над точкой (x, z) — чтобы посадить щитки на поверхность
function topAt(S, z) {
  const ym = S.yb + (S.yt - S.yb) * (S.mid ?? 0.4), c = Math.min(1, Math.abs(z) / S.w) ** (2.5 / 2), s = Math.sqrt(Math.max(0, 1 - c * c));
  return ym + (S.yt - ym) * s ** (2 / 2.2);
}

// окрас по высоте сечения: брюхо кремовое, бока оливковые, спина почти чёрная с бронзой; на хвосте — поперечные полосы
const BELLY = new THREE.Color(0.78, 0.72, 0.5), FLANK = new THREE.Color(0.24, 0.26, 0.15), BACK = new THREE.Color(0.075, 0.09, 0.055);
function tint(k, x, z, tail) {
  const c = BELLY.clone().lerp(FLANK, sm(0.12, 0.42, k)).lerp(BACK, sm(0.5, 0.88, k));
  let d = 1;
  if (tail && k > 0.3) d *= 1 - 0.45 * sm(0.55, 0.85, 0.5 + 0.5 * Math.sin(x * Math.PI * 2 / 0.12));
  if (k > 0.25 && k < 0.7) d *= 1 - 0.22 * sm(0.4, 0.9, Math.sin(x * 37 + z * 21) * Math.sin(x * 13 - z * 9)); // пятна на боках
  return c.multiplyScalar(d);
}

// лофт вдоль x: кольца сечений → BufferGeometry с uv (под плитку чешуи) и цветом вершин
function loft(x0, x1, nx, sec, { N = 28, off = 0, tail = false, capA = false, capB = false } = {}) {
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, S = sec(x + off);
    for (let j = 0; j <= N; j++) {
      const [y, z] = prof(S, j / N * Math.PI * 2);
      pos.push(x, y, z); uv.push((x + off) / 0.17, j / N * 5);
      const c = tint((y - S.yb) / (S.yt - S.yb), x + off, z, tail); col.push(c.r, c.g, c.b);
    }
  }
  const R = N + 1, flip = x1 < x0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < N; j++) {
    const a = i * R + j, b = a + R;
    if (flip) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const cap = (i, out) => { // торец — веер к центру сечения
    const S = sec((i ? x1 : x0) + off), cI = pos.length / 3;
    pos.push(i ? x1 : x0, S.yb + (S.yt - S.yb) * 0.4, 0); uv.push(0, 0); const c = tint(0.5, 0, 0, tail); col.push(c.r, c.g, c.b);
    for (let j = 0; j < N; j++) { const a = (i ? nx : 0) * R + j; if (out !== flip) idx.push(cI, a + 1, a); else idx.push(cI, a, a + 1); }
  };
  if (capA) cap(0, false); if (capB) cap(1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const bodySec = x => ({ yb: BODY.yb(x), yt: BODY.yt(x), w: BODY.w(x) });
const upperSec = x => ({ yb: -0.003, yt: HEAD.yt(x), w: HEAD.w(x), mid: 0 });       // верх головы: снизу плоско (линия рта)
const jawSec = x => ({ yb: HEAD.jb(x), yt: 0.002, w: HEAD.w(x) * 0.95, mid: 1 });     // нижняя челюсть: сверху плоско

// ---------- Материалы ----------
let MAT = null;
function mats() {
  if (MAT) return MAT;
  // чешуя: прямоугольные щитки рядами, швы тёмные, каждый щиток чуть выпуклый
  const S = 256, c = Object.assign(document.createElement("canvas"), { width: S, height: S }), x = c.getContext("2d");
  const hc = Object.assign(document.createElement("canvas"), { width: S, height: S }), hx = hc.getContext("2d");
  x.fillStyle = "#3a3830"; x.fillRect(0, 0, S, S); hx.fillStyle = "#202020"; hx.fillRect(0, 0, S, S);
  const n = 8, cw = S / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const sx = i * cw + (j % 2) * cw / 2, sy = j * cw, v = rnd(0.82, 1.08);
    for (const dx of [0, -S]) {
      x.fillStyle = `rgb(${226 * v | 0},${222 * v | 0},${206 * v | 0})`; x.beginPath(); x.roundRect(sx + dx + 1.5, sy + 1.5, cw - 3, cw - 3, 7); x.fill();
      const g = hx.createRadialGradient(sx + dx + cw / 2, sy + cw / 2, 1, sx + dx + cw / 2, sy + cw / 2, cw * 0.6);
      g.addColorStop(0, "#fff"); g.addColorStop(0.7, "#9a9a9a"); g.addColorStop(1, "#404040");
      hx.fillStyle = g; hx.beginPath(); hx.roundRect(sx + dx + 2, sy + 2, cw - 4, cw - 4, 6); hx.fill();
    }
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const nm = normalMap(hc, 3); nm.wrapS = nm.wrapT = THREE.RepeatWrapping;
  const skin = { map, normalMap: nm, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.4 };
  MAT = {
    skinV: new THREE.MeshPhysicalMaterial({ ...skin, vertexColors: true }),               // тело и голова: окрас в вершинах
    skin: new THREE.MeshPhysicalMaterial({ ...skin, color: 0x3c4029 }),                   // лапы
    scute: new THREE.MeshPhysicalMaterial({ color: 0x15190f, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: new THREE.Color(0x8a7a40) }),
    mouth: new THREE.MeshStandardMaterial({ color: 0xe6c79a, roughness: 0.55, side: THREE.DoubleSide }), // у крокодила пасть желтоватая
    tongue: new THREE.MeshStandardMaterial({ color: 0xd6a27a, roughness: 0.5 }),
    teeth: new THREE.MeshPhysicalMaterial({ color: 0xf2ead2, roughness: 0.3, clearcoat: 0.6 }),
    claw: new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.35 }),
    eye: new THREE.MeshPhysicalMaterial({ color: 0xc9a62a, emissive: 0x4a3600, emissiveIntensity: 0.5, roughness: 0.08, clearcoat: 1 }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
  };
  return MAT;
}
// сужающийся сегмент лапы от a до b (радиусы ra → rb)
function limb(a, b, ra, rb, mat, parent) {
  const d = b.clone().sub(a), geo = new THREE.CylinderGeometry(rb, ra, d.length(), 12, 1);
  const m = part(geo, mat, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
}
function part(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
// щитки/гребни одной геометрией на много штук
function instanced(geo, mat, list, parent) {
  const im = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach(([x, y, z, sx = 1, sy = 1, sz = 1, ry = 0], i) => { o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(0, ry, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.castShadow = true; im.receiveShadow = true; parent.add(im); return im;
}

export function buildCroc() {
  const m = mats(), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  // туловище: от основания хвоста до шеи
  const TX0 = -0.24, NECK = 0.64;
  part(loft(TX0 - 0.012, NECK, 34, bodySec), m.skinV, body);
  // щитки на спине: шесть рядов, по краям мельче; на шее — две пары крупных
  const keel = new THREE.OctahedronGeometry(0.02, 0); keel.translate(0, 0.006, 0);
  const sc = [];
  for (let xx = -0.2; xx <= 0.44; xx += 0.046) {
    const S = bodySec(xx);
    [-0.66, -0.4, -0.14, 0.14, 0.4, 0.66].forEach(f => { const z = f * S.w * 0.82, k = 1 - Math.abs(f) * 0.45; sc.push([xx, topAt(S, z) - 0.004, z, 1.25 * k, 0.6 * k, 0.85 * k]); });
  }
  [[0.55, 0.035], [0.55, -0.035], [0.5, 0.075], [0.5, -0.075]].forEach(([xx, z]) => sc.push([xx, topAt(bodySec(xx), z) - 0.003, z, 1.5, 0.75, 1.2]));
  instanced(keel, m.scute, sc, body);

  // хвост: 7 звеньев цепочкой (машет), у каждого свой кусок лофта и гребни — двойные у основания, одинарные к кончику
  const fin = new THREE.ConeGeometry(0.02, 0.04, 4); fin.scale(1.1, 1, 0.32); fin.translate(0, 0.016, 0);
  const segs = []; let parent = body, jx = TX0;
  const SEG = 0.115;
  for (let i = 0; i < 7; i++) {
    const sg = new THREE.Group(); sg.position.x = i ? -SEG : TX0; parent.add(sg);
    part(loft(0.012, -SEG - (i === 6 ? 0.04 : 0.012), 6, bodySec, { off: jx, tail: true, capB: i === 6 }), m.skinV, sg);
    const fins = [];
    for (let k = 0; k < 3; k++) {
      const lx = -k * SEG / 3, S = bodySec(jx + lx), h = 0.4 + 0.6 * S.w / 0.1;
      if (i < 4) [-1, 1].forEach(sd => fins.push([lx, S.yt - 0.006, sd * S.w * 0.45, h, h * 0.9, 1]));
      else fins.push([lx, S.yt - 0.004, 0, h, h, 1]);
    }
    instanced(fin, m.scute, fins, sg);
    segs.push(sg); parent = sg; jx -= SEG;
  }

  // голова на шарнире челюсти; up — верх головы (с верхней челюстью), jaw — нижняя
  const head = new THREE.Group(); head.position.set(NECK - 0.035, 0.092, 0); body.add(head);
  const up = new THREE.Group(), jaw = new THREE.Group(); head.add(up, jaw);
  part(loft(-0.07, 0.455, 30, upperSec, { capA: true, capB: true }), m.skinV, up);
  part(loft(-0.06, 0.44, 26, jawSec, { capA: true, capB: true }), m.skinV, jaw);
  // нёбо, язык, зубы внахлёст: верхние — вниз, нижние — вверх и видны снаружи даже с закрытой пастью
  const palate = new THREE.Shape(); palate.moveTo(-0.03, 0);
  for (let xx = -0.03; xx <= 0.43; xx += 0.02) palate.lineTo(xx, HEAD.w(xx) * 0.86);
  for (let xx = 0.43; xx >= -0.03; xx -= 0.02) palate.lineTo(xx, -HEAD.w(xx) * 0.86);
  const pg = new THREE.ShapeGeometry(palate); pg.rotateX(Math.PI / 2);
  part(pg, m.mouth, up, 0, -0.004, 0).castShadow = false;
  const lg = pg.clone(); lg.scale(1, 1, 0.92); part(lg, m.mouth, jaw, 0, 0.003, 0).castShadow = false;
  const tongue = part(new THREE.SphereGeometry(0.05, 14, 8), m.tongue, jaw, 0.08, 0.002, 0); tongue.scale.set(1.6, 0.18, 0.75);
  const tooth = new THREE.ConeGeometry(0.0065, 0.026, 6), upT = [], loT = [];
  for (let xx = 0.0; xx <= 0.43; xx += 0.028) {
    const big = Math.abs(xx - 0.112) < 0.015 || Math.abs(xx - 0.364) < 0.015 ? 1.6 : 1;
    [-1, 1].forEach(sd => {
      upT.push([xx, -0.012 * big, sd * (HEAD.w(xx) - 0.007), 1, big, 1]);
      const lx = xx + 0.014; if (lx < 0.43) loT.push([lx, 0.013 * big, sd * (HEAD.w(lx) * 0.95 - 0.004), 1, big, 1]);
    });
  }
  const tUp = tooth.clone(); tUp.rotateX(Math.PI); instanced(tUp, m.teeth, upT, up); instanced(tooth, m.teeth, loT, jaw);
  // глаза на бугорках, вертикальный зрачок; ноздри на кончике морды
  [-1, 1].forEach(sd => {
    part(new THREE.SphereGeometry(0.03, 16, 10), m.skin, up, 0.0, 0.07, sd * 0.05).scale.set(1.35, 0.75, 1);
    const eye = part(new THREE.SphereGeometry(0.018, 16, 12), m.eye, up, 0.012, 0.083, sd * 0.056);
    const pupil = part(new THREE.SphereGeometry(0.0185, 10, 8), m.pupil, eye, 0.002, 0, sd * 0.002); pupil.scale.set(0.22, 1, 0.98); pupil.castShadow = false;
    part(new THREE.SphereGeometry(0.012, 10, 6), m.skin, up, 0.43, 0.034, sd * 0.012).scale.set(1, 0.6, 1);
  });

  // лапы враскоряку: плечо в сторону, локоть, предплечье вниз, ступня с пальцами и когтями
  const legs = [[0.42, 1, 1], [0.42, -1, 1], [-0.12, 1, 0], [-0.12, -1, 0]].map(([x0, sd, front]) => {
    const l = new THREE.Group(), S = bodySec(x0), k = front ? 0.85 : 1.1; l.position.set(x0, 0.075, sd * S.w * 0.8); body.add(l);
    const dir = front ? 1 : -1, sh = new THREE.Vector3(-dir * 0.015, 0.012, -sd * 0.03), el = new THREE.Vector3(dir * 0.04 * k, -0.002, sd * 0.11 * k), ft = new THREE.Vector3(dir * 0.06 * k, -0.062, sd * 0.15 * k);
    limb(sh, el, 0.042 * k, 0.026 * k, m.skin, l); limb(el, ft, 0.026 * k, 0.019 * k, m.skin, l);
    part(new THREE.SphereGeometry(0.026 * k, 12, 8), m.skin, l, el.x, el.y, el.z);
    const foot = part(new THREE.SphereGeometry(0.036 * k, 12, 8), m.skin, l, ft.x + dir * 0.01, ft.y - 0.004, ft.z); foot.scale.set(1.5, 0.38, 1.25);
    for (let t = -2; t <= 2; t++) { // пальцы веером вперёд, на концах тёмные когти
      if (front === 0 && t === 2) continue;
      const a = t * 0.38 + (front ? 0 : 0.2) * sd, len = 0.05 * k, fx = ft.x + dir * 0.02 + Math.cos(a) * len * dir, fz = ft.z + Math.sin(a) * len * 0.9;
      const toe = part(new THREE.CylinderGeometry(0.007, 0.011, len, 6), m.skin, l, (ft.x + fx) / 2 + dir * 0.01, ft.y - 0.008, (ft.z + fz) / 2); toe.rotation.set(0, -a * dir, dir * Math.PI / 2);
      const cl = part(new THREE.ConeGeometry(0.006, 0.018, 5), m.claw, l, fx + dir * 0.012, ft.y - 0.01, fz); cl.rotation.set(0, -a * dir, -dir * Math.PI / 2);
    }
    l.userData.base = l.position.y;
    return l;
  });

  // ---------- Поведение ----------
  let state = "idle", t0 = 0, next = performance.now() + rnd(4000, 9000), from = null, to = null, home = new THREE.Vector3();
  const roar = () => { if (state === "walk") body.position.copy(to); home = body.position.clone(); state = "roar"; t0 = performance.now(); };
  const rest = () => { head.rotation.set(0, 0, 0); up.rotation.z = 0; jaw.rotation.z = 0; body.position.y = 0; legs.forEach(l => { l.rotation.set(0, 0, 0); l.position.y = l.userData.base; }); };
  g.userData.mouth = roar;
  g.userData.tick = now => {
    const t = (now - t0) / 1000;
    const sway = state === "walk" ? 0.22 : state === "roar" ? 0.32 : 0.05;
    segs.forEach((sg, i) => { sg.rotation.y = Math.sin(now / (state === "roar" ? 160 : 600) - i * 0.7) * sway * (0.5 + i * 0.12); });
    body.scale.y = 1 + Math.sin(now / 900) * 0.012; // дышит
    if (state === "idle" && now > next) {
      if (Math.random() < 0.45) { state = "yawn"; t0 = now; }
      else { state = "walk"; t0 = now; from = body.position.clone(); to = body.position.length() > 0.05 ? new THREE.Vector3() : new THREE.Vector3(rnd(-0.6, 0.6), 0, rnd(-0.4, 0.4)); }
    }
    if (state === "yawn") { // медленно поднимает голову и раскрывает пасть
      const o = Math.max(0, Math.sin(Math.min(1, t / 2.6) * Math.PI));
      head.rotation.z = o * 0.12; up.rotation.z = o * 0.45; jaw.rotation.z = -o * 0.05;
      if (t > 2.6) { state = "idle"; rest(); next = now + rnd(6000, 12000); }
    } else if (state === "roar") { // голова вверх, пасть до упора, рывок вперёд, мотает мордой, хвост хлещет
      const p = Math.min(1, t / 1.9), open = p < 0.14 ? sm(0, 1, p / 0.14) : p > 0.78 ? sm(0, 1, (1 - p) / 0.22) : 1;
      head.rotation.z = open * 0.24; up.rotation.z = open * 0.72; jaw.rotation.z = -open * 0.1;
      head.rotation.y = open * Math.sin(t * 18) * 0.08;
      const lunge = Math.sin(Math.min(1, p / 0.22) * Math.PI) * 0.14, r = body.rotation.y;
      body.position.set(home.x + Math.cos(r) * lunge, open * 0.03, home.z - Math.sin(r) * lunge); // привстаёт на лапах
      legs.forEach(l => { l.position.y = l.userData.base - open * 0.03; });
      if (p >= 1) { state = "idle"; rest(); body.position.copy(home); next = now + rnd(6000, 12000); }
    } else if (state === "walk") { // «высокая походка»: приподнят, лапы переступают по диагонали
      const dur = from.distanceTo(to) / 0.16 + 0.4, p = Math.min(1, t / dur), lift = 0.035 * Math.sin(Math.min(1, p * 6, (1 - p) * 6) * Math.PI / 2);
      const dir = to.clone().sub(from);
      if (dir.lengthSq() > 1e-4) body.rotation.y = Math.atan2(-dir.z, dir.x);
      body.position.lerpVectors(from, to, sm(0, 1, p)); body.position.y = lift;
      head.rotation.y = Math.sin(now / 260) * 0.06;
      legs.forEach((l, i) => { const ph = now / 170 + (i === 0 || i === 3 ? 0 : Math.PI); l.rotation.y = Math.sin(ph) * 0.35; l.position.y = l.userData.base - lift + Math.max(0, Math.cos(ph)) * 0.02; });
      if (p >= 1) { state = "idle"; rest(); next = now + rnd(6000, 14000); }
    }
  };
  return g;
}
