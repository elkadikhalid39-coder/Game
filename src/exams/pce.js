// Simulacros de la parte de test de las PCE (con la puntuación de cada guía oficial),
// redacción académica (bloque 1 de Lengua) y cálculo orientativo de la nota.
import pce from "../../content/exams/pce.json";
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { pick } from "../core/util.js";
import { beep } from "../core/audio.js";
import { el, button, closeButton } from "../ui/dom.js";
import { mascot } from "../ui/mascot.js";
import { app, screen, sheet, celebrate } from "../ui/shell.js";
import { factNote } from "../ui/fact.js";
import { countdown } from "../ui/timer.js";
import { hasPass, draftBanner, menuRow, saveResult, lastResult, resultsList } from "./common.js";
import { passCard } from "./nationality.js";
import { PASS, FREE_TESTS, fmt } from "./university.js";
import { scoreTest, grades } from "./pce-score.js";

const TESTS = pce.tests;
const W = pce.writing;
const subjectName = (id) => pce.subjects.find((s) => s.id === id).name;
const canUse = (id) => hasPass(PASS) || FREE_TESTS.includes(id);
// El test de Inglés está en inglés; los demás, en español.
const qLang = (id) => (id === "ingles" ? "en" : "es");

// ---------- Simulacros de test ----------
function showMocks() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "⏱ " + ui("pceMocks")), draftBanner(),
    el("p", "lead", ui("pceMocksDesc")));
  const menu = el("div", "menu");
  for (const [id, t] of Object.entries(TESTS)) {
    const r = lastResult("pce-" + id);
    const locked = !canUse(id);
    const badge = locked ? ui("locked") : r ? `${fmt(r.score)} / ${fmt(r.max)}` : FREE_TESTS.includes(id) && !hasPass(PASS) ? ui("free") : null;
    menu.append(menuRow("📘", subjectName(id), ui("testShown", t.shown) + " · " + ui("minutesN", t.minutes), () => go("pce-test", id), { badge, locked }));
  }
  app.append(menu, passCard(PASS, showMocks));
}

// Reglas de puntuación en el idioma de la persona.
function rules(t) {
  const box = el("div", "card rules");
  box.append(el("p", "", ui("testShown", t.shown) + " · " + (t.max < t.shown ? ui("testMax", t.max) : ui("testAll"))));
  const score = el("div", "score-rules");
  score.lang = "es";
  score.dir = "ltr";
  for (const [label, value, cls] of [[ui("rightL"), "+" + fmt(t.right), "ok"], [ui("wrongL"), "−" + fmt(t.wrong), "bad"], [ui("blankL"), "0", ""]]) {
    const s = el("span", "score-rule " + cls);
    s.append(el("strong", "", value), el("span", "", label));
    score.append(s);
  }
  box.append(score, el("p", "q-meta", t.minutesFrom === "guide" ? ui("minutesGuide", t.minutes) : ui("minutesApp", t.minutes)),
    el("p", "q-meta", "💡 " + ui("guessTip")));
  return box;
}

function testIntro(id) {
  const t = TESTS[id];
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("pce-mocks")), el("h1", "", "⏱ " + subjectName(id)), draftBanner());
  if (!canUse(id)) {
    app.append(factNote(t.fact), passCard(PASS, () => testIntro(id)));
    return;
  }
  app.append(rules(t), factNote(t.fact), button("btn big", ui("startMock"), () => startTest(id)));
  const results = resultsList("pce-" + id, { verdict: false });
  if (results) app.append(results);
}

function startTest(id) {
  const t = TESTS[id];
  const list = pick(t.bank, t.shown);
  const answers = Array(list.length).fill(null);
  screen("lesson");
  const timer = countdown(t.minutes, () => finish(true));
  const head = el("div", "lesson-head exam-head");
  const count = el("span", "q-meta");
  head.append(closeButton(() => go("pce-mocks")), el("strong", "", subjectName(id)), timer.el);
  const warn = el("p", "notice warn-many");
  const paint = () => {
    const n = answers.filter((a) => a !== null).length;
    count.textContent = ui("answeredCount", `${n} / ${t.max}`);
    count.classList.toggle("ok", n > 0 && n <= t.max);
    warn.textContent = "⚠️ " + ui("tooMany", t.max);
    warn.hidden = n <= t.max;
  };
  app.append(head, count, warn);
  list.forEach((q, k) => {
    const card = el("div", "card exam-q");
    card.lang = qLang(id);
    card.dir = "ltr";
    card.append(el("p", "q-meta", `${k + 1} / ${list.length}` + (q.status !== "publicado" ? " · borrador" : "")), el("p", "q-text", q.q));
    const opts = el("div", "options");
    const buttons = q.options.map((o, i) => {
      const b = button("opt left", "abc"[i] + ") " + o, () => {
        answers[k] = i;
        buttons.forEach((x) => x.classList.toggle("selected", x === b));
        paint();
      });
      opts.append(b);
      return b;
    });
    const blank = button("link", ui("clearAnswer"), () => {
      answers[k] = null;
      buttons.forEach((x) => x.classList.remove("selected"));
      paint();
    });
    card.append(opts, blank);
    app.append(card);
  });
  app.append(button("btn big", ui("finish"), () => finish(false)));
  paint();

  function finish(timeUp) {
    timer.stop();
    const { score, marks } = scoreTest(t, list, answers);
    const pass = score >= t.points / 2; // solo para el color: en las PCE no hay nota mínima por bloque
    saveResult("pce-" + id, score, t.points, pass);
    screen("main");
    if (pass) celebrate();
    app.append(mascot(pass ? "cheer" : "oops", 110));
    if (timeUp) app.append(el("p", "lead center", "⏱ " + ui("timeUp")));
    const result = el("div", "exam-result " + (pass ? "pass" : "fail"));
    result.append(el("strong", "", `${fmt(score)} / ${fmt(t.points)}`), el("span", "", ui("testScore")));
    app.append(result, el("h2", "section", ui("reviewAnswers")));
    list.forEach((q, k) => {
      const m = marks[k];
      const item = el("div", "review-item " + (m === "right" ? "ok" : m === "wrong" ? "bad" : ""));
      item.lang = qLang(id);
      item.dir = "ltr";
      const mark = { right: "✓ +" + fmt(t.right), wrong: "✕ −" + fmt(t.wrong), blank: "— 0", ignored: "⚠️ " + ui("notCounted") }[m];
      item.append(el("p", "q-meta", mark), el("p", "q-text", q.q),
        el("p", "", (answers[k] === null ? "—" : q.options[answers[k]]) + (answers[k] === q.answer ? "" : " → " + q.options[q.answer])));
      const ex = el("p", "explain");
      ex.lang = "es";
      ex.append(el("strong", "", ui("explanation") + ": "), q.explain);
      item.append(ex);
      app.append(item);
    });
    app.append(button("btn big", ui("next"), () => go("pce-mocks")));
  }
}

// ---------- Redacción académica ----------
// Palabras → líneas escritas a mano (estimación de la app, no de la guía).
const words = (s) => (s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g) || []).length;
const lines = (s) => Math.round((words(s) / W.wordsPerLine) * 10) / 10;
const PARTS = [
  ["summary", "wSummary", [5, 7]],
  ["theme", "wTheme", [3, 6]],
  ["argument", "wArgument", [20, 25]],
];

function showWriting() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "✍️ " + ui("academicWriting")), draftBanner(),
    factNote("pce.lengua"), factNote("pce.lengua_errores"));
  const menu = el("div", "menu");
  W.texts.forEach((t, k) => {
    const locked = k > 0 && !hasPass(PASS);
    menu.append(menuRow("📰", t.title, ui("academicWritingDesc"), () => go("pce-text", k), { badge: locked ? ui("locked") : k === 0 && !hasPass(PASS) ? ui("free") : null, locked }));
  });
  menu.append(
    menuRow("🔗", ui("connectorsTitle"), ui("connectorsDesc"), () => go("pce-connectors")),
    menuRow("🔎", ui("spellingTitle"), ui("spellingDesc"), () => go("pce-spelling")),
  );
  app.append(menu, passCard(PASS, showWriting));
}

function showText(k) {
  const t = W.texts[k];
  if (k > 0 && !hasPass(PASS)) return go("pce-writing");
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("pce-writing")), el("h1", "", "📰 " + t.title));
  const art = el("article", "reading-text");
  art.lang = "es";
  art.dir = "ltr";
  for (const p of t.body.split("\n\n")) art.append(el("p", "", p));
  app.append(el("p", "q-meta", ui("readText")), art);
  const models = { summary: t.summary, theme: [t.theme, ...t.ideas.map((x, i) => `${i + 1}. ${x}`)].join("\n\n"), argument: t.model };
  for (const [part, key, [lo, hi]] of PARTS) {
    const box = el("section", "step");
    box.append(el("h2", "", ui(key)));
    if (part === "argument") {
      const prompt = el("blockquote", "prompt-text", t.prompt);
      prompt.lang = "es";
      prompt.dir = "ltr";
      box.append(prompt);
    }
    const area = el("textarea", "write-area");
    area.id = `pce-${part}`;
    area.lang = "es";
    area.dir = "ltr";
    area.rows = part === "argument" ? 12 : 5;
    area.placeholder = ui("writeHere");
    const count = el("p", "q-meta");
    const update = () => {
      const l = lines(area.value);
      count.textContent = `${ui("wordsN", words(area.value))} · ${ui("linesApprox", fmt(l, 1))} · ${ui("linesGoal", `${lo}–${hi}`)}`;
      count.classList.toggle("ok", l >= lo && l <= hi);
    };
    area.oninput = update;
    update();
    const check = el("details", "model");
    check.append(el("summary", "", "☑️ " + ui("checkYourself")));
    const ul = el("ul", "checklist");
    ul.lang = "es";
    ul.dir = "ltr";
    for (const c of W.check[part]) {
      const li = el("li");
      const lab = el("label");
      const cb = el("input");
      cb.type = "checkbox";
      lab.append(cb, " " + c);
      li.append(lab);
      ul.append(li);
    }
    check.append(ul);
    const model = el("details", "model");
    const mt = el("article", "reading-text");
    mt.lang = "es";
    mt.dir = "ltr";
    for (const p of models[part].split("\n\n")) mt.append(el("p", "", p));
    model.append(el("summary", "", ui("showModel")), mt);
    box.append(area, count, check, model);
    app.append(box);
  }
  app.append(el("p", "small-print", ui("linesNote", W.wordsPerLine)));
}

function showConnectors() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("pce-writing")), el("h1", "", "🔗 " + ui("connectorsTitle")), el("p", "lead", ui("connectorsDesc")));
  for (const [group, items] of W.connectors) {
    const box = el("section", "step");
    box.lang = "es";
    box.dir = "ltr";
    box.append(el("h2", "", group));
    const chips = el("div", "chips");
    for (const i of items) chips.append(el("span", "chip-item", i));
    box.append(chips);
    app.append(box);
  }
}

// Práctica de corrección: elegir la frase bien escrita, con explicación.
function spelling() {
  const list = pick(W.spelling, W.spelling.length);
  const s = { i: 0, correct: 0 };
  const run = () => {
    if (s.i >= list.length) {
      screen("main");
      app.append(mascot("cheer", 120), el("h1", "", ui("correctOf", `${s.correct} / ${list.length}`)), factNote("pce.lengua_errores"),
        button("btn big", ui("next"), () => go("pce-writing")));
      celebrate();
      return;
    }
    const q = list[s.i];
    screen("lesson");
    const head = el("div", "lesson-head");
    head.append(closeButton(() => go("pce-writing")), el("span", "q-meta", `${ui("spellingTitle")} · ${s.i + 1} / ${list.length}`));
    const card = el("div", "card exam-q");
    card.append(el("p", "q-text", ui("whichCorrect")));
    const opts = el("div", "options");
    opts.lang = "es";
    opts.dir = "ltr";
    q.options.forEach((o, i) => {
      const b = button("opt left", o, () => {
        const ok = i === q.answer;
        beep(ok);
        if (ok) s.correct++;
        for (const x of opts.querySelectorAll(".opt")) { x.disabled = true; if (x.dataset.ok === "1") x.classList.add("correct"); }
        if (!ok) b.classList.add("wrong");
        const ex = el("p", "explain", q.explain);
        ex.lang = "es";
        sheet(ok, ok ? ui("great") : q.options[q.answer], "", "es", () => { s.i++; run(); }, ex);
      });
      b.dataset.ok = i === q.answer ? "1" : "0";
      opts.append(b);
    });
    card.append(opts);
    app.append(head, card);
  };
  run();
}

// ---------- Nota orientativa ----------
function numberInput(id, label, value = "") {
  const row = el("label", "calc-row");
  const input = el("input");
  input.type = "number";
  input.id = id;
  input.min = "0";
  input.max = "10";
  input.step = "0.01";
  input.inputMode = "decimal";
  input.value = value;
  row.append(el("span", "", label), input);
  return { row, input };
}
const num = (input) => {
  const v = parseFloat(String(input.value).replace(",", "."));
  return v >= 0 && v <= 10 ? v : null;
};

function showCalc() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "🧮 " + ui("gradeCalc")));
  const warn = el("div", "notice draft");
  warn.append(el("strong", "", "⚠️ " + ui("calcWarnTitle")), el("span", "", ui("calcWarning")));
  app.append(warn);
  const form = el("div", "card calc");
  const bach = numberInput("calc-bach", ui("bachGrade"));
  form.append(bach.row, el("p", "q-meta", ui("pceAccessGrades")));
  const access = [1, 2, 3, 4].map((n) => numberInput("calc-pce-" + n, ui("subjectN", n)));
  for (const a of access) form.append(a.row);
  form.append(el("p", "q-meta", ui("pceWeighted")));
  const weighted = [1, 2, 3, 4].map((n) => {
    const g = numberInput("calc-w-" + n, ui("subjectN", n));
    const sel = el("select");
    sel.id = "calc-wsel-" + n;
    sel.setAttribute("aria-label", ui("weight"));
    for (const w of ["0", "0.1", "0.2"]) sel.append(new Option(ui("weight") + " " + fmt(Number(w)), w));
    g.row.append(sel);
    form.append(g.row);
    return { input: g.input, sel };
  });
  const out = el("div", "calc-out");
  form.append(button("btn big", ui("calculate"), () => {
    const b = num(bach.input);
    const acc = access.map((a) => num(a.input)).filter((v) => v !== null);
    out.replaceChildren();
    if (b === null || !acc.length) { out.append(el("p", "notice", ui("calcMissing"))); return; }
    const w = weighted.map((x) => [num(x.input), Number(x.sel.value)]).filter(([g]) => g !== null);
    const r = grades(b, acc, w);
    for (const [label, value, max] of [[ui("accessGrade"), r.access, 10], [ui("admissionGrade"), r.admission, 14]]) {
      const row = el("div", "result-row");
      row.append(el("span", "", label), el("strong", "", `${fmt(value, 3)} / ${max}`));
      out.append(row);
    }
    if (r.access < 5) out.append(el("p", "notice draft", ui("calcBelow5")));
  }), out);
  app.append(form, factNote("pce.nota"), factNote("pce.admision"));
}

register("pce-mocks", showMocks);
register("pce-test", testIntro);
register("pce-writing", showWriting);
register("pce-text", showText);
register("pce-connectors", showConnectors);
register("pce-spelling", spelling);
register("pce-calc", showCalc);
