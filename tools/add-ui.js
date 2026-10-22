// Añade o actualiza textos de interfaz en los 12 idiomas a partir de un JSON { clave: { es, en, ... } }.
// Uso: node tools/add-ui.js archivo.json
import { readFileSync, writeFileSync } from "node:fs";

const keys = JSON.parse(readFileSync(process.argv[2], "utf8"));
const base = new URL("../content/i18n/", import.meta.url);
const order = JSON.parse(readFileSync(new URL("_order.json", base), "utf8"));
const part = process.argv[3] || "ui";
for (const code of order) {
  const file = new URL(code + ".json", base);
  const lang = JSON.parse(readFileSync(file, "utf8"));
  for (const [k, v] of Object.entries(keys)) {
    if (!v[code]) throw new Error(`Falta "${k}" en ${code}`);
    lang[part][k] = v[code];
  }
  writeFileSync(file, JSON.stringify(lang, null, 2) + "\n");
}
console.log(`${Object.keys(keys).length} textos añadidos a ${order.length} idiomas (${part})`);
