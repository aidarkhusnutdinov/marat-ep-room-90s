// Комната: стены, пол, окно, батарея. Поверхности (обои, пол, вид за окном, батарея) меняются покупкой:
// applySurface(slot, id) ставит купленное, applySurface(slot, null) возвращает голый бетон.
import * as THREE from "three";
import { M, mesh, box, cyl, photoPlane } from "./kit.js";
import { itemById } from "../catalog.js";
import { goldFloor, herringbone, graffitiLayer } from "../textures.js";
import { GEN, createViewLayer } from "../windowview.js";

export const ROOM_W = 5, ROOM_D = 4.2, WALL_H = 2.6, WALL_T = 0.12;
export const WIN = { z0: 2.25, z1: 3.72, y0: 0.85, y1: 1.95 };

// Батареи-покупки. Начало координат — центр основания, лицевая сторона в +z (в комнате поворачиваем к +x).
export const RADIATORS = {
  rad_iron(T) {
    const W = 1.02, H = W * 497 / 800;
    const t = loader.load(itemById.rad_iron.img); t.colorSpace = THREE.SRGBColorSpace;
    const g = photoPlane(t, W, H);
    g.children[0].position.y = H / 2;
    // корпус не нужен: в просветах между секциями должны быть видны обои; объём даёт тень на стене
    return g;
  },
  rad_gold() {
    const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xf2c75c, metalness: 1, roughness: 0.22 });
    const n = 14, H = 0.6, step = 0.072;
    for (let i = 0; i < n; i++) {
      const x0 = (i - (n - 1) / 2) * step;
      [-0.02, 0.02].forEach(z => mesh(cyl(0.016, 0.016, H, 14), gold, x0, H / 2 + 0.05, z, g));
    }
    [0.08, H + 0.02].forEach(y => { const m = mesh(cyl(0.022, 0.022, n * step + 0.06, 16), gold, 0, y, 0, g); m.rotation.z = Math.PI / 2; });
    return g;
  },
};

const loader = new THREE.TextureLoader();
const cache = {};
function surfaceTex(id, T) {
  if (cache[id]) return cache[id];
  const it = itemById[id];
  let t;
  if (it.gen === "goldFloor") t = goldFloor();
  else if (it.gen === "parquet") { // ёлочка из фото: собираем, когда фото загрузится
    t = new THREE.CanvasTexture(Object.assign(document.createElement("canvas"), { width: 4, height: 4 }));
    // размер меняется 4×4 → большой: старую GPU-текстуру выбрасываем, иначе WebGL пишет в 4×4 и пол чёрный
    const im = new Image(); im.onload = () => {
      const h = herringbone(im, it.old); t.image = h.image; t.dispose(); t.needsUpdate = true;
      const cb = t.userData.onReady; t.userData = h.userData; // нормаль и шероховатость (лак/вытертое) — подхватит applySurface
      if (cb) cb();
    }; im.src = it.img;
  }
  else if (it.gen) { t = new THREE.CanvasTexture(GEN[it.gen]()); }
  else t = loader.load(it.img);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  // фото-кропы тайлим зеркально — так не видно швов; процедурные текстуры бесшовные сами
  if (it.tile) t.wrapS = t.wrapT = it.gen ? THREE.RepeatWrapping : THREE.MirroredRepeatWrapping;
  return (cache[id] = t);
}
// миниатюра для каталога: фото как есть или процедурная картинка
export function surfaceThumb(id) {
  const it = itemById[id];
  if (it.img) return it.img;
  if (it.gen === "goldFloor") return goldFloor().image.toDataURL("image/jpeg", 0.8);
  if (it.gen) return GEN[it.gen]().toDataURL("image/jpeg", 0.8);
  return null;
}

export function buildRoom(scene, T, opts) {
  const invisibleCaster = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const cap = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95 });
  const wallMat = new THREE.MeshStandardMaterial({ map: T.plaster, roughness: 0.95 });
  function wallMesh(shape) {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false }), [wallMat, cap]);
    m.castShadow = true; m.receiveShadow = true; scene.add(m);
    return m;
  }
  { // задняя стена (z=0)
    const s = new THREE.Shape();
    s.moveTo(-WALL_T, 0); s.lineTo(ROOM_W, 0); s.lineTo(ROOM_W, WALL_H); s.lineTo(-WALL_T, WALL_H); s.closePath();
    wallMesh(s).position.z = -WALL_T;
  }
  { // левая стена (x=0) с проёмом окна
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(ROOM_D, 0); s.lineTo(ROOM_D, WALL_H); s.lineTo(0, WALL_H); s.closePath();
    const h = new THREE.Path();
    h.moveTo(WIN.z0, WIN.y0); h.lineTo(WIN.z1, WIN.y0); h.lineTo(WIN.z1, WIN.y1); h.lineTo(WIN.z0, WIN.y1); h.closePath();
    s.holes.push(h);
    wallMesh(s).rotation.y = -Math.PI / 2;
  }
  // пол
  const floorMat = new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.9 });
  T.concrete.repeat.set(ROOM_W / 2, ROOM_D / 2);
  {
    const side = new THREE.MeshStandardMaterial({ color: 0x55534e, roughness: 1 });
    const f = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + WALL_T, 0.18, ROOM_D + WALL_T), [side, side, floorMat, side, side, side]);
    f.position.set(ROOM_W / 2 - WALL_T / 2, -0.09, ROOM_D / 2 - WALL_T / 2);
    f.receiveShadow = true; scene.add(f);
  }
  // мягкая тень в углах и у плинтуса (ambient occlusion «на глаз») — даёт глубину любой отделке
  {
    const c = Object.assign(document.createElement("canvas"), { width: 4, height: 128 }), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, "#fff"); g.addColorStop(0.35, "#737373"); g.addColorStop(1, "#000"); // alphaMap читает яркость
    x.fillStyle = g; x.fillRect(0, 0, 4, 128);
    const ao = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a120a, alphaMap: ao, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    // [ширина, глубина тени, позиция, поворот]: полоса на полу вдоль стены и на стене над полом, вертикальная — в углу
    const strip = (w, d, pos, rot, op = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), op === 1 ? mat : Object.assign(mat.clone(), { opacity: mat.opacity * op })); m.position.copy(pos); m.rotation.set(...rot); m.renderOrder = 1; scene.add(m); };
    strip(ROOM_W, 0.55, new THREE.Vector3(ROOM_W / 2, 0.003, 0.275), [-Math.PI / 2, 0, 0]);           // пол у задней стены
    strip(ROOM_D, 0.55, new THREE.Vector3(0.275, 0.003, ROOM_D / 2), [-Math.PI / 2, 0, Math.PI / 2]);  // пол у левой
    strip(ROOM_W, 0.4, new THREE.Vector3(ROOM_W / 2, 0.2, 0.004), [0, 0, Math.PI], 0.7);                // задняя стена у пола
    strip(ROOM_D, 0.4, new THREE.Vector3(0.004, 0.2, ROOM_D / 2), [0, Math.PI / 2, Math.PI], 0.7);      // левая у пола
    strip(WALL_H, 0.45, new THREE.Vector3(0.225, WALL_H / 2, 0.005), [0, 0, Math.PI / 2], 0.6);          // угол на задней
    strip(WALL_H, 0.45, new THREE.Vector3(0.005, WALL_H / 2, 0.225), [0, Math.PI / 2, -Math.PI / 2], 0.6); // угол на левой
    strip(ROOM_W, 0.35, new THREE.Vector3(ROOM_W / 2, WALL_H - 0.175, 0.004), [0, 0, 0], 0.5);         // под потолком
    strip(ROOM_D, 0.35, new THREE.Vector3(0.004, WALL_H - 0.175, ROOM_D / 2), [0, Math.PI / 2, 0], 0.5);
  }
  // окно: вид (фото или стена соседнего дома), живой слой, рама, подоконник
  const windowGroup = new THREE.Group(); scene.add(windowGroup);
  windowGroup.userData.id = "window";
  const w = WIN.z1 - WIN.z0, h = WIN.y1 - WIN.y0, fy = (WIN.y0 + WIN.y1) / 2, fz = (WIN.z0 + WIN.z1) / 2;
  const viewMat = new THREE.MeshBasicMaterial({ map: T.street.tex, color: 0xe6e6e6 });
  {
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(w, h), viewMat);
    ph.rotation.y = Math.PI / 2; ph.position.set(-0.07, fy, fz); windowGroup.add(ph);
  }
  const layer = createViewLayer(opts);
  const layerTex = new THREE.CanvasTexture(layer.canvas); layerTex.colorSpace = THREE.SRGBColorSpace;
  {
    const ov = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: layerTex, transparent: true, depthWrite: false, color: 0xeeeeee }));
    ov.rotation.y = Math.PI / 2; ov.position.set(-0.066, fy, fz); windowGroup.add(ov);
  }
  {
    const fm = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.7 });
    [[0.05, h, 0.05, fy, WIN.z0 + 0.025], [0.05, h, 0.05, fy, WIN.z1 - 0.025], [0.05, 0.05, w, WIN.y1 - 0.025, fz], [0.05, 0.05, w, WIN.y0 + 0.05, fz],
     [0.04, h, 0.035, fy, WIN.z0 + w * 0.37], [0.04, h, 0.035, fy, WIN.z0 + w * 0.67], [0.04, 0.035, w, WIN.y1 - h * 0.3, fz]]
      .forEach(([a, b, c, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), fm); m.position.set(-0.045, y, z); m.castShadow = true; windowGroup.add(m); });
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, w + 0.12), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }));
    sill.position.set(0.05, WIN.y0 + 0.017, fz); sill.castShadow = sill.receiveShadow = true; scene.add(sill);
  }
  // батарея: обычная из v4 или купленная
  const radiator = new THREE.Group(); radiator.userData.id = "radiator"; scene.add(radiator);
  const radDefault = new THREE.Group(); radiator.add(radDefault);
  {
    const rm = new THREE.MeshStandardMaterial({ color: 0xece7da, roughness: 0.45, metalness: 0.2 });
    for (let i = 0; i < 10; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.075), rm);
      r.position.set(0.1, 0.4, WIN.z0 + 0.22 + i * 0.105); r.castShadow = r.receiveShadow = true; radDefault.add(r);
    }
  }
  let radBought = null;
  // граффити на голом бетоне: прозрачные холсты поверх стен (256 px на метр), под обоями не видно
  const PX = 256, sprays = [];
  function sprayWall(w, h, pos, rotY, win) {
    const c = Object.assign(document.createElement("canvas"), { width: Math.round(w * PX), height: Math.round(h * PX) });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.copy(pos); m.rotation.y = rotY; m.receiveShadow = true; m.userData.id = "walls";
    m.userData.spray = { c, x: c.getContext("2d"), t, win };
    scene.add(m); return m;
  }
  const sprayBack = sprayWall(ROOM_W, WALL_H, new THREE.Vector3(ROOM_W / 2, WALL_H / 2, 0.003), 0);
  // у левой стены u = 1 − z/D; окно в холсте вырезаем, чтобы краска не легла на стекло
  const sprayLeft = sprayWall(ROOM_D, WALL_H, new THREE.Vector3(0.003, WALL_H / 2, ROOM_D / 2), Math.PI / 2,
    [(1 - WIN.z1 / ROOM_D) * ROOM_D * PX, (WALL_H - WIN.y1) * PX, (WIN.z1 - WIN.z0) * PX, (WIN.y1 - WIN.y0) * PX]);
  // рисунок в точке клика (uv плоскости): проявляется полосой за ~1.3 с
  function spray(hit, kind) {
    const sp = hit.object.userData.spray; if (!sp) return null;
    const L = graffitiLayer(kind), cx = hit.uv.x * sp.c.width, cy = (1 - hit.uv.y) * sp.c.height;
    sprays.push({ sp, L, x0: Math.round(cx - 256), y0: Math.round(Math.min(sp.c.height - 300, Math.max(-60, cy - 210))), t0: performance.now(), done: 0 });
    return L.kind;
  }
  function tickSpray(now) {
    for (let i = sprays.length - 1; i >= 0; i--) {
      const s = sprays[i], p = Math.min(1, (now - s.t0) / 1300), to = Math.round(512 * p);
      if (to > s.done) {
        const x = s.sp.x; x.save();
        if (s.sp.win) { const [wx, wy, ww, wh] = s.sp.win; x.beginPath(); x.rect(0, 0, s.sp.c.width, s.sp.c.height); x.rect(wx, wy, ww, wh); x.clip("evenodd"); }
        x.drawImage(s.L.canvas, s.done, 0, to - s.done, 420, s.x0 + s.done, s.y0, to - s.done, 420); x.restore();
        s.done = to; s.sp.t.needsUpdate = true;
      }
      if (p >= 1) sprays.splice(i, 1);
    }
  }
  // «потолок» только для тени, чтобы солнце шло лишь через окно
  {
    const c = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 2, 0.05, ROOM_D + 2), invisibleCaster);
    c.position.set(ROOM_W / 2, WALL_H + 0.03, ROOM_D / 2); c.castShadow = true; scene.add(c);
  }

  function applySurface(slot, id) {
    const it = id && itemById[id];
    if (slot === "walls") {
      if (it) { const t = surfaceTex(id, T); t.repeat.set(1 / it.tile[0], 1 / it.tile[1]); wallMat.map = t; wallMat.roughness = 0.85; }
      else { wallMat.map = T.plaster; wallMat.roughness = 0.95; }
      wallMat.needsUpdate = true;
      sprayBack.visible = sprayLeft.visible = !it; // обои клеят поверх граффити — снимешь обои, рисунки вернутся
    } else if (slot === "floor") {
      floorMat.normalMap = floorMat.roughnessMap = null;
      if (it) {
        const t = surfaceTex(id, T); t.repeat.set(ROOM_W / it.tile[0], ROOM_D / it.tile[1]); floorMat.map = t; floorMat.roughness = id === "floor_kovrolin" ? 1 : 0.5;
        const u = t.userData || {};
        if (!u.normal) u.onReady = () => { if (floorMat.map === t) applySurface("floor", id); }; // паркет ещё собирается
        if (u.normal) { [u.normal, u.rough].forEach(m => m.repeat.copy(t.repeat)); floorMat.normalMap = u.normal; floorMat.normalScale.set(0.7, 0.7); floorMat.roughnessMap = u.rough; floorMat.roughness = 1; }
      }
      else { floorMat.map = T.concrete; floorMat.roughness = 0.9; }
      floorMat.needsUpdate = true;
    } else if (slot === "window") {
      viewMat.map = it ? surfaceTex(id, T) : T.street.tex; viewMat.color.set(it ? 0xf2f2f2 : 0xe6e6e6); viewMat.needsUpdate = true;
      layer.setAnim(it && it.anim);
      windowGroup.userData.item = id || null;
    } else if (slot === "radiator") {
      if (radBought) { radiator.remove(radBought); radBought = null; }
      radDefault.visible = !it;
      if (it) {
        radBought = RADIATORS[id](T);
        radBought.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
        radBought.rotation.y = Math.PI / 2; radBought.position.set(0.08, id === "rad_iron" ? 0.12 : 0.08, fz);
        radiator.add(radBought);
      }
      radiator.userData.item = id || null;
    }
  }
  return {
    windowGroup, radiator, applySurface, spray, pickables: [sprayBack, sprayLeft],
    tick(now) { if (layer.tick(now)) layerTex.needsUpdate = true; tickSpray(now); },
    planeNow: layer.planeNow,
  };
}
