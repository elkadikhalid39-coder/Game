// «Mi ruta a la universidad»: unas preguntas → los pasos que le tocan a cada persona, con sus datos oficiales.
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { el, button } from "../ui/dom.js";
import { speech } from "../ui/mascot.js";
import { app, screen } from "../ui/shell.js";
import { factNote, extLink } from "../ui/fact.js";
import { draftBanner } from "./common.js";
import { UNEDASISS } from "./university.js";

const QUESTIONS = [
  { id: "origin", key: "qOrigin", options: [["spain", "originSpain"], ["eu", "originEu"], ["ib", "originIb"], ["other", "originOther"]] },
  { id: "resident", key: "qResident", when: (a) => a.origin !== "spain", options: [["yes", "yes"], ["no", "no"]] },
  { id: "uni", key: "qUniType", options: [["public", "uniPublic"], ["private", "uniPrivate"], ["unknown", "uniUnknown"]] },
];

function ask(answers) {
  const q = QUESTIONS.find((x) => !(x.id in answers) && (!x.when || x.when(answers)));
  if (!q) return showRoute(answers);
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "🧭 " + ui("uniRoute")));
  if (!Object.keys(answers).length) app.append(el("p", "lead", ui("uniRouteDesc")));
  app.append(speech(ui(q.key), "talk"));
  const opts = el("div", "options");
  for (const [value, key] of q.options) opts.append(button("opt left", ui(key), () => ask({ ...answers, [q.id]: value })));
  app.append(opts);
}

function step(icon, title, ids, extra) {
  const box = el("section", "step");
  box.append(el("h2", "", icon + " " + title));
  for (const id of ids) box.append(factNote(id));
  if (extra) box.append(...[extra].flat());
  return box;
}

const link = (label, url) => {
  const p = el("p", "official-link");
  p.append(extLink("🌐 " + label, url));
  return p;
};

function showRoute(a) {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "✅ " + ui("yourResult")), draftBanner());
  const toSubjects = button("btn ghost-dark", "📑 " + ui("subjectsTitle") + " →", () => go("pce-subjects"));
  const toCalc = button("btn ghost-dark", "🧮 " + ui("gradeCalc") + " →", () => go("pce-calc"));

  if (a.origin === "spain") {
    app.append(step("🎓", ui("stepPau"), ["pce.pau", "pce.admision"], toCalc));
  } else {
    if (a.origin === "other") {
      app.append(step("📜", ui("stepHomolog"), ["pce.homologacion"]));
    } else {
      app.append(step("✔️", ui("stepPceOptional"), ["pce.ue_sin_prueba"]));
    }
    app.append(step("🪪", ui("stepAccredit"), ["pce.que_es", "pce.fases"], link(ui("countryInfo"), UNEDASISS)));
    app.append(step("📚", ui("stepChooseSubjects"), ["pce.materias_numero", "pce.tipos", "pce.idioma"], toSubjects));
    app.append(step("🗓️", ui("stepDates"), ["pce.fechas"]));
    app.append(step("📝", ui("stepExam"), ["pce.duracion", "pce.normas"]));
    app.append(step("🏫", ui("stepEnroll"), ["pce.admision"]));
    app.append(step("🧮", ui("stepGrade"), ["pce.nota"], toCalc));
    if (a.resident === "no") {
      const visa = step("✈️", ui("stepVisa"), ["pce.no_visado"]);
      visa.classList.add("important");
      app.append(visa);
    }
    if (a.origin === "other") app.append(step("⚠️", ui("stepReform"), ["pce.reforma", "pce.marco_legal"]));
  }
  if (a.uni !== "public") app.append(step("🏛️", ui("stepPrivate"), ["pce.privadas"]));
  app.append(button("btn ghost-dark", "↺ " + ui("restart"), () => ask({})));
}

register("uni-route", () => ask({}));
