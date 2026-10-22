// Pestaña Aprender: el camino de lecciones por unidades, cada una con su objetivo «Ya sé…».
import { ui, tr } from "../core/i18n.js";
import { save } from "../core/state.js";
import { register } from "../core/router.js";
import { el, txt, button } from "../ui/dom.js";
import { app, screen, setTab } from "../ui/shell.js";
import { go } from "../core/router.js";
import { UNITS, LESSON_TYPES, doneIn, unitComplete } from "./course.js";
import { startLesson } from "./lesson.js";

// Desplazamiento en zigzag de los nodos dentro de cada unidad.
const ZIGZAG = [0, 1, 0, -1];

function showPath() {
  setTab("path");
  screen("main");
  app.append(continueCard());
  const path = el("div", "path");
  let foundCurrent = false;
  // La unidad con la lección que toca se ve entera; las demás, en una línea que se despliega al tocarla.
  const currentUnit = UNITS.findIndex((u) => !unitComplete(u));
  UNITS.forEach((u, n) => {
    // Cada unidad es un bloque; su cabecera se queda fija arriba mientras se recorre.
    const compact = n !== currentUnit;
    const block = el("section", "unit-block" + (compact ? " compact" : ""));
    const banner = el("div", "unit" + (unitComplete(u) ? " complete" : ""));
    banner.style.setProperty("--unit", u.color);
    const text = el("div", "unit-text");
    text.append(el("span", "unit-kicker", ui("unit") + " " + (n + 1)), txt("strong", "", tr("w_" + u.id, save.native), save.native),
      txt("span", "unit-goal", (unitComplete(u) ? "✓ " : "🎯 ") + tr("c_" + u.id, save.native), save.native));
    banner.append(text, el("span", "unit-emoji", u.emoji));
    if (compact) {
      // Cabecera compacta: progreso «2/4» y botón para ver sus lecciones.
      const toggle = button("unit-toggle", "", () => block.classList.toggle("open"));
      toggle.setAttribute("aria-label", tr("w_" + u.id, save.native));
      toggle.append(el("span", "unit-count", `${Math.min(doneIn(u), LESSON_TYPES.length)}/${LESSON_TYPES.length}`), el("span", "chev", "›"));
      banner.append(toggle);
    }
    block.append(banner);
    const nodes = el("div", "nodes");
    LESSON_TYPES.forEach((lt, li) => {
      const done = doneIn(u) > li;
      const current = !done && !foundCurrent;
      if (current) foundCurrent = true;
      // En modo demo, o con nivel «me defiendo» o más, se puede abrir cualquier lección sin haber hecho las anteriores.
      const state = done ? "done" : current ? "current" : save.demo || save.level >= 2 ? "open" : "locked";
      const node = el("div", "node-wrap " + state + (lt.type === "practice" ? " reward" : ""));
      node.style.setProperty("--x", ZIGZAG[li] * (n % 2 ? -1 : 1));
      const b = el("button", "node");
      b.type = "button";
      b.style.setProperty("--unit", u.color);
      b.append(el("span", "", state === "locked" ? "🔒" : done && lt.type !== "practice" ? "✓" : lt.icon));
      b.setAttribute("aria-label", ui(lt.key) + (state === "locked" ? " 🔒" : ""));
      b.disabled = state === "locked";
      b.onclick = () => startLesson(u, li);
      if (current) node.append(el("span", "start-tag", ui("start")));
      node.append(b, el("span", "node-label", ui(lt.key)));
      nodes.append(node);
    });
    block.append(nodes);
    path.append(block);
  });
  app.append(path);
  // Baja hasta la lección que toca (después de que el navegador coloque la página).
  const current = app.querySelector(".node-wrap.current");
  if (current) requestAnimationFrame(() => current.scrollIntoView({ block: "center" }));
}

// Tarjeta «Continuar»: la última lección o el último examen a medias; si no hay, la lección que toca.
function continueCard() {
  const r = save.resume;
  let title, run;
  const unitIdx = (id) => UNITS.findIndex((u) => u.id === id);
  if (r?.kind === "lesson" && unitIdx(r.unit) >= 0 && LESSON_TYPES[r.li]) {
    const u = UNITS[unitIdx(r.unit)];
    title = `${ui("continueLesson", unitIdx(r.unit) + 1)} · ${ui(LESSON_TYPES[r.li].key)}`;
    run = () => startLesson(u, r.li);
  } else if (r?.kind === "exam") {
    title = ui(r.key) + (r.sub ? " · " + r.sub : "");
    run = () => go(r.route, r.arg);
  } else {
    const n = UNITS.findIndex((u) => !unitComplete(u));
    if (n < 0) return "";
    const li = doneIn(UNITS[n]);
    title = `${ui("continueLesson", n + 1)} · ${ui(LESSON_TYPES[li].key)}`;
    run = () => startLesson(UNITS[n], li);
  }
  const card = button("continue-card", "", run);
  card.append(el("span", "continue-kicker", ui("continueTitle")), el("strong", "", title), el("span", "chev", "›"));
  return card;
}

register("path", showPath);
