// Primera vez: bienvenida, idioma de la persona y su nivel de español. También la tarjeta de ajustes del perfil.
import { I18N, LANGS, ui } from "../core/i18n.js";
import { save, persist } from "../core/state.js";
import { register, go } from "../core/router.js";
import { el, txt, button } from "../ui/dom.js";
import { mascot, speech } from "../ui/mascot.js";
import { app, screen, renderBars } from "../ui/shell.js";
import { VOICE_LIST, voiceOf, sample } from "../core/audio.js";
import { speakerIcon } from "../ui/audio-buttons.js";

function showWelcome() {
  screen("plain", "");
  const hero = el("section", "welcome");
  hero.append(
    mascot("brand", 140),
    el("h1", "wordmark", "Hola, Español"),
    // Antes de elegir idioma: una sola frase, en español y en inglés.
    el("p", "greetings", "Español para vivir y trabajar en España · Spanish for living and working in Spain"),
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
    // La primera vez sigue la pregunta del objetivo; si ya estaba elegido (cambio desde el Perfil), se vuelve.
    b.onclick = () => { const first = save.goal === null; save.level = n; persist(); go(first ? "goal" : "home"); };
    list.append(b);
  }
  app.append(list);
}

// Qué necesita ahora la persona: decide por dónde se abre la app.
export const GOAL_KEYS = { daily: "goalDaily", nat: "goalNat", drive: "goalDrive", uni: "goalUni", unknown: "goalUnknown" };
function showGoal() {
  screen("plain");
  app.append(speech(ui("goalTitle"), "talk"), el("p", "lead center", ui("goalSub")));
  const list = el("div", "levels");
  for (const [g, key] of Object.entries(GOAL_KEYS)) {
    const b = button("level-row" + (g === save.goal ? " selected" : ""), "", () => { save.goal = g; persist(); go("home"); });
    b.dataset.goal = g;
    b.append(el("strong", "", ui(key)));
    list.append(b);
  }
  app.append(list);
}
// Pantalla de inicio según el objetivo: el camino o el examen que necesita.
const GOAL_ROUTE = { nat: "nationality", drive: "driving", uni: "university" };

// Voz del español: acento, voz de hombre o de mujer y manera de hablar.
// La frase de muestra está grabada en todas las voces.
const SAMPLE = "Hola, me llamo Ana.";
export const voiceName = (v) =>
  v.source === "device" ? ui("voiceDevice") : `${ui(v.accent === "es-MX" ? "accMX" : "accES")} · ${ui(v.gender === "f" ? "genF" : "genM")}${v.id === "neutra" ? " · " + ui("voiceNeutral") : ""}`;

function showVoice() {
  screen("main");
  app.append(button("back", "← " + ui("back"), () => go("profile")), el("h1", "", ui("voiceTitle")), el("p", "lead", ui("voiceSub")));
  const list = el("div", "levels");
  for (const v of VOICE_LIST) {
    const row = el("div", "voice-row" + (v.id === save.voice ? " selected" : ""));
    const pickBtn = el("button", "voice-pick");
    pickBtn.type = "button";
    pickBtn.dataset.voice = v.id;
    pickBtn.setAttribute("aria-pressed", String(v.id === save.voice));
    pickBtn.append(el("strong", "", voiceName(v)));
    if (v.source === "device") pickBtn.append(el("span", "", ui("voiceDeviceDesc")));
    pickBtn.onclick = () => { save.voice = v.id; persist(); showVoice(); sample(v.id, SAMPLE); };
    const play = button("audio-btn-play icon", "", () => sample(v.id, SAMPLE));
    play.append(speakerIcon(2));
    play.setAttribute("aria-label", ui("listenSample") + ": " + voiceName(v));
    row.append(pickBtn, play);
    list.append(row);
  }
  app.append(list, el("h2", "section", ui("rhythmTitle")));
  const rhythms = el("div", "chips");
  for (const [id, key] of [["slow", "rhySlow"], ["normal", "rhyNormal"], ["fast", "rhyFast"]]) {
    const b = button("rhythm-chip" + (save.rhythm === id ? " selected" : ""), ui(key), () => { save.rhythm = id; persist(); showVoice(); sample(save.voice, SAMPLE); });
    b.dataset.rhythm = id;
    b.setAttribute("aria-pressed", String(save.rhythm === id));
    rhythms.append(b);
  }
  // Créditos de los modelos de voz (la licencia CC BY del corpus Sharvard pide citarlo).
  app.append(rhythms, el("p", "credits", "Voces generadas con Piper. Modelos: davefx (CC0); Sharvard Corpus, Aubanel, García Lecumberri y Cooke, 2014 (CC BY 3.0); claude (Apache 2.0); ald (Unlicense)."));
}

export function settingsCard() {
  const card = el("div", "card settings");
  const row = button("setting", "", () => go("language"));
  row.append(el("span", "icon", "🌐"), el("span", "", ui("changeLang")), el("span", "chev", "›"));
  card.append(row);
  const lvl = button("setting", "", () => go("level"));
  lvl.append(el("span", "icon", "📶"), el("span", "", ui("myLevel") + ": " + ui("lvl" + (save.level ?? 0))), el("span", "chev", "›"));
  card.append(lvl);
  const voice = button("setting", "", () => go("voice"));
  voice.append(el("span", "icon", "🔊"), el("span", "", ui("myVoice") + ": " + voiceName(voiceOf())), el("span", "chev", "›"));
  card.append(voice);
  const goal = button("setting", "", () => go("goal"));
  goal.append(el("span", "icon", "🧭"), el("span", "", ui("myGoal") + ": " + ui(GOAL_KEYS[save.goal ?? "unknown"])), el("span", "chev", "›"));
  card.append(goal);
  const calm = el("label", "setting toggle");
  const box = el("input");
  box.type = "checkbox";
  box.id = "calm-mode";
  box.checked = save.calm;
  box.onchange = () => { save.calm = box.checked; persist(); renderBars(); };
  calm.append(el("span", "icon", "🌙"), el("span", "", ui("calm")), box);
  card.append(calm);
  // El interruptor de demostración solo existe en la vista previa publicada (compilación de un solo archivo).
  if (import.meta.env?.MODE !== "single") return card;
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
register("voice", showVoice);
register("goal", showGoal);
register("home", () => go(!save.native ? "welcome" : save.level === null ? "level" : GOAL_ROUTE[save.goal] || "path"));
