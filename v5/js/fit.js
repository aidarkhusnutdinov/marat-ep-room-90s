// Проверка «встанет ли красиво»: габариты предметов по раскладке layout(). Если новый предмет (или то, что из-за него
// переехало) налезает на уже стоящую мебель — это «тесно», а не кривая комната. Плоское (ковры, картины, постеры)
// и то, что стоит сверху на другом предмете, не мешает. Питомцы ходят сами — их не считаем.
import * as THREE from "three";
import { itemById, SURFACES } from "./catalog.js";
import { buildItem, layout } from "./models/index.js";

const local = {}; // id|rot → Box3 в начале координат
let T = null;
export const initFit = tex => { T = tex; };
const skip = id => { const it = itemById[id]; return !it || SURFACES.has(it.slot) || it.slot === "pets"; };

function boxOf(id, owned) {
  const [x, y, z, r] = layout(id, owned), k = id + "|" + r.toFixed(3);
  if (!local[k]) {
    const g = buildItem(id, T); g.rotation.y = r; g.updateMatrixWorld(true);
    // только видимые меши: спрайты (пар, пыль, блики) и скрытое не считаем
    const bb = new THREE.Box3(), tmp = new THREE.Box3();
    g.traverseVisible(o => { if (o.isMesh && !o.isSprite) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
    local[k] = bb; local[k].flat = !!g.userData.flat; // пушистый ковёр толстый, но по нему ходят
  }
  const b = local[k].clone().translate(new THREE.Vector3(x, y, z)); b.flat = local[k].flat; return b;
}
const TOL = 0.025;
const flat = b => { if (b.flat) return true; const s = b.getSize(new THREE.Vector3()); return Math.min(s.x, s.y, s.z) < 0.035; };
// мебель, на которую (и в которую) раскладка ставит мелочь: полки стенки, столы, тумбы
const CARRIERS = new Set(["stenka", "tumba", "table", "desk", "bossdesk", "tumbochka", "shkaf", "ctable"]);
function clash(a, b, ia, ib) {
  if (flat(a) || flat(b)) return false;
  if ((CARRIERS.has(ia) && b.min.y > 0.05) || (CARRIERS.has(ib) && a.min.y > 0.05)) return false; // лежит на полке / столе
  if (a.min.y >= b.max.y - 0.04 || b.min.y >= a.max.y - 0.04) return false; // стоит сверху
  return a.min.x < b.max.x - TOL && a.max.x > b.min.x + TOL && a.min.z < b.max.z - TOL && a.max.z > b.min.z + TOL
    && a.min.y < b.max.y - TOL && a.max.y > b.min.y + TOL;
}
// все пары, которые налезают друг на друга при таком наборе предметов
export function clashes(owned) {
  const ids = Object.keys(owned).filter(id => !skip(id)), boxes = ids.map(id => boxOf(id, owned)), out = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (clash(boxes[i], boxes[j], ids[i], ids[j])) out.push([ids[i], ids[j]]);
  return out;
}
// кого придётся убрать, чтобы поставить id (новые столкновения после покупки)
export function blockersByFit(id, owned) {
  if (skip(id)) return [];
  const before = new Set(clashes(owned).map(p => p.join()));
  const after = clashes({ ...owned, [id]: 0 }).filter(p => !before.has(p.join()));
  const out = new Set();
  for (const [a, b] of after) out.add(a === id ? b : b === id ? a : (owned[a] != null && a !== id ? a : b));
  out.delete(id);
  return [...out];
}
