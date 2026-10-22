// Piezas comunes de los pases de examen: estado del pase, avisos, resultados guardados.
import { ui } from "../core/i18n.js";
import { save, persist } from "../core/state.js";
import { el, button } from "../ui/dom.js";
import { screen } from "../ui/shell.js";
import APP from "../../content/app.json";

// En modo demo todos los pases están abiertos (sin pago y sin guardarlo como comprado).
export const ownsPass = (id) => !!save.passes[id];
export const hasPass = (id) => save.demo || ownsPass(id);
export function unlockPass(id) { save.passes[id] = true; persist(); }

// Pantallas de trámite (exámenes, «Mi caso», universidad): el mismo color, pero más plano y serio:
// sin mascota, sin confeti y con botones sin relieve (estilos en body.tramite).
export function tscreen(layout = "main") {
  screen(layout);
  document.body.classList.add("tramite");
}

// Opción de respuesta: letra A, B, C… y texto, a todo el ancho. El estado elegido se marca con icono, no solo con color.
export function optionButton(text, i, onPick, { selected = false, ok = false } = {}) {
  const b = button("opt left choice" + (selected ? " selected" : ""), "", () => onPick(i, b));
  b.append(el("span", "opt-letter", "ABCDEFGH"[i]), el("span", "opt-text", text));
  b.dataset.ok = ok ? "1" : "0";
  b.setAttribute("aria-pressed", String(selected));
  return b;
}

// Corrección dentro de la página, debajo de la pregunta (no en un panel encima del dedo):
// acierto o fallo, la respuesta correcta, la explicación con su fuente y el botón para seguir.
export function answerFeedback(card, ok, answerText, explanation, onNext) {
  for (const b of card.querySelectorAll(".opt")) {
    b.disabled = true;
    if (b.dataset.ok === "1") b.classList.add("correct");
  }
  const box = el("div", "feedback " + (ok ? "ok" : "bad"));
  box.setAttribute("role", "status");
  box.append(el("strong", "feedback-title", (ok ? "✓ " : "✕ ") + (ok ? ui("great") : ui("answer") + ": " + answerText)));
  if (explanation) box.append(explanation);
  const next = button("btn", ui("next") + " →", onNext);
  box.append(next);
  card.append(box);
  next.focus({ preventScroll: true });
  box.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

// Acciones secundarias de un trámite: enlaces discretos debajo de las tres principales.
export function secondaryActions(items) {
  const row = el("div", "secondary-actions");
  for (const [label, fn] of items) row.append(button("link", label, fn));
  return row;
}

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
