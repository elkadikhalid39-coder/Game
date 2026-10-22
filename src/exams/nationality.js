// Pase de Nacionalidad: Mi trámite (gratis), CCSE y DELE A2, con todas las fuentes oficiales.
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { FACTS } from "../core/facts.js";
import { el, button } from "../ui/dom.js";
import { app, screen } from "../ui/shell.js";
import { factNote } from "../ui/fact.js";
import { hasPass, unlockPass, draftBanner, menuRow } from "./common.js";

export const PASS = "nacionalidad";

// Botón para desbloquear el pase. En esta versión no hay pago: sirve para probar el contenido completo.
export function passCard(id, onUnlock) {
  const card = el("div", "card pass-card");
  if (hasPass(id)) {
    card.append(el("strong", "", "✅ " + ui("passActive")));
  } else {
    card.append(button("btn", "🔓 " + ui("unlock"), () => { unlockPass(id); onUnlock(); }));
  }
  return card;
}

function showNationality() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("exams")), el("h1", "", "🏛️ " + ui("passNat")), draftBanner());
  const locked = !hasPass(PASS);
  const menu = el("div", "menu");
  menu.append(
    menuRow("🗂️", ui("myCase"), ui("myCaseDesc"), () => go("tramite"), { badge: ui("free") }),
    menuRow("📘", ui("ccseTitle"), ui("ccseDesc"), () => go("ccse"), { badge: locked ? ui("free") + " · " + ui("locked") : null }),
    menuRow("🗣️", ui("deleTitle"), ui("deleDesc"), () => go("dele"), { badge: locked ? ui("locked") : null, locked }),
    menuRow("📚", ui("officialSources"), "BOE · Ministerio de Justicia · Instituto Cervantes", () => go("sources", "nationality")),
  );
  app.append(menu, passCard(PASS, showNationality));
}

// Todas las fuentes de un pase, agrupadas.
function showSources(from) {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go(from)), el("h1", "", "📚 " + ui("officialSources")));
  const groups = from === "university" ? [["pce.", "🎓 " + ui("passUni")]] : [["nac.", "🗂️ " + ui("myCase")], ["ccse.", "📘 " + ui("ccseTitle")], ["dele.", "🗣️ " + ui("deleTitle")]];
  for (const [prefix, title] of groups) {
    app.append(el("h2", "section", title));
    for (const id of Object.keys(FACTS).filter((k) => k.startsWith(prefix))) app.append(factNote(id));
  }
}

register("nationality", showNationality);
register("sources", showSources);
