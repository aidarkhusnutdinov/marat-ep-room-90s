// Экономика: место, покупка, продажа, наборы со скидкой, тестовые покупки.
// Про «нет места» и «нет денег» shop не рисует сам — шлёт события nospace / nomoney, их ловит ui.js.
import { st, has, emit } from "./state.js";
import { CATALOG, itemById, SLOTS, SURFACES, sizeOf, nameOf } from "./catalog.js";
import { t, cfg } from "./texts.js";
import * as A from "./audio.js";
import { toast, fmt } from "./ui.js";
import { layout } from "./models/index.js";

const ownedIn = slot => Object.keys(st.owned).filter(id => itemById[id].slot === slot); // в порядке покупки
const usedIn = slot => ownedIn(slot).reduce((s, id) => s + sizeOf(id), 0);
const refundOf = ids => ids.reduce((s, id) => s + st.owned[id], 0);
// в кавычки, если в названии их ещё нет: «Пуфик», но Радиола «Ригонда»
export const names = ids => ids.map(id => { const n = nameOf(id); return n.includes("«") ? n : `«${n}»`; }).join(", ");

let fitCheck = () => [];
export const setFitCheck = f => { fitCheck = f; };

// Что придётся продать, чтобы поставить id. Сначала уходят последние купленные.
export function blockersFor(id) {
  const it = itemById[id], cap = SLOTS[it.slot] ?? 1, occ = ownedIn(it.slot);
  let free = cap - usedIn(it.slot) - sizeOf(id);
  const out = [];
  for (let i = occ.length - 1; i >= 0 && free < 0; i--) { out.push(occ[i]); free += sizeOf(occ[i]); }
  return out;
}

// цена с учётом торга (обида продавца проходит через минуту)
export function dealPrice(id) {
  const d = st.deals[id];
  if (d && d.until && Date.now() > d.until) delete st.deals[id];
  return st.deals[id] && st.deals[id].kind !== "new" ? st.deals[id].price : itemById[id].price;
}
function priceOf(id) { return st.test ? 0 : dealPrice(id); }

// Торг: у продавца есть тайный нижний предел (60–90% цены) и терпение на 3 неудачных предложения.
// Предложение не ниже предела — продавец соглашается; ниже — встречная цена (ближе к пределу), терпение тает
// (наглое предложение — вдвое быстрее). Терпение кончилось — обида: +10% на минуту. Уступает понемногу —
// поэтому выгоднее сбавлять маленькими шагами.
export const OFFERS = [10, 20, 35]; // % от текущей цены продавца
export function haggleState(id) {
  const it = itemById[id];
  dealPrice(id); // снимет прошедшую обиду
  let d = st.deals[id];
  if (!d) d = st.deals[id] = { kind: "new", price: it.price, floor: Math.round(it.price * (0.6 + Math.random() * 0.3)), patience: 3 };
  return d;
}
export function haggle(id, pct) {
  const it = itemById[id], d = haggleState(id);
  if (d.kind === "angry") return { kind: "still", left: Math.ceil((d.until - Date.now()) / 1000) };
  const offer = Math.max(1, Math.round(d.price * (1 - pct / 100)));
  let res;
  if (offer >= d.floor) { d.kind = "deal"; d.price = offer; res = { kind: "deal", price: offer, pct: Math.round((1 - offer / it.price) * 100) }; }
  else {
    d.patience -= offer < d.floor * 0.85 ? 2 : 1;
    if (d.patience <= 0) { st.deals[id] = { kind: "angry", price: Math.round(it.price * 1.1), until: Date.now() + 60000 }; res = { kind: "angry", price: st.deals[id].price }; }
    else { // встречная цена: середина между его ценой и пределом
      const counter = Math.max(d.floor, Math.round((d.price + d.floor) / 2));
      if (counter < d.price) { d.price = counter; d.kind = "deal"; }
      res = { kind: counter < it.price ? "counter" : "last", price: d.price, offer };
    }
  }
  emit("change");
  return res;
}

// Реставрация покоцанного: возвращаем скидку + работа мастера
export const restoreCost = id => (st.damaged[id] || 0) + 20;
export function restore(id) {
  if (!st.damaged[id]) return false;
  const n = st.test ? 0 : restoreCost(id);
  if (n > st.money) { A.sad(); emit("nomoney", id, n - st.money); return false; }
  st.money -= n; st.owned[id] += st.damaged[id]; delete st.damaged[id];
  emit("restored", id); A.coins(); emit("change");
  return true;
}

// Покупка. quiet — без звуков, тостов и диалогов (для пачек). Возвращает заметку (строку) / null, false — не куплено.
export function buy(id, quiet) {
  const it = itemById[id];
  if (has(id)) return false;
  const blockers = blockersFor(id), surface = SURFACES.has(it.slot);
  if (!surface) { // место по слоту + «встанет ли красиво» (габариты, js/fit.js)
    const rest = { ...st.owned }; blockers.forEach(b => delete rest[b]);
    const fit = fitCheck(id, rest).filter(b => !blockers.includes(b));
    if (blockers.length || fit.length) { if (!quiet) { A.sad(); emit("nospace", id, [...blockers, ...fit], fit.length > 0); } return false; }
  }
  const price = priceOf(id), refund = surface ? refundOf(blockers) : 0;
  if (price > st.money + refund) { if (!quiet) { A.sad(); emit("nomoney", id, price - st.money - refund); } return false; }
  let msg = null;
  if (surface && blockers.length) { blockers.forEach(b => sellQuiet(b)); msg = t("ui.surface.swap", { old: names(blockers), price: fmt(refund) }); }
  let paid = price;
  // советское иногда привозят покоцанным: дешевле, но видно
  if (it.set === "ussr" && !surface && !st.test && Math.random() * 100 < cfg("шанс покоцанного", 25)) {
    const d = Math.round(paid * cfg("скидка за покоцанность", 30) / 100);
    paid -= d; st.damaged[id] = d; msg = t("ui.damaged", { name: nameOf(id), n: fmt(d) });
  }
  if (st.deals[id] && st.deals[id].kind !== "angry") delete st.deals[id];
  if (id === "pss") msg = t("item.pss.bought");
  if (id === "tv") msg = has("tumba") ? t("tv.on.tumba") : t("tv.on.floor");
  if (["bust", "pss", "fish"].includes(id) && !has("stenka") && layout(id, st.owned)[1] === 0) msg = (msg ? msg + " " : "") + t("item.bust.nostenka");
  st.money -= paid; st.owned[id] = paid;
  emit("add", id);
  if (!quiet) { A.thunk(); A.coins(); if (msg) toast(msg); }
  emit("change");
  return msg;
}
// «Продать и купить» из диалога «нет места»
export function sellAndBuy(id, blockers) {
  blockers.forEach(b => sellQuiet(b));
  emit("change");
  return buy(id);
}
function sellQuiet(id) {
  if (!has(id)) return 0;
  const r = st.owned[id];
  st.money += r; delete st.owned[id]; delete st.damaged[id]; emit("remove", id);
  return r;
}
export function sell(id) {
  if (!has(id)) return;
  sellQuiet(id); A.coins(); emit("change");
}
export function sellAll() {
  Object.keys(st.owned).forEach(sellQuiet);
  emit("change");
}

// Раскладывает список по местам: берёт предметы по порядку, пока место не кончится.
function fitSlots(ids) {
  const used = {}, out = [];
  for (const id of ids) {
    const s = itemById[id].slot, cap = SLOTS[s] ?? 1, n = sizeOf(id);
    if ((used[s] || 0) + n <= cap) { used[s] = (used[s] || 0) + n; out.push(id); }
  }
  return { out, used };
}

// Предложение «набор целиком»: что купим, что придётся продать, сколько стоит со скидкой.
export function setOffer(set) {
  // pref — что ставится при покупке набора, если на место есть варианты (СССР: покоцанный паркет)
  const ids = CATALOG.filter(i => i.set === set && !i.deficit).sort((a, b) => (b.pref ? 1 : 0) - (a.pref ? 1 : 0)).map(i => i.id);
  if (!ids.length) return null;
  const { out, used } = fitSlots(ids);
  const toBuy = out.filter(id => !has(id));
  // конфликты: чужие предметы на местах, которые набор займёт целиком
  // чужие наборы уходят целиком: комната становится «чистым» набором (питомцы остаются)
  const conflicts = Object.keys(st.owned).filter(id => itemById[id].set && itemById[id].set !== set);
  for (const s of Object.keys(used)) {
    let free = (SLOTS[s] ?? 1) - used[s];
    for (const id of ownedIn(s)) {
      if (out.includes(id) || conflicts.includes(id)) continue;
      if (free >= sizeOf(id)) free -= sizeOf(id); else conflicts.push(id);
    }
  }
  const disc = cfg("скидка на набор", 40) / 100;
  const full = toBuy.reduce((s, id) => s + itemById[id].price, 0);
  const each = Object.fromEntries(toBuy.map(id => [id, Math.round(itemById[id].price * (1 - disc))]));
  const price = st.test ? 0 : Object.values(each).reduce((a, b) => a + b, 0);
  return { set, all: out, toBuy, conflicts, full, price, each, disc };
}

export function buySet(set) {
  const o = setOffer(set);
  if (!o) return;
  if (!o.toBuy.length) { toast(t("ui.set.have", { set: t("set." + set) })); return; }
  const refund = refundOf(o.conflicts);
  if (o.price > st.money + refund) { A.sad(); emit("nomoney", null, o.price - st.money - refund); return; }
  o.conflicts.forEach(id => sellQuiet(id));
  st.money -= o.price;
  emit("change");
  // предметы падают по очереди; место и деньги уже зарезервированы
  o.toBuy.forEach((id, i) => setTimeout(() => {
    if (!has(id)) { st.owned[id] = st.test ? 0 : o.each[id]; emit("add", id); emit("change"); }
    A.thunk();
    if (i === o.toBuy.length - 1) {
      A.coins();
      let msg = st.test ? t("ui.set.done.test", { set: t("set." + set) }) : t("ui.set.done", { set: t("set." + set), save: fmt(o.full - o.price) });
      if (o.conflicts.length) msg += "<br>" + t("ui.set.sold", { list: names(o.conflicts), price: fmt(refund) });
      if (CATALOG.some(it => it.set === set && it.deficit)) msg += "<br>" + t("ui.set.deficit." + set);
      toast(msg, 6000);
    }
  }, i * 140));
}

export function reset(budget) {
  sellAll(); st.money = budget; st.watched = false; emit("change");
  toast(t("ui.reset"));
}
// Тестовый режим: купить всё разом — по одному на место
export function testBuyAll() {
  sellAll();
  const { out } = fitSlots(CATALOG.map(i => i.id));
  out.forEach((id, i) => setTimeout(() => { buy(id, true); if (i % 3 === 0) A.thunk(); }, i * 90));
  setTimeout(() => toast(t("test.all.done", { n: out.length, total: CATALOG.length })), out.length * 90);
}
