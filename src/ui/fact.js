// Nota de fuente: muestra un dato con su estado, su fuente y la fecha de comprobación.
import { ui } from "../core/i18n.js";
import { fact } from "../core/facts.js";
import { el } from "./dom.js";

const STATUS = { confirmado: ["ok", "factConfirmed"], fuente_secundaria: ["warn", "factSecondary"], sin_confirmar: ["bad", "factUnconfirmed"] };

// Fecha AAAA-MM-DD → 22/10/2026.
const shortDate = (iso) => iso.split("-").reverse().join("/");

// Enlace que se abre fuera de la app.
export function extLink(name, url) {
  const a = el("a", "", name);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

// Solo la línea de fuente (para poner debajo de un texto propio).
export function sourceLine(id) {
  const f = fact(id);
  const [cls, key] = STATUS[f.status];
  const line = el("p", "fact-source");
  line.append(el("span", "fact-status " + cls, ui(key)), " · ");
  f.sources.forEach((s, i) => {
    if (i) line.append(", ");
    line.append(extLink(s.name, s.url));
  });
  line.append(" · " + ui("factChecked", shortDate(f.checked)));
  return line;
}

// El dato completo: texto (en español) + línea de fuente.
export function factNote(id) {
  const f = fact(id);
  const box = el("div", "fact " + STATUS[f.status][0]);
  box.lang = "es";
  box.append(el("p", "fact-text", f.text));
  if (f.note) box.append(el("p", "fact-note", f.note));
  box.append(sourceLine(id));
  return box;
}
