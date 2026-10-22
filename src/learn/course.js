// Datos del curso (content/course/units.json) y consultas sobre el progreso.
import units from "../../content/course/units.json";
import { save } from "../core/state.js";

export const UNITS = units;
// Lecciones de cada unidad, que se desbloquean en orden.
export const LESSON_TYPES = [
  { type: "words", icon: "🔤", key: "lessonWords" },
  { type: "listen", icon: "🎧", key: "lessonListen" },
  { type: "phrases", icon: "💬", key: "lessonPhrases" },
  // Cierre de la unidad: un diálogo (guion) con lo aprendido.
  { type: "dialog", icon: "🎭", key: "lessonDialog" },
];
export const wordsOf = (unit) => unit.words.map((w) => ({ ...w, unit }));
export const unitOfWord = (id) => UNITS.find((u) => u.words.some((w) => w.id === id));
export const unitOfPhrase = (id) => UNITS.find((u) => u.phrases.some((p) => p.id === id));
export const doneIn = (unit) => save.progress[unit.id] || 0;
export const lessonsDone = () => Object.values(save.progress).reduce((a, b) => a + b, 0);
export const unitComplete = (unit) => doneIn(unit) >= LESSON_TYPES.length;

// Unidad que toca: la primera sin terminar a partir de la última con progreso. Así, a quien ya iba
// por delante no le hacen volver las unidades añadidas al principio del curso.
export function currentUnitIndex() {
  let last = 0;
  UNITS.forEach((u, n) => { if (doneIn(u) > 0) last = n; });
  const n = UNITS.findIndex((u, k) => k >= last && !unitComplete(u));
  return n >= 0 ? n : UNITS.findIndex((u) => !unitComplete(u));
}
// La lección siguiente de una unidad está abierta si la unidad ya está empezada o la anterior está terminada.
export const reachable = (n) => n === 0 || doneIn(UNITS[n]) > 0 || unitComplete(UNITS[n - 1]);
