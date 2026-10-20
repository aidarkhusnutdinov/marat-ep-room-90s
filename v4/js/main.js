// v4: 3D-комната в изометрии а-ля The Sims 1. Фото-текстуры + процедурные материалы, солнце из окна.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeTextures } from "./textures.js";
import { CATS, CATALOG, initMaterials, buildItem, layout } from "./items.js";
import * as A from "./audio.js";

const $ = (id) => document.getElementById(id);
const BUDGET = 2000;
const PRESET_USSR = ["tv", "tumba", "stenka", "bust", "flags", "vympel", "fish", "mug", "sofa", "kover", "begonia", "rug", "table", "kreslo"];
const ROOM_W = 5, ROOM_D = 4.2, WALL_H = 2.6, WALL_T = 0.12;
const WIN = { z0: 2.25, z1: 3.72, y0: 0.85, y1: 1.95 };
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

const T = await makeTextures();
// живые помехи для экрана в комнате
const scrCanvas = Object.assign(document.createElement("canvas"), { width: 128, height: 100 });
const scrCtx = scrCanvas.getContext("2d");
T.screen = new THREE.CanvasTexture(scrCanvas); T.screen.colorSpace = THREE.SRGBColorSpace;
const MAT = initMaterials(T);

// ---------- Комната ----------
const invisibleCaster = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
function wallMesh(shape, matFace) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false });
  const cap = new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.9 });
  const m = new THREE.Mesh(geo, [matFace, cap]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const wallMat = new THREE.MeshStandardMaterial({ map: T.wallpaper, roughness: 0.85 });
// задняя стена (z=0)
{
  const s = new THREE.Shape();
  s.moveTo(-WALL_T, 0); s.lineTo(ROOM_W, 0); s.lineTo(ROOM_W, WALL_H); s.lineTo(-WALL_T, WALL_H); s.closePath();
  const m = wallMesh(s, wallMat); m.position.z = -WALL_T; scene.add(m);
}
// левая стена (x=0) с проёмом окна
{
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(ROOM_D, 0); s.lineTo(ROOM_D, WALL_H); s.lineTo(0, WALL_H); s.closePath();
  const h = new THREE.Path();
  h.moveTo(WIN.z0, WIN.y0); h.lineTo(WIN.z1, WIN.y0); h.lineTo(WIN.z1, WIN.y1); h.lineTo(WIN.z0, WIN.y1); h.closePath();
  s.holes.push(h);
  const m = wallMesh(s, wallMat); m.rotation.y = -Math.PI / 2; scene.add(m);
}
// пол
{
  const top = new THREE.MeshStandardMaterial({ map: T.parquet, roughness: 0.55 });
  T.parquet.repeat.set(ROOM_W / 1.3, ROOM_D / 1.3);
  const side = new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 1 });
  const f = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + WALL_T, 0.18, ROOM_D + WALL_T), [side, side, top, side, side, side]);
  f.position.set(ROOM_W / 2 - WALL_T / 2, -0.09, ROOM_D / 2 - WALL_T / 2);
  f.receiveShadow = true; scene.add(f);
}
// плинтуса
{
  const pm = new THREE.MeshStandardMaterial({ color: 0x6a4323, roughness: 0.6 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.07, 0.02), pm); a.position.set(ROOM_W / 2, 0.035, 0.01);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, ROOM_D), pm); b.position.set(0.01, 0.035, ROOM_D / 2);
  [a, b].forEach(m => { m.receiveShadow = true; scene.add(m); });
}
// окно: настоящее фото, подоконник, батарея, невидимые переплёты для тени
{
  const w = WIN.z1 - WIN.z0, h = WIN.y1 - WIN.y0;
  const ph = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T.window, color: 0xf2f2f2 }));
  ph.rotation.y = Math.PI / 2; ph.position.set(-0.07, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2);
  scene.add(ph);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, w + 0.12), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }));
  sill.position.set(0.05, WIN.y0 + 0.017, (WIN.z0 + WIN.z1) / 2); sill.castShadow = sill.receiveShadow = true; scene.add(sill);
  [0.37, 0.67].forEach(f => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.05), invisibleCaster);
    bar.position.set(-0.05, (WIN.y0 + WIN.y1) / 2, WIN.z0 + w * f); bar.castShadow = true; scene.add(bar);
  });
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, w), invisibleCaster);
  tr.position.set(-0.05, WIN.y1 - h * 0.3, (WIN.z0 + WIN.z1) / 2); tr.castShadow = true; scene.add(tr);
  const rm = new THREE.MeshStandardMaterial({ color: 0xece7da, roughness: 0.45, metalness: 0.2 });
  for (let i = 0; i < 10; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.075), rm);
    r.position.set(0.1, 0.4, WIN.z0 + 0.22 + i * 0.105); r.castShadow = r.receiveShadow = true; scene.add(r);
  }
}
// «потолок» только для тени, чтобы солнце шло лишь через окно
{
  const c = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 2, 0.05, ROOM_D + 2), invisibleCaster);
  c.position.set(ROOM_W / 2, WALL_H + 0.03, ROOM_D / 2); c.castShadow = true; scene.add(c);
}
// розетка и надпись «сюда бы телек…»
const socket = new THREE.Group();
{
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.015), new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.5 }));
  s.position.set(3.42, 0.32, 0.008); socket.add(s);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.31), new THREE.MeshBasicMaterial({ map: T.scribble, transparent: true, color: 0xcccccc }));
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
  const N = 150, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = THREE.MathUtils.lerp(WIN.y0, WIN.y1, Math.random()), z = THREE.MathUtils.lerp(WIN.z0, WIN.z1, Math.random());
    const t = Math.random() * (y / -SUN_DIR.y);
    const p = new THREE.Vector3(0, y, z).addScaledVector(SUN_DIR, t);
    pos.set([p.x, p.y, p.z], i * 3); beamPts.push({ base: p.clone(), ph: Math.random() * 6.28 });
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dc = Object.assign(document.createElement("canvas"), { width: 32, height: 32 }), dx = dc.getContext("2d");
  const rg = dx.createRadialGradient(16, 16, 0, 16, 16, 16); rg.addColorStop(0, "rgba(255,245,215,1)"); rg.addColorStop(1, "rgba(255,245,215,0)");
  dx.fillStyle = rg; dx.fillRect(0, 0, 32, 32);
  var dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 3.5, sizeAttenuation: false, map: new THREE.CanvasTexture(dc), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);
}

// свет от телевизора
const tvLight = new THREE.PointLight(0x9cc4ff, 0, 3.5, 1.5);
scene.add(tvLight);

// плюмбоб над телеком
const plumbob = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), MAT.plumbob);
plumbob.scale.y = 1.7; plumbob.visible = false; scene.add(plumbob);

// ---------- Состояние ----------
const st = { money: BUDGET, owned: {}, watched: false, test: false };
const has = id => st.owned[id] != null;
const items = {}; // id -> group
const anims = [];
const itemById = Object.fromEntries(CATALOG.map(i => [i.id, i]));

function placeAll() {
  for (const id of Object.keys(st.owned)) {
    const g = items[id]; const [x, y, z, r] = layout(id, st.owned);
    g.userData.target = new THREE.Vector3(x, y, z);
    if (!g.userData.dropping) g.position.set(x, y, z);
    g.rotation.y = r;
  }
  socket.visible = !has("tv");
  if (has("tv")) {
    const p = items.tv.userData.target;
    tvLight.position.set(p.x, p.y + 0.3, p.z + 0.6);
    plumbob.position.set(p.x + 0.04, p.y + 0.95, p.z);
  }
  tvLight.intensity = has("tv") ? 1.2 : 0;
  plumbob.visible = has("tv") && !st.watched;
}

function add(id, paid) {
  const g = buildItem(id, T);
  items[id] = g; st.owned[id] = paid; scene.add(g);
  g.userData.dropping = true;
  anims.push({ g, t0: performance.now(), kind: "drop" });
  placeAll();
}
function remove(id) {
  const g = items[id]; if (!g) return;
  scene.remove(g); delete items[id]; delete st.owned[id];
  placeAll();
}

function buy(id, quiet) {
  const it = itemById[id];
  if (st.owned[id] != null) return null;
  const price = st.test ? 0 : it.price;
  if (price > st.money) { if (!quiet) { A.sad(); toast("Не хватает денег. Продай что-нибудь: клик по предмету → «Продать»."); } return null; }
  let paid = price, msg = null;
  if (id === "stenka" && !st.test && Math.random() < 0.3) { paid -= 50; msg = "Стенку привезли <b>поцарапанной</b>. Грузчики вернули 50 ₽ и ушли."; }
  if (id === "pss") msg = "Тома 12–17 <b>потеряли на складе</b>.";
  if (id === "tv") msg = has("tumba") ? "Телевизор на тумбе. Жми на него!" : "Телек на полу, как у студента. Но работает! Жми на него.";
  if (["bust", "pss", "fish"].includes(id) && !has("stenka")) msg = (msg ? msg + " " : "") + "Ставить некуда, пока на полу.";
  st.money -= paid; add(id, paid);
  if (!quiet) { A.thunk(); A.coins(); if (msg) toast(msg); }
  updateUI();
  return msg;
}
function sell(id) {
  if (st.owned[id] == null) return;
  st.money += st.owned[id]; remove(id); A.coins(); updateUI();
}
function sellAll() { Object.keys(st.owned).forEach(id => { st.money += st.owned[id]; remove(id); }); }

// ---------- UI ----------
let toastT;
function toast(html, ms = 3400) {
  const el = $("toast"); el.innerHTML = html; el.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), ms);
}
const fmt = n => n.toLocaleString("ru-RU").replace(/ /g, " ");
let shownMoney = BUDGET;
function updateUI() {
  $("goal").classList.toggle("done", st.watched);
  $("goal-text").textContent = st.watched ? "Клип посмотрели (почти). Обставляй дальше!"
    : has("tv") ? "Телевизор есть. Нажми на него!" : "Купи телевизор и посмотри клип";
  renderTiles();
}
function tickMoney() {
  const target = st.test ? null : st.money;
  const el = $("money");
  if (target == null) { el.textContent = "ТЕСТ"; return; }
  if (shownMoney !== target) {
    const d = target - shownMoney; shownMoney += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) / 8));
    el.textContent = fmt(shownMoney);
  }
}

// каталог
let cat = "all";
const thumbs = {};
$("cats").innerHTML = CATS.map(c => `<button data-cat="${c.id}" class="${c.id === cat ? "on" : ""}">${c.name}</button>`).join("");
$("cats").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  cat = b.dataset.cat; A.blip(1300, 0.03);
  [...$("cats").children].forEach(x => x.classList.toggle("on", x === b));
  renderTiles();
});
function renderTiles() {
  $("tiles").innerHTML = CATALOG.filter(i => cat === "all" || i.cat === cat).map(i =>
    `<button class="tile ${st.owned[i.id] != null ? "owned" : ""} ${i.must ? "must" : ""}" data-id="${i.id}">
      <img src="${thumbs[i.id] || ""}" alt=""><span class="pr">₽${i.price}</span></button>`).join("");
}
$("tiles").addEventListener("click", e => {
  const b = e.target.closest(".tile"); if (!b) return;
  const id = b.dataset.id;
  if (st.owned[id] != null) { toast("Уже стоит в комнате. Клик по нему → «Продать»."); return; }
  buy(id);
});
$("tiles").addEventListener("mousemove", e => {
  const b = e.target.closest(".tile"), card = $("card");
  if (!b) { card.hidden = true; return; }
  const it = itemById[b.dataset.id], r = b.getBoundingClientRect();
  card.innerHTML = `<h4>${it.name}</h4><p>${it.desc}</p><div class="pr">₽ ${it.price}</div>`;
  card.hidden = false;
  card.style.left = Math.min(innerWidth - 314, Math.max(8, r.left - 110)) + "px";
  card.style.top = (r.top - card.offsetHeight - 12) + "px";
});
$("tiles").addEventListener("mouseleave", () => { $("card").hidden = true; });

function openTray(on) {
  $("tray").hidden = !on; $("btn-buy").classList.toggle("on", on); $("card").hidden = true;
  A.buyMusic(on);
}
$("btn-buy").addEventListener("click", () => { A.blip(900, 0.04); openTray($("tray").hidden); });
$("tray-close").addEventListener("click", () => openTray(false));
$("btn-sound").addEventListener("click", () => { const m = A.toggleMute(); $("btn-sound").textContent = m ? "🔇" : "🔊"; });
$("preset").addEventListener("click", () => {
  sellAll(); st.test = false;
  const notes = [];
  PRESET_USSR.forEach((id, i) => setTimeout(() => {
    const m = buy(id, true); A.thunk();
    if (id === "stenka" && m) notes.push("стенку привезли поцарапанной (−50 ₽)");
    if (i === PRESET_USSR.length - 1) {
      A.coins();
      toast("Комната «Фанат СССР» готова!<br>ПСС Ленина <b>не завезли</b>: дефицит" + (notes.length ? ", а " + notes[0] : "") + ".", 5000);
    }
  }, i * 140));
});
$("reset").addEventListener("click", () => { sellAll(); st.test = false; st.money = BUDGET; st.watched = false; updateUI(); placeAll(); toast("Всё продано. Новый день, новая попытка."); });
$("test-all").addEventListener("click", () => {
  sellAll(); st.test = true;
  CATALOG.forEach((it, i) => setTimeout(() => { buy(it.id, true); if (i % 3 === 0) A.thunk(); }, i * 90));
  setTimeout(() => toast("ТЕСТ: куплено всё, деньги не списаны."), CATALOG.length * 90);
});

// ---------- Клики по предметам: круговое меню ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(Object.values(items), true)[0];
  let o = hit && hit.object;
  while (o && !o.userData.id) o = o.parent;
  return o ? o.userData.id : null;
}
let down = null;
renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; A.wake(); });
renderer.domElement.addEventListener("pointermove", e => { renderer.domElement.style.cursor = pick(e) ? "pointer" : ""; });
renderer.domElement.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const id = pick(e);
  if (!id) { $("pie").hidden = true; return; }
  showPie(id, e.clientX, e.clientY);
});
addEventListener("pointerdown", () => A.wake(), { once: true });

function showPie(id, x, y) {
  const it = itemById[id], pie = $("pie");
  A.blip(1500, 0.03);
  const opts = [{ t: it.act, a: () => action(id) }, { t: `Продать (₽${st.owned[id]})`, a: () => sell(id), cls: "sell" }];
  pie.innerHTML = `<div class="center">${it.name}</div>` + opts.map((o, i) => {
    const ang = -Math.PI / 2 + (i ? 0.95 : -0.95) + (i ? Math.PI : 0) * 0;
    const ox = Math.cos(ang) * 120 * (i ? 1 : -1) * 0 + (i ? 95 : -95), oy = i ? 46 : -46;
    return `<button class="opt ${o.cls || ""}" data-i="${i}" style="left:${ox}px;top:${oy}px;animation-delay:${i * 40}ms">${o.t}</button>`;
  }).join("");
  pie.style.left = Math.min(innerWidth - 200, Math.max(200, x)) + "px";
  pie.style.top = Math.min(innerHeight - 80, Math.max(80, y)) + "px";
  pie.hidden = false;
  pie.onclick = e => { const b = e.target.closest(".opt"); if (!b) return; pie.hidden = true; opts[+b.dataset.i].a(); };
}

const QUOTES = ["«Учиться, учиться и ещё раз учиться»", "Бюст смотрит на телевизор с одобрением.", "Бюст сурово молчит."];
const PAGES = ["Том 23. Подчёркнуто карандашом: «верно!»", "Между страниц засушенный кленовый лист.", "Том 41. Закладка — билет в кино за 25 копеек."];
let torsherOn = true;
function jiggle(id) { const g = items[id]; if (g) anims.push({ g, t0: performance.now(), kind: "jiggle" }); }
function action(id) {
  jiggle(id);
  const rand = a => a[Math.floor(Math.random() * a.length)];
  switch (id) {
    case "tv": return openTV();
    case "radiola": { const on = A.radio(); toast(on ? "«Ригонда» прогрелась. Играет «Маяк»." : "Радиола щёлкнула и затихла."); MAT.dial.color.set(on ? 0xffffff : 0xb8a888); break; }
    case "vympel": A.rimshot(); break;
    case "fish": A.bloop(); toast("Дзынь по кобальту. Буль-буль."); break;
    case "mug": A.dzyn(); toast("Ай, горячо! Губы помнят."); break;
    case "kover": A.thump(); toast("Выбил ковёр. Пыль 1987 года."); break;
    case "rug": A.blip(500, 0.08); toast("Угол ковра больше не загибается. Пока."); break;
    case "bust": A.blip(400, 0.1); toast(rand(QUOTES)); break;
    case "pss": A.page(); toast(rand(PAGES)); break;
    case "kreslo": A.creak(); toast("Кресло скрипнуло. Дедушкино."); break;
    case "sofa": A.boing(); toast("Пружины помнят всех, кто прыгал до тебя."); break;
    case "table": A.knock(); toast("Тук-тук. Полировка, но не лак."); break;
    case "torsher": torsherOn = !torsherOn; items.torsher.userData.light.intensity = torsherOn ? 2.2 : 0; MAT.shade.emissiveIntensity = torsherOn ? 0.55 : 0; A.blip(700, 0.04); break;
    case "clock": A.cuckoo(); break;
    case "begonia": A.water(); toast("Полито. Сегодня же вторник?"); break;
    case "flags": A.flap(); flagBoost = 3; break;
    case "tumba": A.blip(600, 0.05); toast("Внутри квитанции за свет и одинокая батарейка."); break;
    case "stenka": A.blip(600, 0.05); toast("В зеркале витрины отражается твоя гордость."); break;
  }
}
let flagBoost = 1;

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
  openTray(false); zoom.hidden = false; ch = 0; applyChannel();
  if (!st.watched) { st.watched = true; placeAll(); updateUI(); }
}
function closeTV() { zoom.hidden = true; if (noiseRAF) cancelAnimationFrame(noiseRAF); noiseRAF = null; A.hissOff(); }
screenEl.addEventListener("click", () => { ch = (ch + 1) % CHANNELS.length; screenEl.animate([{ filter: "brightness(3)" }, { filter: "brightness(1)" }], { duration: 140 }); A.blip(); applyChannel(); });
$("tvz-close").addEventListener("click", closeTV);
addEventListener("keydown", e => { if (e.key === "Escape") { closeTV(); $("pie").hidden = true; openTray(false); } });

// ---------- Миниатюры для каталога (рендер тех же моделей) ----------
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
    const g = buildItem(it.id, T);
    if (it.id === "kover" || it.id === "flags" || it.id === "clock" || it.id === "vympel") g.rotation.y = 0.5;
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
    ts.remove(g);
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
    tvLight.intensity = 0.9 + Math.random() * 0.6;
  }
  // плюмбоб, флажки, пылинки
  plumbob.rotation.y += 0.03; plumbob.position.y += Math.sin(now / 400) * 0.0015;
  if (items.flags) {
    flagBoost = Math.max(1, flagBoost * 0.985);
    for (const f of items.flags.userData.flags) {
      const pa = f.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), k = (x + 0.15) / 0.3;
        pa.setZ(i, Math.sin(now / 260 * flagBoost + x * 18 * f.userData.wave) * 0.018 * k * flagBoost);
      }
      pa.needsUpdate = true;
    }
  }
  const dp = dust.geometry.attributes.position;
  for (let i = 0; i < beamPts.length; i++) {
    const b = beamPts[i], t = now / 4000 + b.ph;
    dp.setXYZ(i, b.base.x + Math.sin(t) * 0.04, b.base.y + Math.sin(t * 0.7 + b.ph) * 0.05, b.base.z + Math.cos(t * 0.9) * 0.04);
  }
  dp.needsUpdate = true;
  tickMoney();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
updateUI(); placeAll();
$("loading").classList.add("gone");
requestAnimationFrame(loop);
setTimeout(() => toast("Новый день. ₽2 000 в кармане.<br>Жми «Покупки» и обставь комнату."), 400);
A.setClockGetter(() => has("clock"));
window.__st = st; // для отладки
