// Набор «Неформал 2003»: шкаф, шведская стенка, пуфик, компьютерный стол, Pentium 433, музыкальный центр,
// стойка для CD, египетский ковёр, коврик «Боб Марли», постер The Prodigy, журнал COOL, скейт.
// Начало координат — центр основания, лицевая сторона в +z.
import * as THREE from "three";
import { M, mesh, rbox, box, cyl, photoPlane, rugWave } from "./kit.js";

const std = o => new THREE.MeshStandardMaterial(o);
const gloss = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.8 });
let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    yellow: gloss(0xf2c230), blue: gloss(0x2a59c8), white: std({ color: 0xf2f2ee, roughness: 0.4 }),
    beech: std({ color: 0xd9b48a, roughness: 0.55 }), beige: std({ color: 0xe3dcc8, roughness: 0.5 }),
    beigeDark: std({ color: 0xbfb7a0, roughness: 0.6 }), dark: std({ color: 0x1c1c1e, roughness: 0.5 }),
    silver: std({ color: 0xc8ccd2, metalness: 0.7, roughness: 0.3 }), rope: std({ color: 0xd8c49a, roughness: 1 }),
    red: gloss(0xd8302a), green: gloss(0x2ea84a),
  };
  return MAT;
}

// ---------- Холсты: иероглиф на пуфике, заставка на мониторе ----------
function canvasTex(w, h, draw) {
  const c = Object.assign(document.createElement("canvas"), { width: w, height: h }), x = c.getContext("2d");
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let hieroTex = null;
function hieroglyph() {
  return hieroTex || (hieroTex = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = "#7a3cc8"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},.06)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    [0.25, 0.75].forEach(u => { // иероглиф 酷 («круто») в кругу — с двух сторон мешка
      x.fillStyle = "#ffd23d"; x.beginPath(); x.arc(u * w, h * 0.5, 62, 0, 6.28); x.fill();
      x.fillStyle = "#1a1020"; x.font = "bold 92px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("酷", u * w, h * 0.53);
    });
  }));
}
// заставка Windows 98 «Звёздное поле» + иногда рабочий стол
export const pcScreen = (() => {
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 96 }), x = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
  let mode = "stars", last = 0;
  return {
    tex,
    toggle() { mode = mode === "stars" ? "desktop" : "stars"; return mode; },
    tick(now) {
      if (now - last < 50) return; last = now;
      if (mode === "desktop") {
        x.fillStyle = "#008080"; x.fillRect(0, 0, 128, 96);
        x.fillStyle = "#c0c0c0"; x.fillRect(0, 86, 128, 10); x.fillStyle = "#000080"; x.fillRect(2, 87, 22, 8);
        x.fillStyle = "#fff"; x.font = "bold 7px sans-serif"; x.fillText("Пуск", 4, 94);
        [[8, 8], [8, 30], [8, 52]].forEach(([px, py]) => { x.fillStyle = "#ffe066"; x.fillRect(px, py, 12, 10); });
        x.fillStyle = "#c0c0c0"; x.fillRect(40, 20, 70, 44); x.fillStyle = "#000080"; x.fillRect(40, 20, 70, 8);
        x.fillStyle = "#000"; x.font = "7px sans-serif"; x.fillText("Winamp 2.91", 44, 40); x.fillText("Prodigy.mp3", 44, 52);
      } else {
        x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 0, 128, 96);
        x.fillStyle = "#fff";
        for (const s of stars) {
          s.z -= 0.02; if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
          const px = 64 + s.x / s.z * 40, py = 48 + s.y / s.z * 30, r = (1 - s.z) * 2;
          x.fillRect(px, py, r, r);
        }
      }
      tex.needsUpdate = true;
    },
  };
})();

export const NEFORMAL = {
  // жёлто-синий шкаф-купе на четыре двери
  shkaf() {
    const m = mats(), g = new THREE.Group(), W = 2.0, H = 2.15, D = 0.58;
    mesh(box(W, H, D - 0.04), m.white, 0, H / 2, -0.02, g);
    const doors = [m.yellow, m.blue, m.yellow, m.blue].map((mt, i) => {
      const x0 = -W / 2 + 0.02 + i * (W - 0.04) / 4, w = (W - 0.04) / 4, d = new THREE.Group(); d.position.set(x0 + w / 2, 0, i % 2 ? D / 2 - 0.02 : D / 2 - 0.045); g.add(d);
      mesh(rbox(w - 0.01, H - 0.12, 0.02, 0.004), mt, 0, H / 2, 0, d);
      mesh(box(0.015, 0.5, 0.02), M.chrome, (i % 2 ? 0.05 : w - 0.05) - w / 2, H / 2, 0.012, d);
      d.userData.x = d.position.x; d.userData.w = w; return d;
    });
    // внутри купе: штанга с вещами неформала — косуха, худи, футболка с черепом
    mesh(cyl(0.01, 0.01, W - 0.1, 8), M.chrome, 0, H - 0.3, 0, g).rotation.z = Math.PI / 2;
    [[0x151515, 0.5], [0x5a2a8a, 0.6], [0x2a2a2a, 0.55], [0xd8302a, 0.5], [0x1d3a6a, 0.6]].forEach(([c, h], i) => mesh(box(0.06, h + 0.3, 0.38), std({ color: c, roughness: 1 }), -0.7 + i * 0.12, H - 0.3 - (h + 0.3) / 2, 0, g));
    mesh(box(W + 0.02, 0.05, D), m.white, 0, H - 0.025, 0, g);
    mesh(box(W, 0.06, D - 0.04), m.white, 0, 0.03, -0.02, g);
    // «Открыть»: синяя дверь-купе уезжает за жёлтую, видно вешалку
    g.userData.act = play => play(2200, p => { const q = p < 0.3 ? p / 0.3 : p > 0.75 ? (1 - p) / 0.25 : 1; doors[1].position.x = doors[1].userData.x - q * doors[1].userData.w * 0.95; });
    return g;
  },
  // шведская стенка: белые стойки, разноцветные перекладины, турник с кольцами и верёвочная лестница
  shved() {
    const m = mats(), g = new THREE.Group(), H = 2.3, W = 0.8;
    const rung = [m.red, M.yellow, m.green, m.blue];
    [-1, 1].forEach(s => mesh(box(0.06, H, 0.08), m.white, s * W / 2, H / 2, 0, g));
    for (let i = 0; i < 9; i++) { const r = mesh(cyl(0.016, 0.016, W, 10), rung[i % 4], 0, 0.2 + i * 0.24, 0, g); r.rotation.z = Math.PI / 2; }
    [-1, 1].forEach(s => mesh(box(0.05, 0.05, 0.75), m.white, s * W / 2, H - 0.05, 0.4, g)); // кронштейны турника
    const bar = mesh(cyl(0.016, 0.016, W + 0.06, 10), M.chrome, 0, H - 0.05, 0.75, g); bar.rotation.z = Math.PI / 2;
    const rings = [[-0.18, m.red], [0.18, m.green]].map(([x0, mt]) => { // кольца на верёвках — качаются от турника
      const r = new THREE.Group(); r.position.set(x0, H - 0.05, 0.75); g.add(r);
      mesh(cyl(0.006, 0.006, 0.55, 6), m.rope, 0, -0.28, 0, r);
      const ring = mesh(new THREE.TorusGeometry(0.08, 0.014, 10, 24), mt, 0, -0.63, 0, r); ring.rotation.y = Math.PI / 2;
      return r;
    });
    g.userData.act = play => play(2600, p => rings.forEach((r, i) => { r.rotation.x = Math.sin(p * Math.PI * 5 + i * 0.6) * 0.5 * (1 - p); }));
    [-0.12, 0.12].forEach(x0 => { const r = mesh(cyl(0.007, 0.007, 1.5, 6), m.rope, x0, H - 0.8, 0.5, g); r.rotation.x = 0.25; }); // лестница
    for (let i = 0; i < 6; i++) { const st = mesh(cyl(0.012, 0.012, 0.26, 8), m.beech, 0, H - 0.25 - i * 0.24, 0.5 - i * 0.06 - 0.06, g); st.rotation.z = Math.PI / 2; }
    return g;
  },
  // пуфик-мешок с иероглифом
  pufik() {
    const g = new THREE.Group();
    const prof = [[0, 0], [0.3, 0.01], [0.42, 0.08], [0.44, 0.2], [0.38, 0.33], [0.24, 0.42], [0.08, 0.46], [0, 0.46]].map(([r, y]) => new THREE.Vector2(r, y));
    const bag = mesh(new THREE.LatheGeometry(prof, 32), std({ map: hieroglyph(), roughness: 0.9 }), 0, 0, 0, g);
    bag.scale.set(1, 1, 0.92); bag.rotation.y = -Math.PI / 2;
    // плюхнулся: мешок сплющивается и медленно расправляется
    g.userData.act = play => play(1400, p => { const q = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85, k = 1 - q * 0.3; bag.scale.set(1 + q * 0.12, k, 0.92 + q * 0.11); });
    return g;
  },
  // компьютерный стол: столешница, тумба с ящиками, выдвижная полка под клавиатуру, надстройка.
  // «Постучать» — полка под клавиатуру выезжает, следом верхний ящик тумбы
  desk() {
    const m = mats(), g = new THREE.Group(), W = 1.2, H = 0.75, D = 0.6;
    mesh(rbox(W, 0.03, D, 0.006), m.beech, 0, H - 0.015, 0, g);
    mesh(box(0.025, H - 0.03, D - 0.02), m.beech, -W / 2 + 0.013, (H - 0.03) / 2, 0, g);
    mesh(box(0.4, H - 0.03, D - 0.02), m.beech, W / 2 - 0.2, (H - 0.03) / 2, -0.01, g);
    const drawers = [0.15, 0.4].map(y => {
      const d = new THREE.Group(); d.position.set(W / 2 - 0.2, y, D / 2 - 0.005); g.add(d);
      mesh(box(0.38, 0.2, 0.012), m.beigeDark, 0, 0, 0.006, d);
      mesh(box(0.34, 0.16, D - 0.08), m.beech, 0, -0.01, -D / 2 + 0.04, d);
      mesh(box(0.12, 0.018, 0.02), M.chrome, 0, 0.05, 0.02, d);
      return d;
    });
    const shelf = new THREE.Group(); shelf.position.set(-0.2, H - 0.12, 0.05); g.add(shelf);
    mesh(box(W - 0.45, 0.02, 0.4), m.beech, 0, 0, 0, shelf);
    mesh(box(W - 0.45, 0.04, 0.015), m.beigeDark, 0, -0.01, 0.2, shelf);
    mesh(box(0.4, 0.02, 0.13), mats().beige, 0, 0.02, 0.02, shelf); // старая клавиатура на полке
    mesh(box(W, 0.02, 0.25), m.beech, 0, H + 0.38, -D / 2 + 0.125, g); // надстройка
    [-1, 1].forEach(s => mesh(box(0.02, 0.38, 0.25), m.beech, s * (W / 2 - 0.01), H + 0.19, -D / 2 + 0.125, g));
    g.userData.act = play => play(1700, p => {
      shelf.position.z = 0.05 + Math.sin(Math.min(1, p * 1.2) * Math.PI) * 0.28;
      drawers[1].position.z = D / 2 - 0.005 + Math.max(0, Math.sin((p - 0.2) / 0.8 * Math.PI)) * 0.3;
    });
    return g;
  },
  // Pentium 433: ЭЛТ-монитор с заставкой, системник, клавиатура, мышь
  pc() {
    const m = mats(), g = new THREE.Group();
    mesh(rbox(0.4, 0.36, 0.4, 0.03), m.beige, -0.1, 0.2, -0.05, g);
    mesh(rbox(0.3, 0.26, 0.25, 0.04), m.beigeDark, -0.1, 0.18, -0.3, g); // кинескоп сзади
    mesh(box(0.42, 0.03, 0.3), m.beige, -0.1, 0.015, -0.05, g);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.24), new THREE.MeshBasicMaterial({ map: pcScreen.tex, toneMapped: false }));
    scr.position.set(-0.1, 0.21, 0.152); g.add(scr);
    mesh(box(0.2, 0.42, 0.42), m.beige, 0.28, 0.21, -0.05, g); // системник
    mesh(box(0.13, 0.02, 0.005), m.beigeDark, 0.28, 0.36, 0.163, g); // дисковод
    mesh(box(0.02, 0.02, 0.005), m.green, 0.33, 0.3, 0.163, g);
    mesh(box(0.42, 0.025, 0.15), m.beige, -0.08, 0.012, 0.25, g); // клавиатура
    const mouse = mesh(rbox(0.05, 0.025, 0.08, 0.012), m.beige, 0.31, 0.016, 0.17, g); // мышь — ровно на коврик (layout pad)
    g.userData.mouse = mouse;
    g.userData.screen = scr;
    return g;
  },
  // музыкальный центр: фото спереди на серебристом корпусе
  music(T) {
    const m = mats(), g = new THREE.Group(), W = 0.9, H = W * 382 / 768;
    mesh(box(W * 0.94, H * 0.9, 0.3), m.silver, 0, H * 0.48, -0.16, g);
    const p = photoPlane(T.nefMusic, W, H); p.children[0].position.y = H / 2; g.add(p);
    // «Включить» — из середины выезжает лоток для CD с диском
    const tray = new THREE.Group(); tray.position.set(0, H * 0.62, -0.02); g.add(tray);
    mesh(box(0.16, 0.012, 0.15), std({ color: 0x2a2a2e, roughness: 0.4 }), 0, 0, -0.06, tray);
    mesh(cyl(0.06, 0.06, 0.003, 28), std({ color: 0xd8dce4, metalness: 0.9, roughness: 0.15 }), 0, 0.008, -0.06, tray);
    g.userData.act = play => play(2000, p => { tray.position.z = -0.02 + Math.sin(p * Math.PI) * 0.15; });
    return g;
  },
  // стойка для CD: башня из коробочек с разноцветными корешками
  cdtower() {
    const m = mats(), g = new THREE.Group();
    mesh(box(0.28, 0.02, 0.28), m.silver, 0, 0.01, 0, g);
    mesh(cyl(0.012, 0.012, 1.45, 8), m.silver, 0, 0.73, -0.08, g);
    const cols = [0xd8302a, 0x2a59c8, 0xf2c230, 0x2ea84a, 0x111111, 0xeeeeee, 0x8a3cc8, 0xff7a2a];
    const cds = [];
    for (let i = 0; i < 46; i++) {
      const mt = std({ color: cols[(i * 5 + (i >> 2)) % cols.length], roughness: 0.3 });
      cds.push(mesh(box(0.142, 0.026, 0.125), mt, (i % 3 - 1) * 0.004, 0.05 + i * 0.03, 0, g));
    }
    // «Выбрать диск»: случайный CD выезжает, а потом задвигается обратно
    g.userData.act = play => { const cd = cds[(Math.random() * cds.length) | 0]; play(1500, p => { cd.position.z = Math.sin(p * Math.PI) * 0.1; }); };
    return g;
  },
  rug_egypt(T) {
    const g = new THREE.Group();
    const r = mesh(new THREE.PlaneGeometry(1.6, 1.6 * 550 / 463, 24, 16), M.photoRug(T.nefRug), 0, 0, 0, g);
    r.rotation.x = -Math.PI / 2; r.rotation.z = Math.PI / 2; r.castShadow = false;
    rugWave(g, r, 1.6);
    return g;
  },
  pad(T) {
    const g = new THREE.Group(), w = 0.3, d = w * 468 / 512;
    mesh(box(w, 0.004, d), [mats().dark, mats().dark, M.photoRug(T.nefPad), mats().dark, mats().dark, mats().dark], 0, 0.002, 0, g);
    return g;
  },
  // постер The Prodigy: по клику у Флинта сверкает глаз (звёздочка-вспышка на зрачке)
  poster(T) {
    const g = new THREE.Group(), w = 0.62, h = w * 768 / 397;
    mesh(new THREE.PlaneGeometry(w, h), std({ map: T.nefPoster, roughness: 0.6 }), 0, 0, 0, g).castShadow = false;
    const star = canvasTex(64, 64, (x) => {
      x.translate(32, 32); x.fillStyle = "#fff";
      for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 4); x.beginPath(); x.moveTo(-2, 0); x.lineTo(0, -31); x.lineTo(2, 0); x.lineTo(0, 31); x.fill(); }
      const r = x.createRadialGradient(0, 0, 0, 0, 0, 12); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(200,255,120,0)"); x.fillStyle = r; x.fillRect(-12, -12, 24, 24);
    });
    const eyes = [[(210 / 397 - 0.5) * w, (0.5 - 150 / 768) * h, 1], [(166 / 397 - 0.5) * w, (0.5 - 181 / 768) * h, 0.6]].map(([ex, ey, k]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: star, color: 0xf4ffd0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
      sp.position.set(ex, ey, 0.01); sp.userData.k = k; g.add(sp); return sp;
    });
    g.userData.act = play => play(900, p => eyes.forEach(sp => {
      const q = Math.max(0, Math.sin(Math.min(1, p / sp.userData.k) * Math.PI)) * sp.userData.k;
      sp.material.opacity = q; sp.material.rotation = p * 2.5; const sc = 0.04 + q * 0.12; sp.scale.set(sc, sc, 1);
    }));
    return g;
  },
  cool(T) {
    const g = new THREE.Group(), w = 0.21, d = w * 447 / 373, paper = std({ color: 0xf4f0e6, roughness: 0.8 });
    const mg = new THREE.Group(); mg.rotation.y = 0.25; g.add(mg);
    mesh(box(w, 0.006, d), paper, 0, 0.003, 0, mg);
    // обложка на «корешке» слева: «полистать» — открывается, страница перелистывается, закрывается
    const cover = new THREE.Group(); cover.position.set(-w / 2, 0.007, 0); mg.add(cover);
    mesh(box(w, 0.002, d), [paper, paper, std({ map: T.nefCool, roughness: 0.5 }), std({ color: 0xe8e0d0, roughness: 0.8 }), paper, paper], w / 2, 0, 0, cover);
    const page = new THREE.Group(); page.position.copy(cover.position); mg.add(page);
    mesh(box(w, 0.001, d), std({ color: 0xf6f2ea, roughness: 0.9, map: canvasTex(64, 80, (x) => { x.fillStyle = "#f6f2ea"; x.fillRect(0, 0, 64, 80); x.fillStyle = "#d8302a"; x.fillRect(6, 6, 52, 14); x.fillStyle = "#999"; for (let i = 0; i < 9; i++) x.fillRect(6, 26 + i * 5, 52, 2); x.fillStyle = "#3a6ad8"; x.fillRect(36, 30, 22, 30); }) }), w / 2, -0.001, 0, page);
    g.userData.act = play => play(2200, p => {
      cover.rotation.z = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 3.0;
      page.rotation.z = Math.max(0, Math.sin((p - 0.25) / 0.6 * Math.PI)) * 2.9;
    });
    return g;
  },
  // скейт прислонён К стене: колёса на полу у комнаты, нос касается стены. Клён в 7 слоёв на торце, шкурка
  // с блёстками, затёртая графика снизу, литые траки, колёса с логотипом. «Олли» — скейт подпрыгивает и стукается о стену
  skate() {
    const m = mats(), g = new THREE.Group(), deck = new THREE.Group();
    const grip = std({ roughness: 1, map: canvasTex(64, 256, (x, w, h) => {
      x.fillStyle = "#151515"; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; x.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
      x.fillStyle = "rgba(120,110,100,.35)"; x.fillRect(10, 60, 44, 40); x.fillRect(12, 170, 40, 36); // вытерто ногами
    }) });
    const art = std({ roughness: 0.55, map: canvasTex(64, 256, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ff5a1f"); gr.addColorStop(1, "#ffb21f");
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = "#111"; for (let i = 0; i < 6; i++) x.fillRect(0, 22 + i * 38, w, 9);
      x.fillStyle = "#ffe14a"; x.font = "900 20px sans-serif"; x.save(); x.translate(42, 205); x.rotate(-Math.PI / 2); x.fillText("SK8 OR DIE", 0, 0); x.restore();
      x.fillStyle = "#f4e8d0"; [[0, 0, 64, 14], [0, 242, 64, 14]].forEach(r => x.fillRect(...r)); // стёртые до дерева нос и хвост
      for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(240,225,200,${Math.random() * 0.6})`; x.lineWidth = Math.random() * 1.5; const px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 18, py + (Math.random() - 0.5) * 4); x.stroke(); }
    }) });
    const ply = std({ roughness: 0.7, map: canvasTex(8, 64, (x, w, h) => { for (let i = 0; i < 7; i++) { x.fillStyle = i % 2 ? "#e8cf9e" : "#c99a5e"; x.fillRect(0, i * h / 7, w, h / 7); } }) });
    // доска: материалы граней [+x, −x, +y(шкурка), −y(графика), +z, −z]
    mesh(rbox(0.2, 0.014, 0.8, 0.006), [ply, ply, grip, art, ply, ply], 0, 0, 0, deck);
    const urethane = std({ color: 0xf2efe0, roughness: 0.35 }), logo = canvasTex(32, 32, x => { x.fillStyle = "#f2efe0"; x.fillRect(0, 0, 32, 32); x.fillStyle = "#d8302a"; x.beginPath(); x.arc(16, 16, 9, 0, 6.28); x.fill(); x.fillStyle = "#f2efe0"; x.beginPath(); x.arc(16, 16, 4, 0, 6.28); x.fill(); });
    const wheels = [];
    [-0.28, 0.28].forEach(z => {
      mesh(box(0.07, 0.012, 0.09), M.chrome, 0, -0.013, z, deck);                 // площадка
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), std({ color: 0xd8302a, roughness: 0.6 }), 0, -0.028, z, deck); // амортизатор
      const axle = mesh(cyl(0.008, 0.008, 0.2, 8), M.chrome, 0, -0.045, z, deck); axle.rotation.z = Math.PI / 2;
      mesh(box(0.13, 0.025, 0.035), M.chrome, 0, -0.04, z, deck);
      [-1, 1].forEach(sd => {
        const w = mesh(cyl(0.026, 0.026, 0.032, 18), [urethane, std({ map: logo, roughness: 0.35 }), std({ map: logo, roughness: 0.35 })], sd * 0.095, -0.045, z, deck);
        w.rotation.z = Math.PI / 2; wheels.push(w);
      });
    });
    // графикой к комнате: колёса смотрят в комнату, шкурка — к стене
    deck.rotation.set(1.32, 0, Math.PI); deck.position.set(0, 0.405, 0.13); g.add(deck);
    g.userData.act = play => play(800, p => {
      const j = Math.sin(p * Math.PI);
      deck.position.y = 0.405 + j * 0.12; deck.rotation.x = 1.32 - j * 0.25;
      wheels.forEach(w => { w.rotation.x = p * 20; });
    });
    return g;
  },
  // компьютерное кресло: тёмно-серая ткань, газлифт, пятилучевая крестовина на колёсиках; «крутануться» — три оборота
  officechair() {
    const g = new THREE.Group(), top = new THREE.Group(); g.add(top);
    const fab = std({ color: 0xffffff, roughness: 0.95, map: canvasTex(64, 64, (x, w, h) => { x.fillStyle = "#6b6d72"; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},.08)`; x.fillRect(Math.random() * w, Math.random() * h, 1, 1); } }) });
    const plastic = std({ color: 0x1b1b1d, roughness: 0.45 });
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, arm = mesh(box(0.3, 0.035, 0.05), plastic, Math.cos(a) * 0.15, 0.07, -Math.sin(a) * 0.15, g); arm.rotation.y = a;
      const c = mesh(new THREE.SphereGeometry(0.03, 10, 8), plastic, Math.cos(a) * 0.3, 0.03, -Math.sin(a) * 0.3, g); c.scale.set(1, 1, 0.7);
    }
    mesh(cyl(0.035, 0.045, 0.06, 12), plastic, 0, 0.1, 0, g);
    mesh(cyl(0.016, 0.016, 0.22, 10), M.chrome, 0, 0.23, 0, top); // газлифт
    mesh(box(0.2, 0.03, 0.2), plastic, 0, 0.36, 0, top);
    mesh(rbox(0.48, 0.08, 0.46, 0.035), fab, 0, 0.42, 0, top);                  // сиденье
    mesh(box(0.06, 0.32, 0.03), plastic, 0, 0.55, -0.24, top);                   // кронштейн спинки
    const back = mesh(rbox(0.42, 0.5, 0.06, 0.03), fab, 0, 0.86, -0.26, top); back.rotation.x = 0.08;
    [0.78, 0.81, 0.84].forEach(y => mesh(box(0.2, 0.006, 0.004), std({ color: 0x343538, roughness: 1 }), 0, y, -0.226, top)); // строчка-поясница
    const lever = mesh(cyl(0.006, 0.006, 0.12, 6), plastic, 0.16, 0.34, 0.02, top); lever.rotation.z = Math.PI / 2 + 0.3;
    g.userData.act = play => play(1500, p => { top.rotation.y = (1 - Math.pow(1 - p, 3)) * Math.PI * 6; });
    return g;
  },
  // журнальный столик из ИКЕА в наклейках (на нём журнал COOL и сокс — см. layout)
  ctable() {
    const m = mats(), g = new THREE.Group(), W = 0.6, H = 0.42;
    const stick = canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = "#e9e4da"; x.fillRect(0, 0, w, h);
      [["KORN", "#1a1a1a", "#d8302a"], ["Linkin Park", "#2a59c8", "#fff"], ["Ария", "#111", "#f2c230"], ["Би-2", "#2ea84a", "#fff"], ["☮", "#8a3cc8", "#fff"], ["SK8", "#ff7a2a", "#111"]].forEach(([txt, bg, fg], i) => {
        x.save(); x.translate(40 + (i % 3) * 85, 50 + (i / 3 | 0) * 120 + (i % 2) * 20); x.rotate((Math.random() - 0.5) * 0.7);
        x.fillStyle = bg; x.fillRect(-36, -18, 72, 36); x.fillStyle = fg; x.font = "900 16px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 0, 1); x.restore();
      });
      for (let i = 0; i < 6; i++) { x.strokeStyle = "rgba(120,80,40,.25)"; x.lineWidth = 3; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 16, 0, 6.28); x.stroke(); } // следы от кружек
    });
    mesh(box(W, 0.05, W), [m.beech, m.beech, std({ map: stick, roughness: 0.5 }), m.beech, m.beech, m.beech], 0, H - 0.025, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(box(0.05, H - 0.05, 0.05), m.beech, a * (W / 2 - 0.025), (H - 0.05) / 2, b * (W / 2 - 0.025), g));
    mesh(box(W - 0.06, 0.015, W - 0.06), m.beech, 0, 0.1, 0, g); // нижняя полка
    g.userData.act = play => play(600, p => { g.rotation.z = Math.sin(p * Math.PI * 5) * 0.025 * (1 - p); });
    return g;
  },
  // сокс: вязаный радужный мячик; «набить» — подлетает несколько раз
  soks() {
    const g = new THREE.Group(), ball = new THREE.Group(); g.add(ball);
    const knit = canvasTex(256, 128, (x, w, h) => { // радужные кольца от полюса + петли вязки
      const cols = ["#5a2a8a", "#2a3aa8", "#1f8a3a", "#f2d22a", "#f28a1a", "#d8302a"];
      for (let i = 0; i < h; i++) { x.fillStyle = cols[Math.min(5, i / h * 6 | 0)]; x.fillRect(0, i, w, 1); }
      for (let j = 0; j < h; j += 4) for (let i = 0; i < w; i += 5) { x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(i, j + 3, 5, 1); x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(i + 1, j, 2, 2); }
    });
    const sp = mesh(new THREE.SphereGeometry(0.035, 20, 14), std({ map: knit, roughness: 1 }), 0, 0.033, 0, ball); sp.rotation.z = 0.6; sp.scale.y = 0.93;
    g.userData.act = play => play(1600, p => {
      const hop = Math.abs(Math.sin(p * Math.PI * 4)) * (1 - p) * 0.35;
      ball.position.y = hop; ball.rotation.x = p * 12; ball.rotation.z = p * 5;
    });
    return g;
  },
};
