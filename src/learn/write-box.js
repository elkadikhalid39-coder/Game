// Piezas para escribir en español: campo con las letras que faltan en muchos teclados, pistas
// y la corrección que marca en qué letras está el fallo.
import { ui } from "../core/i18n.js";
import { save } from "../core/state.js";
import { el, txt, button } from "../ui/dom.js";
import { diffChars } from "./answers.js";

// Campo de escritura. onCheck(texto) se llama al pulsar «Comprobar» o Intro con algo escrito.
// hint: texto correcto para las pistas (primera letra y número de letras; después, la mitad de la palabra).
export function writeBox({ onCheck, hint, multiline = false }) {
  const box = el("div", "write-box");
  const input = el(multiline ? "textarea" : "input", multiline ? "write-area" : "write-input");
  Object.assign(input, { id: "write-answer", autocomplete: "off", autocapitalize: "off", spellcheck: false, lang: "es" });
  input.dir = "ltr";
  if (!multiline) input.type = "text";
  else input.rows = 3;
  input.setAttribute("aria-label", ui("writeIt"));
  const keys = el("div", "es-keys");
  // Los signos de apertura llevan nombre para los lectores de pantalla (un símbolo solo no se lee bien).
  const NAMES = { "¿": "abre interrogación", "¡": "abre exclamación" };
  for (const k of ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"]) {
    const key = button("key", k, () => { input.setRangeText(k, input.selectionStart, input.selectionEnd, "end"); input.focus(); });
    if (NAMES[k]) { key.setAttribute("aria-label", NAMES[k]); key.lang = "es"; }
    keys.append(key);
  }
  const check = () => {
    if (!input.value.trim()) return input.focus();
    input.disabled = true;
    onCheck(input.value);
  };
  if (!multiline) input.onkeydown = (e) => { if (e.key === "Enter") check(); };
  box.append(input, keys);
  if (hint) {
    // Cada pulsación descubre más letras; los espacios y signos se ven siempre.
    let level = 0;
    const shown = el("p", "hint-mask");
    shown.lang = "es";
    shown.dir = "ltr";
    shown.hidden = true;
    const hintBtn = button("link", "💡 " + ui("hint"), () => {
      level = Math.min(level + 1, 2);
      const letters = [...hint];
      const reveal = level === 1 ? 1 : Math.ceil(letters.filter((c) => /\p{L}/u.test(c)).length / 2);
      let seen = 0;
      shown.textContent = letters.map((c) => (/\p{L}|\p{N}/u.test(c) ? (seen++ < reveal ? c : "_") : c)).join(" ");
      shown.hidden = false;
      if (level === 2) hintBtn.disabled = true;
    });
    box.append(shown, hintBtn);
  }
  box.append(button("btn", ui("check"), check));
  return { el: box, input, focus: () => setTimeout(() => input.focus(), 50) };
}

// Corrección visible: lo que escribió la persona (letras de más o distintas en rojo)
// y la forma correcta (letras que faltaban subrayadas).
export function diffView(input, expected) {
  const { given, want } = diffChars(input, expected);
  const box = el("div", "diff");
  box.lang = "es";
  box.dir = "ltr";
  const line = (label, segs, cls) => {
    const p = el("p", "diff-line " + cls);
    p.append(txt("span", "diff-label", label, save.native));
    const text = el("span", "diff-text");
    for (const s of segs) text.append(s.k === "ok" || s.k === "soft" ? document.createTextNode(s.t) : el("mark", "diff-" + s.k, s.t));
    p.append(text);
    return p;
  };
  box.append(line(ui("yourAnswer"), given, "given"), line(ui("rightAnswer"), want, "want"));
  return box;
}
