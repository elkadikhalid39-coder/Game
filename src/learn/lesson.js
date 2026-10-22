// Lección: ejercicios, corrección en panel inferior, salidas sin culpa y segunda oportunidad al final.
// Tipos de ejercicio:
//   intro   palabra nueva con dibujo, traducción y audio
//   see     la palabra en su idioma (o el dibujo) → elegir en español
//   hear    escuchar en español → elegir el significado
//   write   escribir la palabra en español (corrección tolerante)
//   phrase  pregunta en español → elegir la respuesta
//   order   ordenar las palabras de una respuesta
import { ui, tr } from "../core/i18n.js";
import { save, persist, TARGET as G } from "../core/state.js";
import { go } from "../core/router.js";
import { shuffle, pick } from "../core/util.js";
import { speak, beep } from "../core/audio.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, sheet, celebrate } from "../ui/shell.js";
import { LESSON_TYPES, wordsOf, unitOfWord, unitOfPhrase, unitComplete } from "./course.js";
import { checkWritten, sameSentence } from "./answers.js";

const AUDIO_PAUSE_MS = 15 * 60 * 1000;
const audioPaused = () => Date.now() < save.noAudioUntil;

// ---------- Construcción de ejercicios ----------
function wordExercise(item, type) {
  const options = shuffle([item, ...pick(wordsOf(item.unit).filter((w) => w.id !== item.id), 3)]);
  return { type, item, options };
}
function phraseExercise(id, type = "phrase") {
  const { wrong } = unitOfPhrase(id).phrases.find((p) => p.id === id);
  return { type, id, wrong };
}

function makeLesson(unit, li) {
  const words = shuffle(wordsOf(unit));
  const phrases = shuffle(unit.phrases.map((p) => p.id));
  switch (LESSON_TYPES[li].type) {
    case "words": {
      // Tres palabras nuevas: primero se presentan y luego se practican.
      const fresh = words.slice(0, 3);
      return [...fresh.flatMap((w) => [{ type: "intro", item: w }, wordExercise(w, "see")]),
        wordExercise(words[3], "see"), wordExercise(fresh[0], "hear"), wordExercise(fresh[1], "write")];
    }
    case "listen":
      return [...words.slice(0, 6).map((w) => wordExercise(w, "hear")), wordExercise(words[6], "see"), wordExercise(words[7], "write")];
    case "phrases":
      return [...phrases.map((id) => phraseExercise(id)), ...phrases.slice(0, 2).map((id) => phraseExercise(id, "order")),
        wordExercise(words[0], "see"), wordExercise(words[1], "hear")];
    default: // Práctica final: un poco de todo.
      return shuffle([...words.slice(0, 3).map((w) => wordExercise(w, "write")), wordExercise(words[3], "hear"), wordExercise(words[4], "hear"),
        wordExercise(words[5], "see"), ...phrases.map((id) => phraseExercise(id)), phraseExercise(phrases[0], "order"), phraseExercise(phrases[1], "order")]);
  }
}

function makeReview() {
  return pick(save.mistakes, 8).map((m) => {
    if (m.k === "p") return phraseExercise(m.id, Math.random() < 0.5 ? "phrase" : "order");
    const item = wordsOf(unitOfWord(m.id)).find((x) => x.id === m.id);
    return wordExercise(item, pick(["see", "hear", "write"], 1)[0]);
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
  const key = ex.item ? { k: "w", id: ex.item.id } : { k: "p", id: ex.id };
  const at = save.mistakes.findIndex((m) => m.k === key.k && m.id === key.id);
  if (!ok && at < 0) save.mistakes.push(key);
  // Acertar en la segunda oportunidad de la misma lección no basta para sacarlo de Repasar.
  if (ok && at >= 0 && !ex.again) save.mistakes.splice(at, 1);
  if (ok && key.k === "w" && !save.learned.includes(key.id)) save.learned.push(key.id);
}

// Botones de audio: normal y lento.
function audioButtons(text, cls = "") {
  const row = el("span", "audio-row " + cls);
  const slow = button("listen small slow", "🐢", () => speak(text, G, { slow: true }));
  slow.setAttribute("aria-label", ui("slow"));
  row.append(button("listen small", "🔊", () => speak(text, G)), slow);
  return row;
}

// ---------- Lección ----------
function runLesson(s) {
  if (s.i >= s.list.length) return showResult(s);
  let ex = s.list[s.i];
  // Con el audio en pausa, los ejercicios de escuchar pasan a ser de leer.
  if (ex.type === "hear" && audioPaused()) ex = { ...ex, type: "see" };
  const N = save.native;
  screen("lesson");

  const head = el("div", "lesson-head");
  const bar = el("div", "progress");
  const fillBar = el("div");
  fillBar.style.width = (s.i / s.list.length) * 100 + "%";
  bar.append(fillBar);
  head.append(button("icon-btn", "✕", () => go(s.review ? "review" : "path")), bar);
  app.append(head);
  const next = () => { s.i++; runLesson(s); };
  const say = (text) => { if (!audioPaused()) speak(text, G); };

  if (ex.type === "intro") {
    const word = tr(ex.item.id, G);
    const card = el("div", "card intro");
    card.append(el("div", "bigemoji", ex.item.emoji), txt("div", "bigword", word, G));
    if (N !== G) card.append(txt("p", "hint", tr(ex.item.id, N), N));
    card.append(audioButtons(word, "center"));
    app.append(speech(ui("newWord"), "talk"), card, el("div", "footer-space"));
    const foot = el("div", "footer");
    foot.append(button("btn", ui("next"), next));
    app.append(foot);
    say(word);
    return;
  }

  let answered = false;
  const area = el("div", "exercise");
  // ok: acierto; solution: texto correcto en español; note: aviso (tilde o errata) cuando se acepta con un matiz.
  const answer = (ok, solution, { btn, note } = {}) => {
    if (answered) return;
    answered = true;
    beep(ok);
    s.graded++;
    for (const b of area.querySelectorAll(".opt, .tile")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) s.correct++;
    else {
      btn?.classList.add("wrong");
      // Una segunda oportunidad al final de la lección, con las opciones en otro orden.
      if (!ex.again) s.list.push({ ...s.list[s.i], again: true, options: ex.options && shuffle(ex.options) });
    }
    noteResult(ex, ok);
    persist();
    say(solution);
    const title = ok ? ui("great") : ui("answer") + ":";
    const detail = ok ? (note ? ui(note === "accent" ? "noteAccent" : "noteTypo", solution) : "") : solution;
    sheet(ok, title, detail, note ? N : G, next, audioButtons(solution));
  };
  const addOption = (parent, label, lang, isOk, solution) => {
    const b = txt("button", "opt", label, lang);
    b.type = "button";
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(isOk, solution, { btn: b });
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
    const word = tr(ex.item.id, G);
    app.append(speech(ui("listen"), "talk"));
    const big = el("div", "listen-pair");
    const slow = button("listen big slow", "🐢", () => speak(word, G, { slow: true }));
    slow.setAttribute("aria-label", ui("slow"));
    big.append(button("listen big", "🔊", () => speak(word, G)), slow);
    area.append(big);
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, N === G ? o.emoji : tr(o.id, N), N, o === ex.item, word);
    area.append(opts);
    say(word);
  } else if (ex.type === "write") {
    const word = tr(ex.item.id, G);
    app.append(speech(ui("writeIt"), "talk"));
    area.append(el("div", "bigemoji", ex.item.emoji));
    if (N !== G) area.append(txt("div", "bigword small", tr(ex.item.id, N), N));
    const input = el("input", "write-input");
    Object.assign(input, { id: "write-answer", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: false, lang: "es" });
    input.setAttribute("aria-label", ui("writeIt"));
    // Teclas con las letras del español que faltan en muchos teclados.
    const keys = el("div", "es-keys");
    for (const k of ["á", "é", "í", "ó", "ú", "ñ", "ü"]) {
      keys.append(button("key", k, () => { input.setRangeText(k, input.selectionStart, input.selectionEnd, "end"); input.focus(); }));
    }
    const check = () => {
      if (!input.value.trim()) return input.focus();
      const r = checkWritten(input.value, word);
      input.disabled = true;
      input.classList.add(r.ok ? "right" : "wrong");
      answer(r.ok, word, { note: r.note });
    };
    input.onkeydown = (e) => { if (e.key === "Enter") check(); };
    area.append(input, keys, button("btn", ui("check"), check));
    setTimeout(() => input.focus(), 50);
  } else if (ex.type === "order") {
    // Ordenar las palabras de la respuesta (en español) viendo su traducción.
    const sentence = tr("a_" + ex.id, G);
    app.append(speech(ui("orderIt"), "talk"));
    if (N !== G) area.append(txt("div", "quote plain", tr("a_" + ex.id, N), N));
    const built = el("div", "built");
    built.lang = "es";
    const tray = el("div", "tray");
    const words = sentence.split(" ");
    let order = shuffle(words);
    while (words.length > 1 && order.join(" ") === sentence) order = shuffle(words);
    const chosen = [];
    const refresh = () => { checkBtn.disabled = chosen.length !== words.length; };
    order.forEach((w) => {
      const t = button("tile", w, () => {
        if (t.parentElement === tray) { built.append(t); chosen.push(t); } else { tray.append(t); chosen.splice(chosen.indexOf(t), 1); }
        refresh();
      });
      t.lang = "es";
      tray.append(t);
    });
    const checkBtn = button("btn", ui("check"), () => {
      const given = chosen.map((t) => t.textContent).join(" ");
      const ok = sameSentence(given, sentence);
      built.classList.add(ok ? "right" : "wrong");
      answer(ok, sentence);
    });
    checkBtn.disabled = true;
    area.append(built, tray, checkBtn);
  } else {
    // Pregunta en español → elegir la respuesta.
    const q = tr("q_" + ex.id, G), a = "a_" + ex.id;
    app.append(speech(ui("chooseAnswer"), "talk"));
    const quote = el("div", "quote");
    quote.append(audioButtons(q), txt("span", "", q, G));
    area.append(quote);
    if (N !== G) area.append(txt("p", "hint", tr("q_" + ex.id, N), N));
    const opts = el("div", "options");
    for (const id of shuffle([a, ...ex.wrong.map((w) => "a_" + w)])) addOption(opts, tr(id, G), G, id === a, tr(a, G));
    area.append(opts);
    say(q);
  }

  // Salidas sin culpa: saltar (vuelve al final, sin contar como error) y pausar los ejercicios de escuchar.
  const exits = el("div", "exits");
  exits.append(button("link", ui("skip") + " →", () => {
    if (answered) return;
    if (!ex.again && !ex.skipped) s.list.push({ ...s.list[s.i], skipped: true });
    next();
  }));
  if (ex.type === "hear") {
    exits.append(button("link", "🔇 " + ui("cantListen"), () => {
      save.noAudioUntil = Date.now() + AUDIO_PAUSE_MS;
      persist();
      window.speechSynthesis?.cancel();
      runLesson(s); // el mismo ejercicio, ahora de leer
    }));
  }
  if (audioPaused()) exits.append(el("span", "paused-note", "🔇 " + ui("audioPaused")));
  app.append(area, exits);
}

function showResult(s) {
  const wasComplete = s.unit && unitComplete(s.unit);
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
  app.append(mascot("cheer", 140));
  // Al terminar la práctica final por primera vez, se celebra el objetivo conseguido.
  if (s.unit && !wasComplete && unitComplete(s.unit)) {
    const goal = el("div", "can-do-won");
    goal.append(el("span", "", ui("unitDone")), txt("strong", "", "✓ " + tr("c_" + s.unit.id, save.native), save.native));
    app.append(goal);
  } else {
    app.append(el("h1", "", ui("done")));
  }
  app.append(stats, button("btn big", ui("next"), () => go(s.review ? "review" : "path")));
}
