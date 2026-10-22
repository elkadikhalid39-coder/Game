// DELE A2: estructura oficial y simulacro de las cuatro pruebas.
// Lectura y auditiva se corrigen solas (1 punto por acierto, sobre 25).
// Escritura y oral: la persona se autoevalúa con una rúbrica y un ejemplo, y obtiene una puntuación orientativa.
import exam from "../../content/exams/dele-a2.json";
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { speak, speakDialog } from "../core/audio.js";
import { el, button, closeButton } from "../ui/dom.js";
import { mascot } from "../ui/mascot.js";
import { app, screen, celebrate } from "../ui/shell.js";
import { factNote } from "../ui/fact.js";
import { countdown } from "../ui/timer.js";
import { hasPass, draftBanner, menuRow, saveResult, lastResult } from "./common.js";
import { PASS, passCard } from "./nationality.js";

const PARTS = [
  ["reading", "📖", "reading", 60],
  ["listening", "🎧", "listeningTest", 40],
  ["writing", "✍️", "writing", 45],
  ["speaking", "🗣️", "speaking", 24],
];
const key = (part) => "dele-" + part;
const GROUP_PASS = 30; // de 50 en cada grupo (dato «dele.a2_calificacion»)

function showDele() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("nationality")), el("h1", "", "🗣️ " + ui("deleTitle")), draftBanner());
  if (!hasPass(PASS)) {
    app.append(factNote("dele.a2_estructura"), passCard(PASS, showDele));
    return;
  }
  const menu = el("div", "menu");
  for (const [part, icon, k, min] of PARTS) {
    const r = lastResult(key(part));
    menu.append(menuRow(icon, ui(k), ui("minutesN", min), () => go("dele-" + part), { badge: r ? ui("pointsOf25", r.score) : null }));
  }
  app.append(menu);
  // Estimación por grupos con los últimos resultados.
  const g = (a, b) => (lastResult(key(a)) && lastResult(key(b)) ? lastResult(key(a)).score + lastResult(key(b)).score : null);
  const groups = el("div", "per-task");
  for (const [label, a, b] of [["group1", "reading", "writing"], ["group2", "listening", "speaking"]]) {
    const total = g(a, b);
    const row = el("div", "result-row");
    row.append(el("span", "", ui(label)), el("strong", "", total === null ? "— / 50" : `${total} / 50`));
    if (total !== null) row.append(el("span", "pill " + (total >= GROUP_PASS ? "free" : "lock"), total >= GROUP_PASS ? ui("apto") : ui("noApto")));
    groups.append(row);
  }
  app.append(el("p", "lead", ui("groupNeed")), groups, factNote("dele.a2_estructura"), factNote("dele.a2_calificacion"), factNote("dele.inscripcion"));
}

// ---------- Utilidades del simulacro ----------
function examShell(title, minutes, onTimeUp) {
  screen("lesson");
  const timer = countdown(minutes, onTimeUp);
  const head = el("div", "lesson-head exam-head");
  head.append(closeButton(() => go("dele")), el("strong", "", title), timer.el);
  return { head, timer };
}

// Pregunta de opción múltiple (a, b, c) dentro de una tarea. Guarda la respuesta en answers[id].
function mcq(id, q, options, answers) {
  const box = el("div", "card exam-q");
  box.lang = "es";
  box.dir = "ltr";
  box.append(el("p", "q-text", q));
  const opts = el("div", "options");
  options.forEach((o, i) => {
    const b = button("opt left" + (answers[id] === i ? " selected" : ""), "abc"[i] + ") " + o, () => {
      answers[id] = i;
      opts.querySelectorAll(".opt").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    opts.append(b);
  });
  box.append(opts);
  return box;
}

// Relacionar: un desplegable por frase.
function matchSelect(id, label, choices, answers) {
  const row = el("label", "match-row");
  row.lang = "es";
  row.dir = "ltr";
  const sel = el("select");
  sel.id = "match-" + id;
  sel.append(new Option("—", ""));
  choices.forEach((c, i) => sel.append(new Option(c, String(i))));
  if (answers[id] !== undefined) sel.value = String(answers[id]);
  sel.onchange = () => { answers[id] = sel.value === "" ? undefined : Number(sel.value); };
  row.append(el("span", "", label), sel);
  return row;
}

function textBlock(t) {
  const b = el("article", "reading-text");
  b.lang = "es";
  b.dir = "ltr";
  if (t.title) b.append(el("h3", "", t.title));
  for (const p of t.body.split("\n\n")) b.append(el("p", "", p));
  return b;
}

// Recorre las tareas de una prueba de comprensión y corrige al final.
function comprehension(part, data, title, renderTask, solutions) {
  const answers = {};
  let i = 0;
  const finish = () => {
    shell.timer.stop();
    const sol = solutions();
    const score = sol.filter(([id, ans]) => answers[id] === ans).length;
    saveResult(key(part), score, sol.length, score >= 15);
    screen("main");
    if (score >= 15) celebrate();
    app.append(mascot(score >= 15 ? "cheer" : "oops", 110), el("h1", "", ui("pointsOf25", score)), el("p", "lead center", ui("groupNeed")));
    const table = el("div", "per-task");
    for (const t of data.tasks) {
      const ids = sol.filter(([id]) => id.startsWith(t.id + "-"));
      const row = el("div", "result-row");
      row.append(el("span", "", t.title), el("strong", "", `${ids.filter(([id, a]) => answers[id] === a).length} / ${ids.length}`));
      table.append(row);
    }
    app.append(table, button("btn big", ui("next"), () => go("dele")));
  };
  const shell = examShell(title, data.minutes, finish);
  const render = () => {
    app.replaceChildren(shell.head);
    window.scrollTo(0, 0);
    const t = data.tasks[i];
    app.append(el("h2", "section", `${t.title} · ${i + 1} / ${data.tasks.length}`), el("p", "instructions", t.instructions), ...renderTask(t, answers));
    const nav = el("div", "exam-nav");
    nav.append(button("btn ghost-dark", "← " + ui("prev"), () => { if (i > 0) { i--; render(); } }));
    nav.append(i < data.tasks.length - 1 ? button("btn", ui("next") + " →", () => { i++; render(); }) : button("btn", ui("finish"), finish));
    app.append(nav);
  };
  render();
}

// ---------- Comprensión de lectura ----------
function reading() {
  const data = exam.reading;
  comprehension("reading", data, ui("reading"), (t, answers) => {
    const nodes = [];
    if (t.id === "L2") {
      // Cada texto breve con su pregunta.
      t.questions.forEach((q, k) => nodes.push(textBlock(t.texts[q.text]), mcq(`${t.id}-${k}`, q.q, q.options, answers)));
    } else if (t.match) {
      t.texts.forEach((x) => nodes.push(textBlock(x)));
      const box = el("div", "card");
      t.questions.forEach((q, k) => box.append(matchSelect(`${t.id}-${k}`, `${k + 1}. ${q.q}`, t.match, answers)));
      nodes.push(box);
    } else {
      t.texts.forEach((x) => nodes.push(textBlock(x)));
      t.questions.forEach((q, k) => nodes.push(mcq(`${t.id}-${k}`, `${k + 1}. ${q.q}`, q.options, answers)));
    }
    return nodes;
  }, () => data.tasks.flatMap((t) => t.questions.map((q, k) => [`${t.id}-${k}`, q.answer])));
}

// ---------- Comprensión auditiva ----------
// Botón de audio: el audio se escucha dos veces, como en el examen.
function audioButton(lines) {
  let left = 2;
  const b = button("btn ghost-dark audio-btn", "", () => {
    if (!left) return;
    left--;
    paint();
    speakDialog(lines);
  });
  const paint = () => { b.textContent = `🔊 ${ui("play")} · ${ui("playsLeft", left)}`; b.disabled = !left; };
  paint();
  return b;
}

function listening() {
  const data = exam.listening;
  comprehension("listening", data, ui("listeningTest"), (t, answers) => {
    const nodes = [];
    if (t.id === "A3") {
      nodes.push(audioButton(t.dialog));
      const box = el("div", "card");
      t.questions.forEach((q, k) => box.append(matchSelect(`${t.id}-${k}`, `${k + 1}. ${q.q}`, t.match, answers)));
      nodes.push(box);
    } else if (t.id === "A4") {
      const list = el("ol", "statements");
      list.lang = "es";
      list.dir = "ltr";
      list.type = "A";
      t.statements.forEach((s) => list.append(el("li", "", s)));
      nodes.push(list);
      t.items.forEach((it, k) => {
        const box = el("div", "card exam-q");
        box.append(el("p", "q-text", `${ui("play")} ${k + 1}`), audioButton(it.dialog),
          matchSelect(`${t.id}-${k}`, "→", t.statements.map((s, n) => "ABCDEFGHIJ"[n] + ") " + s), answers));
        nodes.push(box);
      });
    } else {
      t.items.forEach((it, k) => {
        const box = mcq(`${t.id}-${k}`, `${k + 1}. ${it.q}`, it.options, answers);
        box.insertBefore(audioButton(it.dialog), box.firstChild.nextSibling);
        nodes.push(box);
      });
    }
    return nodes;
  }, () => data.tasks.flatMap((t) => (t.questions || t.items).map((q, k) => [`${t.id}-${k}`, q.answer])));
}

// ---------- Autoevaluación (escritura y oral) ----------
function rubricPicker(id, label, levels, marks) {
  const box = el("div", "rubric");
  box.append(el("strong", "", label));
  levels.forEach((text, n) => {
    const b = button("opt left" + (marks[id] === n ? " selected" : ""), `${n} · ${text}`, () => {
      marks[id] = n;
      box.querySelectorAll(".opt").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    b.lang = "es";
    b.dir = "ltr";
    box.append(b);
  });
  return box;
}
// Puntuación orientativa sobre 25: media de los criterios (0-3) de todas las tareas.
const estimate = (marks, n) => Math.round((Object.values(marks).reduce((a, b) => a + b, 0) / (3 * 2 * n)) * 25);

function selfAssessment(part, tasks, renderTask) {
  const RUBRIC = exam[part].rubric;
  screen("main");
  const marks = {};
  app.append(el("h1", "", "📝 " + ui("selfAssess")), el("p", "lead", ui("selfAssessHelp")));
  tasks.forEach((t, k) => {
    const box = el("section", "step");
    box.append(el("h2", "", t.title), ...renderTask(t),
      rubricPicker(`${k}-task`, ui("rubricTask"), RUBRIC.task, marks), rubricPicker(`${k}-lang`, ui("rubricLang"), RUBRIC.language, marks));
    app.append(box);
  });
  app.append(button("btn big", ui("estimate"), () => {
    if (Object.keys(marks).length < tasks.length * 2) return;
    const score = estimate(marks, tasks.length);
    saveResult(key(part), score, 25, score >= 15);
    screen("main");
    app.append(mascot("cheer", 110), el("h1", "", ui("estimate") + ": " + ui("pointsOf25", score)), factNote("dele.a2_expresion"), button("btn big", ui("next"), () => go("dele")));
  }));
}

// ---------- Expresión escrita ----------
function writing() {
  const data = exam.writing;
  const texts = {};
  const choice = { E2: 0 };
  const finish = () => {
    shell.timer.stop();
    selfAssessment("writing", data.tasks, (t) => {
      const opt = t.choose ? t.options[choice[t.id]] : t;
      const mine = el("div", "my-answer");
      mine.lang = "es";
      mine.dir = "ltr";
      mine.textContent = texts[t.id] || "—";
      const model = el("details", "model");
      model.append(el("summary", "", ui("showModel")), textBlock({ body: opt.model }));
      return [mine, model];
    });
  };
  const shell = examShell(ui("writing"), data.minutes, finish);
  app.append(shell.head);
  for (const t of data.tasks) {
    const box = el("section", "step");
    box.lang = "es";
    box.dir = "ltr";
    box.append(el("h2", "", t.title));
    const area = el("textarea", "write-area");
    area.id = "write-" + t.id;
    area.lang = "es";
    area.dir = "ltr";
    area.rows = 7;
    const count = el("p", "q-meta");
    const goal = ui("wordsGoal", t.words.join("–"));
    const update = () => {
      texts[t.id] = area.value;
      const n = (area.value.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g) || []).length;
      count.textContent = `${ui("wordsN", n)} · ${goal}`;
      count.classList.toggle("ok", n >= t.words[0] && n <= t.words[1]);
    };
    area.oninput = update;
    if (t.choose) {
      const instr = el("p", "instructions");
      const pick = el("div", "options two");
      t.options.forEach((o, n) => pick.append(button("opt" + (n === 0 ? " selected" : ""), o.label, (e) => {
        choice[t.id] = n;
        instr.textContent = o.instructions;
        pick.querySelectorAll(".opt").forEach((x) => x.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
      })));
      instr.textContent = t.options[0].instructions;
      box.append(el("p", "q-meta", ui("chooseOne")), pick, instr);
    } else {
      box.append(el("p", "instructions", t.instructions), el("blockquote", "prompt-text", t.prompt));
    }
    box.append(area, count);
    update();
    app.append(box);
  }
  app.append(button("btn big", ui("finish"), finish));
}

// ---------- Expresión oral ----------
function speaking() {
  const data = exam.speaking;
  const notes = el("textarea", "write-area");
  notes.id = "oral-notes";
  notes.rows = 5;
  // 1) Preparación: 12 minutos con las tres tareas a la vista para tomar notas.
  const prepShell = examShell(ui("prep"), data.prepMinutes, () => tasks(0));
  app.append(prepShell.head, el("p", "lead", ui("prep") + " · " + ui("minutesN", data.prepMinutes)));
  for (const t of data.tasks) app.append(oralTask(t, false));
  app.append(notes, button("btn big", ui("skipPrep"), () => { prepShell.timer.stop(); tasks(0); }));

  // 2) Examen: una tarea tras otra, con su tiempo.
  function tasks(n) {
    if (n >= data.tasks.length) {
      return selfAssessment("speaking", data.tasks, (t) => [oralTask(t, false)]);
    }
    const t = data.tasks[n];
    const shell = examShell(t.title, t.minutes[1], () => tasks(n + 1));
    app.append(shell.head, el("p", "lead", ui("speakNow")), oralTask(t, true), button("btn big", ui("next") + " →", () => { shell.timer.stop(); tasks(n + 1); }));
  }
}

function oralTask(t, live) {
  const box = el("section", "step");
  box.lang = "es";
  box.dir = "ltr";
  box.append(el("h2", "", `${t.title} (${t.minutes.join("–")} min)`));
  if (t.choose) {
    for (const o of t.options) {
      const opt = el("div", "oral-option");
      opt.append(el("strong", "", o.label), list(o.guide));
      box.append(opt);
    }
  }
  if (t.scene) box.append(el("div", "scene", t.scene), el("p", "instructions", t.sceneText), list(t.guide));
  if (t.situation) {
    box.append(el("p", "instructions", t.situation));
    if (live) {
      // El examinador habla por turnos; la persona responde en voz alta.
      let k = 0;
      const line = el("blockquote", "prompt-text", t.examiner[0]);
      const nextTurn = button("btn ghost-dark", "🔊 " + ui("examinerSays"), () => {
        speak(t.examiner[k], "es");
        line.textContent = t.examiner[k];
        k = Math.min(k + 1, t.examiner.length - 1);
      });
      box.append(el("p", "q-meta", ui("examinerSays")), line, nextTurn);
    }
    box.append(el("p", "q-meta", ui("usefulPhrases")), list(t.phrases));
  }
  return box;
}

function list(items) {
  const ul = el("ul", "guide");
  for (const i of items) ul.append(el("li", "", i));
  return ul;
}

register("dele", showDele);
register("dele-reading", reading);
register("dele-listening", listening);
register("dele-writing", writing);
register("dele-speaking", speaking);
