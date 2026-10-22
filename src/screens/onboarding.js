// Primera vez: bienvenida e idioma de la persona. También la tarjeta de ajustes del perfil.
import { I18N, LANGS, ui } from "../core/i18n.js";
import { save, persist } from "../core/state.js";
import { register, go } from "../core/router.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, renderBars } from "../ui/shell.js";

function showWelcome() {
  screen("plain", "");
  const hero = el("section", "welcome");
  hero.append(
    mascot("cheer", 140),
    el("h1", "wordmark", "Hola, Español"),
    el("p", "greetings", "Hola · Hello · Bonjour · مرحبا · Salut · Привіт · 你好 · سلام"),
  );
  app.append(hero, button("btn big", "Empezar · Start · ابدأ", () => go("language")));
}

// Idioma de la persona: el de la interfaz, las traducciones y las explicaciones.
// Antes de saberlo, se pregunta en varios idiomas. Puede ser el propio español.
function showLanguage() {
  screen("plain", "");
  const list = el("div", "langs");
  for (const code of LANGS) {
    const b = el("button", "lang-row" + (code === save.native ? " selected" : ""));
    b.type = "button";
    b.append(el("span", "code", code.toUpperCase()), txt("span", "name", I18N[code].name, code));
    b.onclick = () => { save.native = code; persist(); go("home"); };
    list.append(b);
  }
  app.append(speech("🗣️ Yo hablo · I speak · Je parle · أنا أتحدث", "talk"), list);
}

export function settingsCard() {
  const card = el("div", "card settings");
  const row = button("setting", "", () => go("language"));
  row.append(el("span", "icon", "🌐"), el("span", "", ui("changeLang")), el("span", "chev", "›"));
  card.append(row);
  const calm = el("label", "setting toggle");
  const box = el("input");
  box.type = "checkbox";
  box.id = "calm-mode";
  box.checked = save.calm;
  box.onchange = () => { save.calm = box.checked; persist(); renderBars(); };
  calm.append(el("span", "icon", "🌙"), el("span", "", ui("calm")), box);
  card.append(calm);
  return card;
}

register("welcome", showWelcome);
register("language", showLanguage);
register("home", () => go(save.native ? "path" : "welcome"));
