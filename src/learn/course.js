// Datos del curso (content/course/units.json) y consultas sobre el progreso.
import units from "../../content/course/units.json";
import { save } from "../core/state.js";

export const UNITS = units;
// Lecciones de cada unidad, que se desbloquean en orden.
export const LESSON_TYPES = [
  { type: "words", icon: "🔤", key: "lessonWords" },
  { type: "listen", icon: "🎧", key: "lessonListen" },
  { type: "phrases", icon: "💬", key: "lessonPhrases" },
];
export const wordsOf = (unit) => unit.words.map((w) => ({ ...w, unit }));
export const unitOfWord = (id) => UNITS.find((u) => u.words.some((w) => w.id === id));
export const unitOfPhrase = (id) => UNITS.find((u) => u.phrases.some((p) => p.id === id));
export const doneIn = (unit) => save.progress[unit.id] || 0;
export const lessonsDone = () => Object.values(save.progress).reduce((a, b) => a + b, 0);
