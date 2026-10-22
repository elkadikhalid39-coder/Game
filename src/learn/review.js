// Pestaña Perfil (la de Practicar está en practice.js).
import { ui, tr } from "../core/i18n.js";
import { save } from "../core/state.js";
import { register } from "../core/router.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, setTab } from "../ui/shell.js";
import { settingsCard } from "../screens/onboarding.js";
import { UNITS, LESSON_TYPES, lessonsDone, unitComplete } from "./course.js";

function showProfile() {
  setTab("profile");
  screen("main");
  const head = el("div", "profile-head");
  const names = el("div", "");
  names.append(el("strong", "", "Hola, Español"), el("span", "", ui("tagline")));
  head.append(mascot("happy", 84), names);
  const tile = (icon, value, label, cls) => {
    const d = el("div", "stat-tile " + cls);
    d.append(el("span", "icon", icon), el("strong", "", String(value)), el("span", "", label));
    return d;
  };
  const grid = el("div", "stats");
  grid.append(tile("📚", save.learned.length, ui("wordsLearned"), "mint"),
    tile("✅", lessonsDone() + " / " + UNITS.length * LESSON_TYPES.length, ui("lessonsDone"), "grape"),
    tile("🔁", save.mistakes.length, ui("tabReview"), "coral"));
  // Objetivos: lo que ya sé hacer (unidades completas) y lo que falta.
  const goals = el("ul", "can-do");
  for (const u of UNITS) {
    const li = txt("li", unitComplete(u) ? "done" : "", (unitComplete(u) ? "✓ " : "○ ") + tr("c_" + u.id, save.native), save.native);
    goals.append(li);
  }
  app.append(head, grid, el("h2", "section", "🎯 " + ui("canDoTitle")), goals, el("h2", "section", "⚙️ " + ui("settings")), settingsCard());
}

register("profile", showProfile);
