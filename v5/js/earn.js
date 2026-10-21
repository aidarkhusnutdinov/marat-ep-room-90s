// Заработок: вопрос-викторина и «поделиться игрой». Вопросы — из вопросы.txt, суммы — из настройки.txt.
import { st, emit } from "./state.js";
import { QUESTIONS, t, cfg } from "./texts.js";
import { dialog, toast, fmt } from "./ui.js";
import * as A from "./audio.js";

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let queue = [], waitUntil = 0;
const shared = new Set();
const pay = n => { st.money += n; A.coins(); emit("change"); };

export function quiz() {
  const left = Math.ceil((waitUntil - Date.now()) / 1000);
  if (left > 0) { toast(t("quiz.wait", { s: left })); return; }
  if (!QUESTIONS.length) { toast(t("quiz.empty")); return; }
  if (!queue.length) queue = shuffle(QUESTIONS.slice());
  const q = queue.pop(), n = cfg("награда за вопрос", 150);
  const answers = shuffle([q.right, ...q.wrong.slice(0, 3)]);
  dialog({
    title: t("quiz.title", { n: fmt(n) }), html: `<p class="q">${q.q}</p>`, cls: "quiz",
    buttons: answers.map(a => ({ t: a, cls: "ans", a: () => {
      const ok = a === q.right, pause = cfg("пауза после ошибки", 0);
      if (ok) { A.right(); pay(n); } else { A.wrong(); waitUntil = Date.now() + pause * 1000; }
      // сразу предлагаем следующий вопрос — ждать не надо (пауза после ошибки — в настройки.txt, по умолчанию 0)
      dialog({
        title: ok ? t("quiz.right", { n: fmt(n) }) : t("quiz.miss"), cls: "quiz",
        html: ok ? "" : `<p>${t(pause > 0 ? "quiz.wrong" : "quiz.wrong.now", { a: q.right, s: pause })}</p>`,
        buttons: [{ t: t("quiz.more", { n: fmt(n) }), cls: "main", a: quiz }, { t: t("quiz.enough") }],
      });
    } })),
  });
}

function reward(net, pre = "") {
  const n = cfg("награда за шеринг", 1000);
  if (shared.has(net)) { toast(pre + t("share.again")); return; }
  shared.add(net); A.share(); pay(n); toast(pre + t("share.done", { n: fmt(n) }));
}
export function share() {
  const url = cfg("ссылка для шеринга", location.href.split("?")[0]), text = t("share.msg");
  // на телефоне — системное меню «Поделиться»; проверить настоящий пост браузер не может, платим за попытку
  if (navigator.share && matchMedia("(pointer: coarse)").matches) {
    navigator.share({ title: t("ui.title"), text, url }).then(() => reward("system")).catch(() => {});
    return;
  }
  const u = encodeURIComponent(url), tx = encodeURIComponent(text);
  const open = (net, href) => () => { window.open(href, "_blank", "noopener"); reward(net); };
  dialog({
    title: t("share.title"), html: `<p>${t("share.text", { n: fmt(cfg("награда за шеринг", 1000)) })}</p>`,
    buttons: [
      { t: t("share.vk"), cls: "vk", a: open("vk", `https://vk.com/share.php?url=${u}&title=${tx}`) },
      { t: t("share.tg"), cls: "tg", a: open("tg", `https://t.me/share/url?url=${u}&text=${tx}`) },
      { t: t("share.wa"), cls: "wa", a: open("wa", `https://wa.me/?text=${tx}%20${u}`) },
      // у Инстаграма нет ссылки «поделиться»: копируем адрес и открываем Инстаграм — вставить в сторис или в директ
      { t: t("share.ig"), cls: "ig", a: () => { navigator.clipboard?.writeText(url).catch(() => {}); window.open("https://www.instagram.com/", "_blank", "noopener"); reward("ig", t("share.ig.copied") + "<br>"); } },
      { t: t("share.copy"), a: () => { navigator.clipboard?.writeText(url).catch(() => {}); reward("copy", t("share.copied") + "<br>"); } },
    ],
  });
}
