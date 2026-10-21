// Общее состояние игры и простые события между модулями.
import { cfg } from "./texts.js";

export const st = {
  money: 0, owned: {}, watched: false,
  v4: {},          // id → true: предмет показан «как было в v4»
  boxBonus: false, // шкатулку уже сдавали в музей
  deals: {},       // торг: id → { price, until, kind } (скидка держится до покупки, обида — минуту)
  damaged: {},     // покоцанное советское: id → сколько скинули
  test: false, // бесконечные деньги: ?test в адресе или «тест = да» в настройки.txt
};
export const has = id => st.owned[id] != null;

export function initState() {
  st.money = cfg("бюджет", 1500);
  st.test = new URLSearchParams(location.search).has("test") || cfg("тест", false) === true;
}

const handlers = {};
export const on = (ev, f) => { (handlers[ev] = handlers[ev] || []).push(f); };
export const emit = (ev, ...a) => (handlers[ev] || []).forEach(f => f(...a));
