// Каталог, 3D-модели предметов и их места в комнате.
// Комната: пол x 0..5, z 0..4.2 (метры). Задняя стена z=0 (смотрит в +z), левая x=0 (смотрит в +x).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const CATS = [
  { id: "all", name: "Всё" },
  { id: "tech", name: "Техника" },
  { id: "furn", name: "Мебель" },
  { id: "decor", name: "Декор" },
  { id: "ussr", name: "Идеология" },
];

export const CATALOG = [
  { id: "tv", cat: "tech", price: 300, must: true, name: "Телевизор «Сапфир 401-1»",
    desc: "Переносной, чёрно-белый, жёлтый. Ловит два канала и одну музыку Марата.", act: "Смотреть клип" },
  { id: "radiola", cat: "tech", price: 150, name: "Радиола «Ригонда»",
    desc: "Ламповая. Греется дольше чайника, звучит теплее, чем он.", act: "Включить музыку" },
  { id: "stenka", cat: "furn", price: 350, name: "Стенка «Хельга»",
    desc: "Полированная, с зеркальной витриной. Дышать на неё нельзя, жить без неё тоже.", act: "Полюбоваться" },
  { id: "tumba", cat: "furn", price: 60, name: "Тумба под телевизор",
    desc: "Держит телевизор и семейные тайны.", act: "Протереть пыль" },
  { id: "sofa", cat: "furn", price: 280, name: "Диван-книжка",
    desc: "Раскладывается с третьей попытки и звуком «кря».", act: "Попрыгать" },
  { id: "kreslo", cat: "furn", price: 200, name: "Кресло",
    desc: "В нём дедушка читал «Правду». Теперь твоя очередь.", act: "Посидеть" },
  { id: "table", cat: "furn", price: 80, name: "Столик журнальный",
    desc: "Журналы в комплект не входят.", act: "Постучать" },
  { id: "torsher", cat: "furn", price: 90, name: "Торшер",
    desc: "Тёплые 40 ватт. Уютно, если не смотреть на счётчик.", act: "Щёлкнуть" },
  { id: "kover", cat: "decor", price: 180, name: "Ковёр на стену",
    desc: "Шерсть, ромбы, медальон. Глушит соседей и дурные мысли.", act: "Выбить" },
  { id: "rug", cat: "decor", price: 150, name: "Ковёр на пол",
    desc: "Выбивать раз в год на снегу.", act: "Поправить угол" },
  { id: "clock", cat: "decor", price: 70, name: "Часы с кукушкой",
    desc: "Кукушка вылетает каждый час. Иногда без причины.", act: "Позвать кукушку" },
  { id: "begonia", cat: "decor", price: 25, name: "Бегония королевская",
    desc: "Поливать по вторникам. Стоит на подоконнике в лучах солнца.", act: "Полить" },
  { id: "fish", cat: "decor", price: 70, name: "Рыбки фарфоровые",
    desc: "Кобальт и глазурь, набор из трёх. Стоят на хвостах уже сорок лет.", act: "Постучать по рыбке" },
  { id: "mug", cat: "decor", price: 10, name: "Кружка алюминиевая",
    desc: "Зелёная, слегка помятая. Чай в ней обжигает только губы.", act: "Отхлебнуть" },
  { id: "vympel", cat: "decor", price: 40, name: "Вымпел «Ударнику соцтруда»",
    desc: "Ударнику социалистического труда. Кому именно, история умалчивает.", act: "Погладить бахрому" },
  { id: "bust", cat: "ussr", price: 120, name: "Бюст Ленина",
    desc: "Гипс. Смотрит строго, но справедливо.", act: "Посмотреть в глаза" },
  { id: "pss", cat: "ussr", price: 150, name: "Ленин. ПСС в 55 томах",
    desc: "Красный переплёт. Тома 12–17 потерялись при переезде.", act: "Открыть наугад" },
  { id: "flags", cat: "ussr", price: 30, name: "Флажки красные",
    desc: "К Первомаю. Можно и к любому другому дню.", act: "Помахать" },
];

// ---------- Материалы ----------
let M = null;
export function initMaterials(T) {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  M = {
    walnut: new THREE.MeshPhysicalMaterial({ map: T.walnut, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 }),
    walnutDark: new THREE.MeshPhysicalMaterial({ map: T.walnut, color: 0x9a8070, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    oak: std({ map: T.oak, roughness: 0.55 }),
    brass: std({ color: 0xd9b25a, metalness: 0.9, roughness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0, clearcoat: 1, depthWrite: false }),
    mirror: std({ color: 0xb7c3c6, metalness: 1, roughness: 0.08 }),
    yellow: std({ color: 0xe9c443, roughness: 0.42 }),
    tvPhoto: std({ map: T.tv, transparent: true, alphaTest: 0.5, roughness: 0.45 }),
    chrome: std({ color: 0xdddddd, metalness: 1, roughness: 0.2 }),
    sofa: std({ map: T.sofa, roughness: 0.95 }),
    chair: std({ map: T.chair, roughness: 0.95 }),
    plaster: std({ color: 0xe8e2d4, roughness: 0.92 }),
    redStone: std({ color: 0x8a1f1a, roughness: 0.5 }),
    cobalt: new THREE.MeshPhysicalMaterial({ color: 0x1d44b0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 }),
    mugGreen: std({ color: 0x4f8a52, metalness: 0.55, roughness: 0.42, side: THREE.DoubleSide }),
    red: std({ color: 0xd0261c, roughness: 0.7, side: THREE.DoubleSide }),
    pole: std({ color: 0x6b4423, roughness: 0.6 }),
    rugWall: std({ map: T.rugWall, roughness: 1 }),
    rugFloor: std({ map: T.rugFloor, roughness: 1 }),
    shade: std({ map: T.shade, roughness: 0.9, emissive: 0xffb866, emissiveIntensity: 0.55, side: THREE.DoubleSide }),
    grille: std({ map: T.grille, roughness: 1 }),
    dial: new THREE.MeshBasicMaterial({ map: T.dial, color: 0xfff0d0 }),
    spines: std({ map: T.spines, roughness: 0.7 }),
    bookTop: std({ color: 0xe9dfc6, roughness: 0.9 }),
    photo: (t) => std({ map: t, transparent: true, alphaTest: 0.4, roughness: 0.8, side: THREE.DoubleSide }),
    plumbob: new THREE.MeshPhysicalMaterial({ color: 0x3cff5a, emissive: 0x19c53a, emissiveIntensity: 0.8, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.9 }),
  };
  return M;
}

// ---------- Хелперы ----------
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const rbox = (w, h, d, r = 0.01) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);

// Дверца с филёнкой и ручкой; лицевая сторона в +z
function door(g, x0, x1, y0, y1, z, mat, handleX) {
  const w = x1 - x0, h = y1 - y0;
  mesh(rbox(w - 0.008, h - 0.008, 0.022, 0.006), mat, (x0 + x1) / 2, (y0 + y1) / 2, z, g);
  mesh(rbox(w - 0.09, h - 0.09, 0.008, 0.003), M.walnutDark, (x0 + x1) / 2, (y0 + y1) / 2, z + 0.014, g);
  if (handleX != null) mesh(box(0.014, 0.09, 0.02), M.brass, handleX, (y0 + y1) / 2, z + 0.022, g);
}

// ---------- Модели (начало координат — центр основания) ----------
const BUILD = {
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
    mesh(box(W - 0.02, 0.012, D - 0.02), M.oak, 0, L + H + 0.006, 0, g);
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
    door(g, -1.19, -0.41, 0.79, 1.99, Z, M.walnut, -0.45);
    door(g, -1.19, -0.41, 0.09, 0.77, Z, M.walnut, -0.45);
    // правая — шкаф во всю высоту
    door(g, 0.41, 1.19, 0.09, 1.99, Z, M.walnut, 0.45);
    // центр: дверцы снизу, витрина с зеркалом и полками сверху
    door(g, -0.39, 0, 0.09, 0.77, Z, M.walnut, -0.03);
    door(g, 0, 0.39, 0.09, 0.77, Z, M.walnut, 0.03);
    mesh(box(0.78, 1.18, 0.005), M.mirror, 0, 1.39, -Z + 0.025, g).castShadow = false;
    [0.78, 1.17, 1.56].forEach(y => mesh(box(0.78, 0.02, D - 0.04), M.walnut, 0, y, 0, g));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.2), M.glass);
    gl.position.set(0, 1.39, Z - 0.002); g.add(gl);
    const vl = new THREE.PointLight(0xffd9a0, 0.8, 1.4, 2); vl.position.set(0, 1.9, 0.12); g.add(vl);
    return g;
  },

  tumba() {
    const g = new THREE.Group();
    const W = 1.1, H = 0.55, D = 0.45;
    mesh(rbox(W, H - 0.05, D, 0.01), M.oak, 0, H / 2 + 0.025, 0, g);
    mesh(box(W - 0.04, 0.05, D - 0.06), M.walnutDark, 0, 0.025, -0.01, g);
    door(g, -W / 2 + 0.02, -0.005, 0.08, H - 0.03, D / 2, M.oak, -0.04);
    door(g, 0.005, W / 2 - 0.02, 0.08, H - 0.03, D / 2, M.oak, 0.04);
    return g;
  },

  // Диван смотрит в +x, длина вдоль z
  sofa() {
    const g = new THREE.Group();
    const L = 1.75, D = 0.85;
    mesh(box(D - 0.04, 0.16, L - 0.04), M.walnutDark, 0, 0.12, 0, g);
    mesh(rbox(D - 0.25, 0.2, L / 2 - 0.02, 0.06), M.sofa, 0.1, 0.3, -L / 4, g);
    mesh(rbox(D - 0.25, 0.2, L / 2 - 0.02, 0.06), M.sofa, 0.1, 0.3, L / 4, g);
    const back = mesh(rbox(0.22, 0.55, L - 0.04, 0.07), M.sofa, -D / 2 + 0.13, 0.62, 0, g);
    back.rotation.z = -0.08;
    [-1, 1].forEach(s => mesh(rbox(D, 0.5, 0.05, 0.015), M.walnut, 0, 0.3, s * (L / 2 - 0.02), g));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(cyl(0.02, 0.015, 0.05, 8), M.walnutDark, a * (D / 2 - 0.08), 0.025, b * (L / 2 - 0.08), g));
    return g;
  },

  // Кресло смотрит в +x
  kreslo() {
    const g = new THREE.Group();
    mesh(rbox(0.6, 0.16, 0.6, 0.06), M.chair, 0.04, 0.4, 0, g);
    const back = mesh(rbox(0.14, 0.62, 0.6, 0.06), M.chair, -0.27, 0.72, 0, g);
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
    return g;
  },

  torsher() {
    const g = new THREE.Group();
    mesh(cyl(0.16, 0.18, 0.03, 24), M.walnutDark, 0, 0.015, 0, g);
    mesh(cyl(0.012, 0.012, 1.3, 8), M.brass, 0, 0.67, 0, g);
    const sh = mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.3, 28, 1, true), M.shade, 0, 1.38, 0, g);
    sh.castShadow = false;
    const l = new THREE.PointLight(0xffb870, 2.2, 5, 1.6);
    l.position.set(0, 1.3, 0); g.add(l);
    g.userData.light = l;
    return g;
  },

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

  clock(T) { return photoPlane(T.clock, 0.3, 0.3 * 657 / 304); },
  vympel(T) { return photoPlane(T.vympel, 0.24, 0.24 * 200 / 123); },
  begonia(T) {
    const g = photoPlane(T.begonia, 0.46, 0.46 * 484 / 600);
    g.children[0].position.y = 0.46 * 484 / 600 / 2;
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

  pss() {
    const g = new THREE.Group();
    // ряд томов с дыркой посередине (тома 12–17)
    [[-0.17, 0.4], [0.24, 0.2]].forEach(([x, w]) => {
      const mats = [M.bookTop, M.bookTop, M.bookTop, M.bookTop, M.spines, M.spines];
      const b = mesh(box(w, 0.25, 0.18), mats, x, 0.125, 0, g);
      b.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 0) a[i] = v * w / 0.5; });
    });
    const lean = mesh(box(0.035, 0.25, 0.18), M.spines, 0.07, 0.12, 0, g); lean.rotation.z = -0.35;
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

  flags() {
    const g = new THREE.Group();
    [-1, 1].forEach(s => {
      const p = mesh(cyl(0.007, 0.007, 0.62, 8), M.pole, s * 0.1, 0, 0.03, g);
      p.rotation.z = s * 0.55;
      const f = mesh(new THREE.PlaneGeometry(0.3, 0.19, 12, 4), M.red, s * 0.3, 0.2, 0.035, g);
      f.userData.wave = s;
      g.userData.flags = (g.userData.flags || []).concat(f);
    });
    return g;
  },
};

function photoPlane(t, w, h) {
  const g = new THREE.Group();
  const m = mesh(new THREE.PlaneGeometry(w, h), M.photo(t), 0, 0, 0, g);
  m.castShadow = true; m.receiveShadow = false;
  return g;
}

export function buildItem(id, T) {
  const g = BUILD[id](T);
  g.userData.id = id;
  return g;
}

// Места предметов. Зависимые предметы переезжают, если опоры нет.
export function layout(id, owned) {
  const S = owned.stenka != null, TB = owned.tumba != null, TL = owned.table != null;
  const L = { // [x, y, z, rotY]
    stenka: [1.35, 0, 0.23, 0],
    tumba: [3.5, 0, 0.24, 0],
    tv: TB ? [3.42, 0.55, 0.24, 0] : [3.42, 0, 0.3, 0],
    radiola: [4.55, 0, 0.22, 0],
    sofa: [0.45, 0, 1.33, 0],
    table: [1.42, 0, 1.33, 0],
    kreslo: [3.75, 0, 2.35, Math.PI / 2 + 0.35],
    torsher: [2.76, 0, 0.32, 0],
    kover: [0.006, 1.38, 1.33, Math.PI / 2],
    rug: [1.95, 0.004, 1.45, 0],
    clock: [4.55, 1.62, 0.012, 0],
    vympel: [3.42, 1.65, 0.012, 0],
    begonia: [0.12, 0.885, 2.98, Math.PI / 4],
    flags: [0.01, 2.22, 1.33, Math.PI / 2],
    bust: S ? [1.35, 2.05, 0.2, 0] : [0.55, 0, 0.7, 0.3],
    pss: S ? [1.33, 1.18, 0.05, 0] : [1.0, 0, 0.62, 0.2],
    fish: S ? [1.35, 1.57, 0.06, 0] : [1.85, 0, 0.6, 0],
    mug: TL ? [1.38, 0.47, 1.1, 0.6] : TB ? [3.95, 0.55, 0.3, 0.6] : [3.0, 0, 0.9, 0.6],
  };
  return L[id];
}
