// Comprueba que todos los idiomas tienen todas las claves y que el contenido no usa ids inexistentes.
// Uso: node tools/check-content.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/(core|adult|kids|main)\.js$/.test(s));
const ctx = {};
vm.createContext(ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), "utf8") + "\n;globalThis.__x = { I18N, ...(typeof WORLDS !== 'undefined' ? { WORLDS, KID_WORDS, KID_UNITS } : {}) };", ctx);
const { I18N, WORLDS, KID_WORDS, KID_UNITS } = ctx.__x;

const errors = [];
const ref = I18N.es;
for (const [code, lang] of Object.entries(I18N)) {
  for (const k of ["name", "voice", "script"]) if (!lang[k]) errors.push(`${code}: falta ${k}`);
  for (const part of ["ui", "t"]) {
    for (const k of Object.keys(ref[part])) if (!lang[part][k]) errors.push(`${code}.${part}: falta "${k}"`);
    for (const k of Object.keys(lang[part])) if (!(k in ref[part])) errors.push(`${code}.${part}: sobra "${k}"`);
  }
  if (!lang.ui.gateQ.includes("{x}") || !lang.ui.startsWith.includes("{x}")) errors.push(`${code}: falta {x} en gateQ/startsWith`);
  // Dos opciones iguales en la misma lección serían imposibles de distinguir.
  const groups = [...WORLDS.map((w) => [w.id, w.words.map((x) => x[0])]), ...Object.entries(KID_WORDS).map(([k, v]) => [k, v.map((x) => x[0])])];
  for (const [g, ids] of groups) {
    const seen = new Map();
    for (const id of ids) {
      const t = (lang.t[id] || "").toLowerCase();
      if (seen.has(t)) errors.push(`${code}: "${t}" repetido en ${g} (${seen.get(t)}, ${id})`);
      seen.set(t, id);
    }
  }
}
const ids = new Set(Object.keys(ref.t));
for (const w of WORLDS) {
  if (!ids.has("w_" + w.id)) errors.push(`mundo sin nombre: w_${w.id}`);
  for (const [id] of w.words) if (!ids.has(id)) errors.push(`${w.id}: palabra sin traducir "${id}"`);
  for (const [id, wrong] of w.phrases) for (const p of [id, ...wrong]) {
    if (!ids.has("q_" + p) && p === id) errors.push(`${w.id}: falta q_${p}`);
    if (!ids.has("a_" + p)) errors.push(`${w.id}: falta a_${p}`);
  }
}
for (const list of Object.values(KID_WORDS)) for (const [id] of list) if (!ids.has(id)) errors.push(`niños: palabra sin traducir "${id}"`);
for (const u of KID_UNITS) if (!ref.ui["u_" + u.id]) errors.push(`unidad sin nombre: u_${u.id}`);

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK: ${Object.keys(I18N).length} idiomas, ${Object.keys(ref.ui).length} textos de interfaz y ${ids.size} de contenido cada uno.`);
