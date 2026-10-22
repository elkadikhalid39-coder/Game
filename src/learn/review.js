// Pestañas Repasar y Perfil.
import { ui, tr } from "../core/i18n.js";
import { save, TARGET } from "../core/state.js";
import { register } from "../core/router.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, setTab } from "../ui/shell.js";
import { settingsCard } from "../screens/onboarding.js";
import { UNITS, LESSON_TYPES, lessonsDone } from "./course.js";
import { startReview } from "./lesson.js";

function showReview() {
  setTab("review");
  screen("main");
  app.append(el("h1", "", "🔁 " + ui("tabReview")));
  if (!save.mistakes.length) {
    app.append(speech(ui("reviewEmpty"), "happy"));
    return;
  }
  app.append(speech(ui("reviewCount", save.mistakes.length), "talk"));
  const chips = el("div", "chips");
  for (const m of save.mistakes.slice(0, 30)) chips.append(txt("span", "chip-item", tr(m.k === "p" ? "q_" + m.id : m.id, TARGET), TARGET));
  app.append(chips, button("btn big", ui("reviewStart"), startReview));
}

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
  app.append(head, grid, el("h2", "section", "⚙️ " + ui("settings")), settingsCard());
}

register("review", showReview);
register("profile", showProfile);
