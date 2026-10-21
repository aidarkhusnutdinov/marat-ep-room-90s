// Тексты, вопросы и настройки из txt-файлов рядом с index.html — Айдар правит их руками.
const TXT = {}, CFG = {};
export const QUESTIONS = [];

async function load(f) {
  const r = await fetch(encodeURI(f), { cache: "no-cache" });
  if (!r.ok) throw new Error("нет файла " + f);
  return (await r.text()).replace(/^﻿/, "");
}
const strip = s => s.replace(/(^|\s)#.*$/, "").trim(); // комментарий: # в начале строки или после пробела

// [раздел] + «ключ = текст» → TXT["раздел.ключ"]
function parseTexts(src) {
  let sec = "";
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^\[(.+)\]$/);
    if (m) { sec = m[1].trim(); continue; }
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
    TXT[sec ? sec + "." + k : k] = v.split(/\s*\|\s*/);
  }
}
function parseCfg(src) {
  for (const raw of src.split(/\r?\n/)) {
    const line = strip(raw), i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
    CFG[k] = /^-?\d+(\.\d+)?$/.test(v) ? +v : v === "да" ? true : v === "нет" ? false : v;
  }
}
// ? вопрос / + верный / - неверный
function parseQuestions(src) {
  let q = null;
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("#")) continue;
    if (line.startsWith("?")) { q = { q: line.slice(1).trim(), right: null, wrong: [] }; QUESTIONS.push(q); }
    else if (q && line.startsWith("+")) q.right = line.slice(1).trim();
    else if (q && line.startsWith("-")) q.wrong.push(line.slice(1).trim());
  }
  for (let i = QUESTIONS.length - 1; i >= 0; i--)
    if (!QUESTIONS[i].right || !QUESTIONS[i].wrong.length) { console.warn("вопрос без ответов:", QUESTIONS[i].q); QUESTIONS.splice(i, 1); }
}

export async function loadTexts() {
  const [t, q, c] = await Promise.all([load("тексты.txt"), load("вопросы.txt"), load("настройки.txt")]);
  parseTexts(t); parseQuestions(q); parseCfg(c);
}

// t("item.tv.name"), t("ui.start", { n: "1 500" }); при нескольких вариантах — случайный
export function t(key, vars) {
  const a = TXT[key];
  if (!a) { console.warn("нет текста:", key); return key; }
  let s = a[Math.floor(Math.random() * a.length)];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return s;
}
export const hasText = key => TXT[key] != null;
export const cfg = (k, def) => CFG[k] != null ? CFG[k] : def;
