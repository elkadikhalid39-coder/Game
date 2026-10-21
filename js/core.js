// Núcleo: progreso guardado, idiomas, utilidades, ajustes y navegación entre pantallas.
const app = document.getElementById("app");
const topbar = document.getElementById("topbar");

// ---------- Progreso guardado ----------
const SAVE_KEY = "hola-espanol";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
let save = Object.assign({
  xp: 0, streak: 0, lastDay: "", stars: {}, native: "", target: "",
  mode: "", age: "", stickers: [], calm: false,
}, loadSave());
if (!I18N[save.native] || !I18N[save.target]) { save.native = ""; save.target = ""; }

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
function today() { return new Date().toISOString().slice(0, 10); }
function touchStreak() {
  const t = today();
  if (save.lastDay === t) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  save.streak = save.lastDay === y ? save.streak + 1 : 1;
  save.lastDay = t;
}

// ---------- Idiomas ----------
const dirOf = (lang) => I18N[lang].dir || "ltr";
// Texto de interfaz en el idioma de la persona; {x} se sustituye.
const ui = (k, x) => fill((I18N[save.native] || I18N.es).ui[k] ?? I18N.es.ui[k], x);
// Texto de interfaz en el idioma que se aprende (instrucciones habladas a los niños).
const uiT = (k, x) => fill(I18N[save.target].ui[k], x);
const tr = (id, lang) => I18N[lang].t[id];
const fill = (s, x) => (x === undefined ? s : s.replace("{x}", x));

// ---------- Utilidades ----------
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const pick = (a, n) => shuffle(a).slice(0, n);
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
// Texto en un idioma concreto: fija lang y dirección (árabe y urdu de derecha a izquierda).
function txt(tag, cls, text, lang) {
  const e = el(tag, cls, text);
  e.lang = lang;
  e.dir = dirOf(lang);
  return e;
}
function button(cls, label, onclick) {
  const b = el("button", cls, label);
  b.type = "button";
  b.onclick = onclick;
  return b;
}
// Cada cambio de pantalla incrementa screenId; así una acción con retraso sabe si sigue en la misma pantalla.
let screenId = 0;
function screen(lang = save.native) {
  screenId++;
  app.replaceChildren();
  app.dir = lang ? dirOf(lang) : "ltr";
  window.scrollTo(0, 0);
}

// Lee en voz alta una o varias partes: speak([[texto, idioma], ...]).
// Devuelve una promesa que se cumple al terminar (o, sin voz disponible, tras una pausa corta).
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function speak(parts, lang) {
  if (typeof parts === "string") parts = [[parts, lang]];
  const minWait = delay(1100);
  if (!window.speechSynthesis) return minWait;
  speechSynthesis.cancel();
  const voices = speechSynthesis.getVoices();
  let last;
  for (const [text, l] of parts) {
    last = new SpeechSynthesisUtterance(text);
    last.lang = I18N[l].voice;
    const v = voices.find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(l));
    if (v) last.voice = v;
    last.rate = save.mode === "kids" ? 0.8 : 0.9;
    speechSynthesis.speak(last);
  }
  const ended = new Promise((r) => { last.onend = r; last.onerror = r; });
  return Promise.all([minWait, Promise.race([ended, delay(5000)])]);
}

function beep(ok) {
  if (save.calm) return;
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 660 : 220;
    g.gain.setValueAtTime(ok ? 0.15 : 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* sin audio */ }
}

// Lluvia de emojis al acertar (se omite en modo calma o con movimiento reducido).
function celebrate() {
  if (save.calm || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 14; i++) {
    const c = el("span", "confetti", pick(["⭐", "🎉", "✨", "🌟", "🎈"], 1)[0]);
    c.style.left = rand(5, 95) + "vw";
    c.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.append(c);
    setTimeout(() => c.remove(), 1600);
  }
}

// ---------- Barra superior ----------
function renderTopbar() {
  topbar.replaceChildren();
  document.body.classList.toggle("kids", save.mode === "kids");
  document.body.classList.toggle("calm", save.calm);
  if (!save.native || !save.target || !save.mode) return;
  if (save.mode === "kids") {
    topbar.append(
      button("chip", "🏠", showKidsHome),
      el("span", "", "🌟 " + save.stickers.length),
      button("chip", "🔒 " + ui("parents"), () => showGate(showSettings)),
    );
  } else {
    topbar.append(
      button("chip", "⚙️ " + save.native.toUpperCase() + "→" + save.target.toUpperCase(), showSettings),
      el("span", "", "🔥 " + save.streak),
      el("span", "", "⭐ " + save.xp),
    );
  }
}

// ---------- Navegación ----------
function go() {
  if (!save.native || !save.target) return showNativePicker();
  if (!save.mode) return showModePicker();
  if (save.mode === "kids" && !save.age) return showAgePicker();
  return save.mode === "kids" ? showKidsHome() : showMap();
}

// Paso 1: idioma que habla la persona.
function showNativePicker() {
  renderTopbar();
  screen("");
  app.append(el("h1", "", "👋 Hola · Hello · مرحبا"));
  app.append(el("p", "sub", "🗣️ Yo hablo · I speak · أنا أتحدث · Я говорю · 我说"));
  const grid = el("div", "options two");
  for (const code of Object.keys(I18N)) {
    const b = txt("button", "opt", I18N[code].name, code);
    b.onclick = () => { save.native = code; showTargetPicker(); };
    grid.append(b);
  }
  app.append(grid);
}

// Paso 2: idioma que quiere aprender (ya en su idioma).
function showTargetPicker() {
  renderTopbar();
  screen();
  app.append(button("back", "← " + ui("back"), showNativePicker));
  app.append(el("h1", "", "🎯 " + ui("iLearn")));
  const grid = el("div", "options two");
  // Puede ser el mismo idioma que habla: para reforzarlo, aprender a leerlo o practicar.
  for (const code of Object.keys(I18N)) {
    const b = txt("button", "opt" + (code === "es" ? " featured" : ""), I18N[code].name, code);
    b.onclick = () => { save.target = code; persist(); go(); };
    grid.append(b);
  }
  app.append(grid);
}

// Paso 3: adultos o niños.
function showModePicker() {
  renderTopbar();
  screen();
  app.append(el("h1", "", ui("chooseMode")));
  const box = el("div", "modes");
  const card = (emoji, title, desc, mode) => {
    const b = el("button", "mode");
    b.append(el("span", "big", emoji), el("strong", "", title), el("span", "", desc));
    b.onclick = () => { save.mode = mode; persist(); go(); };
    return b;
  };
  box.append(card("🧑", ui("adults"), ui("adultsDesc"), "adult"), card("🧒", ui("kids"), ui("kidsDesc"), "kids"));
  app.append(box);
}

// Paso 4 (niños): edad.
function showAgePicker() {
  renderTopbar();
  screen();
  app.append(el("h1", "", ui("chooseAge")));
  const box = el("div", "modes");
  for (const a of AGES) {
    const b = el("button", "mode");
    b.append(el("span", "big", a.emoji), el("strong", "", a.id.replace("-", "–") + " " + ui("years")));
    b.onclick = () => { save.age = a.id; persist(); go(); };
    box.append(b);
  }
  app.append(box);
}

// ---------- Control parental ----------
// Una multiplicación sencilla para que los niños pequeños no entren solos en los ajustes.
function showGate(onPass) {
  screen();
  const a = rand(3, 9), b = rand(3, 9);
  const card = el("div", "card gate");
  const input = el("input");
  input.id = "gate-answer";
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  const msg = el("p", "feedback bad");
  const check = () => {
    if (Number(input.value) === a * b) onPass();
    else { msg.textContent = ui("gateWrong"); input.value = ""; }
  };
  input.onkeydown = (e) => { if (e.key === "Enter") check(); };
  card.append(el("p", "prompt", "🔒 " + ui("gateQ", `${a} × ${b}`)), input, msg, button("btn", ui("ok"), check));
  app.append(button("back", "← " + ui("back"), go), card);
  input.focus();
}

// ---------- Ajustes ----------
function showSettings() {
  renderTopbar();
  screen();
  app.append(button("back", "← " + ui("back"), go), el("h1", "", "⚙️ " + ui("settings")));
  const card = el("div", "card settings");
  card.append(button("opt", "🌐 " + ui("changeLang"), () => { save.native = ""; save.target = ""; showNativePicker(); }));
  card.append(button("opt", "🔁 " + ui("switchMode"), () => { save.mode = ""; persist(); go(); }));
  if (save.mode === "kids") card.append(button("opt", "🎂 " + ui("changeAge"), () => { save.age = ""; persist(); go(); }));
  const calm = el("label", "toggle");
  const box = el("input");
  box.type = "checkbox";
  box.id = "calm-mode";
  box.checked = save.calm;
  box.onchange = () => { save.calm = box.checked; persist(); renderTopbar(); };
  calm.append(box, el("span", "", ui("calm")));
  card.append(calm);
  app.append(card);
}
