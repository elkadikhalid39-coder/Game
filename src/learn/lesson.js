// Lección: ejercicios, corrección en panel inferior, salidas sin culpa y segunda oportunidad al final.
// Tipos de ejercicio (nunca se pregunta solo con un dibujo: cada uno se interpreta a su manera):
//   intro     palabra nueva con dibujo, traducción y audio
//   pick      la palabra en su idioma → elegir en español
//   hear      escuchar en español → elegir el significado en su idioma
//   dictation escuchar en español → escribirla (marca en qué letras está el fallo)
//   write     la palabra en su idioma → escribirla en español
//   phrase    pregunta en español → elegir la respuesta
//   order     escuchar y leer la traducción → ordenar las palabras de la respuesta
// Quien tiene el español como idioma no tiene traducción que ver: sus ejercicios de palabras son dictados.
import { ui, tr } from "../core/i18n.js";
import { save, persist, TARGET as G } from "../core/state.js";
import { go } from "../core/router.js";
import { shuffle, pick } from "../core/util.js";
import { speak, beep } from "../core/audio.js";
import { el, txt, button, closeButton } from "../ui/dom.js";
import { writeBox, diffView } from "./write-box.js";
import { audioControls } from "../ui/audio-buttons.js";
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

// Las palabras de la unidad se reparten entre las dos primeras lecciones, en orden:
// cada palabra se presenta antes de preguntarla.
function makeLesson(unit, li) {
  const all = wordsOf(unit);
  const half = Math.ceil(all.length / 2);
  const phrases = shuffle(unit.phrases.map((p) => p.id));
  const type = LESSON_TYPES[li].type;
  if (type === "words" || type === "listen") {
    const fresh = type === "words" ? all.slice(0, half) : all.slice(half);
    // Presentar y reconocer cada palabra; después, escribirlas al dictado y desde su idioma.
    const first = type === "words" ? "pick" : "hear";
    return [...fresh.flatMap((w) => [{ type: "intro", item: w }, wordExercise(w, first)]),
      ...shuffle(fresh).map((w) => wordExercise(w, "dictation")), ...pick(fresh, 2).map((w) => wordExercise(w, "write"))];
  }
  const words = shuffle(all);
  if (type === "phrases") {
    return [...phrases.map((id) => phraseExercise(id)), ...phrases.slice(0, 2).map((id) => phraseExercise(id, "order")),
      wordExercise(words[0], "dictation"), wordExercise(words[1], "dictation")];
  }
  // Práctica final: sobre todo escribir.
  return shuffle([...words.slice(0, 4).map((w) => wordExercise(w, "dictation")), ...words.slice(4, 6).map((w) => wordExercise(w, "write")),
    wordExercise(words[6], "hear"), ...phrases.map((id) => phraseExercise(id)), phraseExercise(phrases[0], "order"), phraseExercise(phrases[1], "order")]);
}

// Ajusta un ejercicio a la persona: sin traducción (idioma español) o con el audio en pausa.
// Devuelve null si no se puede hacer (se salta sin contar).
function adapt(ex) {
  const sameLang = save.native === G;
  if (sameLang && ["pick", "hear", "write"].includes(ex.type)) ex = { ...ex, type: "dictation" };
  if (audioPaused()) {
    if (ex.type === "hear") ex = { ...ex, type: "pick" };
    if (ex.type === "dictation") ex = sameLang ? null : { ...ex, type: "write" };
  }
  return ex;
}

function makeReview() {
  return pick(save.mistakes, 8).map((m) => {
    if (m.k === "p") return phraseExercise(m.id, Math.random() < 0.5 ? "phrase" : "order");
    const item = wordsOf(unitOfWord(m.id)).find((x) => x.id === m.id);
    return wordExercise(item, pick(["dictation", "dictation", "write", "hear"], 1)[0]);
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

// ---------- Lección ----------
function runLesson(s) {
  if (s.i >= s.list.length) return showResult(s);
  const ex = adapt(s.list[s.i]);
  if (!ex) { s.i++; return runLesson(s); }
  const N = save.native;
  screen("lesson");

  const head = el("div", "lesson-head");
  const bar = el("div", "progress");
  const fillBar = el("div");
  fillBar.style.width = (s.i / s.list.length) * 100 + "%";
  bar.append(fillBar);
  head.append(closeButton(() => go(s.review ? "review" : "path")), bar);
  app.append(head);
  const next = () => { s.i++; runLesson(s); };
  const say = (text) => { if (!audioPaused()) speak(text, G); };

  if (ex.type === "intro") {
    const word = tr(ex.item.id, G);
    const card = el("div", "card intro");
    // El dibujo solo aparece si representa la palabra sin dudas (las palabras abstractas no llevan).
    if (ex.item.emoji) card.append(el("div", "bigemoji", ex.item.emoji));
    card.append(txt("div", "bigword", word, G));
    if (N !== G) card.append(txt("p", "hint", tr(ex.item.id, N), N));
    card.append(audioControls(word, { cls: "center" }));
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
  // written: lo que escribió la persona, para marcar en qué letras está el fallo.
  // hinted: se usó una pista; cuenta como acierto, pero la palabra se queda en Repasar.
  const answer = (ok, solution, { btn, note, written, hinted } = {}) => {
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
    noteResult(ex, ok && !hinted);
    persist();
    say(solution);
    const title = ok ? (hinted ? ui("okWithHint") : ui("great")) : ui("answer") + ":";
    const detail = ok ? (note ? ui(note === "accent" ? "noteAccent" : "noteTypo", solution) : "") : solution;
    const extra = el("div", "sheet-extra");
    const showDiff = written !== undefined && (!ok || note);
    if (showDiff) extra.append(diffView(written, solution));
    // Al corregir una palabra se ve su significado en el idioma de la persona.
    if (ex.item && N !== G) extra.append(txt("p", "sheet-meaning", "= " + tr(ex.item.id, N), N));
    extra.append(audioControls(solution));
    // Si se ve la comparación letra a letra, la solución ya está en ella: no se repite.
    sheet(ok, title, showDiff && !ok ? "" : detail, note ? N : G, next, extra);
  };
  const addOption = (parent, label, lang, isOk, solution) => {
    const b = txt("button", "opt", label, lang);
    b.type = "button";
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(isOk, solution, { btn: b });
    parent.append(b);
  };

  if (ex.type === "pick") {
    // La palabra en su idioma (con el dibujo de apoyo) → elegir en español.
    app.append(speech(ui("howSay"), "talk"));
    const prompt = el("div", "prompt-word");
    if (ex.item.emoji) prompt.append(el("span", "midemoji", ex.item.emoji));
    prompt.append(txt("span", "bigword", tr(ex.item.id, N), N));
    area.append(prompt);
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, G), G, o === ex.item, tr(ex.item.id, G));
    area.append(opts);
  } else if (ex.type === "hear") {
    // Escucha en español y elige el significado en su idioma.
    const word = tr(ex.item.id, G);
    app.append(speech(ui("listen"), "talk"));
    area.append(audioControls(word, { size: "big" }));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, N), N, o === ex.item, word);
    area.append(opts);
    say(word);
  } else if (ex.type === "dictation" || ex.type === "write") {
    const word = tr(ex.item.id, G);
    const box = writeBox({
      hint: word,
      onCheck: (value, { hinted }) => {
        const r = checkWritten(value, word);
        box.input.classList.add(r.ok ? "right" : "wrong");
        answer(r.ok, word, { note: r.note, written: value, hinted });
      },
    });
    box.el.dataset.word = ex.item.id; // para las pruebas automáticas
    if (ex.type === "dictation") {
      // Dictado: solo se oye; el dibujo y el significado se ven al corregir.
      app.append(speech(ui("dictationPrompt"), "talk"));
      area.append(audioControls(word, { size: "big" }));
      say(word);
    } else {
      app.append(speech(ui("writeIt"), "talk"));
      const prompt = el("div", "prompt-word");
      if (ex.item.emoji) prompt.append(el("span", "midemoji", ex.item.emoji));
      prompt.append(txt("span", "bigword", tr(ex.item.id, N), N));
      area.append(prompt);
    }
    area.append(box.el);
    box.focus();
  } else if (ex.type === "order") {
    // Ordenar las palabras de la respuesta (en español) viendo su traducción.
    const sentence = tr("a_" + ex.id, G);
    app.append(speech(ui("orderIt"), "talk"));
    // Se oye la frase (y se lee su traducción si la persona tiene otro idioma).
    const prompt = el("div", "quote plain");
    prompt.append(audioControls(sentence));
    if (N !== G) prompt.append(txt("span", "", tr("a_" + ex.id, N), N));
    area.append(prompt);
    say(sentence);
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
    quote.append(audioControls(q), txt("span", "", q, G));
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
