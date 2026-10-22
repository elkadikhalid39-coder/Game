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
  need("w_" + u.id, u.id); // nombre de la unidad
  need("c_" + u.id, u.id); // objetivo «Ya sé…»
  for (const { id } of u.words) need(id, u.id);
  for (const p of u.phrases) { need("q_" + p.id, u.id); need("a_" + p.id, u.id); for (const w of p.wrong) need("a_" + w, u.id); }
  // Diálogo de cierre: escena, cada línea, la frase clave del dictado y, si hay, el enunciado de escribir.
  const d = u.dialog;
  if (!d) { errors.push(`${u.id}: sin diálogo de cierre`); continue; }
  need("gs_" + u.id, u.id);
  d.lines.forEach((l, k) => {
    need(`g_${u.id}_${k + 1}`, u.id);
    if (l.w === "t" && (l.wrong?.length !== 2 || l.wrong.includes(ref.t[`g_${u.id}_${k + 1}`]))) errors.push(`${u.id}: la línea ${k + 1} necesita dos frases incorrectas distintas de la buena`);
  });
  if (!d.lines[d.key]) errors.push(`${u.id}: la frase clave ${d.key} no existe`);
  if (d.compose) need("gw_" + u.id, u.id);
}

// Audio pregrabado: cada palabra y frase del curso tiene que estar en la voz neutra
// (si no, hay que volver a generar el audio: tools/audio/README.md).
const fnv = (t) => { let h = 0x811c9dc5; for (const b of Buffer.from(t.trim(), "utf8")) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h.toString(16).padStart(8, "0"); };
const neutral = JSON.parse(readFileSync(new URL("../public/audio/neutra.json", import.meta.url), "utf8"));
const es = JSON.parse(readFileSync(new URL("../content/i18n/es.json", import.meta.url), "utf8")).t;
// Lo que falta se avisa sin parar: los paquetes de audio no se regeneran sin permiso, y mientras tanto
// la app usa la voz del dispositivo para esas frases.
const noAudio = [];
for (const u of UNITS) {
  const dialog = (u.dialog?.lines || []).map((l, k) => es[`g_${u.id}_${k + 1}`]);
  const texts = [...u.words.flatMap(({ id }) => [es[id], es["e_" + id]]), ...u.phrases.flatMap((p) => [es["q_" + p.id], es["a_" + p.id]]), ...dialog];
  for (const t of texts) if (t && !neutral[fnv(t)]) noAudio.push(`${u.id}: «${t}»`);
}
if (noAudio.length) console.warn(`AVISO: ${noAudio.length} textos del curso sin audio grabado (usan la voz del dispositivo hasta regenerar con tools/audio/generate.py).`);

// Lo que se lee en los exámenes también va grabado: las preguntas de conducir (voz neutra)
// y los diálogos de la auditiva del DELE (las dos voces de España).
const pack = (id) => JSON.parse(readFileSync(new URL(`../public/audio/${id}.json`, import.meta.url), "utf8"));
const exam = (f) => JSON.parse(readFileSync(new URL("../content/exams/" + f, import.meta.url), "utf8"));
const examPack = pack("neutra-ex");
for (const q of exam("conducir.json").questions) {
  const t = [q.q, ...q.options.map((o, i) => "abc"[i] + ". " + o)].join(". ");
  if (!examPack[fnv(t)] && !neutral[fnv(t)]) errors.push(`conducir ${q.id}: sin audio grabado (regenerar con tools/audio/generate.py)`);
}
const voices = { M: pack("es-f"), H: pack("es-m") };
const dialogs = (o, out = []) => {
  if (Array.isArray(o)) o.forEach((x) => dialogs(x, out));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) k === "dialog" ? out.push(...v) : dialogs(v, out);
  return out;
};
for (const f of ["dele-a2.json", "dele-a2-2.json"]) for (const [who, t] of dialogs(exam(f))) if (!voices[who][fnv(t)]) errors.push(`${f}: diálogo sin audio grabado «${t.slice(0, 40)}…»`);

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK contenido: ${order.length} idiomas, ${Object.keys(ref.ui).length} textos de interfaz y ${ids.size} de contenido cada uno; ${UNITS.length} unidades.`);
