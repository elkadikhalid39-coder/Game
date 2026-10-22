// Audio: voces pregrabadas (generadas con Piper, en public/audio) con la voz sintética del móvil
// como respaldo, y sonidos de acierto/fallo.
// Cada voz es un paquete: <voz>.json (índice { hash del texto: [inicio, longitud] }) y <voz>.bin (MP3 seguidos).
// Si una frase no está en la voz elegida, se usa la voz neutra; si tampoco, la del móvil.
import VOICES from "../../content/voices.json";
import { I18N } from "./i18n.js";
import { save, TARGET as G } from "./state.js";
import { delay } from "./util.js";

export const VOICE_LIST = VOICES.voices;
const NEUTRAL = VOICES.default;
const EXAMS = NEUTRAL + "-ex"; // lo que se lee en los exámenes, con la voz neutra (se descarga al abrir un examen)
export const voiceOf = (id = save.voice) => VOICE_LIST.find((v) => v.id === id) || VOICE_LIST[0];
const rhythm = () => VOICES.rhythms[save.rhythm] ?? 1;

// FNV-1a de 32 bits sobre el texto en UTF-8 (igual que tools/audio/generate.py).
export function hashText(text) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text.trim())) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

// ---------- Paquetes de voz ----------
const packs = new Map(); // id → Promise<{ index, bin } | null>
function loadPack(id) {
  if (!packs.has(id)) {
    const base = new URL(`audio/${id}`, document.baseURI).href;
    packs.set(id, Promise.all([fetch(base + ".json").then((r) => (r.ok ? r.json() : null)), fetch(base + ".bin").then((r) => (r.ok ? r.arrayBuffer() : null))])
      .then(([index, bin]) => (index && bin ? { index, bin, urls: new Map() } : null))
      .catch(() => null));
  }
  return packs.get(id);
}
// Se carga la voz elegida (y la neutra, que la completa) al arrancar, para que el primer audio no espere.
export function preloadVoice() {
  if (voiceOf().source === "recorded") loadPack(voiceOf().id);
  loadPack(NEUTRAL);
}
// Al abrir un examen se descarga (y queda guardado para usarlo sin conexión) el audio que necesita.
// dialogs: también las dos voces de la comprensión auditiva del DELE.
export function preloadExamAudio({ dialogs = false } = {}) {
  loadPack(EXAMS);
  if (dialogs) { loadPack("es-f"); loadPack("es-m"); }
}

const ready = new Map(); // id → paquete ya cargado (para buscar sin esperar)
async function clip(text, ids) {
  for (const id of ids) {
    const pack = ready.get(id) ?? (await loadPack(id));
    if (!pack) continue;
    ready.set(id, pack);
    const at = pack.index[hashText(text)];
    if (!at) continue;
    if (!pack.urls.has(at[0])) pack.urls.set(at[0], URL.createObjectURL(new Blob([pack.bin.slice(at[0], at[0] + at[1])], { type: "audio/mpeg" })));
    return pack.urls.get(at[0]);
  }
  return null;
}

// ---------- Reproducción ----------
let player = null;
let run = 0; // cada llamada nueva corta la anterior
export function stopAudio() {
  run++;
  if (player) { player.pause(); player = null; }
  window.speechSynthesis?.cancel();
}

function playUrl(url, rate, token) {
  return new Promise((resolve) => {
    if (token !== run) return resolve(false);
    const a = new Audio(url);
    a.playbackRate = rate;
    a.preservesPitch = true;
    player = a;
    const done = (ok) => { a.onended = a.onerror = null; resolve(ok); };
    a.onended = () => done(true);
    a.onerror = () => done(false);
    a.play().catch(() => done(false));
  });
}

function deviceSpeak(parts, rate, pitch = 1) {
  if (!window.speechSynthesis) return delay(1100);
  const voices = speechSynthesis.getVoices();
  const norm = (x) => x.lang.replace("_", "-").toLowerCase();
  let last;
  for (const [text, l] of parts) {
    last = new SpeechSynthesisUtterance(text);
    // El español sigue el acento de la voz elegida; los demás idiomas, la variante de cada uno.
    const want = (l === G ? voiceOf().accent : I18N[l].voice).toLowerCase();
    last.lang = want;
    const v = voices.find((x) => norm(x) === want) || voices.find((x) => norm(x).startsWith(l));
    if (v) last.voice = v;
    last.rate = 0.9 * rate;
    last.pitch = pitch;
    speechSynthesis.speak(last);
  }
  const ended = new Promise((r) => { last.onend = r; last.onerror = r; });
  return Promise.all([delay(1100), Promise.race([ended, delay(8000)])]);
}

// Lee en voz alta una o varias partes: speak([[texto, idioma], ...], { slow }).
// Devuelve una promesa que se cumple al terminar.
export async function speak(parts, lang, { slow = false } = {}) {
  if (typeof parts === "string") parts = [[parts, lang]];
  stopAudio();
  const token = run;
  const rate = rhythm() * (slow ? 0.7 : 1);
  const v = voiceOf();
  // Solo con voz pregrabada si todas las partes son en español y están grabadas.
  if (v.source === "recorded" && parts.every(([, l]) => l === G)) {
    const urls = await Promise.all(parts.map(([t]) => clip(t, [v.id, NEUTRAL, EXAMS])));
    if (token !== run) return;
    if (urls.every(Boolean)) {
      for (const url of urls) if (!(await playUrl(url, rate, token))) return token === run ? deviceSpeak(parts, rate) : undefined;
      return;
    }
  }
  return deviceSpeak(parts, rate);
}

// Escuchar una muestra de una voz (pantalla de voces).
export async function sample(id, text) {
  stopAudio();
  const token = run;
  const v = voiceOf(id);
  const url = v.source === "recorded" ? await clip(text, [v.id]) : null;
  if (url) return playUrl(url, rhythm(), token);
  return deviceSpeak([[text, G]], rhythm());
}

// Diálogo con dos voces (H: hombre, M: mujer), para la comprensión auditiva del DELE.
// Se usan siempre las dos voces de España (como en el examen); sin ellas, las del móvil.
export async function speakDialog(lines, { times = 1 } = {}) {
  stopAudio();
  const token = run;
  const who = { M: "es-f", H: "es-m" };
  const urls = await Promise.all(lines.map(([w, text]) => clip(text, [who[w]])));
  if (token !== run) return;
  if (urls.every(Boolean)) {
    for (let t = 0; t < times; t++) {
      for (const url of urls) if (!(await playUrl(url, 1, token))) return;
      if (t < times - 1) await delay(1500);
    }
    return;
  }
  return deviceDialog(lines, times);
}

function deviceDialog(lines, times) {
  const minWait = delay(1500);
  if (!window.speechSynthesis) return minWait;
  const es = speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("es"));
  const spain = es.filter((v) => v.lang.replace("_", "-").toLowerCase() === "es-es");
  const pool = spain.length >= 2 ? spain : es;
  const voice = { M: pool[0], H: pool[1] || pool[0] };
  let last;
  for (let t = 0; t < times; t++) {
    for (const [who, text] of lines) {
      last = new SpeechSynthesisUtterance(text);
      last.lang = "es-ES";
      if (voice[who]) last.voice = voice[who];
      // Si el dispositivo solo tiene una voz en español, se distingue con el tono.
      if (voice.H === voice.M) last.pitch = who === "H" ? 0.8 : 1.2;
      last.rate = 0.9;
      speechSynthesis.speak(last);
    }
    // Pausa entre la primera y la segunda escucha.
    if (t < times - 1) { const pause = new SpeechSynthesisUtterance(" "); pause.lang = "es-ES"; speechSynthesis.speak(pause); }
  }
  const ended = new Promise((r) => { last.onend = r; last.onerror = r; });
  return Promise.all([minWait, Promise.race([ended, delay(120_000)])]);
}

let ctx;
export function beep(ok) {
  if (save.calm) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
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
