// Pestaña Aprender: «El barrio». Cada unidad es un lugar (centro de salud, trabajo, ayuntamiento…)
// con una misión de cuatro pasos. Al terminarla, el lugar recibe su sello en el pasaporte.
import { ui, tr } from "../core/i18n.js";
import { save } from "../core/state.js";
import { register } from "../core/router.js";
import { el, txt } from "../ui/dom.js";
import { mascot } from "../ui/mascot.js";
import { app, screen, setTab } from "../ui/shell.js";
import { UNITS, LESSON_TYPES, doneIn, unitComplete } from "./course.js";
import { startLesson } from "./lesson.js";

function showPath() {
  setTab("path");
  screen("main");
  app.append(el("h1", "", ui("barrioTitle")), el("p", "lead center", ui("barrioIntro")));
  const map = el("div", "barrio");
  let foundCurrent = false;
  UNITS.forEach((u, n) => {
    const complete = unitComplete(u);
    const hasCurrent = !complete && !foundCurrent;
    const place = el("section", "place" + (complete ? " complete" : "") + (hasCurrent ? " here" : ""));
    place.style.setProperty("--unit", u.color);
    // Cabecera: dibujo del lugar, nombre y misión; el sello si ya está completa.
    const head = el("div", "place-head");
    const text = el("div", "place-text");
    text.append(el("span", "place-kicker", ui("placeN", n + 1)), txt("strong", "place-name", tr("w_" + u.id, save.native), save.native),
      txt("span", "place-goal", ui("missionLabel") + " " + tr("c_" + u.id, save.native), save.native));
    head.append(el("span", "place-icon", u.emoji), text);
    if (complete) head.append(mascot("cheer", 58));
    place.append(head);
    // Itinerario de la misión: cuatro pasos unidos por una línea.
    const steps = el("ol", "nodes itinerary");
    LESSON_TYPES.forEach((lt, li) => {
      const done = doneIn(u) > li;
      const current = !done && !foundCurrent;
      if (current) foundCurrent = true;
      // En modo demo, o con nivel «me defiendo» o más, se puede abrir cualquier paso sin haber hecho los anteriores.
      const state = done ? "done" : current ? "current" : save.demo || save.level >= 2 ? "open" : "locked";
      const step = el("li", "node-wrap " + state + (lt.type === "practice" ? " reward" : ""));
      const b = el("button", "node");
      b.type = "button";
      b.append(el("span", "step-mark", state === "locked" ? "🔒" : done ? "✓" : String(li + 1)));
      b.append(el("span", "node-label", ui(lt.key)));
      b.setAttribute("aria-label", ui(lt.key) + (state === "locked" ? " 🔒" : ""));
      b.disabled = state === "locked";
      b.onclick = () => startLesson(u, li);
      step.append(b);
      if (current) step.append(el("span", "start-tag", ui("start") + " →"));
      steps.append(step);
    });
    place.append(steps);
    map.append(place);
  });
  app.append(map);
  // Baja hasta el lugar donde toca seguir.
  const current = app.querySelector(".place.here");
  if (current) requestAnimationFrame(() => current.scrollIntoView({ block: "center" }));
}

register("path", showPath);
