// Comprueba que todos los idiomas tienen todos los textos y que el curso no usa ids inexistentes.
// Uso: node tools/check-content.js
import { readFileSync } from "node:fs";

const load = (p) => JSON.parse(readFileSync(new URL("../content/" + p, import.meta.url), "utf8"));
const order = load("i18n/_order.json");
const I18N = Object.fromEntries(order.map((c) => [c, load(`i18n/${c}.json`)]));
const UNITS = load("course/units.json");

const errors = [];
const ref = I18N.es;
for (const [code, lang] of Object.entries(I18N)) {
  for (const k of ["name", "voice"]) if (!lang[k]) errors.push(`${code}: falta ${k}`);
  for (const part of ["ui", "t"]) {
    for (const k of Object.keys(ref[part])) if (!lang[part][k]) errors.push(`${code}.${part}: falta "${k}"`);
    for (const k of Object.keys(lang[part])) if (!(k in ref[part])) errors.push(`${code}.${part}: sobra "${k}"`);
    // Los marcadores {x} deben estar en todas las traducciones donde los tiene el español.
    for (const [k, v] of Object.entries(ref[part])) if (String(v).includes("{x}") && lang[part][k] && !String(lang[part][k]).includes("{x}")) errors.push(`${code}.${part}.${k}: falta {x}`);
  }
  // Dos opciones iguales en la misma lección serían imposibles de distinguir.
  for (const u of UNITS) {
    const seen = new Map();
    for (const { id } of u.words) {
      const t = (lang.t[id] || "").toLowerCase();
      if (seen.has(t)) errors.push(`${code}: "${t}" repetido en ${u.id} (${seen.get(t)}, ${id})`);
      seen.set(t, id);
    }
  }
}
const ids = new Set(Object.keys(ref.t));
const need = (id, where) => { if (!ids.has(id)) errors.push(`${where}: falta la traducción "${id}"`); };
for (const u of UNITS) {
  need("w_" + u.id, u.id);
  for (const k of u.extraKeys || []) need(k, u.id);
  for (const { id } of u.words) need(id, u.id);
  for (const p of u.phrases) { need("q_" + p.id, u.id); need("a_" + p.id, u.id); for (const w of p.wrong) need("a_" + w, u.id); }
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK contenido: ${order.length} idiomas, ${Object.keys(ref.ui).length} textos de interfaz y ${ids.size} de contenido cada uno; ${UNITS.length} unidades.`);
