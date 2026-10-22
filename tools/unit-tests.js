// Pruebas de las funciones puras (sin navegador). Uso: node tools/unit-tests.js
import assert from "node:assert/strict";
import { checkWritten, normalize } from "../src/learn/answers.js";
import { scoreTest, grades } from "../src/exams/pce-score.js";

const cases = [
  ["Médico", "Médico", true, null],
  ["medico", "Médico", true, "accent"],
  ["el médico", "Médico", true, null],
  ["MÉDICO", "Médico", true, null],
  ["medicp", "Médico", true, "typo"],
  ["pan", "Pan", true, null],
  ["pa", "Pan", false, null], // en palabras cortas no se aceptan erratas
  ["bano", "Baño", false, null], // la ñ no es una tilde: «bano» es otra palabra
  ["baño", "Baño", true, null],
  ["cita previa", "Cita previa", true, null],
  ["", "Pan", false, null],
  ["gato", "Médico", false, null],
];
for (const [input, expected, ok, note] of cases) {
  assert.deepEqual(checkWritten(input, expected), { ok, note }, `${input} → ${expected}`);
}
assert.equal(normalize("¿Dónde firmo?"), "dónde firmo");

// PCE: Historia (8 preguntas, cuentan 6; +0,5 / −0,2).
const H = { max: 6, right: 0.5, wrong: 0.2 };
const qs = Array.from({ length: 8 }, () => ({ answer: 0 }));
assert.equal(scoreTest(H, qs, [0, 0, 0, 0, 0, 0, null, null]).score, 3);
assert.equal(scoreTest(H, qs, [0, 0, 0, 0, 1, 1, null, null]).score, 1.6);
// Respuestas de más: solo cuentan las 6 primeras respondidas, aunque las siguientes sean aciertos.
const extra = scoreTest(H, qs, [1, 0, 0, 0, 0, 0, 0, 0]);
assert.equal(extra.score, 2.3);
assert.deepEqual(extra.marks.slice(6), ["ignored", "ignored"]);
// El bloque nunca baja de 0.
assert.equal(scoreTest(H, qs, [1, 1, 1, null, null, null, null, null]).score, 0);
// Nota: 0,6 · 8 + 0,4 · 7 = 7,6; admisión con 9 · 0,2 y 8 · 0,1 (la tercera materia no cuenta).
assert.deepEqual(grades(8, [7], [[9, 0.2], [8, 0.1], [5, 0.1]]), { access: 7.6, admission: 10.2 });
console.log(`OK pruebas unitarias: ${cases.length + 6}`);
