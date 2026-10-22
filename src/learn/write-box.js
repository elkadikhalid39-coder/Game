// Piezas para escribir en español: campo de escritura, pistas
// y la corrección que marca en qué letras está el fallo.
import { ui } from "../core/i18n.js";
import { save } from "../core/state.js";
import { el, txt, button } from "../ui/dom.js";
import { diffChars } from "./answers.js";

// Campo de escritura. onCheck(texto, { hinted }) se llama al pulsar «Comprobar» o Intro con algo escrito.
// hint: texto correcto para las pistas (ver abajo: nunca se enseña más de la mitad de las letras).
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
    // Pistas en proporción a lo que hay que escribir: 1.ª, las casillas y el número de letras;
    // 2.ª, un 25 % de las letras; 3.ª, un 50 %. Primero la inicial de cada palabra y luego repartidas.
    const shown = el("div", "hint-mask");
    shown.lang = "es";
    shown.dir = "ltr";
    shown.hidden = true;
    const chars = [...hint];
    const letterIdx = chars.map((c, i) => (/\p{L}|\p{N}/u.test(c) ? i : -1)).filter((i) => i >= 0);
    // En las frases, casillas más pequeñas para que quepan en la pantalla del móvil.
    if (letterIdx.length > 12) shown.classList.add("small");
    const firsts = letterIdx.filter((i) => i === 0 || !/\p{L}|\p{N}/u.test(chars[i - 1]));
    const rest = letterIdx.filter((i) => !firsts.includes(i));
    // Las demás, repartidas por toda la palabra o frase (no seguidas).
    const spread = [...rest.filter((_, k) => k % 2 === 1), ...rest.filter((_, k) => k % 2 === 0)];
    const order = [...firsts, ...spread];
    const LEVELS = [0, 0.25, 0.5];
    const hintBtn = button("link", "💡 " + ui("hint"), () => {
      level = Math.min(level + 1, LEVELS.length);
      const reveal = new Set(order.slice(0, Math.ceil(letterIdx.length * LEVELS[level - 1])));
      shown.replaceChildren();
      // Cada palabra en un bloque que no se parte al cambiar de línea (frases largas en el móvil).
      let word = null;
      chars.forEach((c, i) => {
        if (c === " ") { word = null; return shown.append(el("span", "hint-gap")); }
        if (!word) shown.append((word = el("span", "hint-word")));
        word.append(/\p{L}|\p{N}/u.test(c) ? el("span", "hint-box", reveal.has(i) ? c : "") : el("span", "hint-sign", c));
      });
      shown.append(txt("span", "hint-count", ui("hintLetters", letterIdx.length), save.native));
      shown.hidden = false;
      if (level === LEVELS.length) hintBtn.disabled = true;
    });
    box.append(shown, hintBtn);
  }
  box.append(button("btn", ui("check"), check));
  return { el: box, input, focus: () => setTimeout(() => input.focus(), 50) };
}

// Corrección visible: lo que escribió la persona (letras de más o distintas en rojo)
// y la forma correcta (letras que faltaban subrayadas).
export function diffView(input, expected, { ignoreCase = false } = {}) {
  const { given, want, errors } = diffChars(input, expected, { ignoreCase });
  const box = el("div", "diff");
  box.lang = "es";
  box.dir = "ltr";
  const line = (label, segs, cls) => {
    const p = el("p", "diff-line " + cls);
    p.append(txt("span", "diff-label", label, save.native));
    const text = el("span", "diff-text");
    for (const s of segs) text.append(s.k === "ok" ? document.createTextNode(s.t) : el("mark", "diff-" + s.k, s.t));
    p.append(text);
    return p;
  };
  box.append(line(ui("yourAnswer"), given, "given"), line(ui("rightAnswer"), want, "want"));
  // Qué tipo de fallo es cada uno, en el idioma de la persona.
  const list = el("ul", "diff-errors");
  for (const [type, n] of Object.entries(errors)) list.append(txt("li", "", ui("err_" + type, n), save.native));
  if (list.children.length) box.append(list);
  return box;
}
