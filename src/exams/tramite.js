// «Mi trámite»: unas preguntas → lista personalizada de lo que necesita la persona para pedir la nacionalidad.
// Cada punto enlaza a su dato oficial (fuente, estado y fecha de comprobación).
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { el, button } from "../ui/dom.js";
import { speech } from "../ui/mascot.js";
import { app, screen } from "../ui/shell.js";
import { factNote, extLink } from "../ui/fact.js";
import { draftBanner } from "./common.js";

const HISPANIC = "Argentina, Bolivia, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala, Guinea Ecuatorial, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, Puerto Rico, República Dominicana, Uruguay, Venezuela";
const SEDE = "https://sede.mjusticia.gob.es/tramites/nacionalidad-espanola";

// Preguntas en orden; `when` decide si se hace según las respuestas anteriores.
const QUESTIONS = [
  { id: "age", key: "qAge", options: [["under14", "ageUnder14"], ["teen", "age14to17"], ["adult", "ageAdult"]] },
  { id: "case", key: "qCase", options: [["one", "caseOneYear"], ["two", "caseTwoYears"], ["refugee", "caseRefugee"], ["general", "caseGeneral"]] },
  { id: "hispanic", key: "qHispanic", extra: HISPANIC, when: (a) => a.age === "adult", options: [["yes", "yes"], ["no", "no"]] },
  { id: "cert", key: "qLangCert", when: (a) => a.age === "adult" && a.hispanic === "no", options: [["yes", "yes"], ["no", "no"]] },
  { id: "eso", key: "qEso", when: (a) => a.age === "adult", options: [["yes", "yes"], ["no", "no"]] },
  { id: "literacy", key: "qLiteracy", when: (a) => a.age === "adult" && a.eso === "no", options: [["yes", "yes"], ["no", "no"]] },
];

function ask(answers) {
  const q = QUESTIONS.find((x) => !(x.id in answers) && (!x.when || x.when(answers)));
  if (!q) return showChecklist(answers);
  screen("main");
  const done = QUESTIONS.filter((x) => x.id in answers).length;
  app.append(button("back", "← " + ui("back"), () => go("nationality")), el("h1", "", "🗂️ " + ui("myCase")));
  if (!done) app.append(el("p", "lead", ui("myCaseDesc")));
  app.append(speech(ui(q.key), "talk"));
  if (q.extra) app.append(el("p", "country-list", q.extra));
  const opts = el("div", "options");
  for (const [value, key] of q.options) {
    opts.append(button("opt left", ui(key), () => ask({ ...answers, [q.id]: value })));
  }
  app.append(opts);
}

// Un paso de la lista: título en el idioma de la persona y datos oficiales debajo (en español).
function step(icon, title, ids, extra) {
  const box = el("section", "step");
  box.append(el("h2", "", icon + " " + title));
  for (const id of ids) box.append(factNote(id));
  if (extra) box.append(extra);
  return box;
}

function showChecklist(a) {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("nationality")), el("h1", "", "✅ " + ui("yourResult")), draftBanner());
  const years = { one: 1, two: 2, refugee: 5, general: 10 }[a.case];
  const yearsFact = { one: "nac.residencia_un_ano", two: "nac.residencia_dos_anos", refugee: "nac.residencia_refugiados", general: "nac.residencia_general" }[a.case];
  app.append(step("📅", years === 1 ? ui("stepYearsOne") : ui("stepYears", years), [yearsFact, "nac.residencia_requisitos"]));

  if (a.age !== "adult") {
    app.append(step("🎒", ui("minorsNoTests"), ["nac.menores_exentos"]));
  } else {
    if (a.hispanic === "yes") app.append(step("✔️", ui("noDele"), ["nac.exento_dele_paises"]));
    else if (a.cert === "yes") app.append(step("✔️", ui("noDele"), ["nac.exento_dele_previo", "nac.certificados_idioma"]));
    else app.append(step("🗣️", ui("needDele"), ["nac.pruebas", "dele.a2_estructura"], button("btn ghost-dark", "🗣️ " + ui("deleTitle") + " →", () => go("dele"))));
    app.append(step("📘", ui("needCcse"), ["ccse.estructura", "nac.ccse_vigencia", "nac.discapacidad_ajustes"], button("btn ghost-dark", "📘 " + ui("ccseTitle") + " →", () => go("ccse"))));
    if (a.eso === "yes") app.append(step("🎓", ui("dispensaYouCan"), ["nac.dispensa_quien"]));
    if (a.literacy === "yes") {
      const s = step("⚠️", ui("dispensaFirst"), ["nac.dispensa_quien", "nac.dispensa_antes", "nac.dispensa_otros"]);
      s.classList.add("important");
      app.append(s);
    }
  }
  app.append(step("📄", ui("stepDocuments"), a.age === "adult" ? ["nac.documentos", "nac.antecedentes_vigencia"] : ["nac.documentos"]));
  app.append(step("👤", ui("stepWho"), ["nac.quien_solicita"]));
  const link = el("p", "official-link");
  link.append(extLink("🌐 " + ui("openOfficial") + " · sede.mjusticia.gob.es", SEDE));
  app.append(step("💻", ui("stepHow"), ["nac.presentacion", "nac.tasa", "nac.tasa_examenes"], link));
  app.append(step("⏳", ui("stepAfter"), ["nac.subsanacion", "nac.plazo_resolucion", "nac.jura", "nac.renuncia", "nac.inscripcion", "nac.recursos", "nac.sentencia_2024"]));
  if (a.age === "adult") app.append(step("🗓️", ui("stepValidity"), ["nac.ccse_vigencia", "nac.dele_vigencia"]));
  app.append(factNote("nac.no_asesoria"), button("btn ghost-dark", "↺ " + ui("restart"), () => ask({})));
}

register("tramite", () => ask({}));
