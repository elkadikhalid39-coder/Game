// Núcleo: progreso guardado, idiomas, voz, sonidos y navegación entre pantallas.

// ---------- Progreso guardado ----------
const SAVE_KEY = "hola-espanol";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
// Solo se aprende español; el idioma de la persona es el de la interfaz y las explicaciones.
const TARGET = "es";
const SAVE_VERSION = 2;
let save = migrate(loadSave());

// Versión 1 (con modo niños y varios idiomas de aprendizaje) → versión 2: se conserva lo aprendido en español.
function migrate(old) {
  const s = {
    v: SAVE_VERSION, native: I18N[old.native] ? old.native : "", target: TARGET, calm: !!old.calm,
    progress: {}, // { es: { [unidad]: lecciones completadas } }
    mistakes: {}, // { es: [{ k: "w" | "p", id }] }
    learned: {}, // { es: [ids de palabras acertadas] }
  };
  for (const key of ["progress", "mistakes", "learned"]) if (old[key]?.[TARGET]) s[key][TARGET] = old[key][TARGET];
  return s;
}

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
const forTarget = (key) => (save[key][save.target] ??= key === "progress" ? {} : []);
const mistakesFor = () => (save.target ? forTarget("mistakes") : []);

// ---------- Idiomas ----------
const dirOf = (lang) => I18N[lang].dir || "ltr";
const fill = (s, x) => (x === undefined ? s : s.replace("{x}", x));
// Texto de interfaz en el idioma de la persona.
const ui = (k, x) => fill((I18N[save.native] || I18N.es).ui[k] ?? I18N.es.ui[k], x);
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
    // Primero la variante exacta (es-ES: español de España); si no está, cualquiera del idioma.
    const norm = (x) => x.lang.replace("_", "-").toLowerCase();
    const v = voices.find((x) => norm(x) === I18N[l].voice.toLowerCase()) || voices.find((x) => norm(x).startsWith(l));
    if (v) last.voice = v;
    last.rate = 0.9;
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
  return save.native ? showPath() : showWelcome();
}
