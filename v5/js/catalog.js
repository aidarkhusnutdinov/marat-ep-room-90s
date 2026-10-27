// Каталог: только данные. Названия, описания и реплики — в тексты.txt ([item.<id>]).
// set — набор (ussr / neformal / kapital; у питомцев нет), cat — раздел,
// slot — место в комнате (см. SLOTS), size — сколько места занимает (по умолчанию 1),
// deficit — не входит в покупку набора целиком («не завезли»), pref — его ставит покупка набора, если на место есть варианты.
// Поверхности: img — фото (assets/items/…), gen — процедурная текстура, tile — размер плитки в метрах [ш, в],
// anim — анимация поверх вида из окна (fire / pioneers / skate).
import { t } from "./texts.js";

export const SETS = ["all", "ussr", "neformal", "kapital"];
export const CATS = ["all", "tech", "furn", "decor", "ideo", "remont", "window", "pets"];

// Сколько помещается на каждое место. Поверхности (пол, стены, окно, батарея) — одна активная,
// покупка новой автоматически продаёт старую с возвратом денег.
export const SLOTS = {
  wallBig: 1,   // стенка / шкаф / шведская стенка у задней стены
  tvStand: 1,   // тумба под телевизор
  tvSpot: 1,    // телевизор
  audioSpot: 1, // радиола / музыкальный центр
  sofaSpot: 1,  // диван / пуфик
  tableSpot: 1, // журнальный столик
  chairSpot: 1, // кресло
  deskChair: 1, // компьютерное кресло у стола
  lampSpot: 1,  // торшер
  wallRug: 1,   // ковёр на стену
  floorRug: 1,  // ковёр на пол
  wallClock: 1, // часы на стене
  poster: 1,    // вымпел / постер над телевизором
  sill: 2,      // подоконник
  small: 6,     // мелочь на полках и столах
  pcSpot: 1,    // компьютер
  skate: 1,     // скейт у стены
  floorSmall: 2, // шкура / маленький коврик в углу
  croc: 1,      // крокодил ползает по полу
  safe: 1,      // сейф в углу
  serverSpot: 1, // квантовый сервер
  pets: 6,      // питомцы: сумма «веса» (size), берётся из настройки.txt «вместимость питомцев»
  floor: 1, walls: 1, window: 1, radiator: 1,
};
export const SURFACES = new Set(["floor", "walls", "window", "radiator"]);

export const CATALOG = [
  { id: "tv", set: "ussr", cat: "tech", price: 300, slot: "tvSpot", must: true },
  { id: "radiola", set: "ussr", cat: "tech", price: 150, slot: "audioSpot" },
  { id: "stenka", set: "ussr", cat: "furn", price: 350, slot: "wallBig" },
  { id: "tumba", set: "ussr", cat: "furn", price: 60, slot: "tvStand" },
  { id: "sofa", set: "ussr", cat: "furn", price: 280, slot: "sofaSpot" },
  { id: "kreslo", set: "ussr", cat: "furn", price: 200, slot: "chairSpot" },
  { id: "table", set: "ussr", cat: "furn", price: 80, slot: "tableSpot" },
  { id: "torsher", set: "ussr", cat: "furn", price: 90, slot: "lampSpot" },
  { id: "kover", set: "ussr", cat: "decor", price: 180, slot: "wallRug" },
  { id: "kover3", set: "ussr", cat: "decor", price: 210, slot: "wallRug" },
  { id: "rug", set: "ussr", cat: "decor", price: 150, slot: "floorRug" },
  { id: "slon", set: "ussr", cat: "decor", price: 65, slot: "small" },
  { id: "box", set: "ussr", cat: "decor", price: 90, slot: "small" },
  { id: "clock", set: "ussr", cat: "decor", price: 70, slot: "wallClock" },
  { id: "begonia", set: "ussr", cat: "decor", price: 25, slot: "sill" },
  { id: "fish", set: "ussr", cat: "decor", price: 70, slot: "small" },
  { id: "mug", set: "ussr", cat: "decor", price: 10, slot: "small" },
  { id: "vympel", set: "ussr", cat: "ideo", price: 40, slot: "poster" },
  { id: "bust", set: "ussr", cat: "ideo", price: 120, slot: "small" },
  { id: "pss", set: "ussr", cat: "ideo", price: 150, slot: "small" },

  // ---------- Неформал 2003 ----------
  { id: "pc", set: "neformal", cat: "tech", price: 433, slot: "pcSpot" },
  { id: "music", set: "neformal", cat: "tech", price: 350, slot: "audioSpot" },
  { id: "cdtower", set: "neformal", cat: "tech", price: 90, slot: "lampSpot" },
  { id: "shkaf", set: "neformal", cat: "furn", price: 300, slot: "wallBig" },
  { id: "shved", set: "neformal", cat: "furn", price: 250, slot: "wallBig" },
  { id: "pufik", set: "neformal", cat: "furn", price: 120, slot: "sofaSpot" },
  { id: "desk", set: "neformal", cat: "furn", price: 200, slot: "tvStand" },
  { id: "rug_egypt", set: "neformal", cat: "decor", price: 160, slot: "floorRug" },
  { id: "pad", set: "neformal", cat: "decor", price: 15, slot: "small" },
  { id: "poster", set: "neformal", cat: "ideo", price: 60, slot: "wallRug" },
  { id: "cool", set: "neformal", cat: "ideo", price: 20, slot: "small" },
  { id: "skate", set: "neformal", cat: "ideo", price: 110, slot: "skate" },
  { id: "officechair", set: "neformal", cat: "furn", price: 140, slot: "deskChair" },
  { id: "ctable", set: "neformal", cat: "furn", price: 90, slot: "tableSpot" },
  { id: "soks", set: "neformal", cat: "ideo", price: 30, slot: "small" },

  // ---------- Разгул капитализма ----------
  { id: "audio", set: "kapital", cat: "tech", price: 1500, slot: "audioSpot" },
  { id: "brain", set: "kapital", cat: "tech", price: 3000, slot: "serverSpot" },
  { id: "bossdesk", set: "kapital", cat: "furn", price: 1200, slot: "tableSpot" },
  { id: "goldchair", set: "kapital", cat: "furn", price: 700, slot: "chairSpot" },
  { id: "tumbochka", set: "kapital", cat: "furn", price: 500, slot: "tvStand" },
  { id: "giraffe", set: "kapital", cat: "decor", price: 900, slot: "lampSpot" },
  { id: "rug_lux", set: "kapital", cat: "decor", price: 800, slot: "floorRug" },
  { id: "leopard", set: "kapital", cat: "decor", price: 600, slot: "floorSmall" },
  { id: "pinkrug", set: "kapital", cat: "decor", price: 300, slot: "floorSmall" },
  { id: "square", set: "kapital", cat: "decor", price: 1500, slot: "poster" },
  { id: "croc", set: "kapital", cat: "ideo", price: 1000, slot: "croc" },
  { id: "yeltsin", set: "kapital", cat: "ideo", price: 1100, slot: "wallRug" },
  { id: "safe", set: "kapital", cat: "ideo", price: 1300, slot: "safe" },
  { id: "ruble", set: "kapital", cat: "ideo", price: 400, slot: "small" },

  // ---------- Питомцы (size — «вес»: пёс 3, бобёр и кошки 2, черепаха и тарантул 1) ----------
  { id: "dobraya", cat: "pets", price: 150, slot: "pets", size: 2 },
  { id: "machka", cat: "pets", price: 180, slot: "pets", size: 2 },
  { id: "sglaz", cat: "pets", price: 166, slot: "pets", size: 2 },
  { id: "matvey", cat: "pets", price: 250, slot: "pets", size: 3 },
  { id: "chirik", cat: "pets", price: 90, slot: "pets", size: 1 },
  { id: "tarantul", cat: "pets", price: 120, slot: "pets", size: 1 },
  { id: "mihalych", cat: "pets", price: 220, slot: "pets", size: 2 },

  // ---------- Ремонт: обои, пол, батарея ----------
  { id: "wall_ussr1", set: "ussr", cat: "remont", price: 120, slot: "walls", img: "assets/wallpaper.jpg", tile: [1.1, 1.34] },
  { id: "wall_ussr2", set: "ussr", cat: "remont", price: 140, slot: "walls", img: "assets/items/ussr/wall_ussr2.jpg", tile: [0.7, 0.8] },
  { id: "wall_beavis", set: "neformal", cat: "remont", price: 200, slot: "walls", img: "assets/items/neformal/wall_beavis.jpg", tile: [2.8, 0.9] },
  { id: "wall_stereo", set: "neformal", cat: "remont", price: 180, slot: "walls", img: "assets/items/neformal/wall_stereo.jpg", tile: [1.2, 0.95] },
  { id: "wall_peacock", set: "kapital", cat: "remont", price: 450, slot: "walls", img: "assets/items/kapital/wall_peacock.jpg", tile: [1.3, 1.3] },
  { id: "wall_damask", set: "kapital", cat: "remont", price: 380, slot: "walls", img: "assets/items/kapital/wall_damask.jpg", tile: [3.1, 1.0] },
  { id: "floor_parq_new", set: "ussr", cat: "remont", price: 260, slot: "floor", img: "assets/items/ussr/floor_parq_new.jpg", gen: "parquet", tile: [2.2, 2.2] },
  { id: "floor_parq_old", set: "ussr", cat: "remont", price: 90, slot: "floor", img: "assets/items/ussr/floor_parq_old.jpg", gen: "parquet", old: true, pref: true, tile: [2.2, 2.2] },
  { id: "floor_kovrolin", set: "neformal", cat: "remont", price: 150, slot: "floor", img: "assets/items/neformal/floor_kovrolin.jpg", tile: [1.6, 2.2] },
  { id: "floor_gold", set: "kapital", cat: "remont", price: 700, slot: "floor", gen: "goldFloor", tile: [2, 2] },
  { id: "floor_sea", set: "kapital", cat: "remont", price: 900, slot: "floor", img: "assets/items/kapital/floor_sea.jpg", tile: [5.1, 2.35] },
  { id: "rad_iron", set: "ussr", cat: "remont", price: 120, slot: "radiator", img: "assets/items/ussr/rad_iron.png" },
  { id: "rad_gold", set: "kapital", cat: "remont", price: 800, slot: "radiator" },

  // ---------- За окном ----------
  { id: "win_green", set: "ussr", cat: "window", price: 80, slot: "window", img: "assets/window.jpg" },
  { id: "win_fire", set: "ussr", cat: "window", price: 250, slot: "window", gen: "fire", anim: "fire" },
  { id: "win_mausoleum", set: "ussr", cat: "window", price: 200, slot: "window", img: "assets/items/ussr/win_mausoleum.jpg" },
  { id: "win_pioneers", set: "ussr", cat: "window", price: 300, slot: "window", gen: "parade", anim: "pioneers" },
  { id: "win_skate", set: "neformal", cat: "window", price: 150, slot: "window", img: "assets/items/neformal/win_skate.jpg", anim: "skate" },
  { id: "win_garages", set: "neformal", cat: "window", price: 60, slot: "window", img: "assets/items/neformal/win_garages.jpg" },
  { id: "win_beach", set: "kapital", cat: "window", price: 500, slot: "window", img: "assets/items/kapital/win_beach.jpg", anim: "dolphin" },
  { id: "win_borovoe", set: "kapital", cat: "window", price: 350, slot: "window", img: "assets/items/kapital/win_borovoe.jpg" },
];
export const itemById = Object.fromEntries(CATALOG.map(i => [i.id, i]));
export const sizeOf = id => itemById[id].size || 1;

// подписи предмета из тексты.txt
export const nameOf = id => t(`item.${id}.name`);
export const descOf = id => t(`item.${id}.desc`);
export const actOf = id => t(`item.${id}.act`);
