// Lección: ejercicios, corrección en panel inferior y segunda oportunidad al final para lo fallado.
import { ui, tr } from "../core/i18n.js";
import { save, persist, TARGET } from "../core/state.js";
import { go } from "../core/router.js";
import { shuffle, pick } from "../core/util.js";
import { speak, beep } from "../core/audio.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, sheet, celebrate } from "../ui/shell.js";
import { LESSON_TYPES, wordsOf, unitOfWord, unitOfPhrase } from "./course.js";

function wordExercise(item, type) {
  const pool = wordsOf(item.unit);
  const options = shuffle([item, ...pick(pool.filter((w) => w.id !== item.id), 3)]);
  return { type, item, options };
}
function phraseExercise(id) {
  const { wrong } = unitOfPhrase(id).phrases.find((p) => p.id === id);
  return { type: "phrase", id, wrong };
}

function makeLesson(unit, li) {
  const words = shuffle(wordsOf(unit));
  if (LESSON_TYPES[li].type === "words") {
    // Tres palabras nuevas: primero se presentan y luego se practican.
    const fresh = words.slice(0, 3);
    const list = fresh.flatMap((w) => [{ type: "intro", item: w }, wordExercise(w, "see")]);
    return [...list, wordExercise(words[3], "see"), wordExercise(fresh[0], "hear")];
  }
  if (LESSON_TYPES[li].type === "listen") return words.slice(0, 7).map((w) => wordExercise(w, "hear")).concat(wordExercise(words[7] || words[0], "see"));
  const phrases = unit.phrases.map((p) => phraseExercise(p.id));
  return shuffle([...phrases, ...phrases.map((p) => ({ ...p })), wordExercise(words[0], "see"), wordExercise(words[1], "hear")]);
}

function makeReview() {
  return pick(save.mistakes, 8).map((m) => {
    if (m.k === "p") return phraseExercise(m.id);
    const item = wordsOf(unitOfWord(m.id)).find((x) => x.id === m.id);
    return wordExercise(item, Math.random() < 0.5 ? "see" : "hear");
  });
}

export function startLesson(unit, li) {
  runLesson({ unit, li, list: makeLesson(unit, li), i: 0, correct: 0, graded: 0 });
}
export function startReview() {
  const list = makeReview();
  if (list.length) runLesson({ review: true, list, i: 0, correct: 0, graded: 0 });
}

function noteResult(ex, ok) {
  const key = ex.type === "phrase" ? { k: "p", id: ex.id } : { k: "w", id: ex.item.id };
  const at = save.mistakes.findIndex((m) => m.k === key.k && m.id === key.id);
  if (!ok && at < 0) save.mistakes.push(key);
  // Acertar en la segunda oportunidad de la misma lección no basta para sacarlo de Repasar.
  if (ok && at >= 0 && !ex.again) save.mistakes.splice(at, 1);
  if (ok && key.k === "w" && !save.learned.includes(key.id)) save.learned.push(key.id);
}

function runLesson(s) {
  if (s.i >= s.list.length) return showResult(s);
  const ex = s.list[s.i];
  const N = save.native, G = TARGET;
  screen("lesson");

  const head = el("div", "lesson-head");
  const bar = el("div", "progress");
  const fillBar = el("div");
  fillBar.style.width = (s.i / s.list.length) * 100 + "%";
  bar.append(fillBar);
  head.append(button("icon-btn", "✕", () => go(s.review ? "review" : "path")), bar);
  app.append(head);
  const next = () => { s.i++; runLesson(s); };

  if (ex.type === "intro") {
    const card = el("div", "card intro");
    card.append(el("div", "bigemoji", ex.item.emoji), txt("div", "bigword", tr(ex.item.id, G), G));
    if (N !== G) card.append(txt("p", "hint", tr(ex.item.id, N), N));
    card.append(button("listen", "🔊", () => speak(tr(ex.item.id, G), G)));
    app.append(speech(ui("newWord"), "talk"), card, el("div", "footer-space"));
    const foot = el("div", "footer");
    foot.append(button("btn", ui("next"), next));
    app.append(foot);
    speak(tr(ex.item.id, G), G);
    return;
  }

  let answered = false;
  const area = el("div", "exercise");
  const answer = (btn, ok, solution) => {
    if (answered) return;
    answered = true;
    beep(ok);
    s.graded++;
    for (const b of area.querySelectorAll(".opt")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) s.correct++;
    else {
      btn.classList.add("wrong");
      // Una segunda oportunidad al final de la lección, con las opciones en otro orden.
      if (!ex.again) s.list.push({ ...ex, again: true, options: ex.options && shuffle(ex.options) });
    }
    noteResult(ex, ok);
    persist();
    speak(solution, G);
    sheet(ok, ok ? ui("great") : ui("answer") + ":", ok ? "" : solution, G, next);
  };
  const addOption = (parent, label, lang, isOk, solution) => {
    const b = txt("button", "opt", label, lang);
    b.type = "button";
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(b, isOk, solution);
    parent.append(b);
  };

  if (ex.type === "see") {
    // La palabra en el idioma de la persona (o el dibujo si es el mismo idioma); se elige en español.
    app.append(speech(ui("howSay"), "talk"));
    area.append(N === G ? el("div", "bigemoji", ex.item.emoji) : txt("div", "bigword", tr(ex.item.id, N), N));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, G), G, o === ex.item, tr(ex.item.id, G));
    area.append(opts);
  } else if (ex.type === "hear") {
    // Escucha en español y elige el significado en su idioma.
    app.append(speech(ui("listen"), "talk"));
    area.append(button("listen big", "🔊", () => speak(tr(ex.item.id, G), G)));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, N), N, o === ex.item, tr(ex.item.id, G));
    area.append(opts);
    speak(tr(ex.item.id, G), G);
  } else {
    const q = "q_" + ex.id, a = "a_" + ex.id;
    app.append(speech(ui("chooseAnswer"), "talk"));
    const quote = el("div", "quote");
    quote.append(button("listen small", "🔊", () => speak(tr(q, G), G)), txt("span", "", tr(q, G), G));
    area.append(quote);
    if (N !== G) area.append(txt("p", "hint", tr(q, N), N));
    const opts = el("div", "options");
    for (const id of shuffle([a, ...ex.wrong.map((w) => "a_" + w)])) addOption(opts, tr(id, G), G, id === a, tr(a, G));
    area.append(opts);
    speak(tr(q, G), G);
  }
  app.append(area);
}

function showResult(s) {
  if (!s.review) save.progress[s.unit.id] = Math.max(save.progress[s.unit.id] || 0, s.li + 1);
  persist();
  celebrate();
  screen("plain");
  const accuracy = s.graded ? Math.round((s.correct / s.graded) * 100) : 100;
  const stats = el("div", "result-stats");
  const stat = (label, value, cls) => {
    const d = el("div", "result-stat " + cls);
    d.append(el("span", "", label), el("strong", "", value));
    return d;
  };
  stats.append(stat("🎯 " + ui("score"), accuracy + "%", "mint"), stat("📚 " + ui("wordsLearned"), String(save.learned.length), "sun"));
  app.append(mascot("cheer", 140), el("h1", "", ui("done")), stats, button("btn big", ui("next"), () => go(s.review ? "review" : "path")));
}
