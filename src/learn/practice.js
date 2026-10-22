// Pestaña Practicar: mis errores, dictado (palabras y frases) y diccionario.
import { ui, tr } from "../core/i18n.js";
import { save, persist, TARGET as G } from "../core/state.js";
import { register, go } from "../core/router.js";
import { shuffle } from "../core/util.js";
import { speak, beep } from "../core/audio.js";
import { el, txt, button, closeButton } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, sheet, setTab, celebrate } from "../ui/shell.js";
import { menuRow } from "../exams/common.js";
import { UNITS, doneIn } from "./course.js";
import { startReview } from "./lesson.js";
import { wordErrors, normalize } from "./answers.js";
import { writeBox, diffView } from "./write-box.js";

const SESSION = { words: 8, sentences: 5 };

// Unidades empezadas (o la primera, si todavía no ha empezado ninguna).
function openUnits() {
  const started = UNITS.filter((u) => doneIn(u) > 0);
  return started.length ? started : UNITS.slice(0, 1);
}

function showPractice() {
  setTab("review");
  screen("main");
  app.append(el("h1", "", "✍️ " + ui("tabPractice")));
  const menu = el("div", "menu");
  const n = save.mistakes.length;
  menu.append(
    menuRow("🔁", ui("mistakesTitle"), n ? ui("reviewCount", n) : ui("reviewEmpty"), () => (n ? startReview() : null), { badge: n ? ui("reviewStart") : null, locked: !n }),
    menuRow("🎧", ui("dictationTitle") + " · " + ui("dictWords"), ui("dictationDesc"), () => go("dictation", "words")),
    menuRow("📝", ui("dictationTitle") + " · " + ui("dictSentences"), ui("dictSentencesDesc"), () => go("dictation", "sentences")),
    menuRow("📖", ui("dictionaryTitle"), ui("dictionaryDesc"), () => go("dictionary")),
  );
  app.append(menu);
}

// ---------- Dictado ----------
// Elementos: { text (español), meaning (en su idioma), id? (palabra, para Repasar), emoji? }.
function dictationItems(mode) {
  const units = openUnits();
  if (mode === "words") {
    return shuffle(units.flatMap((u) => u.words.map((w) => ({ id: w.id, emoji: w.emoji, text: tr(w.id, G), meaning: tr(w.id, save.native) })))).slice(0, SESSION.words);
  }
  const ids = units.flatMap((u) => u.phrases.flatMap((p) => ["q_" + p.id, "a_" + p.id]));
  return shuffle(ids).slice(0, SESSION.sentences).map((id) => ({ text: tr(id, G), meaning: tr(id, save.native) }));
}

function dictation(mode) {
  if (Date.now() < save.noAudioUntil) {
    // El dictado necesita oír: se ofrece volver a activar el audio.
    screen("main");
    app.append(button("back", "← " + ui("back"), () => go("review")), el("h1", "", "🎧 " + ui("dictationTitle")), speech(ui("dictNeedsAudio"), "talk"),
      button("btn big", "🔊 " + ui("resumeAudio"), () => { save.noAudioUntil = 0; persist(); dictation(mode); }));
    return;
  }
  const items = dictationItems(mode);
  const results = [];
  const run = (i) => {
    if (i >= items.length) return summary(mode, items, results);
    const it = items[i];
    screen("lesson");
    const head = el("div", "lesson-head");
    const bar = el("div", "progress");
    const fill = el("div");
    fill.style.width = (i / items.length) * 100 + "%";
    bar.append(fill);
    head.append(closeButton(() => go("review")), bar);
    const audio = el("div", "listen-pair");
    const slow = button("listen big slow", "🐢", () => speak(it.text, G, { slow: true }));
    slow.setAttribute("aria-label", ui("slow"));
    const normal = button("listen big", "🔊", () => speak(it.text, G));
    normal.setAttribute("aria-label", ui("play"));
    audio.append(normal, slow);
    const box = writeBox({
      hint: mode === "words" ? it.text : null,
      multiline: mode === "sentences",
      onCheck: (value) => {
        // En el dictado la ortografía es lo que se practica: no se aceptan erratas ni tildes de menos
        // (sí se ignoran mayúsculas, signos y el artículo inicial).
        const errors = mode === "words" ? (normalize(value) === normalize(it.text) ? 0 : 1) : wordErrors(value, it.text);
        const r = { ok: errors === 0 };
        results[i] = { value, errors };
        if (it.id) noteWord(it.id, r.ok);
        beep(r.ok);
        speak(it.text, G);
        const extra = el("div", "sheet-extra");
        // La corrección se muestra siempre que no sea idéntica (también las tildes y los signos).
        if (normalize(value) !== normalize(it.text) || !r.ok) extra.append(diffView(value, it.text));
        if (save.native !== G || it.emoji) extra.append(txt("p", "sheet-meaning", (it.emoji ? it.emoji + " " : "") + (save.native !== G ? it.meaning : ""), save.native));
        const title = r.ok ? ui("great") : mode === "sentences" ? ui("wordErrorsN", errors) : ui("answer") + ":";
        sheet(r.ok, title, r.ok ? "" : it.text, G, () => run(i + 1), extra);
      },
    });
    box.el.dataset.text = it.text; // para las pruebas automáticas
    app.append(head, speech(ui("dictationPrompt"), "talk"), audio, box.el);
    const skip = button("link", ui("skip") + " →", () => { results[i] = { value: "", errors: null }; run(i + 1); });
    const exits = el("div", "exits");
    exits.append(skip);
    app.append(exits);
    speak(it.text, G);
    box.focus();
  };
  run(0);
}

// Una palabra del dictado entra en Repasar si se falla y sale si se acierta.
function noteWord(id, ok) {
  const at = save.mistakes.findIndex((m) => m.k === "w" && m.id === id);
  if (!ok && at < 0) save.mistakes.push({ k: "w", id });
  if (ok && at >= 0) save.mistakes.splice(at, 1);
  if (ok && !save.learned.includes(id)) save.learned.push(id);
  persist();
}

function summary(mode, items, results) {
  screen("main");
  const done = results.filter((r) => r && r.errors !== null);
  const perfect = done.filter((r) => r.errors === 0).length;
  if (perfect === done.length && done.length) celebrate();
  app.append(mascot(perfect === done.length ? "cheer" : "happy", 110), el("h1", "", ui("dictResult", `${perfect} / ${items.length}`)));
  // Lo que salió mal, con la corrección, para repasarlo de un vistazo.
  items.forEach((it, i) => {
    const r = results[i];
    if (!r || r.errors === 0) return;
    const item = el("div", "review-item bad");
    item.append(r.errors === null ? txt("p", "q-text", it.text, G) : diffView(r.value, it.text));
    app.append(item);
  });
  app.append(button("btn big", "↺ " + ui("again"), () => dictation(mode)), button("btn ghost-dark", ui("next"), () => go("review")));
}

// ---------- Diccionario ----------
// Sin tildes ni mayúsculas, para buscar «cafe» y encontrar «café».
const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function dictionary() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("review")), el("h1", "", "📖 " + ui("dictionaryTitle")));
  const search = el("input", "search");
  Object.assign(search, { type: "search", id: "dict-search", placeholder: ui("searchWords"), autocomplete: "off" });
  search.setAttribute("aria-label", ui("searchWords"));
  const list = el("div", "dict-list");
  const N = save.native;
  const render = () => {
    const q = fold(search.value.trim());
    list.replaceChildren();
    let shown = 0;
    for (const u of UNITS) {
      const rows = u.words.filter((w) => !q || fold(tr(w.id, G)).includes(q) || fold(tr(w.id, N)).includes(q));
      if (!rows.length) continue;
      list.append(txt("h2", "section", u.emoji + " " + tr("w_" + u.id, N), N));
      for (const w of rows) {
        shown++;
        const row = el("div", "dict-row");
        const play = button("listen small", "🔊", () => speak(tr(w.id, G), G));
        play.setAttribute("aria-label", ui("play") + ": " + tr(w.id, G));
        const words = el("div", "dict-words");
        words.append(txt("strong", "", tr(w.id, G), G));
        if (N !== G) words.append(txt("span", "", tr(w.id, N), N));
        row.append(el("span", "dict-emoji", w.emoji), words);
        if (save.learned.includes(w.id)) row.append(el("span", "pill free", "✓"));
        row.append(play);
        list.append(row);
      }
    }
    if (!shown) list.append(el("p", "lead center", ui("noResults")));
  };
  search.oninput = render;
  app.append(search, list);
  render();
}

register("review", showPractice);
register("dictation", dictation);
register("dictionary", dictionary);
