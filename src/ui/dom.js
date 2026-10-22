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
export function button(cls, label, onclick) {
  const b = el("button", cls, label);
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
