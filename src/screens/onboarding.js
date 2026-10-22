// Primera vez: bienvenida, idioma de la persona y su nivel de español. También la tarjeta de ajustes del perfil.
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
    b.onclick = () => { save.native = code; persist(); go(save.level === null ? "level" : "home"); };
    list.append(b);
  }
  app.append(speech("🗣️ Yo hablo · I speak · Je parle · أنا أتحدث", "talk"), list);
}

// Nivel de español: cambia cuánto se presenta, cuánto se repite y si se trabaja con palabras o con frases.
export const LEVELS = [0, 1, 2, 3];
function showLevel() {
  screen("plain");
  app.append(speech(ui("levelTitle"), "talk"), el("p", "lead center", ui("levelSub")));
  const list = el("div", "levels");
  for (const n of LEVELS) {
    const b = el("button", "level-row" + (n === save.level ? " selected" : ""));
    b.type = "button";
    b.dataset.level = n;
    b.append(el("span", "level-bars", "▮".repeat(n + 1) + "▯".repeat(3 - n)), el("strong", "", ui("lvl" + n)), el("span", "", ui("lvl" + n + "d")));
    b.onclick = () => { save.level = n; persist(); go("home"); };
    list.append(b);
  }
  app.append(list);
}

export function settingsCard() {
  const card = el("div", "card settings");
  const row = button("setting", "", () => go("language"));
  row.append(el("span", "icon", "🌐"), el("span", "", ui("changeLang")), el("span", "chev", "›"));
  card.append(row);
  const lvl = button("setting", "", () => go("level"));
  lvl.append(el("span", "icon", "📶"), el("span", "", ui("myLevel") + ": " + ui("lvl" + (save.level ?? 0))), el("span", "chev", "›"));
  card.append(lvl);
  const calm = el("label", "setting toggle");
  const box = el("input");
  box.type = "checkbox";
  box.id = "calm-mode";
  box.checked = save.calm;
  box.onchange = () => { save.calm = box.checked; persist(); renderBars(); };
  calm.append(el("span", "icon", "🌙"), el("span", "", ui("calm")), box);
  card.append(calm);
  const demo = el("label", "setting toggle");
  const demoBox = el("input");
  demoBox.type = "checkbox";
  demoBox.id = "demo-mode";
  demoBox.checked = save.demo;
  demoBox.onchange = () => { save.demo = demoBox.checked; persist(); renderBars(); };
  demo.append(el("span", "icon", "🔓"), el("span", "", ui("demoMode")), demoBox);
  card.append(demo);
  return card;
}

register("welcome", showWelcome);
register("language", showLanguage);
register("level", showLevel);
register("home", () => go(!save.native ? "welcome" : save.level === null ? "level" : "path"));
