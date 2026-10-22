// Piezas comunes de los pases de examen: estado del pase, avisos, resultados guardados.
import { ui } from "../core/i18n.js";
import { save, persist } from "../core/state.js";
import { el, button } from "../ui/dom.js";
import APP from "../../content/app.json";

// En modo demo todos los pases están abiertos (sin pago y sin guardarlo como comprado).
export const ownsPass = (id) => !!save.passes[id];
export const hasPass = (id) => save.demo || ownsPass(id);
export function unlockPass(id) { save.passes[id] = true; persist(); }

// Aviso de contenido en borrador y de que la app no sustituye a los organismos oficiales.
export function draftBanner() {
  const b = el("div", "notice draft");
  b.append(el("strong", "", "🛠️ " + ui("draft")), el("span", "", ui("disclaimer")));
  return b;
}

// «Avisar de un error» en una pregunta o un dato: prepara un mensaje con su identificador.
// Va por correo si el equipo ha puesto una dirección (content/app.json); si no, se comparte o se copia.
// No se envía nada solo: la persona decide si lo manda y a quién.
export function reportButton(ref, text) {
  const b = button("link report", "⚑ " + ui("reportError"), async () => {
    const subject = `Hola, Español · ${ref}`;
    const body = `${subject}\n${text}\n\n`;
    if (APP.contactEmail) return void (location.href = `mailto:${APP.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    try {
      if (navigator.share) return void (await navigator.share({ title: subject, text: body }));
      await navigator.clipboard.writeText(body);
    } catch { /* cancelado o sin permiso */ }
    b.textContent = "✓ " + ui("reportCopied");
  });
  b.dataset.ref = ref;
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

// verdict: false oculta APTO / NO APTO (partes de examen sin nota mínima propia).
export function resultsList(key, { verdict = true } = {}) {
  const list = save.exams[key] || [];
  if (!list.length) return null;
  const box = el("div", "results-list");
  box.append(el("h3", "", ui("lastResults")));
  for (const r of list.slice(0, 3)) {
    const row = el("div", "result-row " + (r.pass ? "pass" : "fail"));
    row.append(el("span", "", r.date.split("-").reverse().join("/")), el("strong", "", `${String(r.score).replace(".", ",")} / ${String(r.max).replace(".", ",")}`));
    if (verdict) row.append(el("span", "pill " + (r.pass ? "free" : "lock"), r.pass ? ui("apto") : ui("noApto")));
    box.append(row);
  }
  return box;
}
