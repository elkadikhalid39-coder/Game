// Comprueba los contenidos de examen (content/exams): formato oficial, respuestas válidas, fuentes y estado.
// Uso: node tools/check-exams.js
import { readFileSync } from "node:fs";
import { SIGN_CODES } from "../src/ui/signs.js";

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
const between = (n, [a, b], w) => { if (n < a || n > b) errors.push(`${w}: ${n} palabras (debe tener ${a}-${b})`); };
const R = dele.reading.tasks, A = dele.listening.tasks;
if (R.reduce((n, t) => n + t.questions.length, 0) !== 25) errors.push("dele lectura: debe tener 25 preguntas");
if (A[0].items.length + A[1].items.length + A[2].questions.length + A[3].items.length !== 25) errors.push("dele auditiva: debe tener 25 preguntas");
between(words(R[0].texts[0].body), [250, 300], "dele lectura T1");
R[1].texts.forEach((t, i) => between(words(t.body), [50, 80], `dele lectura T2 texto ${i + 1}`));
R[2].texts.forEach((t, i) => between(words(t.body), [100, 120], `dele lectura T3 texto ${i + 1}`));
between(words(R[3].texts[0].body), [375, 425], "dele lectura T4");
between(A[2].dialog.reduce((n, [, x]) => n + words(x), 0), [225, 275], "dele auditiva T3");
for (const t of [...R, ...A]) for (const q of t.questions || t.items) {
  const max = (q.options || t.match || t.statements).length;
  if (!(q.answer >= 0 && q.answer < max)) errors.push(`dele ${t.id}: respuesta fuera de rango`);
}
if (new Set(A[3].items.map((i) => i.answer)).size !== A[3].items.length) errors.push("dele auditiva T4: dos mensajes con la misma frase");
for (const k of ["writing", "speaking"]) if (dele[k].rubric.task.length !== 4 || dele[k].rubric.language.length !== 4) errors.push(`dele ${k}: la rúbrica va de 0 a 3`);

// ---------- PCE (UNEDasiss) ----------
const pce = load("pce.json");
const facts = new Set(JSON.parse(readFileSync(new URL("../content/facts/universidad.json", import.meta.url), "utf8")).map((f) => f.id));
const needFact = (id, w) => { if (!facts.has(id)) errors.push(`pce ${w}: el dato "${id}" no existe`); };
for (const s of pce.subjects) {
  if (!["test", "desarrollo"].includes(s.type)) errors.push(`pce ${s.name}: tipo no válido`);
  for (const k of ["guide", "model"]) if (!/^https:\/\//.test(s[k] || "")) errors.push(`pce ${s.name}: falta el enlace oficial (${k})`);
  if (s.id && !pce.details[s.id]) errors.push(`pce ${s.name}: falta su ficha`);
}
for (const [id, d] of Object.entries(pce.details)) for (const f of [d.fact, ...(d.extra || [])]) needFact(f, id);
for (const [id, t] of Object.entries(pce.tests)) {
  needFact(t.fact, id);
  // La puntuación máxima tiene que salir de las reglas: respuestas que cuentan × valor del acierto.
  if (Math.abs(t.max * t.right - t.points) > 1e-9) errors.push(`pce ${id}: ${t.max} × ${t.right} no da ${t.points} puntos`);
  if (t.bank.length < t.shown * 2) errors.push(`pce ${id}: el banco necesita al menos ${t.shown * 2} preguntas`);
  const seen = new Set();
  for (const q of t.bank) {
    if (seen.has(q.id)) errors.push(`pce ${q.id}: id repetido`);
    seen.add(q.id);
    if (q.options.length !== 3 || new Set(q.options).size !== 3) errors.push(`pce ${q.id}: debe tener 3 opciones distintas`);
    if (!(q.answer >= 0 && q.answer < 3)) errors.push(`pce ${q.id}: respuesta fuera de rango`);
    if (!q.explain || !STATUS.includes(q.status)) errors.push(`pce ${q.id}: falta explicación o estado`);
  }
  for (const l of [0, 1, 2]) if (t.bank.filter((q) => q.answer === l).length / t.bank.length > 0.5) errors.push(`pce ${id}: más de la mitad de las respuestas son la opción ${"abc"[l]}`);
}
for (const t of pce.writing.texts) {
  between(words(t.body), [200, 320], `pce texto «${t.title}»`);
  // Modelo de resumen: 5-7 líneas; modelo argumentativo: 20-25 líneas (con las palabras por línea de la app).
  const lines = (s) => words(s) / pce.writing.wordsPerLine;
  if (lines(t.summary) < 5 || lines(t.summary) > 7) errors.push(`pce «${t.title}»: el resumen modelo tiene ${lines(t.summary).toFixed(1)} líneas`);
  if (lines(t.model) < 20 || lines(t.model) > 25) errors.push(`pce «${t.title}»: el texto argumentativo modelo tiene ${lines(t.model).toFixed(1)} líneas`);
}

// ---------- Conducir (DGT) ----------
const dgt = load("conducir.json");
const dgtFacts = new Set(JSON.parse(readFileSync(new URL("../content/facts/conducir.json", import.meta.url), "utf8")).map((f) => f.id));
const dgtIds = new Set();
for (const q of dgt.questions) {
  const w = `conducir ${q.id}`;
  if (dgtIds.has(q.id)) errors.push(`${w}: id repetido`);
  dgtIds.add(q.id);
  if (q.options.length !== 3 || new Set(q.options).size !== 3) errors.push(`${w}: debe tener 3 opciones distintas`);
  if (!(q.answer >= 0 && q.answer < 3)) errors.push(`${w}: respuesta fuera de rango`);
  if (!q.explain || !dgtFacts.has(q.fact)) errors.push(`${w}: falta la explicación o el dato oficial «${q.fact}»`);
  if (!STATUS.includes(q.status)) errors.push(`${w}: estado no válido`);
}
for (const t of dgt.topics) {
  if (dgt.questions.filter((q) => q.topic === t.id).length < 3) errors.push(`conducir ${t.id}: el simulacro necesita al menos 3 preguntas del tema`);
  for (const f of t.study) if (!dgtFacts.has(f)) errors.push(`conducir ${t.id}: el dato «${f}» no existe`);
}
if (dgt.questions.length < dgt.mock.questions * 2) errors.push(`conducir: el banco necesita al menos ${dgt.mock.questions * 2} preguntas`);
for (const l of [0, 1, 2]) if (dgt.questions.filter((q) => q.answer === l).length / dgt.questions.length > 0.5) errors.push(`conducir: más de la mitad de las respuestas son la opción ${"abc"[l]}`);
const langs = JSON.parse(readFileSync(new URL("../content/i18n/_order.json", import.meta.url), "utf8")).filter((l) => l !== "es");
for (const w of dgt.words) for (const l of langs) if (!w.tr[l]) errors.push(`conducir vocabulario «${w.es}»: falta la traducción (${l})`);

// Señales dibujadas: solo códigos que la app sabe dibujar (src/ui/signs.js).
for (const q of dgt.questions) if (q.sign && !SIGN_CODES.includes(q.sign.split(":")[0])) errors.push(`conducir ${q.id}: señal «${q.sign}» sin dibujo`);

// Revisión: una pregunta solo deja de ser «borrador» con nombre y fecha de quien la revisó (tools/review.js).
const reviewed = (node, where) => {
  if (Array.isArray(node)) return node.forEach((v, i) => reviewed(v, `${where}/${v?.id ?? i}`));
  if (!node || typeof node !== "object") return;
  if (["revisado", "publicado"].includes(node.status) && !(node.review?.by && /^\d{4}-\d{2}-\d{2}$/.test(node.review?.date || "")))
    errors.push(`${where}: «${node.status}» sin review.by y review.date`);
  for (const [k, v] of Object.entries(node)) if (v && typeof v === "object") reviewed(v, `${where}/${k}`);
};
for (const [name, data] of Object.entries({ ccse, dele, pce, conducir: dgt })) reviewed(data, name);

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK exámenes: CCSE ${ccse.questions.length} preguntas; DELE A2 lectura y auditiva de 25 preguntas con el formato oficial; PCE ${pce.subjects.length} materias y ${Object.values(pce.tests).reduce((n, t) => n + t.bank.length, 0)} preguntas de test; conducir ${dgt.questions.length} preguntas y ${dgt.words.length} palabras.`);
