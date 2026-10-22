// Revisión por especialistas del contenido de examen.
//   node tools/review.js export   → docs/revision/<examen>.csv con todas las preguntas, para revisarlas en una hoja de cálculo
//   node tools/review.js import   → aplica a content/exams/*.json las filas marcadas como «revisado» o «publicado»
// En la hoja, el especialista rellena: estado (borrador | revisado | publicado), revisado_por, fecha (AAAA-MM-DD) y comentarios.
// Una pregunta solo deja de ser «borrador» con nombre y fecha de quien la revisó (lo comprueba tools/check-exams.js).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";

const EXAMS = new URL("../content/exams/", import.meta.url);
const OUT = new URL("../docs/revision/", import.meta.url);
const COLS = ["ref", "tema", "pregunta", "opciones", "correcta", "explicacion", "fuente", "estado", "revisado_por", "fecha", "comentarios"];

// Todas las preguntas de un examen (objetos con q, options y answer), con su ruta dentro del JSON como referencia.
function questions(node, path = [], out = []) {
  if (Array.isArray(node)) node.forEach((v, i) => questions(v, [...path, node[i]?.id ?? i], out));
  else if (node && typeof node === "object") {
    if (typeof node.q === "string" && Array.isArray(node.options) && Number.isInteger(node.answer)) out.push({ ref: path.join("/"), node });
    else for (const [k, v] of Object.entries(node)) questions(v, [...path, k], out);
  }
  return out;
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const files = readdirSync(EXAMS).filter((f) => f.endsWith(".json"));
const mode = process.argv[2];

if (mode === "export") {
  mkdirSync(OUT, { recursive: true });
  for (const file of files) {
    const data = JSON.parse(readFileSync(new URL(file, EXAMS), "utf8"));
    const rows = questions(data).map(({ ref, node: q }) => [
      ref, q.topic ?? q.task ?? "", q.q, q.options.map((o, i) => "abc"[i] + ") " + o).join(" | "), "abc"[q.answer] ?? q.answer,
      q.explain ?? "", q.source?.url ?? q.fact ?? "", q.status ?? data.status ?? "borrador", q.review?.by ?? "", q.review?.date ?? "", "",
    ]);
    const name = file.replace(".json", ".csv");
    writeFileSync(new URL(name, OUT), "﻿" + [COLS, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
    console.log(`docs/revision/${name}: ${rows.length} preguntas`);
  }
} else if (mode === "import") {
  for (const file of files) {
    let sheet;
    try { sheet = parseCsv(readFileSync(new URL(file.replace(".json", ".csv"), OUT), "utf8").replace(/^﻿/, "")); } catch { continue; }
    const url = new URL(file, EXAMS);
    const data = JSON.parse(readFileSync(url, "utf8"));
    const byRef = new Map(questions(data).map((x) => [x.ref, x.node]));
    let changed = 0;
    for (const r of sheet) {
      const q = byRef.get(r.ref);
      if (!q || !["revisado", "publicado"].includes(r.estado)) continue;
      if (!r.revisado_por || !/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) { console.warn(`${file} ${r.ref}: falta revisado_por o fecha; se queda como está`); continue; }
      q.status = r.estado;
      q.review = { by: r.revisado_por, date: r.fecha, ...(r.comentarios ? { notes: r.comentarios } : {}) };
      changed++;
    }
    if (changed) writeFileSync(url, JSON.stringify(data, null, 2) + "\n");
    console.log(`${file}: ${changed} preguntas marcadas como revisadas`);
  }
} else {
  console.log("Uso: node tools/review.js export | import");
}
