// Núcleo: progreso guardado, idiomas, voz, sonidos y navegación entre pantallas.

// ---------- Progreso guardado ----------
const SAVE_KEY = "hola-espanol";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
let save = Object.assign({
  xp: 0, streak: 0, lastDay: "", native: "", target: "", mode: "", age: "",
  stickers: [], calm: false,
  progress: {}, // { [idioma]: { [mundo]: lecciones completadas } }
  mistakes: {}, // { [idioma]: [{ k: "w" | "p", id }] }
  learned: {}, // { [idioma]: [ids de palabras acertadas] }
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
const forTarget = (key) => (save[key][save.target] ??= key === "progress" ? {} : []);
const mistakesFor = () => (save.target ? forTarget("mistakes") : []);

// ---------- Idiomas ----------
const dirOf = (lang) => I18N[lang].dir || "ltr";
const fill = (s, x) => (x === undefined ? s : s.replace("{x}", x));
// Texto de interfaz en el idioma de la persona.
const ui = (k, x) => fill((I18N[save.native] || I18N.es).ui[k] ?? I18N.es.ui[k], x);
// Texto de interfaz en el idioma que se aprende (instrucciones habladas a los niños).
const uiT = (k, x) => fill(I18N[save.target].ui[k], x);
const tr = (id, lang) => I18N[lang].t[id];

// ---------- Utilidades ----------
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const pick = (a, n) => shuffle(a).slice(0, n);
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Voz y sonidos ----------
// Lee en voz alta una o varias partes: speak([[texto, idioma], ...]).
// Devuelve una promesa que se cumple al terminar (o, sin voz disponible, tras una pausa corta).
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
    const notes = ok ? [523, 784] : [262];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.09;
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(ok ? 0.14 : 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.22);
    });
  } catch { /* sin audio */ }
}

// ---------- Navegación ----------
function go() {
  if (!save.native) return showWelcome();
  if (!save.target) return showTargetPicker();
  if (!save.mode) return showModePicker();
  if (save.mode === "kids" && !save.age) return showAgePicker();
  return save.mode === "kids" ? showKidsHome() : showPath();
}
