// Glosario de palabras difíciles (content/glossary/ccse.json): debajo del enunciado, en español,
// cada palabra difícil con su traducción al idioma de la persona. El enunciado no se traduce.
import data from "../../content/glossary/ccse.json";
import { ui } from "../core/i18n.js";
import { save, TARGET } from "../core/state.js";
import { el, txt } from "../ui/dom.js";

const TERMS = data.terms.map((t) => ({ ...t, re: new RegExp(t.match, "i") }));

export function glossFor(text) {
  if (save.native === TARGET) return null;
  const found = TERMS.filter((t) => t.re.test(text)).slice(0, 3);
  if (!found.length) return null;
  const box = el("details", "gloss");
  box.open = true;
  box.append(txt("summary", "", ui("glossary"), save.native));
  for (const t of found) {
    const row = el("p", "gloss-row");
    row.append(el("strong", "", t.es), " — ", txt("span", "", t.tr[save.native], save.native));
    box.append(row);
  }
  return box;
}
