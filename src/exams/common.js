// Piezas comunes de los pases de examen: estado del pase, avisos, resultados guardados.
import { ui } from "../core/i18n.js";
import { save, persist } from "../core/state.js";
import { el, button } from "../ui/dom.js";

export const hasPass = (id) => !!save.passes[id];
export function unlockPass(id) { save.passes[id] = true; persist(); }

// Aviso de contenido en borrador y de que la app no sustituye a los organismos oficiales.
export function draftBanner() {
  const b = el("div", "notice draft");
  b.append(el("strong", "", "🛠️ " + ui("draft")), el("span", "", ui("disclaimer")));
  return b;
}

// Fila de menú. locked: muestra el candado y no abre la pantalla.
export function menuRow(icon, title, desc, onclick, { badge, locked } = {}) {
  const b = button("menu-row" + (locked ? " locked" : ""), "", onclick);
  const text = el("span", "menu-text");
  text.append(el("strong", "", title));
  if (desc) text.append(el("span", "", desc));
  if (badge) text.append(el("span", "pill " + (locked ? "lock" : "free"), badge));
  b.append(el("span", "menu-icon", icon), text);
  b.append(el("span", "chev", "›"));
  return b;
}

// Resultados de simulacros: save.exams[clave] = [{ date, score, max, pass }].
export function saveResult(key, score, max, pass) {
  (save.exams[key] ||= []).unshift({ date: new Date().toISOString().slice(0, 10), score, max, pass });
  save.exams[key] = save.exams[key].slice(0, 10);
  persist();
}
export const lastResult = (key) => save.exams[key]?.[0];

export function resultsList(key) {
  const list = save.exams[key] || [];
  if (!list.length) return null;
  const box = el("div", "results-list");
  box.append(el("h3", "", ui("lastResults")));
  for (const r of list.slice(0, 3)) {
    const row = el("div", "result-row " + (r.pass ? "pass" : "fail"));
    row.append(el("span", "", r.date.split("-").reverse().join("/")), el("strong", "", `${r.score} / ${r.max}`),
      el("span", "pill " + (r.pass ? "free" : "lock"), r.pass ? ui("apto") : ui("noApto")));
    box.append(row);
  }
  return box;
}
