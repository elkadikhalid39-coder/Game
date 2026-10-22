// Pase de Conducir (permiso B, DGT): Mi caso (canje o examen), temario por temas con test y explicación,
// simulacro con el formato del examen, repaso de fallos y vocabulario del examen en el idioma de la persona.
import bank from "../../content/exams/conducir.json";
import { ui } from "../core/i18n.js";
import { save, persist, setResume, clearResume, TARGET as G } from "../core/state.js";
import { register, go } from "../core/router.js";
import { shuffle, pick } from "../core/util.js";
import { speak, beep } from "../core/audio.js";
import { el, txt, button, closeButton } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app } from "../ui/shell.js";
import { factNote, sourceLine, extLink } from "../ui/fact.js";
import { countdown } from "../ui/timer.js";
import { playButton } from "../ui/audio-buttons.js";
import { signCard } from "../ui/signs.js";
import { preloadExamAudio } from "../core/audio.js";
import { hasPass, draftBanner, menuRow, saveResult, resultsList, reportButton, tscreen, optionButton, answerFeedback, secondaryActions } from "./common.js";
import { passCard } from "./nationality.js";

export const PASS = "conducir";
const QUESTIONS = bank.questions;
const MOCK = bank.mock; // 30 preguntas, 30 minutos, apto con 3 fallos como máximo (datos «dgt.examen_b»)
const FREE_TOPIC = "permiso"; // muestra gratuita: documentación y permisos (lo que más se consulta)
const SEDE_CANJE = "https://sede.dgt.gob.es/es/permisos-de-conducir/canjes-de-permisos/canjes-de-permisos-extranjeros/";
const DGT_TEST = "https://www.dgt.es/nuestros-servicios/permisos-de-conducir/obtener-un-nuevo-permiso-de-conducir/";
const byTopic = (t) => QUESTIONS.filter((q) => q.topic === t);
const topicName = (t) => ui("topic_" + t);
const canStudy = (t) => hasPass(PASS) || t === FREE_TOPIC;

function showDriving() {
  tscreen("main");
  preloadExamAudio();
  app.append(button("back", "← " + ui("back"), () => go("exams")), el("h1", "", "🚗 " + ui("passDrive")), draftBanner());
  const locked = !hasPass(PASS);
  const fails = save.drivingFails.length;
  // Tres acciones principales; el resto, enlaces secundarios.
  const menu = el("div", "menu");
  menu.append(
    menuRow("📚", ui("driveTopics"), ui("driveTopicsDesc"), () => go("driving-topics"), { badge: locked ? ui("free") + " · " + ui("locked") : null }),
    menuRow("⏱", ui("driveMock"), ui("driveMockDesc"), () => go("driving-mock"), { badge: locked ? ui("locked") : null, locked }),
    menuRow("🗂️", ui("driveCase"), ui("driveCaseDesc"), () => go("driving-case"), { badge: ui("free") }),
  );
  app.append(menu, secondaryActions([
    [`❌ ${ui("driveFails")}${fails ? ` (${fails})` : ""}`, () => (fails ? practice(null) : null)],
    ["🔤 " + ui("driveWords"), () => go("driving-words")],
    ["📚 " + ui("officialSources"), () => go("sources", "driving")],
    ["🗣️ " + ui("practiceSpanish"), () => go("path")],
  ]));
  const results = resultsList("conducir");
  if (results) app.append(results);
  app.append(passCard(PASS, showDriving));
}

// ---------- Mi caso: ¿canje o examen? ----------
const CASE_QUESTIONS = [
  { id: "has", key: "qHasLicense", options: [["yes", "yes"], ["no", "no"]] },
  { id: "from", key: "qLicenseFrom", when: (a) => a.has === "yes", options: [["eu", "fromEu"], ["conv", "fromConvenio"], ["other", "fromOther"]] },
  { id: "resident", key: "qObtainedResident", when: (a) => a.from === "conv", options: [["no", "no"], ["yes", "yes"]] },
];

function askCase(answers) {
  const q = CASE_QUESTIONS.find((x) => !(x.id in answers) && (!x.when || x.when(answers)));
  if (!q) return showCase(answers);
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving")), el("h1", "", "🗂️ " + ui("driveCase")));
  app.append(speech(ui(q.key), "talk"));
  // En la pregunta del país se enseña la lista oficial de países con convenio.
  if (q.id === "from") app.append(sourceBox("dgt.canje_convenio"));
  const opts = el("div", "options");
  for (const [value, key] of q.options) opts.append(button("opt left", ui(key), () => askCase({ ...answers, [q.id]: value })));
  app.append(opts);
}

function sourceBox(id) {
  const box = el("div", "country-list");
  box.append(factNote(id));
  return box;
}

function step(icon, title, ids, extra) {
  const box = el("section", "step");
  box.append(el("h2", "", icon + " " + title));
  for (const id of ids) box.append(factNote(id));
  if (extra) box.append(extra);
  return box;
}

const officialLink = (label, url) => {
  const p = el("p", "official-link");
  p.append(extLink("🌐 " + label, url));
  return p;
};

function showCase(a) {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving")), el("h1", "", "✅ " + ui("yourResult")), draftBanner());
  const canExchange = a.from === "eu" || (a.from === "conv" && a.resident === "no");
  if (a.from === "eu") {
    app.append(step("✔️", ui("stepCanjeVoluntary"), ["dgt.canje_ue"], officialLink(ui("openOfficial") + " · sede.dgt.gob.es", SEDE_CANJE)));
  } else if (canExchange) {
    const urgent = step("⏳", ui("step6Months"), ["dgt.canje_6meses"]);
    urgent.classList.add("important");
    app.append(urgent, step("🔁", ui("stepCanjeNoExam"), ["dgt.canje_convenio", "dgt.canje_limite", "dgt.tasas"], officialLink(ui("openOfficial") + " · sede.dgt.gob.es", SEDE_CANJE)));
  } else {
    if (a.has === "yes") {
      // Permiso de fuera de la UE que no se puede canjear: solo vale seis meses.
      const warn = step("⚠️", ui("step6Months"), ["dgt.canje_6meses", "dgt.canje_limite"]);
      warn.classList.add("important");
      app.append(warn);
    }
    app.append(step("📋", ui("stepRequirements"), ["dgt.requisitos", "dgt.edad_b"]));
    app.append(step("📝", ui("stepTheory"), ["dgt.examen_b", "dgt.examen_teorico", "dgt.idiomas", "dgt.lectura_facil"],
      button("btn ghost-dark", "📚 " + ui("driveTopics") + " →", () => go("driving-topics"))));
    app.append(step("🚗", ui("stepPractical"), ["dgt.practico", "dgt.convocatorias", "dgt.tasas"], officialLink(ui("openOfficial") + " · dgt.es", DGT_TEST)));
  }
  app.append(step("⭐", ui("stepPoints"), ["dgt.puntos"]));
  app.append(factNote("dgt.no_asesoria"), button("btn ghost-dark", "↺ " + ui("restart"), () => askCase({})));
}

// ---------- Temario por temas ----------
function showTopics() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving")), el("h1", "", "📚 " + ui("driveTopics")), el("p", "lead", ui("driveTopicsHelp")));
  const menu = el("div", "menu");
  bank.topics.forEach((t, n) => {
    const locked = !canStudy(t.id);
    const badge = locked ? ui("locked") : t.id === FREE_TOPIC && !hasPass(PASS) ? ui("free") : ui("inBank", byTopic(t.id).length);
    menu.append(menuRow(String(n + 1), topicName(t.id), ui("driveTopicDesc"), () => go("driving-topic", t.id), { badge, locked }));
  });
  app.append(menu, passCard(PASS, showTopics));
}

// Ficha del tema: lo que hay que saber (datos oficiales) y, después, el test del tema.
function showTopic(id) {
  const t = bank.topics.find((x) => x.id === id);
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving-topics")), el("h1", "", topicName(id)));
  if (!canStudy(id)) {
    app.append(passCard(PASS, () => showTopic(id)));
    return;
  }
  app.append(el("h2", "section", "📖 " + ui("studyFirst")));
  for (const f of t.study) app.append(factNote(f));
  app.append(button("btn big", "✍️ " + ui("practiceTopic"), () => practice(id)));
}

// Pregunta del test, con botón para escucharla (como la ayuda de audio del examen de la DGT).
function questionCard(q, meta, chosen, onPick) {
  const card = el("div", "card exam-q");
  card.lang = "es";
  card.dir = "ltr";
  const head = el("div", "q-head");
  head.append(el("p", "q-meta", meta + (q.status !== "publicado" ? " · borrador" : "")),
    playButton([q.q, ...q.options.map((o, i) => "abc"[i] + ". " + o)].join(". "), ui("readAloud")));
  card.append(head);
  // Sin el pictograma oficial no se dibuja una señal aproximada: se describe con palabras.
  if (q.sign) card.append(signCard(q.sign));
  card.append(el("p", "q-text", q.q));
  const opts = el("div", "options");
  q.options.forEach((o, i) => opts.append(optionButton(o, i, onPick, { selected: chosen === i, ok: i === q.answer })));
  card.append(opts);
  return card;
}

function explanation(q) {
  const box = el("div", "explain");
  box.lang = "es";
  box.dir = "ltr";
  box.append(el("strong", "", ui("explanation") + ": "), q.explain);
  box.append(sourceLine(q.fact), reportButton("conducir " + q.id, q.q));
  return box;
}

// Una pregunta fallada entra en «Mis fallos»; acertada en el repaso, sale.
function noteFail(q, ok) {
  const at = save.drivingFails.indexOf(q.id);
  if (!ok && at < 0) save.drivingFails.push(q.id);
  if (ok && at >= 0) save.drivingFails.splice(at, 1);
  persist();
}

// Práctica con corrección inmediata: de un tema (topic) o de las preguntas falladas (topic = null).
function practice(topic) {
  if (topic) setResume({ kind: "exam", route: "driving-topic", arg: topic, key: "passDrive", sub: topicName(topic) });
  const list = topic ? shuffle(byTopic(topic)) : shuffle(QUESTIONS.filter((q) => save.drivingFails.includes(q.id)));
  const back = topic ? () => go("driving-topic", topic) : () => go("driving");
  const s = { i: 0, correct: 0 };
  const run = () => {
    if (s.i >= list.length) {
      clearResume("exam");
      tscreen("main");
      app.append(el("h1", "", ui("correctOf", `${s.correct} / ${list.length}`)));
      if (save.drivingFails.length) app.append(el("p", "lead center", ui("reviewCount", save.drivingFails.length)));
      app.append(button("btn big", ui("next"), back));
      return;
    }
    const q = list[s.i];
    tscreen("lesson");
    const head = el("div", "lesson-head");
    const bar = el("div", "progress");
    const fill = el("div");
    fill.style.width = (s.i / list.length) * 100 + "%";
    bar.append(fill);
    head.append(closeButton(back), bar);
    const card = questionCard(q, `${topicName(q.topic)} · ${s.i + 1} / ${list.length}`, null, (i, btn) => {
      const ok = i === q.answer;
      beep(ok);
      if (ok) s.correct++;
      noteFail(q, ok);
      if (!ok) btn.classList.add("wrong");
      answerFeedback(card, ok, q.options[q.answer], explanation(q), () => { s.i++; run(); });
    });
    app.append(head, card);
  };
  run();
}

// ---------- Simulacro con el formato del examen ----------
function mockIntro() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving")), el("h1", "", "⏱ " + ui("driveMock")), draftBanner());
  if (!hasPass(PASS)) {
    app.append(factNote("dgt.examen_b"), passCard(PASS, mockIntro));
    return;
  }
  app.append(el("p", "lead", ui("driveMockRules", MOCK.maxErrors)), factNote("dgt.examen_b"), factNote("dgt.examen_teorico"),
    button("btn big", ui("startMock"), startMock));
  const results = resultsList("conducir");
  if (results) app.append(results);
}

// Preguntas de todos los temas, repartidas: primero una de cada tema y el resto al azar.
function mockQuestions() {
  const first = bank.topics.flatMap((t) => pick(byTopic(t.id), 1));
  const rest = pick(QUESTIONS.filter((q) => !first.includes(q)), MOCK.questions - first.length);
  return shuffle([...first, ...rest]).slice(0, MOCK.questions);
}

function startMock() {
  setResume({ kind: "exam", route: "driving-mock", key: "passDrive", sub: ui("driveMock") });
  const list = mockQuestions();
  const answers = Array(list.length).fill(null);
  let i = 0;
  tscreen("lesson");
  const timer = countdown(MOCK.minutes, () => finish(true));
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
    app.append(head, questionCard(list[i], `${i + 1} / ${list.length}`, answers[i], (k) => { answers[i] = k; render(); }), nav,
      el("p", "q-meta center", ui("answeredCount", `${answers.filter((a) => a !== null).length} / ${list.length}`)),
      i < list.length - 1 ? button("link", ui("finish"), () => finish(false)) : "");
  };
  const finish = (timeUp) => {
    timer.stop();
    // Una pregunta sin responder cuenta como fallo.
    const errors = list.filter((q, k) => answers[k] !== q.answer).length;
    const pass = errors <= MOCK.maxErrors;
    list.forEach((q, k) => noteFail(q, answers[k] === q.answer));
    saveResult("conducir", list.length - errors, list.length, pass);
    clearResume("exam");
    tscreen("main");
    if (timeUp) app.append(el("p", "lead center", "⏱ " + ui("timeUp")));
    const result = el("div", "exam-result " + (pass ? "pass" : "fail"));
    result.append(el("strong", "", pass ? ui("apto") : ui("noApto")), el("span", "", ui("errorsOf", `${errors} / ${list.length}`)));
    app.append(result, el("p", "lead center", ui("driveMockRules", MOCK.maxErrors)));
    // Los temas con más fallos, con un botón para practicar solo ese tema.
    const bad = {};
    list.forEach((q, k) => { if (answers[k] !== q.answer) bad[q.topic] = (bad[q.topic] || 0) + 1; });
    const weak = Object.entries(bad).sort((x, y) => y[1] - x[1]).slice(0, 3);
    if (weak.length) {
      const box = el("div", "weak-list");
      for (const [t, n] of weak) {
        const row = el("div", "weak-row");
        row.append(el("span", "", `${topicName(t)} (✕ ${n})`), button("btn", ui("practiceThis"), () => practice(t)));
        box.append(row);
      }
      app.append(el("h2", "section", ui("weakAreas")), box);
    }
    app.append(el("h2", "section", ui("reviewAnswers")));
    list.forEach((q, k) => {
      const ok = answers[k] === q.answer;
      const item = el("div", "review-item " + (ok ? "ok" : "bad"));
      item.lang = "es";
      item.dir = "ltr";
      item.append(el("p", "q-text", (ok ? "✓ " : "✕ ") + q.q), el("p", "", (answers[k] === null ? "—" : q.options[answers[k]]) + (ok ? "" : " → " + q.options[q.answer])), explanation(q));
      app.append(item);
    });
    app.append(button("btn big", ui("next"), () => go("driving")));
  };
  render();
}

// ---------- Vocabulario del examen ----------
function showWords() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("driving")), el("h1", "", "🔤 " + ui("driveWords")), el("p", "lead", ui("driveWordsHelp")));
  const N = save.native;
  for (const w of bank.words) {
    const row = el("div", "word-row");
    const head = el("div", "word-head");
    head.append(txt("strong", "", w.es, G), playButton(w.es, ui("play") + ": " + w.es));
    row.append(head, txt("p", "word-def", w.def, G));
    if (N !== G && w.tr[N]) row.append(txt("p", "word-tr", "= " + w.tr[N], N));
    app.append(row);
  }
  if (N !== G) app.append(el("p", "small-print", ui("translationNote")));
}

register("driving", showDriving);
register("driving-case", () => askCase({}));
register("driving-topics", showTopics);
register("driving-topic", showTopic);
register("driving-mock", mockIntro);
register("driving-words", showWords);
