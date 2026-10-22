// Comprueba el registro de datos oficiales (content/facts/*.json) según docs/CONTENIDO.md.
// Uso: node tools/check-facts.js [--strict]   (--strict: también falla si un dato ha pasado su fecha de revisión)
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../content/facts/", import.meta.url);
const strict = process.argv.includes("--strict");
const STATUS = ["confirmado", "fuente_secundaria", "sin_confirmar"];
const today = new Date().toISOString().slice(0, 10);
const errors = [], warnings = [];
const seen = new Set();
let count = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  for (const f of JSON.parse(readFileSync(new URL(file, dir), "utf8"))) {
    count++;
    const where = `${file} · ${f.id || "(sin id)"}`;
    if (!f.id) errors.push(`${where}: falta id`);
    if (seen.has(f.id)) errors.push(`${where}: id repetido`);
    seen.add(f.id);
    if (!f.text) errors.push(`${where}: falta text`);
    if (!STATUS.includes(f.status)) errors.push(`${where}: status debe ser ${STATUS.join(" | ")}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.checked || "")) errors.push(`${where}: checked debe ser AAAA-MM-DD`);
    if (!Number.isInteger(f.reviewDays)) errors.push(`${where}: falta reviewDays`);
    if (!Array.isArray(f.sources) || !f.sources.length) errors.push(`${where}: falta al menos una fuente`);
    for (const s of f.sources || []) {
      if (!s.name || !/^https:\/\//.test(s.url || "")) errors.push(`${where}: fuente sin nombre o sin enlace https`);
      if (typeof s.official !== "boolean") errors.push(`${where}: la fuente debe indicar official: true | false`);
    }
    // Un dato confirmado necesita una fuente oficial; uno de fuente secundaria no puede presentarse como confirmado.
    if (f.status === "confirmado" && !f.sources?.some((s) => s.official)) errors.push(`${where}: «confirmado» sin fuente oficial`);
    // Precios y tasas nunca se escriben: se enlaza a la página oficial.
    if (/€|\beuros?\b/i.test(f.text + " " + (f.note || ""))) errors.push(`${where}: no se escriben precios ni tasas`);
    // Fecha real y plazo de revisión válidos antes de calcular cuándo toca revisarlo.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.checked || "") || Number.isNaN(Date.parse(f.checked))) errors.push(`${where}: «checked» debe ser una fecha AAAA-MM-DD`);
    else if (!(f.reviewDays > 0)) errors.push(`${where}: falta reviewDays`);
    else {
      const due = new Date(Date.parse(f.checked) + f.reviewDays * 864e5).toISOString().slice(0, 10);
      if (due < today) (strict ? errors : warnings).push(`${where}: tocaba revisarlo el ${due}`);
    }
  }
}
for (const w of warnings) console.warn("Aviso: " + w);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK datos oficiales: ${count} datos con fuente, estado y fecha.`);
