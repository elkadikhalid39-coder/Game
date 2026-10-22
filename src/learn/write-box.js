// Piezas para escribir en español: campo de escritura, pistas
// y la corrección que marca en qué letras está el fallo.
import { ui } from "../core/i18n.js";
import { save } from "../core/state.js";
import { el, txt, button } from "../ui/dom.js";
import { diffChars } from "./answers.js";

// Campo de escritura. onCheck(texto, { hinted }) se llama al pulsar «Comprobar» o Intro con algo escrito.
// hint: texto correcto para las pistas. La 1.ª pista dice cuántas letras tiene; la 2.ª, la primera letra.
// Nunca se enseña más: la palabra la tiene que escribir la persona.
// Se escribe con el teclado del propio móvil u ordenador (sin teclas añadidas: confundían).
export function writeBox({ onCheck, hint, multiline = false }) {
  const box = el("div", "write-box");
  const input = el(multiline ? "textarea" : "input", multiline ? "write-area" : "write-input");
  Object.assign(input, { id: "write-answer", autocomplete: "off", autocapitalize: "off", spellcheck: false, lang: "es" });
  input.dir = "ltr";
  if (!multiline) input.type = "text";
  else input.rows = 3;
  input.enterKeyHint = "done";
  input.setAttribute("aria-label", ui("writeIt"));
  let level = 0;
  const check = () => {
    if (!input.value.trim()) return input.focus();
    input.disabled = true;
    // Se cierra el teclado del móvil para que se vea la corrección.
    input.blur();
    onCheck(input.value, { hinted: level > 0 });
  };
  // Intro (o «Enviar» en el teclado del móvil) comprueba; se cancela la acción por defecto
  // para que esa misma pulsación no active el botón «Continuar» de la corrección.
  if (!multiline) input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); check(); } };
  box.append(input);
  if (hint) {
    const shown = el("div", "hint-mask");
    shown.lang = "es";
    shown.dir = "ltr";
    shown.hidden = true;
    const hintBtn = button("link", "💡 " + ui("hint"), () => {
      level = Math.min(level + 1, 2);
      // Una casilla por letra; los espacios separan palabras. En la 2.ª pista, la primera letra.
      shown.replaceChildren();
      let first = true;
      for (const c of hint) {
        if (/\p{L}|\p{N}/u.test(c)) {
          shown.append(el("span", "hint-box", level === 2 && first ? c : ""));
          first = false;
        } else if (c === " ") shown.append(el("span", "hint-gap"));
      }
      const count = [...hint].filter((c) => /\p{L}|\p{N}/u.test(c)).length;
      shown.append(txt("span", "hint-count", ui("hintLetters", count), save.native));
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
