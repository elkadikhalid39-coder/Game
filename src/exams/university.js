// Pase de Universidad: Mi ruta (gratis), materias PCE con su formato oficial, simulacros de test,
// redacción académica y cálculo orientativo de la nota.
import pce from "../../content/exams/pce.json";
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { el, button } from "../ui/dom.js";
import { app, screen } from "../ui/shell.js";
import { factNote, extLink } from "../ui/fact.js";
import { hasPass, draftBanner, menuRow, tscreen, secondaryActions } from "./common.js";
import { passCard } from "./nationality.js";

export const PASS = "universidad";
export const UNEDASISS = "https://unedasiss.uned.es/";
// Muestra gratuita: el test de Inglés y el primer texto de redacción.
export const FREE_TESTS = ["ingles"];

// Número con coma decimal, como en los documentos oficiales.
export const fmt = (n, digits = 2) => n.toLocaleString("es-ES", { maximumFractionDigits: digits });

function showUniversity() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("exams")), el("h1", "", "🎓 " + ui("passUni")), draftBanner());
  const visa = el("p", "notice visa");
  visa.append("✈️ ", ui("noVisaNotice"));
  app.append(visa);
  const locked = !hasPass(PASS);
  const menu = el("div", "menu");
  // Tres acciones principales (practicar por materia, simulacro, mi caso); el resto, enlaces secundarios.
  menu.append(
    menuRow("📑", ui("subjectsTitle"), ui("subjectsDesc"), () => go("pce-subjects"), { badge: ui("free") }),
    menuRow("⏱", ui("pceMocks"), ui("pceMocksDesc"), () => go("pce-mocks"), { badge: locked ? ui("free") + " · " + ui("locked") : null }),
    menuRow("🧭", ui("uniRoute"), ui("uniRouteDesc"), () => go("uni-route"), { badge: ui("free") }),
  );
  app.append(menu, secondaryActions([
    ["✍️ " + ui("academicWriting"), () => go("pce-writing")],
    ["🧮 " + ui("gradeCalc"), () => go("pce-calc")],
    ["📚 " + ui("officialSources"), () => go("sources", "university")],
    ["🗣️ " + ui("practiceSpanish"), () => go("path")],
  ]), passCard(PASS, showUniversity));
}

// ---------- Materias ----------
const SUBJECTS = pce.subjects;
const byId = (id) => SUBJECTS.find((s) => s.id === id);

function typePill(s) {
  return el("span", "pill " + (s.type === "test" ? "free" : "info"), s.type === "test" ? ui("typeTest") : ui("typeDev"));
}

function officialLinks(s) {
  const box = el("p", "official-link");
  box.lang = "es";
  box.dir = "ltr";
  box.append(extLink("📄 " + ui("officialGuide"), s.guide), " · ", extLink("📝 " + ui("officialModel"), s.model),
    el("span", "q-meta", " · " + ui("guideDate", s.guideDate.split("-").reverse().join("/"))));
  return box;
}

function showSubjects() {
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("university")), el("h1", "", "📑 " + ui("subjectsTitle")),
    factNote("pce.materias_numero"), factNote("pce.idioma"), factNote("pce.tipos"));
  app.append(el("h2", "section", "✅ " + ui("verifiedSubjects")));
  const menu = el("div", "menu");
  for (const s of SUBJECTS.filter((x) => x.id)) {
    menu.append(menuRow("📘", s.name, s.modality, () => go("pce-subject", s.id), { badge: ui("verifiedSubject") }));
  }
  app.append(menu);
  // Materias sin ficha propia todavía (hoy todas la tienen): solo el enlace a su guía oficial.
  const others = SUBJECTS.filter((x) => !x.id);
  if (others.length) app.append(el("h2", "section", "📂 " + ui("otherSubjects")), el("p", "lead", ui("otherSubjectsHelp")));
  for (const s of others) {
    const row = el("div", "subject-row");
    const head = el("div", "subject-head");
    head.lang = "es";
    head.dir = "ltr";
    head.append(el("strong", "", s.name), typePill(s));
    row.append(head, el("p", "q-meta", s.modality), officialLinks(s));
    app.append(row);
  }
}

function showSubject(id) {
  const s = byId(id);
  const d = pce.details[id];
  tscreen("main");
  app.append(button("back", "← " + ui("back"), () => go("pce-subjects")), el("h1", "", "📘 " + s.name), factNote(d.fact));
  for (const f of d.extra || []) app.append(factNote(f));
  app.append(factNote("pce.normas"), el("h2", "section", ui("program")));
  const list = el("ul", "guide");
  list.lang = "es";
  list.dir = "ltr";
  for (const p of d.program) list.append(el("li", "", p));
  app.append(list, officialLinks(s));
  for (const t of d.tools) {
    if (t === "writing") app.append(button("btn big", "✍️ " + ui("academicWriting"), () => go("pce-writing")));
    else app.append(button("btn big", "⏱ " + ui("practiceTest"), () => go("pce-test", t)));
  }
}

register("university", showUniversity);
register("pce-subjects", showSubjects);
register("pce-subject", showSubject);
