import { dirOf, ui } from "../core/i18n.js";

export const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
// Texto en un idioma concreto: fija lang y dirección (árabe y urdu de derecha a izquierda).
export function txt(tag, cls, text, lang) {
  const e = el(tag, cls, text);
  e.lang = lang;
  e.dir = dirOf(lang);
  return e;
}
// Las flechas de «← Volver» y «Continuar →» van en su propio elemento para girarlas en árabe y urdu
// (se leen de derecha a izquierda: «volver» apunta a la derecha).
export function button(cls, label, onclick) {
  const b = el("button", cls);
  label = label == null ? "" : String(label);
  if (label.startsWith("← ")) b.append(el("span", "arrow", "←"), " " + label.slice(2));
  else if (label.endsWith(" →")) b.append(label.slice(0, -2) + " ", el("span", "arrow", "→"));
  else b.textContent = label;
  b.type = "button";
  b.onclick = onclick;
  return b;
}
// Botón ✕ de salir de una lección o examen, con nombre para lectores de pantalla.
export function closeButton(onclick) {
  const b = button("icon-btn", "✕", onclick);
  b.setAttribute("aria-label", ui("close"));
  return b;
}
