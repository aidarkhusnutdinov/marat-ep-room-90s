// v5 «Новый день»: 3D-комната в изометрии посреди космоса. Пустая бетонная коробка → обставляем.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeTextures } from "./textures.js";
import { initSpace } from "./space.js";
import { CATALOG, SLOTS, SURFACES, itemById } from "./catalog.js";
import { restore, restoreCost, setFitCheck } from "./shop.js";
import { initFit, blockersByFit, clashes } from "./fit.js";
import { initMaterials } from "./models/kit.js";
import { buildItem, layout } from "./models/index.js";
import { pcScreen } from "./models/neformal.js";
import { createPets } from "./pets.js";
import { buildRoom, surfaceThumb, WIN } from "./models/room.js";
import { loadTexts, t, cfg, QUESTIONS, hasText } from "./texts.js";
import { st, has, on, initState } from "./state.js";
import { initUI, updateUI, toast, tickMoney, thumbs, showPie, hidePie, openTray, setActionHandler, setPieExtras, setActLabel, fmt, closeDialog } from "./ui.js";
import { actOf } from "./catalog.js";
import * as A from "./audio.js";

const $ = (id) => document.getElementById(id);
await loadTexts();
initState();
SLOTS.pets = cfg("вместимость питомцев", 6);
const space = initSpace();
const ISO = new THREE.Vector3(Math.sin(Math.PI / 4) * Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), Math.cos(Math.PI / 4) * Math.cos(Math.PI / 6));

// ---------- Рендерер, сцена, камера ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$("view").appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
const TARGET = new THREE.Vector3(2.35, 0.95, 1.95);
camera.position.copy(TARGET).addScaledVector(ISO, 20);
camera.lookAt(TARGET);
function resize() {
  const w = innerWidth, h = innerHeight, a = w / h;
  let half = 2.75;
  if (a < 1.5) half = 2.75 * 1.5 / a * 0.92;
  camera.left = -half * a; camera.right = half * a; camera.top = half; camera.bottom = -half;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
addEventListener("resize", resize); resize();

const T = await makeTextures({ scribble: t("ui.scribble") });
// живые помехи для экрана в комнате
const scrCanvas = Object.assign(document.createElement("canvas"), { width: 128, height: 100 });
const scrCtx = scrCanvas.getContext("2d");
T.screen = new THREE.CanvasTexture(scrCanvas); T.screen.colorSpace = THREE.SRGBColorSpace;
const MAT = initMaterials(T);
initFit(T); setFitCheck(blockersByFit);

// ---------- Комната: стены, пол, окно, батарея (js/models/room.js) ----------
const room = buildRoom(scene, T, { bannerText: t("window.plane.banner"), onPlane: () => A.ifAwake(A.plane), onSkater: () => A.ifAwake(() => A.skate(0.25)),
  onBugle: () => A.ifAwake(A.bugle), onHurrah: () => A.ifAwake(A.hurrah) });
const windowGroup = room.windowGroup;
// розетка и надпись «сюда бы телек…»
const socket = new THREE.Group();
{
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.015), new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.5 }));
  s.position.set(3.42, 0.32, 0.008); socket.add(s);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.31), new THREE.MeshBasicMaterial({ map: T.scribble, transparent: true, color: 0x9a9a9a }));
  t.position.set(3.42, 0.6, 0.004); socket.add(t);
  scene.add(socket);
}

// ---------- Свет ----------
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x5a3e2a, 1.0));
const fill = new THREE.DirectionalLight(0xffe2c0, 0.55);
fill.position.set(8, 6, 9); scene.add(fill);
const SUN_DIR = new THREE.Vector3(1, -0.7, -0.12).normalize();
const sun = new THREE.DirectionalLight(0xfff0c8, 4.2);
sun.target.position.set(2.2, 0, 2.6);
sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, -9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

// луч и пылинки в нём — привет «Ну, погоди!» из старой версии
const beamPts = [];
{
  const corners = [[WIN.y0, WIN.z0], [WIN.y0, WIN.z1], [WIN.y1, WIN.z1], [WIN.y1, WIN.z0]].map(([y, z]) => new THREE.Vector3(0, y, z));
  const floorP = corners.map(c => c.clone().addScaledVector(SUN_DIR, c.y / -SUN_DIR.y));
  const v = [...corners, ...floorP].flatMap(p => [p.x, p.y, p.z]);
  const idx = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx);
  const beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(beam);
  // пылинки живут в «координатах луча»: точка окна (y, z) + расстояние t вдоль луча; плывут, оседают, кружатся
  const N = 170, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = THREE.MathUtils.lerp(WIN.y0, WIN.y1, Math.random()), z = THREE.MathUtils.lerp(WIN.z0, WIN.z1, Math.random());
    beamPts.push({ y, z, t: Math.random() * (y / -SUN_DIR.y), vy: 0, vz: 0, vt: 0, ph: Math.random() * 6.28, tw: 0.5 + Math.random() * 2 });
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); dg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dc = Object.assign(document.createElement("canvas"), { width: 32, height: 32 }), dx = dc.getContext("2d");
  const rg = dx.createRadialGradient(16, 16, 0, 16, 16, 16); rg.addColorStop(0, "rgba(255,245,215,1)"); rg.addColorStop(1, "rgba(255,245,215,0)");
  dx.fillStyle = rg; dx.fillRect(0, 0, 32, 32);
  var dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 3.5, sizeAttenuation: false, vertexColors: true, map: new THREE.CanvasTexture(dc), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);
}

// свет от телевизора и тёплый ореол вокруг экрана
const tvLight = new THREE.PointLight(0xb8ccff, 0, 4.5, 1.2);
scene.add(tvLight);
function glowTex(stops) {
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 }), x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// телевизор светится сам, как торшер: голубоватое ядро от экрана, тёплый жёлтый край. Пока клип не смотрели —
// свет ярче и «дышит», зовёт нажать; потом спокойный
const tvGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex([[0, "rgba(215,232,255,.9)"], [0.25, "rgba(180,205,255,.6)"], [0.55, "rgba(140,175,255,.25)"], [1, "rgba(120,160,255,0)"]]),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
tvGlow.scale.set(1.5, 1.25, 1); tvGlow.visible = false; scene.add(tvGlow);
// раунд 3: свечение стало заметным — голубой ореол на стене за телевизором и мерцающее пятно света на полу перед ним
const glowPlane = (w, h, stops) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTex(stops), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.visible = false; m.renderOrder = 2; scene.add(m); return m; };
const tvWall = glowPlane(2.1, 1.7, [[0, "rgba(170,200,255,.75)"], [0.35, "rgba(140,175,255,.4)"], [0.7, "rgba(120,150,255,.12)"], [1, "rgba(120,150,255,0)"]]);
const tvFloor = glowPlane(2.0, 2.0, [[0, "rgba(150,185,255,.85)"], [0.4, "rgba(120,160,255,.42)"], [1, "rgba(110,140,255,0)"]]);
tvFloor.rotation.x = -Math.PI / 2;
const tvWarm = new THREE.PointLight(0xffd59a, 0, 3, 1.6); scene.add(tvWarm);

// ---------- Пул ламп ----------
// Свет торшера, жирафа, витрины стенки — это постоянные лампы сцены, а не PointLight внутри модели. Если добавлять
// свет вместе с предметом, three.js перекомпилирует шейдеры у всех материалов комнаты (число ламп входит в шейдер) —
// покупка набора замирала на секунды. Лампа модели остаётся «пультом» (невидима), пул повторяет её каждый кадр.
const LAMPS = Array.from({ length: 4 }, () => { const l = new THREE.PointLight(0xffffff, 0, 1, 2); scene.add(l); return { l, src: null }; });
function lampsAttach(g) { g.traverse(o => { if (!o.isPointLight) return; o.visible = false; const f = LAMPS.find(p => !p.src); if (f) f.src = o; }); }
function lampsDetach(g) { LAMPS.forEach(p => { let o = p.src; while (o && o !== g) o = o.parent; if (o === g) { p.src = null; p.l.intensity = 0; } }); }
const lampPos = new THREE.Vector3();
function lampsTick() {
  for (const p of LAMPS) {
    if (!p.src) continue;
    const s = p.src; s.getWorldPosition(lampPos); p.l.position.copy(lampPos);
    p.l.color.copy(s.color); p.l.intensity = s.intensity; p.l.distance = s.distance; p.l.decay = s.decay;
  }
}

// ---------- Предметы в сцене ----------
const items = {}; // id -> group
const anims = [];

function placeAll() {
  for (const id of Object.keys(st.owned)) {
    const g = items[id]; if (!g || isPet(id)) continue; // поверхности живут в room.js, питомцы ходят сами
    const [x, y, z, r] = layout(id, st.owned);
    g.userData.target = new THREE.Vector3(x, y, z);
    if (!g.userData.dropping) g.position.set(x, y, z);
    g.rotation.y = r;
  }
  socket.visible = !has("tv");
  if (has("tv")) {
    const p = items.tv.userData.target;
    const r = items.tv.rotation.y, fx = Math.sin(r), fz = Math.cos(r); // куда смотрит экран
    tvLight.position.set(p.x + fx * 0.6, p.y + 0.3, p.z + fz * 0.6);
    tvGlow.position.set(p.x - 0.04 + fx * 0.32, p.y + 0.36, p.z + fz * 0.32);
    tvWarm.position.set(p.x + fx * 0.45, p.y + 0.5, p.z + fz * 0.45);
    tvWall.position.set(p.x, p.y + 0.34, 0.008); tvWall.userData.on = p.z < 0.6 && Math.abs(r) < 0.1; // ореол — только у задней стены
    tvFloor.position.set(p.x + fx * 1.05, 0.008, p.z + fz * 1.05); tvFloor.rotation.z = r;
  }
  tvLight.intensity = has("tv") ? 2.4 : 0;
  tvGlow.visible = has("tv"); tvFloor.visible = has("tv"); tvWall.visible = has("tv") && !!tvWall.userData.on;
}
const isSurface = id => SURFACES.has(itemById[id].slot);
// покоцанное: темнее, грубее, с лёгкой «пылью»
function wearOut(g) {
  g.traverse(o => {
    if (!o.isMesh || o.isSprite) return;
    const one = m => { const c = m.clone(); if (c.color) c.color.multiplyScalar(0.68); if (c.roughness != null) c.roughness = Math.min(1, c.roughness + 0.3); if (c.clearcoat) c.clearcoat *= 0.2; return c; };
    o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
  });
}
function rebuildItem(id) {
  const old = items[id]; if (!old) return;
  scene.remove(old);
  lampsDetach(old);
  const g = buildItem(id, T); if (st.damaged[id]) wearOut(g);
  items[id] = g; scene.add(g); lampsAttach(g); placeAll(); jiggle(id);
}
on("restored", id => { rebuildItem(id); toast(t("ui.restored", { name: itemById[id] && t(`item.${id}.name`) })); });
const isPet = id => itemById[id].slot === "pets";
let fartSaid = false;
const pets = createPets(scene, { onFart: () => { A.fart(); if (!fartSaid) { fartSaid = true; toast(t("item.matvey.fart")); } } });
on("add", id => {
  if (isSurface(id)) { room.applySurface(itemById[id].slot, id); if (itemById[id].slot === "window") A.setView(id); return; }
  const g = buildItem(id, T);
  if (st.damaged[id]) wearOut(g);
  items[id] = g; scene.add(g); lampsAttach(g);
  g.userData.dropping = true;
  if (isPet(id)) pets.add(id, g);
  anims.push({ g, t0: performance.now(), kind: "drop" });
  placeAll();
});
on("remove", id => {
  if (isSurface(id)) { const s = itemById[id].slot; if (!Object.keys(st.owned).some(o => itemById[o].slot === s)) { room.applySurface(s, null); if (s === "window") A.setView(null); } return; }
  const g = items[id]; if (!g) return;
  scene.remove(g); lampsDetach(g); delete items[id]; pets.remove(id); A.deviceOff(id);
  placeAll();
});
on("change", () => { placeAll(); pets.rebuild(items); });

initUI();
setActionHandler(action);
// что сейчас включено: для подписи «Выключить» (item.<id>.act.off в тексты.txt)
const isOn = id => ({ radiola: A.playingDevice() === "radiola", music: A.playingDevice() === "music", audio: A.playingDevice() === "audio",
  torsher: !!items.torsher && items.torsher.userData.light.intensity > 0, giraffe: !!items.giraffe && items.giraffe.userData.light.intensity > 0 })[id];
setActLabel(id => isOn(id) && hasText(`item.${id}.act.off`) ? t(`item.${id}.act.off`) : actOf(id));
// техника показывает, что играет: у радиолы поднята крышка и крутится пластинка, у колонок качают басы
function devicesShow() {
  const d = A.playingDevice();
  if (items.radiola) { MAT.dial.color.set(d === "radiola" ? 0xffffff : 0xb8a888); items.radiola.userData.setPlaying(d === "radiola"); }
  for (const id of ["music", "audio"]) if (items[id] && items[id].userData.setPlaying) items[id].userData.setPlaying(d === id);
}
setPieExtras(id => [...pieExtra(id), ...(st.damaged[id] ? [{ t: t("ui.restore", { n: fmt(st.test ? 0 : restoreCost(id)) }), a: () => restore(id) }] : [])]);
const pieExtra = id => isPet(id) ? [{ t: t("pet.feed"), a: () => { pets.act(id, "feed"); A.feed(id); toast(t(`item.${id}.feed`)); } }] : [];

// ---------- Клики по предметам: круговое меню ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const ids = [], dist = [];
  lastHit = null;
  for (const hit of ray.intersectObjects([...Object.values(items), windowGroup, room.radiator, ...room.pickables.filter(m => m.visible)], true)) {
    let o = hit.object;
    while (o && !o.userData.id) o = o.parent;
    if (!o || ids.includes(o.userData.id)) continue;
    if (o.userData.id === "walls") { if (ids.length) continue; lastHit = hit; } // стена — только если перед ней ничего нет
    ids.push(o.userData.id); dist.push(hit.distance);
  }
  if (ids[0] === "walls" && ids.length > 1) { ids.shift(); dist.shift(); } // окно и батарея в стене важнее самой стены
  // мелочь ЗА стеклом витрины или дверцей шкафа важнее самой мебели: луч сначала упирается в стекло.
  // Берём только то, что стоит внутри (рядом по лучу и не на полу) — иначе клик по мебели уходил ковру под ней
  if (ids[0] && CARRIERS.has(ids[0])) {
    const i = ids.findIndex((id, k) => k > 0 && dist[k] - dist[0] < 0.5 && !CARRIERS.has(id) && itemById[id] && !isSurface(id) && items[id] && items[id].position.y > 0.05);
    if (i > 0) return ids[i];
  }
  return ids[0] || null;
}
let lastHit = null;
// столы и тумбы сюда не входят: то, что на них лежит, луч и так встречает первым
const CARRIERS = new Set(["stenka", "shkaf", "walls"]);
// граффити на голых стенах: рисунок в точке клика, копятся; под обоями не видно
function drawGraffiti(kind, hit = lastHit) {
  if (!hit || !hit.object.userData.spray) return null;
  kind = room.spray(hit, kind);
  if (kind === "barmaley") A.chalk(); else A.spray();
  toast(t("room.graffiti." + kind));
  return kind;
}
let down = null;
renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; A.wake(); });
renderer.domElement.addEventListener("pointermove", e => { renderer.domElement.style.cursor = pick(e) ? "pointer" : ""; });
renderer.domElement.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const id = pick(e);
  if (!id) { hidePie(); return; }
  hidePie();
  if (id === "walls") { drawGraffiti(); return; }
  if (id === "window") { // своё окно-покупка → меню, хрущёвка напротив → реплика
    if (windowGroup.userData.item) showPie(windowGroup.userData.item, e.clientX, e.clientY); else { A.blip(900, 0.04); A.duck(6); toast(t("window.khrushchev")); }
    return;
  }
  if (id === "radiator") {
    if (room.radiator.userData.item) showPie(room.radiator.userData.item, e.clientX, e.clientY); else { A.knock(); toast(t("room.radiator")); }
    return;
  }
  showPie(id, e.clientX, e.clientY);
});
addEventListener("pointerdown", () => A.wake(), { once: true });

let torsherOn = true;
function jiggle(id) { const g = items[id]; if (g) anims.push({ g, t0: performance.now(), kind: "jiggle" }); }
// своя анимация предмета (ящик выезжает, дверца открывается…): модель кладёт в userData.act(play),
// play(мс, p => …) крутит функцию от 0 до 1 и в конце ещё раз зовёт с p = 1
const playOn = g => (dur, fn) => anims.push({ g, t0: performance.now(), kind: "fn", dur, fn });
function action(id) {
  const g = items[id];
  if (g && g.userData.act) g.userData.act(playOn(g)); else jiggle(id);
  const say = () => toast(t(`item.${id}.say`));
  switch (id) {
    case "tv": return openTV();
    case "radiola": { const on = A.deviceToggle("radiola"); devicesShow(); toast(t(on ? "item.radiola.say.on" : "item.radiola.say.off")); break; }
    case "vympel": A.rimshot(); break;
    case "fish": A.bloop(); say(); break;
    case "mug": A.dzyn(); A.sip(); say(); break;
    case "kover": A.thump(); say(); break;
    case "rug": A.rug(); say(); break;
    case "bust": A.ahem(); say(); break;
    case "pss": A.page(); say(); break;
    case "kreslo": A.sit(); say(); break;
    case "sofa": A.boing(); say(); break;
    case "table": A.knock(); say(); break;
    case "torsher": torsherOn = !torsherOn; items.torsher.userData.light.intensity = torsherOn ? 2.2 : 0; MAT.shade.emissiveIntensity = torsherOn ? 0.55 : 0; A.lamp(); break;
    case "clock": A.cuckoo(); { const b = items.clock.userData.bird; b.visible = true; anims.push({ g: b, t0: performance.now(), kind: "cuckoo" }); } break;
    case "kover3": A.thump(); say(); break;
    case "slon": A.porcelain(); say(); break;
    case "box": {
      const g = items.box, open = !g.userData.open.visible;
      g.userData.open.visible = open; g.userData.closed.visible = !open; if (open) A.box(); else A.door();
      if (open && !st.boxBonus) { st.boxBonus = true; const n = cfg("бонус шкатулки", 100); st.money += n; A.coins(); toast(t("item.box.first", { n: fmt(n) }), 5000); updateUI(); }
      else toast(t(open ? "item.box.say" : "item.box.close"));
      break;
    }
    case "begonia": A.water(); say(); break;
    case "tumba": A.door(); say(); break;
    case "stenka": A.door(); say(); break;
    // Питомцы: «погладить»
    case "dobraya": case "machka": case "sglaz": A.meow({ dobraya: 1, machka: 2, sglaz: 3 }[id]); pets.act(id, "pet"); say(); break;
    case "matvey": A.woof(); pets.act(id, "pet"); say(); break;
    case "chirik": A.turtle(); pets.act(id, "pet"); say(); break;
    case "tarantul": A.spider(); pets.act(id, "pet"); say(); break;
    case "mihalych": A.beaverPet(); pets.act(id, "pet"); say(); break;
    // Разгул капитализма
    case "audio": { const on = A.deviceToggle("audio"); devicesShow(); if (on) A.sparkle(); toast(t(on ? "item.audio.say.on" : "item.audio.say.off")); break; }
    case "brain": A.brain(); say(); break;
    case "bossdesk": A.knock(); say(); break;
    case "goldchair": A.creak(); say(); break;
    case "tumbochka": A.door(); say(); break;
    case "giraffe": { const u = items.giraffe.userData, on = u.light.intensity === 0; u.light.intensity = on ? 1.6 : 0; u.inner.material.emissiveIntensity = on ? 0.8 : 0.05; A.lamp(); break; }
    case "rug_lux": case "leopard": case "pinkrug": A.rug(); say(); break;
    case "square": A.ahem(); say(); break;
    case "croc": items.croc.userData.mouth(); A.growl(); say(); break;
    case "yeltsin": A.yeltsin(); say(); break;
    case "safe": A.safe(); say(); break;
    case "ruble": A.sparkle(); say(); break;
    // Неформал 2003
    case "shkaf": A.door(); say(); break;
    case "shved": A.metal(); say(); break;
    case "pufik": A.beanbag(); say(); break;
    case "desk": A.knock(); say(); break;
    case "pc": { const m = pcScreen.toggle(); if (m === "desktop") A.boot(); else A.modem(); toast(t(m === "desktop" ? "item.pc.say.on" : "item.pc.say.off")); break; }
    case "music": { A.cdtray(); const on = A.deviceToggle("music"); devicesShow(); toast(t(on ? "item.music.say.on" : "item.music.say.off")); break; }
    case "cdtower": A.page(); say(); break;
    case "rug_egypt": A.rug(); say(); break;
    case "pad": A.blip(900, 0.04); say(); break;
    case "poster": A.page(); say(); break;
    case "cool": A.page(); say(); break;
    case "skate": A.skate(); say(); break;
    default:
      if (itemById[id].slot === "window") { A.blip(1100, 0.05); A.duck(8); say(); }
      else if (itemById[id].slot === "radiator") { if (id === "rad_iron") A.metal(); else A.sparkle(); say(); }
  }
}

// ---------- Телевизор крупно ----------
const zoom = $("tvzoom"), screenEl = $("screen");
const CHANNELS = ["static", "bars", "ep", "nosig"];
let ch = 0, noiseRAF = null;
const ncv = $("noise"), nctx = ncv.getContext("2d");
function drawNoise() {
  const img = nctx.createImageData(ncv.width, ncv.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  nctx.putImageData(img, 0, 0); noiseRAF = requestAnimationFrame(drawNoise);
}
function applyChannel() {
  const c = CHANNELS[ch]; screenEl.dataset.ch = c;
  if (c === "static" && !noiseRAF) drawNoise();
  if (c !== "static" && noiseRAF) { cancelAnimationFrame(noiseRAF); noiseRAF = null; }
  if (c === "static") A.hissOn(); else A.hissOff();
  if (c === "bars") A.tone(1000, 0.4);
}
function openTV() {
  openTray(false); zoom.hidden = false; ch = 0; A.tvon(); A.tvMode(true); applyChannel();
  if (!st.watched) { st.watched = true; placeAll(); updateUI(); }
}
function closeTV() { if (!zoom.hidden) A.tvMode(false); zoom.hidden = true; if (noiseRAF) cancelAnimationFrame(noiseRAF); noiseRAF = null; A.hissOff(); }
screenEl.addEventListener("click", () => { ch = (ch + 1) % CHANNELS.length; screenEl.animate([{ filter: "brightness(3)" }, { filter: "brightness(1)" }], { duration: 140 }); A.tvknob(); applyChannel(); });
$("tvz-close").addEventListener("click", closeTV);
addEventListener("keydown", e => { if (e.key === "Escape") { closeTV(); hidePie(); closeDialog(); openTray(false); } });

// ---------- Миниатюры для каталога (рендер тех же моделей) ----------
// те же модели потом прогревают шейдеры основной сцены (warm): первая покупка не ждёт компиляции
const warm = new THREE.Scene();
{
  const tr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  tr.setSize(160, 160); tr.toneMapping = THREE.ACESFilmicToneMapping;
  const ts = new THREE.Scene();
  ts.environment = new THREE.PMREMGenerator(tr).fromScene(new RoomEnvironment(), 0.04).texture;
  ts.environmentIntensity = 0.5;
  ts.add(new THREE.HemisphereLight(0xfff4e4, 0x6b4a32, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(3, 5, 4); ts.add(dl);
  const tc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
  const tmp = new THREE.Vector3();
  for (const it of CATALOG) {
    if (isSurface(it.id) && surfaceThumb(it.id)) { thumbs[it.id] = surfaceThumb(it.id); continue; }
    const g = buildItem(it.id, T);
    if (it.id === "kover" || it.id === "clock" || it.id === "vympel") g.rotation.y = 0.5;
    ts.add(g);
    const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
    tc.position.copy(c).addScaledVector(ISO, 10); tc.lookAt(c); tc.updateMatrixWorld();
    let r = 0;
    for (let i = 0; i < 8; i++) {
      tmp.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(tc.matrixWorldInverse);
      r = Math.max(r, Math.abs(tmp.x), Math.abs(tmp.y - 0));
    }
    r *= 1.12;
    Object.assign(tc, { left: -r, right: r, top: r, bottom: -r }); tc.updateProjectionMatrix();
    tr.render(ts, tc);
    thumbs[it.id] = tr.domElement.toDataURL("image/png");
    ts.remove(g); g.traverse(o => { if (o.isLight) o.visible = false; }); warm.add(g);
  }
  tr.dispose();
}

// ---------- Цикл ----------
const easeBounce = t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
let frame = 0;
function loop(now) {
  frame++;
  // анимации появления и «подпрыгивания»
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i], p = Math.min(1, (now - a.t0) / (a.kind === "drop" ? 520 : 380));
    if (a.kind === "fn") { const q = Math.min(1, (now - a.t0) / a.dur); a.fn(q); if (q >= 1) anims.splice(i, 1); continue; }
    if (a.kind === "cuckoo") { // выдвинулась, «ку-ку» ×2, спряталась
      const q = Math.min(1, (now - a.t0) / 2200), out = q < 0.15 ? q / 0.15 : q > 0.85 ? (1 - q) / 0.15 : 1;
      a.g.position.z = -0.02 + out * 0.11; a.g.rotation.x = out * Math.sin(now / 90) * 0.15;
      if (q >= 1) { a.g.visible = false; anims.splice(i, 1); }
      continue;
    }
    if (a.kind === "drop") {
      const tg = a.g.userData.target; if (!tg) continue;
      a.g.position.set(tg.x, tg.y + (1 - easeBounce(p)) * 1.4, tg.z);
      if (p >= 1) a.g.userData.dropping = false;
    } else {
      const s = 1 + Math.sin(p * Math.PI * 3) * 0.06 * (1 - p);
      a.g.scale.set(s, 1 / s, s);
    }
    if (p >= 1) { if (a.kind !== "drop") a.g.scale.set(1, 1, 1); anims.splice(i, 1); }
  }
  // помехи на экране телека в комнате
  if (items.tv && frame % 2 === 0) {
    const img = scrCtx.createImageData(128, 100), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = 40 + Math.random() * 200; d[i] = v * 0.85; d[i + 1] = v * 0.9; d[i + 2] = v; d[i + 3] = 255; }
    scrCtx.putImageData(img, 0, 0);
    scrCtx.globalCompositeOperation = "destination-in";
    scrCtx.beginPath(); scrCtx.roundRect(0, 0, 128, 100, [14]); scrCtx.fill();
    scrCtx.globalCompositeOperation = "source-over";
    T.screen.needsUpdate = true;
    tvLight.intensity = 1.9 + Math.random() * 1.1;
  }
  if (tvGlow.visible) {
    const call = st.watched ? 0 : 0.5 + 0.5 * Math.sin(now / 520); // пока не смотрели — зовёт
    const flick = (tvLight.intensity - 2.4) / 1.1; // мерцание экрана −0.5…0.5
    tvGlow.material.opacity = 0.75 + 0.15 * Math.sin(now / 900) + flick * 0.2 + call * 0.3;
    const k = 1 + call * 0.15; tvGlow.scale.set(1.7 * k, 1.4 * k, 1);
    tvWall.material.opacity = 0.8 + flick * 0.25 + call * 0.25; tvWall.scale.setScalar(1 + call * 0.1);
    tvFloor.material.opacity = 0.7 + flick * 0.3 + call * 0.3;
    tvWarm.intensity = 0.5 + call * 0.9;
  } else tvWarm.intensity = 0;
  // пылинки: броуновское блуждание + медленное оседание и лёгкий сквозняк; вылетела из луча — появляется с другой стороны
  {
    const dp = dust.geometry.attributes.position, dc = dust.geometry.attributes.color, dt = 1 / 60, ts = now / 1000;
    for (let i = 0; i < beamPts.length; i++) {
      const b = beamPts[i];
      b.vy += (Math.random() - 0.5) * 0.02 - 0.0012; b.vz += (Math.random() - 0.5) * 0.02 + Math.sin(ts * 0.3) * 0.0008; b.vt += (Math.random() - 0.5) * 0.03;
      b.vy *= 0.97; b.vz *= 0.97; b.vt *= 0.97;
      b.y += b.vy * dt; b.z += b.vz * dt; b.t += b.vt * dt;
      if (b.y < WIN.y0) b.y = WIN.y1; if (b.y > WIN.y1) b.y = WIN.y0;
      if (b.z < WIN.z0) b.z = WIN.z1; if (b.z > WIN.z1) b.z = WIN.z0;
      const tMax = b.y / -SUN_DIR.y; if (b.t < 0.05) b.t = tMax - 0.05; if (b.t > tMax) b.t = 0.05;
      dp.setXYZ(i, SUN_DIR.x * b.t, b.y + SUN_DIR.y * b.t, b.z + SUN_DIR.z * b.t);
      const k = 0.35 + 0.65 * Math.max(0, Math.sin(ts * b.tw + b.ph)) ** 2; // поблёскивают, попадая в свет
      dc.setXYZ(i, k, k, k);
    }
    dp.needsUpdate = dc.needsUpdate = true;
  }
  lampsTick();
  room.tick(now);
  pets.tick(now);
  if (items.pc) pcScreen.tick(now);
  for (const id in items) { const f = items[id].userData.tick; if (f) f(now); } // живые предметы
  tickMoney();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
updateUI(); placeAll();
$("loading").classList.add("gone");
requestAnimationFrame(loop);
// шейдеры всех предметов — под свет и тени основной сцены, в фоне
// и заодно загрузить в видеопамять общие фото-текстуры (иначе первая покупка ковра ждёт загрузки картинки на GPU)
setTimeout(() => {
  const surf = room.preload(warm);
  renderer.compileAsync(warm, camera, scene).catch(() => {}).finally(() => {
    const tex = new Set(surf);
    warm.traverse(o => { if (!o.material) return; [].concat(o.material).forEach(m => ["map", "normalMap", "roughnessMap", "alphaMap", "emissiveMap"].forEach(k => m[k] && tex.add(m[k]))); });
    tex.forEach(t => { if (t.image && (t.image.width || t.image.videoWidth)) renderer.initTexture(t); });
    // шейдеры теней compileAsync не собирает — один кадр тени от всех моделей на слое 1 (камера его не видит)
    warm.traverse(o => o.layers.set(1)); warm.position.copy(sun.target.position);
    sun.shadow.camera.layers.enable(1); scene.add(warm); renderer.render(scene, camera);
    scene.remove(warm); sun.shadow.camera.layers.disable(1);
    warm.clear();
  });
}, 300);
setTimeout(() => toast(st.test ? t("test.on") : t("ui.start", { n: fmt(st.money) })), 400);
A.setClockGetter(() => has("clock"));
window.__st = st; // для отладки
// крупный план для отладки: __dbg.focus("croc", 0.6) — камера на предмет, полуширина кадра 0.6 м; focus() — назад
function focus(id, half = 0.7) {
  const c = id ? new THREE.Box3().setFromObject(id === "window" ? windowGroup : items[id]).getCenter(new THREE.Vector3()) : TARGET;
  camera.position.copy(c).addScaledVector(ISO, 20); camera.lookAt(c);
  if (!id) { resize(); return; }
  const a = innerWidth / innerHeight; Object.assign(camera, { left: -half * a, right: half * a, top: half, bottom: -half }); camera.updateProjectionMatrix();
}
window.__dbg = { renderer, camera, screenOf: id => { const v = new THREE.Box3().setFromObject(items[id]).getCenter(new THREE.Vector3()).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, focus, clashes: () => clashes(st.owned), graffiti: (kind, u = 0.5, v = 0.55) => drawGraffiti(kind, { object: room.pickables[0], uv: { x: u, y: v } }), comet: space.cometNow, plane: room.planeNow, act: action, items, pets, SLOTS, QUESTIONS };
