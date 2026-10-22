// Pruebas de las funciones puras (sin navegador). Uso: node tools/unit-tests.js
import assert from "node:assert/strict";
import { checkWritten, normalize } from "../src/learn/answers.js";

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
console.log(`OK pruebas unitarias: ${cases.length + 1}`);
