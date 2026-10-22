// Voz sintética del dispositivo y sonidos de acierto/fallo.
import { I18N } from "./i18n.js";
import { save } from "./state.js";
import { delay } from "./util.js";

// Lee en voz alta una o varias partes: speak([[texto, idioma], ...], { slow }).
// Devuelve una promesa que se cumple al terminar (o, sin voz disponible, tras una pausa corta).
export function speak(parts, lang, { slow = false } = {}) {
  if (typeof parts === "string") parts = [[parts, lang]];
  const minWait = delay(1100);
  if (!window.speechSynthesis) return minWait;
  speechSynthesis.cancel();
  const voices = speechSynthesis.getVoices();
  const norm = (x) => x.lang.replace("_", "-").toLowerCase();
  let last;
  for (const [text, l] of parts) {
    last = new SpeechSynthesisUtterance(text);
    last.lang = I18N[l].voice;
    // Primero la variante exacta (es-ES: español de España); si no está, cualquiera del idioma.
    const v = voices.find((x) => norm(x) === I18N[l].voice.toLowerCase()) || voices.find((x) => norm(x).startsWith(l));
    if (v) last.voice = v;
    last.rate = slow ? 0.55 : 0.9;
    speechSynthesis.speak(last);
  }
  const ended = new Promise((r) => { last.onend = r; last.onerror = r; });
  return Promise.all([minWait, Promise.race([ended, delay(8000)])]);
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
