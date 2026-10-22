// Comprueba los contenidos de examen (content/exams): formato oficial, respuestas válidas, fuentes y estado.
// Uso: node tools/check-exams.js
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL("../content/exams/" + f, import.meta.url), "utf8"));
const errors = [];
const STATUS = ["borrador", "revisado", "publicado"];

// ---------- CCSE ----------
const ccse = load("ccse.json");
const PER_TASK = { 1: 10, 2: 3, 3: 2, 4: 3, 5: 7 }; // reparto del simulacro
const ids = new Set();
for (const q of ccse.questions) {
  const w = `ccse ${q.id}`;
  if (ids.has(q.id)) errors.push(`${w}: id repetido`);
  ids.add(q.id);
  if (!PER_TASK[q.task]) errors.push(`${w}: tarea no válida`);
  if (q.type === "vf" && q.options.join() !== "Verdadero,Falso") errors.push(`${w}: verdadero/falso mal formado`);
  if (q.type === "mc3" && q.options.length !== 3) errors.push(`${w}: debe tener 3 opciones`);
  if (!(q.answer >= 0 && q.answer < q.options.length)) errors.push(`${w}: respuesta fuera de rango`);
  if (new Set(q.options).size !== q.options.length) errors.push(`${w}: opciones repetidas`);
  if (!q.explain || !q.source?.name || !/^https:\/\//.test(q.source?.url || "")) errors.push(`${w}: falta explicación o fuente`);
  if (!STATUS.includes(q.status)) errors.push(`${w}: estado no válido`);
}
for (const [t, n] of Object.entries(PER_TASK)) {
  const have = ccse.questions.filter((q) => q.task === Number(t)).length;
  if (have < n) errors.push(`ccse: la tarea ${t} tiene ${have} preguntas y el simulacro necesita ${n}`);
}
// Las respuestas correctas no deben caer siempre en la misma letra.
const letters = ccse.questions.filter((q) => q.type === "mc3").map((q) => q.answer);
for (const l of [0, 1, 2]) if (letters.filter((x) => x === l).length / letters.length > 0.5) errors.push(`ccse: más de la mitad de las respuestas son la opción ${"abc"[l]}`);

// ---------- DELE A2 (formato de la guía oficial) ----------
const dele = load("dele-a2.json");
const words = (s) => (s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g) || []).length;
const between = (n, [a, b], w) => { if (n < a || n > b) errors.push(`dele ${w}: ${n} palabras (debe tener ${a}-${b})`); };
const R = dele.reading.tasks, A = dele.listening.tasks;
if (R.reduce((n, t) => n + t.questions.length, 0) !== 25) errors.push("dele lectura: debe tener 25 preguntas");
if (A[0].items.length + A[1].items.length + A[2].questions.length + A[3].items.length !== 25) errors.push("dele auditiva: debe tener 25 preguntas");
between(words(R[0].texts[0].body), [250, 300], "lectura T1");
R[1].texts.forEach((t, i) => between(words(t.body), [50, 80], `lectura T2 texto ${i + 1}`));
R[2].texts.forEach((t, i) => between(words(t.body), [100, 120], `lectura T3 texto ${i + 1}`));
between(words(R[3].texts[0].body), [375, 425], "lectura T4");
between(A[2].dialog.reduce((n, [, x]) => n + words(x), 0), [225, 275], "auditiva T3");
for (const t of [...R, ...A]) for (const q of t.questions || t.items) {
  const max = (q.options || t.match || t.statements).length;
  if (!(q.answer >= 0 && q.answer < max)) errors.push(`dele ${t.id}: respuesta fuera de rango`);
}
if (new Set(A[3].items.map((i) => i.answer)).size !== A[3].items.length) errors.push("dele auditiva T4: dos mensajes con la misma frase");
for (const k of ["writing", "speaking"]) if (dele[k].rubric.task.length !== 4 || dele[k].rubric.language.length !== 4) errors.push(`dele ${k}: la rúbrica va de 0 a 3`);

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK exámenes: CCSE ${ccse.questions.length} preguntas; DELE A2 lectura y auditiva de 25 preguntas con el formato oficial.`);
