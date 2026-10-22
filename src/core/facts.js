// Registro de datos legales y de examen (content/facts/*.json). Cada dato lleva fuente, estado y fecha de comprobación.
// Las reglas están en docs/CONTENIDO.md y las comprueba tools/check-facts.js.
const files = import.meta.glob("../../content/facts/*.json", { eager: true, import: "default" });
export const FACTS = Object.fromEntries(Object.values(files).flat().map((f) => [f.id, f]));
export function fact(id) {
  if (!FACTS[id]) throw new Error("Dato sin registrar: " + id);
  return FACTS[id];
}
