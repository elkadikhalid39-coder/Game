// Pestaña Aprender: el camino de lecciones por unidades, cada una con su objetivo «Ya sé…».
import { ui, tr } from "../core/i18n.js";
import { save } from "../core/state.js";
import { register } from "../core/router.js";
import { el, txt } from "../ui/dom.js";
import { app, screen, setTab } from "../ui/shell.js";
import { UNITS, LESSON_TYPES, doneIn, unitComplete } from "./course.js";
import { startLesson } from "./lesson.js";

// Desplazamiento en zigzag de los nodos dentro de cada unidad.
const ZIGZAG = [0, 1, 0, -1];

function showPath() {
  setTab("path");
  screen("main");
  const path = el("div", "path");
  let foundCurrent = false;
  UNITS.forEach((u, n) => {
    // Cada unidad es un bloque; su cabecera se queda fija arriba mientras se recorre.
    const block = el("section", "unit-block");
    const banner = el("div", "unit" + (unitComplete(u) ? " complete" : ""));
    banner.style.setProperty("--unit", u.color);
    const text = el("div", "unit-text");
    text.append(el("span", "unit-kicker", ui("unit") + " " + (n + 1)), txt("strong", "", tr("w_" + u.id, save.native), save.native),
      txt("span", "unit-goal", (unitComplete(u) ? "✓ " : "🎯 ") + tr("c_" + u.id, save.native), save.native));
    banner.append(text, el("span", "unit-emoji", u.emoji));
    block.append(banner);
    const nodes = el("div", "nodes");
    LESSON_TYPES.forEach((lt, li) => {
      const done = doneIn(u) > li;
      const current = !done && !foundCurrent;
      if (current) foundCurrent = true;
      const state = done ? "done" : current ? "current" : "locked";
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

register("path", showPath);
