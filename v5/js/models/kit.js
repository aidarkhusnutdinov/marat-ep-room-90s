// Общие материалы и хелперы для моделей всех наборов.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ---------- Материалы ----------
export let M = null;
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
    sofa: std({ map: T.rogozhka.map, normalMap: T.rogozhka.normal, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95 }),
    chair: new THREE.MeshPhysicalMaterial({ map: T.velour.map, normalMap: T.velour.normal, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0xffb090), sheenRoughness: 0.4 }),
    sofaV4: std({ map: T.sofa, roughness: 0.95 }),
    chairV4: std({ map: T.chair, roughness: 0.95 }),
    enamel: new THREE.MeshPhysicalMaterial({ color: 0x1f5a2a, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    enamelIn: std({ color: 0xf2f0e8, roughness: 0.25, side: THREE.BackSide }),
    blackRim: std({ color: 0x111111, roughness: 0.35 }),
    malachite: new THREE.MeshPhysicalMaterial({ map: T.malachite, roughness: 0.15, clearcoat: 1 }),
    plaster: std({ color: 0xe8e2d4, roughness: 0.92 }),
    redStone: std({ color: 0x8a1f1a, roughness: 0.5 }),
    cobalt: new THREE.MeshPhysicalMaterial({ color: 0x1d44b0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 }),
    mugGreen: std({ color: 0x4f8a52, metalness: 0.55, roughness: 0.42, side: THREE.DoubleSide }),
    rugWall: std({ map: T.rugWall, roughness: 1 }),
    rugFloor: std({ map: T.rugFloor, roughness: 1 }),
    shade: std({ map: T.shade, roughness: 0.9, emissive: 0xffb866, emissiveIntensity: 0.55, side: THREE.DoubleSide }),
    grille: std({ map: T.grille, roughness: 1 }),
    dial: new THREE.MeshBasicMaterial({ map: T.dial, color: 0xfff0d0 }),
    spines: std({ map: T.spines, roughness: 0.7 }),
    bookTop: std({ color: 0xe9dfc6, roughness: 0.9 }),
    photoRug: (t) => std({ map: t, roughness: 1 }),
    porcelainDS: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide }),
    photo: (t) => std({ map: t, transparent: true, alphaTest: 0.4, roughness: 0.8, side: THREE.DoubleSide }),
  };
  return M;
}

// ---------- Хелперы ----------
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export const rbox = (w, h, d, r = 0.01) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);

// Дверца с филёнкой и ручкой; лицевая сторона в +z
export function door(g, x0, x1, y0, y1, z, mat, handleX) {
  const w = x1 - x0, h = y1 - y0;
  mesh(rbox(w - 0.008, h - 0.008, 0.022, 0.006), mat, (x0 + x1) / 2, (y0 + y1) / 2, z, g);
  mesh(rbox(w - 0.09, h - 0.09, 0.008, 0.003), M.walnutDark, (x0 + x1) / 2, (y0 + y1) / 2, z + 0.014, g);
  if (handleX != null) mesh(box(0.014, 0.09, 0.02), M.brass, handleX, (y0 + y1) / 2, z + 0.022, g);
}

export function photoPlane(t, w, h) {
  const g = new THREE.Group();
  const m = mesh(new THREE.PlaneGeometry(w, h), M.photo(t), 0, 0, 0, g);
  m.castShadow = true; m.receiveShadow = false;
  return g;
}


// ковёр на полу (плоскость в XY, повёрнута на пол): по нему пробегает волна-складка и разглаживается
export function rugWave(g, m, len) {
  const pos = m.geometry.attributes.position, base = pos.array.slice();
  g.userData.act = play => play(1300, p => {
    for (let i = 0; i < pos.count; i++) { const x0 = base[i * 3]; pos.setZ(i, Math.max(0, Math.sin((x0 / len + 0.5 - p * 1.4 + 0.2) * Math.PI * 3)) * 0.03 * Math.sin(p * Math.PI)); }
    pos.needsUpdate = true;
  });
}
