// Набор «Фанат СССР»: модели v4. Начало координат — центр основания.
import * as THREE from "three";
import { M, mesh, rbox, box, cyl, door, photoPlane } from "./kit.js";

// дверца на петле: door() из kit.js, но внутри поворотной группы (петля — по краю x0 или x1)
function hinged(g, x0, x1, y0, y1, z, mat, handleX, hingeLeft) {
  const piv = new THREE.Group(), hx = hingeLeft ? x0 : x1; piv.position.set(hx, 0, z); g.add(piv);
  door(piv, x0 - hx, x1 - hx, y0, y1, 0, mat, handleX - hx);
  piv.userData.sign = hingeLeft ? -1 : 1; return piv;
}
// дверца открывается наружу, к нам (+z): левая петля — поворот по часовой, правая — против
const swing = (d, q) => { d.rotation.y = d.userData.sign * q * 1.6; };
// пыль облачком (выбить ковёр): спрайты разлетаются и тают
let dustTex = null;
function dustCloud(g, n, at, spread) {
  if (!dustTex) {
    const c = Object.assign(document.createElement("canvas"), { width: 64, height: 64 }), x = c.getContext("2d");
    const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(235,225,205,.7)"); r.addColorStop(1, "rgba(235,225,205,0)");
    x.fillStyle = r; x.fillRect(0, 0, 64, 64); dustTex = new THREE.CanvasTexture(c);
  }
  return Array.from({ length: n }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.userData.v = new THREE.Vector3((Math.random() - 0.5) * spread.x, Math.random() * spread.y, (Math.random() - 0.5) * spread.z);
    sp.userData.at = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread.x, (Math.random() - 0.5) * spread.y, (Math.random() - 0.5) * spread.z));
    sp.visible = false; g.add(sp); return sp;
  });
}
const puffAt = (sprites, p) => sprites.forEach(sp => {
  sp.visible = p > 0 && p < 1; sp.position.copy(sp.userData.at).addScaledVector(sp.userData.v, p);
  const k = 0.08 + p * 0.25; sp.scale.set(k, k, 1); sp.material.opacity = Math.sin(p * Math.PI) * 0.8;
});

// ковёр на стене: фото на сетке; «выбить» — ковёр колышется волной, из него летит пыль
function wallRug(tex, w, h) {
  const g = new THREE.Group(), m = mesh(new THREE.PlaneGeometry(w, h, 20, 14), M.photoRug(tex), 0, 0, 0, g); m.castShadow = false;
  const pos = m.geometry.attributes.position, base = pos.array.slice();
  const puff = dustCloud(g, 14, new THREE.Vector3(0, 0, 0.05), new THREE.Vector3(w * 0.8, h * 0.6, 0.35));
  g.userData.act = play => play(1600, p => {
    const k = Math.sin(p * Math.PI) * 0.03;
    for (let i = 0; i < pos.count; i++) { const x0 = base[i * 3], y0 = base[i * 3 + 1]; pos.setZ(i, Math.sin(x0 * 9 - p * 30) * Math.cos(y0 * 4) * k); }
    pos.needsUpdate = true; puffAt(puff, p);
  });
  return g;
}

// ---------- Модели (начало координат — центр основания) ----------
export const USSR = {
  tv(T) {
    const g = new THREE.Group();
    const W = 0.8, H = W * 858 / 1100, D = 0.46;
    mesh(rbox(W - 0.03, H - 0.03, D, 0.035), M.yellow, 0, H / 2, -0.005, g);
    const front = mesh(new THREE.PlaneGeometry(W, H), M.tvPhoto, 0, H / 2, D / 2 + 0.002, g);
    front.castShadow = false;
    // экран с живыми помехами — поверх синей бумаги на фото
    const sw = W * 0.646, sh = H * 0.655;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ map: T.screen, transparent: true, toneMapped: false }));
    scr.position.set(-W / 2 + W * 0.073 + sw / 2, H - H * 0.153 - sh / 2, D / 2 + 0.004);
    g.add(scr);
    // антенна
    [[-0.5, 0.06], [0.45, -0.05]].forEach(([rz, dx]) => {
      const a = mesh(cyl(0.004, 0.006, 0.55, 8), M.chrome, 0, 0, 0, g);
      a.position.set(dx + 0.1, H + 0.25, -0.05); a.rotation.z = rz;
    });
    mesh(cyl(0.03, 0.035, 0.02), M.chrome, 0.1, H + 0.01, -0.05, g);
    g.userData.screenMesh = scr;
    return g;
  },

  radiola() {
    const g = new THREE.Group();
    const W = 0.8, H = 0.36, D = 0.38, L = 0.32;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const l = mesh(cyl(0.012, 0.02, L, 10), M.oak, sx * (W / 2 - 0.06), L / 2, sz * (D / 2 - 0.06), g);
      l.rotation.z = sx * 0.12; l.rotation.x = -sz * 0.12;
    });
    mesh(rbox(W, H, D, 0.02), M.walnut, 0, L + H / 2, 0, g);
    mesh(rbox(W * 0.56, H * 0.72, 0.01, 0.005), M.grille, -W * 0.17, L + H * 0.48, D / 2 + 0.003, g);
    const dl = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.32, 0.06), M.dial);
    dl.position.set(W * 0.27, L + H * 0.66, D / 2 + 0.004); g.add(dl);
    [0.17, 0.3].forEach(dx => {
      const k = mesh(cyl(0.022, 0.022, 0.025, 16), M.brass, W * dx, L + H * 0.3, D / 2 + 0.012, g);
      k.rotation.x = Math.PI / 2;
    });
    // крышка на петле сзади; под ней пластинка — «включить» поднимает крышку, диск крутится, пока играет
    const lid = new THREE.Group(); lid.position.set(0, L + H, -D / 2 + 0.01); g.add(lid);
    mesh(box(W - 0.02, 0.012, D - 0.02), M.oak, 0, 0.006, D / 2 - 0.01, lid);
    const disc = new THREE.Group(); disc.position.set(-0.12, L + H - 0.005, 0); g.add(disc);
    mesh(cyl(0.14, 0.14, 0.004, 32), new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.25, clearcoat: 1 }), 0, 0, 0, disc);
    mesh(cyl(0.045, 0.045, 0.005, 24), new THREE.MeshStandardMaterial({ color: 0xc8322a, roughness: 0.6 }), 0, 0.001, 0, disc);
    const arm = mesh(box(0.012, 0.012, 0.2), M.chrome, 0.2, L + H + 0.004, -0.02, g); arm.rotation.y = 0.4;
    let open = 0, playing = false;
    g.userData.setPlaying = on => { playing = on; };
    g.userData.tick = () => { open += ((playing ? 1 : 0) - open) * 0.06; lid.rotation.x = -open * 1.1; if (playing) disc.rotation.y -= 0.06; };
    return g;
  },

  stenka() {
    const g = new THREE.Group();
    const W = 2.4, H = 2.05, D = 0.45, Z = D / 2;
    mesh(box(W, H, 0.02), M.walnutDark, 0, H / 2, -Z + 0.01, g);
    mesh(box(0.022, H, D), M.walnut, -W / 2 + 0.011, H / 2, 0, g);
    mesh(box(0.022, H, D), M.walnut, W / 2 - 0.011, H / 2, 0, g);
    mesh(box(W, 0.03, D), M.walnut, 0, H - 0.015, 0, g);
    mesh(box(W, 0.08, D - 0.02), M.walnutDark, 0, 0.04, -0.01, g);
    [-0.4, 0.4].forEach(x => mesh(box(0.022, H, D), M.walnut, x, H / 2, 0, g));
    // левая секция
    const dTop = hinged(g, -1.19, -0.41, 0.79, 1.99, Z, M.walnut, -0.45, true);
    door(g, -1.19, -0.41, 0.09, 0.77, Z, M.walnut, -0.45);
    // правая — шкаф во всю высоту
    const dRight = hinged(g, 0.41, 1.19, 0.09, 1.99, Z, M.walnut, 0.45, false);
    // центр: дверцы снизу, витрина с зеркалом и полками сверху
    door(g, -0.39, 0, 0.09, 0.77, Z, M.walnut, -0.03);
    door(g, 0, 0.39, 0.09, 0.77, Z, M.walnut, 0.03);
    // за дверцами: стопка постельного и пальто на плечиках (видно, когда открыто)
    const linen = [0xe8dcc4, 0x9ab0c8, 0xd8a8a8, 0xeee8d8].map((c, i) => mesh(box(0.6, 0.07, 0.32), new THREE.MeshStandardMaterial({ color: c, roughness: 1 }), -0.8, 0.83 + i * 0.075, -0.02, g));
    mesh(box(0.7, 0.012, D - 0.04), M.walnut, -0.8, 0.8, 0, g);
    mesh(cyl(0.008, 0.008, 0.74, 8), M.chrome, 0.8, 1.85, 0, g).rotation.z = Math.PI / 2;
    const coat = mesh(new THREE.BoxGeometry(0.42, 0.9, 0.12), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 }), 0.8, 1.38, 0, g);
    mesh(box(0.78, 1.18, 0.005), M.mirror, 0, 1.39, -Z + 0.025, g).castShadow = false;
    [0.78, 1.17, 1.56].forEach(y => mesh(box(0.78, 0.02, D - 0.04), M.walnut, 0, y, 0, g));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.2), M.glass);
    gl.position.set(0, 1.39, Z - 0.002); g.add(gl);
    const vl = new THREE.PointLight(0xffd9a0, 0.8, 1.4, 2); vl.position.set(0, 1.9, 0.12); g.add(vl);
    g.userData.act = play => play(2400, p => {
      const q = p < 0.3 ? p / 0.3 : p > 0.75 ? (1 - p) / 0.25 : 1;
      swing(dTop, Math.min(1, q * 1.15)); swing(dRight, Math.max(0, q * 1.15 - 0.15));
      vl.intensity = 0.8 + Math.sin(p * Math.PI) * 1.2; // подсветка витрины мигнула ярче
    });
    return g;
  },

  tumba() {
    const g = new THREE.Group();
    const W = 1.1, H = 0.55, D = 0.45;
    mesh(rbox(W, H - 0.05, D, 0.01), M.oak, 0, H / 2 + 0.025, 0, g);
    mesh(box(W - 0.04, 0.05, D - 0.06), M.walnutDark, 0, 0.025, -0.01, g);
    const dl = hinged(g, -W / 2 + 0.02, -0.005, 0.08, H - 0.03, D / 2, M.oak, -0.04, true);
    const dr = hinged(g, 0.005, W / 2 - 0.02, 0.08, H - 0.03, D / 2, M.oak, 0.04, false);
    // внутри: подшивка «Огонька» и коробка с ёлочными игрушками
    mesh(box(0.38, 0.22, 0.28), new THREE.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 1 }), -0.25, 0.2, -0.02, g);
    mesh(box(0.34, 0.18, 0.28), new THREE.MeshStandardMaterial({ color: 0xb83a2a, roughness: 0.9 }), 0.25, 0.18, -0.02, g);
    g.userData.act = play => play(1800, p => { const q = Math.sin(p * Math.PI); swing(dl, q * 0.9); swing(dr, Math.max(0, Math.sin((p - 0.1) / 0.9 * Math.PI)) * 0.9); });
    return g;
  },

  // Диван смотрит в +x, длина вдоль z
  sofa(T, fab = M.sofa) {
    const g = new THREE.Group();
    const L = 1.75, D = 0.85;
    mesh(box(D - 0.04, 0.16, L - 0.04), M.walnutDark, 0, 0.12, 0, g);
    mesh(rbox(D - 0.25, 0.2, L / 2 - 0.02, 0.06), fab, 0.1, 0.3, -L / 4, g);
    mesh(rbox(D - 0.25, 0.2, L / 2 - 0.02, 0.06), fab, 0.1, 0.3, L / 4, g);
    const backP = new THREE.Group(); backP.position.set(-D / 2 + 0.13, 0.36, 0); g.add(backP); // петля «книжки» у сиденья
    const back = mesh(rbox(0.22, 0.55, L - 0.04, 0.07), fab, 0, 0.26, 0, backP);
    backP.rotation.z = -0.08;
    // «Сесть» — книжка раскладывается: спинка ложится назад, потом щёлк — и обратно
    g.userData.act = play => play(2000, p => { const q = p < 0.35 ? p / 0.35 : p > 0.7 ? (1 - p) / 0.3 : 1; backP.rotation.z = -0.08 + q * 1.35; });
    [-1, 1].forEach(s => mesh(rbox(D, 0.5, 0.05, 0.015), M.walnut, 0, 0.3, s * (L / 2 - 0.02), g));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(cyl(0.02, 0.015, 0.05, 8), M.walnutDark, a * (D / 2 - 0.08), 0.025, b * (L / 2 - 0.08), g));
    return g;
  },

  // Кресло смотрит в +x
  kreslo(T, fab = M.chair) {
    const g = new THREE.Group();
    mesh(rbox(0.6, 0.16, 0.6, 0.06), fab, 0.04, 0.4, 0, g);
    const back = mesh(rbox(0.14, 0.62, 0.6, 0.06), fab, -0.27, 0.72, 0, g);
    back.rotation.z = -0.18;
    [-1, 1].forEach(s => {
      mesh(rbox(0.66, 0.05, 0.08, 0.02), M.oak, 0.02, 0.64, s * 0.33, g);
      mesh(box(0.05, 0.3, 0.06), M.oak, 0.28, 0.5, s * 0.33, g);
      mesh(box(0.05, 0.3, 0.06), M.oak, -0.24, 0.5, s * 0.33, g);
    });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      const l = mesh(cyl(0.016, 0.022, 0.34, 8), M.oak, a * 0.25, 0.17, b * 0.25, g);
      l.rotation.z = a * 0.12; l.rotation.x = -b * 0.12;
    });
    g.userData.act = play => play(1100, p => { g.rotation.z = Math.sin(p * Math.PI * 3) * 0.06 * (1 - p); }); // плюхнулся — качнулось
    return g;
  },

  table() {
    const g = new THREE.Group();
    mesh(rbox(0.5, 0.035, 0.9, 0.012), M.walnut, 0, 0.45, 0, g);
    mesh(box(0.42, 0.02, 0.8), M.oak, 0, 0.18, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      const l = mesh(cyl(0.012, 0.02, 0.45, 8), M.oak, a * 0.19, 0.225, b * 0.38, g);
      l.rotation.z = a * 0.08; l.rotation.x = -b * 0.08;
    });
    g.userData.act = play => play(700, p => { g.rotation.x = Math.sin(p * Math.PI * 6) * 0.03 * (1 - p); }); // хромая ножка
    return g;
  },

  torsher() {
    const g = new THREE.Group();
    mesh(cyl(0.14, 0.16, 0.03, 24), M.walnutDark, 0, 0.015, 0, g);
    mesh(cyl(0.012, 0.012, 1.3, 8), M.brass, 0, 0.67, 0, g);
    const sh = mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.3, 28, 1, true), M.shade, 0, 1.38, 0, g);
    sh.castShadow = false;
    const l = new THREE.PointLight(0xffb870, 2.2, 5, 1.6);
    l.position.set(0, 1.3, 0); g.add(l);
    g.userData.light = l;
    return g;
  },


  // часы: фото + кукушка на штоке, прячется за циферблатом (main.js выдвигает её по userData.bird)
  clock(T) {
    const H = 0.3 * 657 / 304, g = photoPlane(T.clock, 0.3, H);
    const bird = new THREE.Group(); bird.position.set(0, H / 2 - H * 0.26, -0.02); g.add(bird);
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.6 });
    const feath = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.7 });
    const stick = mesh(cyl(0.004, 0.004, 0.09, 6), wood, 0, 0, -0.04, bird); stick.rotation.x = Math.PI / 2;
    const body = mesh(new THREE.SphereGeometry(0.028, 14, 10), feath, 0, 0.01, 0.01, bird); body.scale.set(1, 0.85, 1.3);
    mesh(new THREE.SphereGeometry(0.018, 12, 10), feath, 0, 0.035, 0.035, bird);
    const beak = mesh(new THREE.ConeGeometry(0.006, 0.02, 8), M.yellow, 0, 0.033, 0.058, bird); beak.rotation.x = Math.PI / 2;
    [-1, 1].forEach(sd => mesh(new THREE.SphereGeometry(0.0035, 6, 6), M.blackRim, sd * 0.011, 0.04, 0.048, bird));
    const tail = mesh(box(0.02, 0.006, 0.035), feath, 0, 0.012, -0.03, bird); tail.rotation.x = -0.4;
    bird.visible = false; g.userData.bird = bird;
    return g;
  },
  // вымпел на гвоздике: качается маятником
  vympel(T) {
    const g = new THREE.Group(), H = 0.24 * 200 / 123, p = photoPlane(T.vympel, 0.24, H); p.position.y = -H / 2; const piv = new THREE.Group(); piv.position.y = H / 2; piv.add(p); g.add(piv);
    g.userData.act = play => play(2200, q => { piv.rotation.z = Math.sin(q * Math.PI * 6) * 0.35 * (1 - q); });
    return g;
  },
  begonia(T) {
    const g = photoPlane(T.begonia, 0.46, 0.46 * 484 / 600);
    g.children[0].position.y = 0.46 * 484 / 600 / 2;
    // полили: листья качнулись, капли блестят
    const drops = Array.from({ length: 8 }, () => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, roughness: 0, transmission: 0.6, transparent: true, opacity: 0.8 })); d.visible = false; g.add(d); d.userData.x = (Math.random() - 0.5) * 0.25; return d; });
    g.userData.act = play => play(1300, p => {
      g.children[0].scale.set(1 + Math.sin(p * Math.PI * 4) * 0.03 * (1 - p), 1 - Math.sin(p * Math.PI * 4) * 0.03 * (1 - p), 1);
      drops.forEach((d, i) => { const q = (p * 2 + i / 8) % 1; d.visible = p < 0.8; d.position.set(d.userData.x, 0.5 - q * 0.4, 0.03); });
    });
    return g;
  },



  pss() {
    const g = new THREE.Group();
    // ряд томов с дыркой посередине (тома 12–17)
    [[-0.17, 0.4], [0.24, 0.2]].forEach(([x, w]) => {
      const mats = [M.bookTop, M.bookTop, M.bookTop, M.bookTop, M.spines, M.spines];
      const b = mesh(box(w, 0.25, 0.18), mats, x, 0.125, 0, g);
      b.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 0) a[i] = v * w / 0.5; });
    });
    const lean = mesh(box(0.035, 0.25, 0.18), M.spines, 0.07, 0.12, 0, g); lean.rotation.z = -0.35;
    // «Почитать»: том выдвигается из ряда и встаёт обратно
    const pull = mesh(box(0.033, 0.25, 0.18), M.spines, 0.12, 0.125, 0, g);
    g.userData.act = play => play(1500, p => { pull.position.z = Math.sin(p * Math.PI) * 0.12; pull.rotation.x = Math.sin(p * Math.PI) * 0.25; });
    return g;
  },


  // ---------- По фото (этап 5). Старые версии v4 — в USSR_V4 ниже ----------
  kover(T) { return wallRug(T.kover1, 1.55, 1.55 * 800 / 1200); },
  kover3(T) { return wallRug(T.kover3, 1.6, 1.6 * 840 / 1200); },
  rug(T) {
    const g = new THREE.Group(), t = T.kover2.clone(); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.needsUpdate = true;
    const m = mesh(new THREE.PlaneGeometry(2.5, 1.45, 24, 12), M.photoRug(t), 0, 0, 0, g);
    m.rotation.x = -Math.PI / 2; m.castShadow = false;
    // «Пройтись»: по ковру пробегает волна-складка (как будто зацепили ногой) и разглаживается
    const pos = m.geometry.attributes.position, base = pos.array.slice();
    g.userData.act = play => play(1300, p => {
      for (let i = 0; i < pos.count; i++) { const x0 = base[i * 3]; pos.setZ(i, Math.max(0, Math.sin((x0 / 2.5 + 0.5 - p * 1.4 + 0.2) * Math.PI * 3)) * 0.035 * Math.sin(p * Math.PI)); }
      pos.needsUpdate = true;
    });
    return g;
  },
  // бюст: фото на выпуклой дуге (свет ложится объёмно) лицом к камере + гранитный постамент с табличкой; «посмотреть в глаза» — кивает
  bust(T) {
    const g = new THREE.Group(), W = 0.22, H = W * 471 / 277, th = 1.9, r = W / th;
    const base = new THREE.MeshPhysicalMaterial({ color: 0x5a1814, roughness: 0.3, clearcoat: 1 });
    mesh(rbox(0.17, 0.05, 0.13, 0.008), base, 0, 0.025, 0, g);
    const plate = mesh(new THREE.PlaneGeometry(0.08, 0.025), M.brass, 0, 0.026, 0.066, g); plate.castShadow = false;
    const head = new THREE.Group(); head.position.y = 0.05; head.rotation.y = Math.PI / 4; g.add(head); // к камере (изометрия 45°)
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 24, 1, true, -th / 2, th), new THREE.MeshStandardMaterial({ map: T.bust, transparent: true, alphaTest: 0.4, roughness: 0.75, side: THREE.DoubleSide }));
    arc.position.set(0, H / 2, -r * 0.55); arc.castShadow = true; head.add(arc);
    g.userData.act = play => play(1200, p => { head.rotation.x = Math.sin(p * Math.PI * 2) * 0.08 * (1 - p); });
    return g;
  },
  fish(T) { const H = 0.42 * 541 / 644, g = photoPlane(T.fishSet, 0.42, H); g.children[0].position.y = H / 2; return g; },
  // эмалированная кружка: зелёная снаружи, белая внутри, чёрный ободок
  mug() {
    const g = new THREE.Group(), R = 0.042, H = 0.085;
    mesh(new THREE.CylinderGeometry(R, R, H, 28, 1, true), M.enamel, 0, H / 2, 0, g);
    mesh(new THREE.CylinderGeometry(R * 0.97, R * 0.97, H, 28, 1, true), M.enamelIn, 0, H / 2, 0, g);
    mesh(new THREE.CircleGeometry(R, 28), M.enamel, 0, 0.002, 0, g).rotation.x = -Math.PI / 2;
    const bottom = mesh(new THREE.CircleGeometry(R * 0.97, 28), M.enamelIn.clone(), 0, 0.006, 0, g);
    bottom.rotation.x = -Math.PI / 2; bottom.material.side = THREE.FrontSide;
    mesh(new THREE.TorusGeometry(R, 0.0035, 8, 32), M.blackRim, 0, H, 0, g).rotation.x = Math.PI / 2;
    const h = mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 16, Math.PI), M.enamel, R + 0.002, H * 0.52, 0, g);
    h.rotation.z = -Math.PI / 2; h.scale.set(1.15, 0.85, 1);
    const steam = dustCloud(g, 6, new THREE.Vector3(0, H + 0.03, 0), new THREE.Vector3(0.03, 0.22, 0.03));
    steam.forEach(s => s.material.color.set(0xffffff));
    g.userData.act = play => play(1800, p => puffAt(steam, p)); // парок от чая
    return g;
  },
  // слоники ×7 по убыванию — фарфоровые, хоботы вверх на счастье
  slon() {
    const g = new THREE.Group();
    let x = 0;
    for (let i = 0; i < 7; i++) {
      const s = 1 - i * 0.09, e = new THREE.Group();
      const body = mesh(new THREE.SphereGeometry(0.03, 14, 10), M.porcelain, 0, 0.045, 0, e); body.scale.set(1.35, 0.95, 0.9);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(cyl(0.009, 0.01, 0.03, 8), M.porcelain, a * 0.024, 0.015, b * 0.015, e));
      mesh(new THREE.SphereGeometry(0.02, 12, 10), M.porcelain, 0.043, 0.06, 0, e);
      [-1, 1].forEach(b => { const ear = mesh(new THREE.CircleGeometry(0.017, 12), M.porcelain, 0.036, 0.062, b * 0.016, e); ear.rotation.y = b * 1.2; ear.material = M.porcelainDS; });
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.058, 0.055, 0), new THREE.Vector3(0.085, 0.03, 0), new THREE.Vector3(0.09, 0.075, 0));
      mesh(new THREE.TubeGeometry(curve, 8, 0.0055, 6), M.porcelain, 0, 0, 0, e);
      const tail = mesh(cyl(0.002, 0.002, 0.025, 4), M.porcelain, -0.042, 0.05, 0, e); tail.rotation.z = 0.6;
      e.scale.setScalar(s); e.position.x = x; x += 0.105 * s; g.add(e);
    }
    g.children.forEach(e => { e.position.x -= x / 2 - 0.05; });
    // слоники подпрыгивают по очереди — волна от большого к маленькому
    g.userData.act = play => play(1400, p => g.children.forEach((e, i) => { const q = Math.max(0, Math.min(1, p * 2.2 - i * 0.18)); e.position.y = Math.sin(q * Math.PI) * 0.05; }));
    return g;
  },
  // малахитовая шкатулка: фото закрытой / открытой, клик открывает
  box(T) {
    const g = new THREE.Group();
    const c = photoPlane(T.boxClosed, 0.14, 0.14 * 291 / 316); c.children[0].position.y = 0.07 * 291 / 316;
    const o = photoPlane(T.boxOpen, 0.24, 0.24 * 149 / 290); o.children[0].position.y = 0.12 * 149 / 290; o.visible = false;
    g.add(c, o); g.userData.closed = c; g.userData.open = o;
    return g;
  },

};

// Как было в v4 — переключаются в круговом меню «Вид: как в v4»
export const USSR_V4 = {
  kover() {
    const g = new THREE.Group();
    const m = mesh(new THREE.PlaneGeometry(1.55, 1.1), M.rugWall, 0, 0, 0, g);
    m.castShadow = false;
    return g;
  },

  rug() {
    const g = new THREE.Group();
    const m = mesh(new THREE.PlaneGeometry(2.3, 1.6), M.rugFloor, 0, 0, 0, g);
    m.rotation.x = -Math.PI / 2; m.castShadow = false;
    return g;
  },

  bust() {
    const g = new THREE.Group();
    mesh(rbox(0.19, 0.13, 0.15, 0.01), M.redStone, 0, 0.065, 0, g);
    const tor = [[0, 0.13], [0.1, 0.13], [0.11, 0.17], [0.09, 0.22], [0.05, 0.25], [0.03, 0.27], [0, 0.27]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const t = mesh(new THREE.LatheGeometry(tor, 24), M.plaster, 0, 0, 0, g); t.scale.z = 0.6;
    const head = mesh(new THREE.SphereGeometry(0.06, 24, 18), M.plaster, 0, 0.33, 0.005, g); head.scale.set(0.95, 1.12, 1);
    const beard = mesh(new THREE.ConeGeometry(0.035, 0.07, 14), M.plaster, 0, 0.28, 0.035, g); beard.rotation.x = Math.PI;
    return g;
  },

  fish() {
    const g = new THREE.Group();
    const prof = [[0.006, 0], [0.026, 0.006], [0.02, 0.014], [0.007, 0.03], [0.028, 0.07], [0.04, 0.11], [0.036, 0.15], [0.016, 0.185], [0.001, 0.195]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 24);
    [[-0.09, 0.62, 0.3], [0, 1, -0.2], [0.085, 0.78, 0.5]].forEach(([x, s, ry]) => {
      const f = mesh(geo, M.cobalt, x, 0, 0, g);
      f.scale.set(0.55 * s, s, s); f.rotation.y = ry;
      mesh(new THREE.SphereGeometry(0.008 * s, 10, 8), M.porcelain, x + 0.01 * s, 0.155 * s, 0.03 * s, g);
    });
    g.scale.setScalar(1.5);
    return g;
  },

  mug() {
    const g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.09, 24, 1, true), M.mugGreen, 0, 0.045, 0, g);
    mesh(new THREE.CircleGeometry(0.037, 24), M.mugGreen, 0, 0.002, 0, g).rotation.x = -Math.PI / 2;
    const h = mesh(new THREE.TorusGeometry(0.026, 0.006, 8, 16, Math.PI), M.mugGreen, 0.04, 0.045, 0, g);
    h.rotation.z = -Math.PI / 2;
    return g;
  },
  sofa: T => USSR.sofa(T, M.sofaV4),
  kreslo: T => USSR.kreslo(T, M.chairV4),
};
