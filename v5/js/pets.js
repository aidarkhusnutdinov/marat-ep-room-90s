// Питомцы: блуждание по свободным клеткам пола (сетка 0.25 м, занятость — из габаритов мебели),
// анимация лап и хвоста, «погладить» (подпрыгнет) / «покормить» (жуёт), пук Матвея, сверкающий глаз Сглаза.
import * as THREE from "three";

const CELL = 0.25, X0 = 0.2, X1 = 4.85, Z0 = 0.2, Z1 = 4.0;
const CAGE = new THREE.Vector3(4.5, 0, 3.75); // табуретка с аквариумом тарантула — в переднем правом углу
const rnd = (a, b) => a + Math.random() * (b - a);
const key = (i, j) => i + "," + j;
const cellOf = v => Math.floor(v / CELL);

let puffTex = null;
function puff() {
  if (!puffTex) {
    const c = Object.assign(document.createElement("canvas"), { width: 64, height: 64 }), x = c.getContext("2d");
    [[32, 36, 20], [20, 30, 14], [44, 28, 15], [32, 22, 14]].forEach(([px, py, r]) => {
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, "rgba(190,200,120,.85)"); g.addColorStop(1, "rgba(190,200,120,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    });
    puffTex = new THREE.CanvasTexture(c);
  }
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false }));
}

export function createPets(scene, hooks) {
  const pets = {};
  let blocked = new Set(), last = performance.now();
  const puffs = [];

  // Занятые клетки: всё, что стоит на полу (низ ниже 0.35 м) и не плоское (ковры не мешают)
  function rebuild(items) {
    blocked = new Set();
    const b = new THREE.Box3();
    for (const id in items) {
      if (pets[id] && !pets[id].caged) continue; // аквариум — мебель, об него спотыкаются
      const g = items[id]; b.setFromObject(g);
      const tg = g.userData.target; if (tg) b.translate(new THREE.Vector3().subVectors(tg, g.position));
      if (b.min.y > 0.35 || b.max.y - b.min.y < 0.03) continue;
      for (let i = cellOf(b.min.x - 0.06); i <= cellOf(b.max.x + 0.06); i++)
        for (let j = cellOf(b.min.z - 0.06); j <= cellOf(b.max.z + 0.06); j++) blocked.add(key(i, j));
    }
    // мебель поставили прямо на зверя — переносим его на свободное место, иначе застрянет внутри
    for (const id in pets) {
      const p = pets[id], g = p.g;
      if (p.caged || free(g.position.x, g.position.z)) continue;
      const to = randomFree(g.position, 1.2) || randomFree();
      if (to) { g.position.copy(to); g.userData.target = to.clone(); p.state = "hop"; p.t0 = performance.now(); p.until = p.t0 + 700; }
    }
  }
  const free = (x, z) => x > X0 && x < X1 && z > Z0 && z < Z1 && !blocked.has(key(cellOf(x), cellOf(z)));
  const lineFree = (a, b) => { const n = Math.ceil(a.distanceTo(b) / 0.1); for (let k = 1; k <= n; k++) { const p = a.clone().lerp(b, k / n); if (!free(p.x, p.z)) return false; } return true; };
  function randomFree(near, r) {
    for (let k = 0; k < 60; k++) {
      const x = near ? near.x + rnd(-r, r) : rnd(X0, X1), z = near ? near.z + rnd(-r, r) : rnd(Z0, Z1);
      if (free(x, z)) return new THREE.Vector3((cellOf(x) + 0.5) * CELL, 0, (cellOf(z) + 0.5) * CELL);
    }
    return null;
  }

  function add(id, g) {
    if (g.userData.caged) { // живёт в аквариуме: стоит на месте, ходит внутри сам
      g.position.copy(CAGE); g.rotation.y = -0.5; g.userData.target = CAGE.clone();
      pets[id] = { g, caged: true, state: "idle", until: 0 }; return;
    }
    const p = randomFree() || new THREE.Vector3(2.5, 0, 3.2);
    g.position.copy(p); g.rotation.y = rnd(0, 6.28);
    g.userData.target = p.clone();
    pets[id] = { g, state: "idle", until: performance.now() + rnd(800, 2500), to: null, nextFart: performance.now() + rnd(15000, 30000), nextGlint: performance.now() + rnd(3000, 7000) };
  }
  function remove(id) { delete pets[id]; }

  function act(id, kind) {
    const p = pets[id]; if (!p) return;
    p.state = kind === "feed" && !p.caged ? "eat" : "hop"; p.t0 = performance.now(); p.until = p.t0 + (kind === "feed" ? 2200 : 700);
  }

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    for (const id in pets) {
      const p = pets[id], g = p.g, u = g.userData;
      if (u.dropping) continue;
      if (p.caged) { if (p.state === "hop") { const q = Math.min(1, 1 - (p.until - now) / 700); u.hop && u.hop(q); if (now > p.until) p.state = "idle"; } continue; }
      const legs = u.legs || [];
      if (p.state === "idle" && now > p.until) {
        const to = randomFree(g.position, id === "chirik" ? 0.6 : 1.6);
        if (to && to.distanceTo(g.position) > 0.2 && lineFree(g.position, to)) { p.state = "walk"; p.to = to; }
        else p.until = now + rnd(500, 1500);
      }
      if (p.state === "walk") {
        const d = p.to.clone().sub(g.position); d.y = 0;
        const dist = d.length(), step = u.speed * dt;
        // плавный поворот к цели
        const want = Math.atan2(-d.z, d.x); let dr = want - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
        g.rotation.y += dr * Math.min(1, dt * 6);
        if (!free(g.position.x + d.x / dist * 0.15, g.position.z + d.z / dist * 0.15) && dist > 0.15) { p.state = "idle"; p.until = now + 600; }
        else if (dist <= step) { g.position.copy(p.to); p.state = "idle"; p.until = now + rnd(1500, 6000) * (id === "chirik" ? 3 : 1); }
        else g.position.addScaledVector(d, step / dist);
        const ph = now / 1000 * u.gait;
        legs.forEach((l, i) => { l.rotation.z = Math.sin(ph + (i % 2 ^ (i >> 1) % 2 ? Math.PI : 0)) * (u.spider ? 0.25 : 0.5); });
        if (u.body) u.body.position.y = Math.abs(Math.sin(ph)) * 0.01;
      } else legs.forEach(l => { l.rotation.z *= 0.8; });
      if (p.state === "hop") { const q = 1 - (p.until - now) / 700; u.body.position.y = Math.sin(Math.min(1, q) * Math.PI) * 0.08; if (now > p.until) { p.state = "idle"; u.body.position.y = 0; } }
      if (p.state === "eat") { if (u.head) u.head.rotation.z = -0.4 + Math.sin(now / 90) * 0.15; if (now > p.until) { p.state = "idle"; if (u.head) u.head.rotation.z = 0; } }
      if (u.tail) u.tail.rotation.y = Math.sin(now / (p.state === "walk" ? 160 : 600)) * 0.4;
      // Матвей иногда пукает
      if (id === "matvey" && now > p.nextFart) {
        p.nextFart = now + rnd(20000, 45000);
        const s = puff(), back = new THREE.Vector3(-0.3, 0.25, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(g.position);
        s.position.copy(back); s.scale.set(0.15, 0.15, 1); scene.add(s); puffs.push({ s, t0: now });
        hooks.onFart && hooks.onFart();
      }
      // у Сглаза сверкает глаз
      if (u.glint) {
        if (now > p.nextGlint) { p.glintT = now; p.nextGlint = now + rnd(4000, 9000); }
        const q = p.glintT ? (now - p.glintT) / 500 : 1;
        u.glint.material.opacity = q < 1 ? Math.sin(q * Math.PI) : 0; u.glint.material.rotation = now / 300;
      }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const f = puffs[i], q = (now - f.t0) / 2200;
      f.s.position.y += dt * 0.12; const k = 0.15 + q * 0.4; f.s.scale.set(k, k, 1); f.s.material.opacity = 0.85 * (1 - q);
      if (q >= 1) { scene.remove(f.s); puffs.splice(i, 1); }
    }
  }
  return { add, remove, act, tick, rebuild, isPet: id => !!pets[id], count: () => Object.keys(pets).length, fartNow: () => { if (pets.matvey) pets.matvey.nextFart = 0; } };
}
