// CCSE: temario por tareas, práctica con corrección inmediata y simulacro con el formato del examen.
import bank from "../../content/exams/ccse.json";
import { ui } from "../core/i18n.js";
import { save, persist, setResume, clearResume } from "../core/state.js";
import { register, go } from "../core/router.js";
import { shuffle, pick } from "../core/util.js";
import { beep } from "../core/audio.js";
import { el, button, closeButton } from "../ui/dom.js";
import { app } from "../ui/shell.js";
import { factNote, extLink } from "../ui/fact.js";
import { countdown } from "../ui/timer.js";
import { hasPass, draftBanner, menuRow, saveResult, resultsList, reportButton, tscreen, optionButton, answerFeedback } from "./common.js";
import { glossFor } from "./glossary.js";
import { PASS, passCard } from "./nationality.js";

const QUESTIONS = bank.questions;
// Formato del examen (dato «ccse.estructura» y reparto «ccse.reparto_tareas»): 25 preguntas, 45 minutos, apto con 15.
const PER_TASK = { 1: 10, 2: 3, 3: 2, 4: 3, 5: 7 };
const MINUTES = 45, PASS_MARK = 15;
const SAMPLE = 5; // preguntas gratis de la tarea 1 sin el pase
const byTask = (t) => QUESTIONS.filter((q) => q.task === t);

const MANUAL = "https://examenes.cervantes.es/sites/default/files/manual-ccse-2026-def.pdf";
// Aviso fijo: estas preguntas comprueban el tema; las del examen son las del manual oficial.
function manualNotice() {
  const box = el("div", "notice draft");
  box.append(el("span", "", ui("ccseManualNotice")), " ", extLink("📄 " + ui("officialManual"), MANUAL));
  return box;
}

function showCcse() {
  tscreen("main");
  const locked = !hasPass(PASS);
  app.append(button("back", "← " + ui("back"), () => go("nationality")), el("h1", "", ui("ccseTitle")), manualNotice());
  // Tres acciones principales: practicar por tarea, simulacro y mis fallos.
  const fails = save.ccseFails.length;
  const menu = el("div", "menu");
  menu.append(
    menuRow("📘", ui("practiceByTask"), locked ? ui("sampleNote", SAMPLE) : ui("inBank", QUESTIONS.length), () => go("ccse-tasks")),
    menuRow("⏱", ui("mock"), ui("ccseDesc"), () => mockIntro(), { badge: locked ? ui("locked") : null, locked }),
    menuRow("❌", ui("driveFails"), fails ? ui("reviewCount", fails) : ui("driveFailsEmpty"), () => (fails ? practice(null) : null), { locked: !fails }),
  );
  app.append(menu);
  const results = resultsList("ccse");
  if (results) app.append(results);
  app.append(draftBanner(), factNote("ccse.estructura"), factNote("ccse.reparto_tareas"), factNote("ccse.manual"), passCard(PASS, showCcse));
}

function showTasks() {
  tscreen("main");
  const locked = !hasPass(PASS);
  app.append(button("back", "← " + ui("back"), () => go("ccse")), el("h1", "", ui("practiceByTask")));
  const menu = el("div", "menu");
  for (let t = 1; t <= 5; t++) {
    const lockedTask = locked && t !== 1;
    const badge = locked ? (t === 1 ? ui("sampleNote", SAMPLE) : ui("locked")) : ui("inBank", byTask(t).length);
    menu.append(menuRow(String(t), ui("task", t) + " · " + ui("ccseT" + t), ui("practice"), () => practice(t), { badge, locked: lockedTask }));
  }
  app.append(menu);
}

// Pregunta con sus opciones (A, B, C) y, debajo del enunciado, la traducción de las palabras difíciles.
// onPick(i) recibe el índice elegido.
function questionCard(q, n, total, chosen, onPick) {
  const card = el("div", "card exam-q");
  card.lang = "es";
  card.dir = "ltr";
  card.append(el("p", "q-meta", `${ui("task", q.task)} · ${n} / ${total}` + (q.status !== "publicado" ? " · borrador" : "")), el("p", "q-text", q.q));
  const gloss = glossFor(q.q);
  if (gloss) card.append(gloss);
  const opts = el("div", "options");
  q.options.forEach((o, i) => opts.append(optionButton(o, i, onPick, { selected: chosen === i, ok: i === q.answer })));
  card.append(opts);
  return card;
}

function explanation(q) {
  const box = el("div", "explain");
  box.lang = "es";
  box.dir = "ltr";
  box.append(el("strong", "", ui("explanation") + ": "), q.explain, " ", extLink("(" + q.source.name + ")", q.source.url));
  box.append(reportButton("ccse " + q.id, q.q));
  return box;
}

function noteFail(q, ok) {
  const at = save.ccseFails.indexOf(q.id);
  if (!ok && at < 0) save.ccseFails.push(q.id);
  if (ok && at >= 0) save.ccseFails.splice(at, 1);
  persist();
}

// ---------- Práctica: preguntas de una tarea (o las falladas, task = null) con corrección inmediata ----------
// Primero se leen los hechos (la explicación con su fuente) de las preguntas que vienen; luego, las preguntas.
function practice(task) {
  const sample = !hasPass(PASS);
  const pool = task === null ? shuffle(QUESTIONS.filter((q) => save.ccseFails.includes(q.id))).slice(0, 10)
    : sample ? byTask(1).slice(0, SAMPLE) : shuffle(byTask(task)).slice(0, 8);
  if (task !== null) setResume({ kind: "exam", route: "ccse-tasks", key: "ccseTitle", sub: ui("task", task) });
  const s = { list: pool, i: 0, correct: 0 };
  const facts = () => {
    tscreen("main");
    app.append(button("back", "← " + ui("back"), () => go("ccse")), el("h1", "", ui("studyFirst")), el("p", "lead", ui("factsFirst")));
    const list = el("ol", "fact-cards");
    list.lang = "es";
    list.dir = "ltr";
    for (const q of shuffle(s.list)) {
      const li = el("li", "fact");
      li.append(el("p", "fact-text", q.explain), extLink(q.source.name, q.source.url));
      list.append(li);
    }
    app.append(list, button("btn big", ui("practice") + " →", run));
  };
  const run = () => {
    if (s.i >= s.list.length) {
      clearResume("exam");
      tscreen("main");
      app.append(el("h1", "", ui("correctOf", `${s.correct} / ${s.list.length}`)), button("btn big", ui("next"), () => go("ccse")));
      return;
    }
    const q = s.list[s.i];
    tscreen("lesson");
    const head = el("div", "lesson-head");
    head.append(closeButton(() => go("ccse")), el("span", "q-meta", task === null ? ui("driveFails") : ui("ccseT" + task)));
    const card = questionCard(q, s.i + 1, s.list.length, null, (i, btn) => {
      const ok = i === q.answer;
      beep(ok);
      if (ok) s.correct++;
      noteFail(q, ok);
      if (!ok) btn.classList.add("wrong");
      answerFeedback(card, ok, q.options[q.answer], explanation(q), () => { s.i++; run(); });
    });
    app.append(head, card);
  };
  task === null ? run() : facts();
}

// ---------- Simulacro ----------
function mockIntro() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("ccse")), el("h1", "", "⏱ " + ui("mock")), factNote("ccse.estructura"),
    button("btn big", ui("startMock"), startMock));
}

function startMock() {
  setResume({ kind: "exam", route: "ccse", key: "ccseTitle", sub: ui("mock") });
  // Mismo reparto que el examen real, en el orden de las tareas.
  const list = Object.entries(PER_TASK).flatMap(([t, n]) => pick(byTask(Number(t)), n));
  const answers = Array(list.length).fill(null);
  let i = 0;
  tscreen("lesson"); // antes del cronómetro: el cronómetro se para al cambiar de pantalla
  const timer = countdown(MINUTES, () => finish(true));
  const render = () => {
    app.replaceChildren();
    window.scrollTo(0, 0);
    const head = el("div", "lesson-head exam-head");
    const bar = el("div", "progress");
    const fill = el("div");
    fill.style.width = (answers.filter((a) => a !== null).length / list.length) * 100 + "%";
    bar.append(fill);
    head.append(bar, timer.el);
    const nav = el("div", "exam-nav");
    nav.append(button("btn ghost-dark", "← " + ui("prev"), () => { if (i > 0) { i--; render(); } }));
    nav.append(i < list.length - 1 ? button("btn", ui("next") + " →", () => { i++; render(); }) : button("btn", ui("finish"), () => finish(false)));
    app.append(head, questionCard(list[i], i + 1, list.length, answers[i], (k) => { answers[i] = k; render(); }), nav,
      el("p", "q-meta center", ui("answeredCount", `${answers.filter((a) => a !== null).length} / ${list.length}`)),
      // «Terminar» antes de tiempo; en la última pregunta ya está en la barra de navegación.
      i < list.length - 1 ? button("link", ui("finish"), () => finish(false)) : "");
  };
  const finish = (timeUp) => {
    timer.stop();
    const score = list.filter((q, k) => answers[k] === q.answer).length;
    const pass = score >= PASS_MARK;
    saveResult("ccse", score, list.length, pass);
    list.forEach((q, k) => noteFail(q, answers[k] === q.answer));
    clearResume("exam");
    tscreen("main");
    const result = el("div", "exam-result " + (pass ? "pass" : "fail"));
    result.append(el("strong", "", pass ? ui("apto") : ui("noApto")), el("span", "", ui("correctOf", `${score} / ${list.length}`)));
    if (timeUp) app.append(el("p", "lead center", "⏱ " + ui("timeUp")));
    app.append(result);
    // Aciertos por tarea, para saber qué repasar.
    const table = el("div", "per-task");
    for (const t of Object.keys(PER_TASK)) {
      const idx = list.map((q, k) => (q.task === Number(t) ? k : -1)).filter((k) => k >= 0);
      const ok = idx.filter((k) => answers[k] === list[k].answer).length;
      const row = el("div", "result-row");
      row.append(el("span", "", ui("task", t) + " · " + ui("ccseT" + t)), el("strong", "", `${ok} / ${idx.length}`));
      table.append(row);
    }
    // Las tareas con más fallos, con un botón para practicar solo esa tarea.
    const weak = Object.keys(PER_TASK).map(Number).map((t) => {
      const idx = list.map((q, k) => (q.task === t ? k : -1)).filter((k) => k >= 0);
      return [t, idx.filter((k) => answers[k] !== list[k].answer).length];
    }).filter(([, bad]) => bad > 0).sort((x, y) => y[1] - x[1]).slice(0, 3);
    if (weak.length) {
      const box = el("div", "weak-list");
      for (const [t, bad] of weak) {
        const row = el("div", "weak-row");
        row.append(el("span", "", `${ui("task", t)} · ${ui("ccseT" + t)} (✕ ${bad})`), button("btn", ui("practiceThis"), () => practice(t)));
        box.append(row);
      }
      app.append(el("h2", "section", ui("weakAreas")), box);
    }
    app.append(table, manualNotice(), el("h2", "section", ui("reviewAnswers")));
    list.forEach((q, k) => {
      const ok = answers[k] === q.answer;
      const item = el("div", "review-item " + (ok ? "ok" : "bad"));
      item.lang = "es";
      item.dir = "ltr";
      item.append(el("p", "q-text", (ok ? "✓ " : "✕ ") + q.q), el("p", "", (answers[k] === null ? "—" : q.options[answers[k]]) + (ok ? "" : " → " + q.options[q.answer])), explanation(q));
      app.append(item);
    });
    app.append(button("btn big", ui("next"), () => go("ccse")));
  };
  render();
}

register("ccse", showCcse);
register("ccse-tasks", showTasks);
