// Интерфейс: тосты, деньги, каталог плиткой (разделы × наборы), карточка, диалоги, круговое меню, тестовая панель.
import { st, has, on } from "./state.js";
import { CATS, SETS, CATALOG, SLOTS, itemById, nameOf, descOf, actOf } from "./catalog.js";
import { t, cfg } from "./texts.js";
import { buy, sell, sellAndBuy, setOffer, buySet, reset, testBuyAll, sellAll, names, dealPrice, haggle, haggleState, OFFERS } from "./shop.js";
import { quiz, share } from "./earn.js";
import * as A from "./audio.js";

const $ = (id) => document.getElementById(id);
export const thumbs = {};
let actionHandler = () => {};
export const setActionHandler = f => { actionHandler = f; };

let toastT;
export function toast(html, ms = 3400) {
  const el = $("toast"); el.innerHTML = html; el.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), ms);
}
export const fmt = n => n.toLocaleString("ru-RU").replace(/ /g, " ");

let shownMoney = 0;
export function tickMoney() {
  const el = $("money");
  if (st.test) { if (el.textContent !== t("test.badge")) el.textContent = t("test.badge"); return; }
  if (shownMoney !== st.money) {
    const d = st.money - shownMoney; shownMoney += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) / 8));
    el.textContent = fmt(shownMoney);
  }
}

export function updateUI() {
  $("goal").classList.toggle("done", st.watched);
  $("goal-text").textContent = t(st.watched ? "ui.goal.done" : has("tv") ? "ui.goal.tv" : "ui.goal.start");
  renderTiles(); renderOffers();
}

// ---------- Диалог: заголовок, текст, кнопки ----------
export function dialog({ title, html = "", buttons = [], cls = "" }) {
  const d = $("dlg");
  d.className = cls; d.hidden = false;
  d.innerHTML = `<button class="x">✕</button><h3>${title}</h3>${html}<div class="btns">` +
    buttons.map((b, i) => `<button class="${b.cls || ""}" data-i="${i}">${b.t}</button>`).join("") + "</div>";
  const close = () => { d.hidden = true; };
  d.onclick = e => {
    if (e.target.closest(".x")) { A.blip(700, 0.03); close(); return; }
    const b = e.target.closest("[data-i]"); if (!b) return;
    const btn = buttons[+b.dataset.i];
    if (!btn.keep) close();
    btn.a && btn.a();
  };
  return close;
}
export const closeDialog = () => { $("dlg").hidden = true; };

function noSpace(id, blockers, tight) {
  const it = itemById[id], refund = blockers.reduce((s, b) => s + st.owned[b], 0);
  const cap = SLOTS[it.slot] ?? 1;
  const text = tight ? t("ui.nospace.tight", { list: names(blockers), price: fmt(refund) })
    : it.slot === "pets" ? t("ui.nospace.pets", { list: names(blockers), price: fmt(refund) })
    : cap > 1 ? t("ui.nospace.many", { list: names(blockers), price: fmt(refund), cap })
    : t("ui.nospace.text", { list: names(blockers), price: fmt(refund) });
  dialog({
    title: t(it.slot === "pets" || tight ? "ui.nospace.pets.title" : "ui.nospace.title"), html: `<p>${text}</p>`,
    buttons: [{ t: t("ui.nospace.sellbuy"), cls: "main", a: () => sellAndBuy(id, blockers) }, { t: t("ui.cancel") }],
  });
}
function noMoney(id, need) {
  dialog({
    title: t("ui.nomoney.title", { n: fmt(need) }), html: `<p>${t("ui.nomoney.text")}</p>`,
    buttons: [
      { t: t("ui.nomoney.share", { n: fmt(cfg("награда за шеринг", 1000)) }), cls: "main", a: share },
      { t: t("ui.nomoney.quiz", { n: fmt(cfg("награда за вопрос", 150)) }), cls: "main alt", a: quiz },
    ],
  });
}

// ---------- Каталог ----------
let cat = "all", set = "all";
const setBadge = s => s ? `<span class="badge set-${s}" title="${t("set." + s)}">${t("set." + s + ".icon")}</span>` : "";
function priceTag(i) {
  const p = dealPrice(i.id);
  return p === i.price ? `<span class="pr">₽${fmt(i.price)}</span>` : `<span class="pr ${p < i.price ? "down" : "up"}">₽${fmt(p)}</span>`;
}
// Торг: кнопки «предложить −10 / −20 / −35%» от текущей цены продавца, «купить», реплика продавца сверху
function haggleDialog(id, said) {
  const name = nameOf(id), d = haggleState(id), price = dealPrice(id);
  const angry = d.kind === "angry";
  const text = said || (angry ? t("haggle.still", { s: Math.ceil((d.until - Date.now()) / 1000) }) : t("haggle.start", { price: fmt(price) }));
  const offers = angry ? [] : OFFERS.map(p => ({ t: t("haggle.offer", { price: fmt(Math.max(1, Math.round(d.price * (1 - p / 100)))), pct: p }), cls: "ans", keep: true, a: () => {
    const r = haggle(id, p);
    if (r.kind === "deal") A.deal(); else if (r.kind === "angry") A.huff(); else A.blip(500, 0.06);
    haggleDialog(id, t("haggle." + r.kind, { name, price: fmt(r.price), pct: r.pct || 0, offer: fmt(r.offer || 0) }));
  } }));
  const left = angry ? "" : `<div class="patience">${t("haggle.patience")} ${"😐".repeat(Math.max(0, d.patience))}</div>`;
  dialog({
    title: t("haggle.title", { name }), cls: "haggle-dlg",
    html: `<p class="q">${text}</p>${left}<p class="hint">${t("haggle.tip")}</p>`,
    buttons: [...offers, { t: t("haggle.buy", { price: fmt(price) }), cls: "main", a: () => buy(id) }, { t: t("ui.cancel") }],
  });
}
function renderTiles() {
  const list = CATALOG.filter(i => (cat === "all" || i.cat === cat) && (set === "all" || i.set === set));
  $("tiles").innerHTML = list.length ? list.map(i =>
    `<button class="tile ${has(i.id) ? "owned" : ""} ${i.must ? "must" : ""}" data-id="${i.id}">
      <img src="${thumbs[i.id] || ""}" alt="">${setBadge(i.set)}${priceTag(i)}${has(i.id) ? "" : `<span class="haggle" title="${t("haggle.btn")}">🤝</span>`}</button>`).join("")
    : `<div class="empty">${t("ui.empty")}</div>`;
}
function renderOffers() {
  $("set-offers").innerHTML = SETS.filter(s => s !== "all").map(s => {
    const o = setOffer(s);
    if (!o) return `<button class="offer set-${s}" disabled>${t("ui.set.btn", { set: t("set." + s) })}<small>${t("ui.set.soon")}</small></button>`;
    const price = o.toBuy.length ? t("ui.set.price", { price: fmt(o.price), full: fmt(o.full), disc: Math.round(o.disc * 100) }) : t("ui.set.full");
    return `<button class="offer set-${s}" data-set="${s}">${t("ui.set.btn", { set: t("set." + s) })}<small>${price}</small></button>`;
  }).join("");
}
export function openTray(on) {
  $("tray").hidden = !on; $("btn-buy").classList.toggle("on", on); $("card").hidden = true;
  A.buyMusic(on);
}

// ---------- Круговое меню ----------
let pieExtras = () => [];
export const setPieExtras = f => { pieExtras = f; };
export function showPie(id, x, y) {
  const pie = $("pie");
  A.blip(1500, 0.03);
  const opts = [{ t: actOf(id), a: () => actionHandler(id) }, ...pieExtras(id), { t: t("ui.sell", { price: st.owned[id] }), a: () => sell(id), cls: "sell" }];
  // пункты столбиком прямо под курсором (название — чуть выше), чтобы не тянуться мышкой
  const list = opts.slice(0, 5), STEP = 32, Y0 = 14;
  pie.innerHTML = `<div class="center" style="top:-24px">${nameOf(id)}</div>` + list.map((o, i) =>
    `<button class="opt ${o.cls || ""}" data-i="${i}" style="left:0;top:${Y0 + i * STEP}px;animation-delay:${i * 30}ms">${o.t}</button>`).join("");
  pie.style.left = Math.min(innerWidth - 130, Math.max(130, x)) + "px";
  const below = Y0 + (list.length - 1) * STEP + 22;
  pie.style.top = Math.max(44, Math.min($("panel").getBoundingClientRect().top - below - 6, y)) + "px";
  pie.hidden = false;
  pie.onclick = e => { const b = e.target.closest(".opt"); if (!b) return; pie.hidden = true; opts[+b.dataset.i].a(); };
}
export const hidePie = () => { $("pie").hidden = true; };

function chips(el, keys, prefix, cur, onPick) {
  el.innerHTML = keys.map(k => `<button data-k="${k}" class="${k === cur ? "on" : ""} ${prefix === "set" && k !== "all" ? "set-" + k : ""}">${prefix === "set" && k !== "all" ? t("set." + k + ".icon") + " " : ""}${t(prefix + "." + k)}</button>`).join("");
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    A.blip(1300, 0.03);
    [...el.children].forEach(x => x.classList.toggle("on", x === b));
    onPick(b.dataset.k); renderTiles();
  });
}

export function initUI() {
  document.title = t("ui.title");
  $("loading").textContent = t("ui.loading");
  $("btn-buy").innerHTML = `<span class="ico">🛒</span>${t("ui.buy")}`;
  $("btn-sound").title = t("ui.sound"); $("btn-music").title = t("ui.music"); $("btn-sfx").title = t("ui.sfx");
  $("reset").textContent = t("ui.sell.all");
  document.querySelector(".tvz-help").textContent = t("tv.help");
  $("tvz-close").textContent = t("tv.back");
  document.querySelector(".ep-note").textContent = t("tv.ep.note");
  document.querySelector(".chan-nosig").textContent = t("tv.nosig");
  shownMoney = st.money; $("money").textContent = fmt(st.money);

  chips($("cats"), CATS, "cat", cat, k => { cat = k; });
  chips($("sets"), SETS, "set", set, k => { set = k; });
  $("tiles").addEventListener("click", e => {
    const b = e.target.closest(".tile"); if (!b) return;
    const id = b.dataset.id;
    if (e.target.closest(".haggle")) { haggleDialog(id); return; }
    if (has(id)) {
      // обои и пол в комнате не кликаются — снимаем их тут
      if (["walls", "floor"].includes(itemById[id].slot)) dialog({
        title: t("room.remove.title", { name: nameOf(id) }), html: `<p>${t("room.remove.text", { price: fmt(st.owned[id]) })}</p>`,
        buttons: [{ t: t("room.remove.ok"), cls: "main", a: () => sell(id) }, { t: t("ui.cancel") }],
      });
      else toast(t("ui.owned"));
      return;
    }
    buy(id);
  });
  $("tiles").addEventListener("mousemove", e => {
    const b = e.target.closest(".tile"), card = $("card");
    if (!b) { card.hidden = true; return; }
    const id = b.dataset.id, it = itemById[id], r = b.getBoundingClientRect();
    card.innerHTML = `<h4>${nameOf(id)}</h4>${it.set ? `<div class="set-name">${setBadge(it.set)} ${t("set." + it.set)}</div>` : ""}<p>${descOf(id)}</p><div class="pr">₽ ${fmt(dealPrice(id))}${dealPrice(id) !== it.price ? ` <s>₽${fmt(it.price)}</s>` : ""}</div>${has(id) ? "" : `<div class="hint">${t("haggle.hint")}</div>`}`;
    card.hidden = false;
    card.style.left = Math.min(innerWidth - 314, Math.max(8, r.left - 110)) + "px";
    card.style.top = Math.max(8, r.top - card.offsetHeight - 12) + "px";
  });
  $("tiles").addEventListener("mouseleave", () => { $("card").hidden = true; });
  $("set-offers").addEventListener("click", e => { const b = e.target.closest("[data-set]"); if (b) buySet(b.dataset.set); });

  $("btn-buy").addEventListener("click", () => { A.blip(900, 0.04); openTray($("tray").hidden); });
  $("tray-close").addEventListener("click", () => openTray(false));
  $("btn-sound").addEventListener("click", () => { const m = A.toggleMute(); $("btn-sound").textContent = m ? "🔇" : "🔊"; });
  const musicBtn = () => { $("btn-music").classList.toggle("off", !A.isShopMusic()); };
  $("btn-music").addEventListener("click", () => { const m = A.toggleShopMusic(); musicBtn(); toast(t(m ? "ui.music.on" : "ui.music.off")); });
  musicBtn();
  const sfxBtn = () => { $("btn-sfx").textContent = A.isLive() ? "🎙" : "🎹"; };
  $("btn-sfx").addEventListener("click", () => { const l = A.toggleLive(); sfxBtn(); toast(t(l ? "ui.sfx.live" : "ui.sfx.synth")); });
  sfxBtn();
  $("reset").addEventListener("click", () => reset(cfg("бюджет", 1500)));

  // тестовая панель видна только в тестовом режиме
  const tp = $("test-panel");
  tp.hidden = !st.test;
  $("test-all").textContent = t("test.all"); $("test-clear").textContent = t("test.clear");
  $("test-all").addEventListener("click", testBuyAll);
  $("test-clear").addEventListener("click", () => { sellAll(); toast(t("ui.reset")); });

  on("change", updateUI);
  on("nospace", noSpace);
  on("nomoney", noMoney);
}
