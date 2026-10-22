// Corrección de respuestas escritas en español: acepta pequeños errores e indica la forma correcta.

// Minúsculas, sin signos de puntuación, espacios simples y sin artículo inicial (el, la, un…).
export function normalize(s, { accents = true } = {}) {
  let out = s.toLowerCase().replace(/[¿?¡!.,;:"'«»()]/g, " ").replace(/\s+/g, " ").trim();
  out = out.replace(/^(el|la|los|las|un|una|unos|unas) /, "");
  // Sin tildes ni virgulilla (ñ → n): muchos teclados (árabe, chino, ruso…) no tienen esas letras.
  // Se acepta, pero la corrección enseña siempre la forma correcta.
  if (!accents) out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return out;
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// → { ok, note }: note = null (perfecto) | "accent" (solo faltan o sobran tildes o la ñ) | "typo" (una letra de diferencia).
export function checkWritten(input, expected) {
  const given = normalize(input), want = normalize(expected);
  if (!given) return { ok: false, note: null };
  if (given === want) return { ok: true, note: null };
  const g = normalize(input, { accents: false }), w = normalize(expected, { accents: false });
  if (g === w) return { ok: true, note: "accent" };
  // Una errata en una palabra de 5 letras o más se acepta, avisando de cómo se escribe.
  if (w.length >= 5 && distance(g, w) === 1) return { ok: true, note: "typo" };
  return { ok: false, note: null };
}

// Frase ordenada por fichas: se compara sin mayúsculas ni signos.
export const sameSentence = (a, b) => normalize(a, { accents: true }) === normalize(b, { accents: true });

// ---------- Corrección de dictados: dónde están los fallos ----------
const isLetter = (c) => /[\p{L}\p{N}]/u.test(c);

const isSpace = (c) => /\s/.test(c);
const base = (c) => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Compara lo escrito con lo correcto carácter a carácter (alineación de Levenshtein) y clasifica cada fallo.
// → { given: [{ t, k }], want: [{ t, k }], errors: { [tipo]: número } }
//   k en given: ok | bad (sobra o está cambiado) | case (solo cambia la mayúscula)
//   k en want:  ok | miss (falta o estaba cambiado) | case
//   tipos: letter (letra cambiada), accent (tilde o ñ), extraLetter, missingLetter, extraSpace, missingSpace,
//          case (mayúscula), punct (signo de puntuación que sobra o falta)
// Los espacios que sobran o faltan se muestran como «␣» para que se vean.
// ignoreCase: no cuenta las mayúsculas (palabras sueltas: «por favor» y «Por favor» están bien).
export function diffChars(input, expected, { ignoreCase = false } = {}) {
  const a = [...input.trim()], b = [...expected.trim()];
  // Coste: igual = 0; solo mayúscula = 0,1; tilde = 0,5; resto = 1.
  const cost = (x, y) => (x === y ? 0 : x.toLowerCase() === y.toLowerCase() ? 0.1 : base(x) === base(y) ? 0.5 : 1);
  const D = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) D[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost(a[i - 1], b[j - 1]));
  const ops = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + cost(a[i - 1], b[j - 1])) { ops.push(["sub", a[--i], b[--j]]); }
    else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push(["extra", a[--i], null]); }
    else { ops.push(["missing", null, b[--j]]); }
  }
  ops.reverse();
  const given = [], want = [], errors = {};
  const push = (list, t, k) => {
    const last = list[list.length - 1];
    if (last && last.k === k) last.t += t; else list.push({ t, k });
  };
  const err = (type) => { errors[type] = (errors[type] || 0) + 1; };
  for (const [op, x, y] of ops) {
    if (op === "sub") {
      if (x === y) { push(given, x, "ok"); push(want, y, "ok"); }
      else if (x.toLowerCase() === y.toLowerCase()) {
        if (ignoreCase) { push(given, x, "ok"); push(want, y, "ok"); }
        else { push(given, x, "case"); push(want, y, "case"); err("case"); }
      }
      else { push(given, x, "bad"); push(want, y, "miss"); err(base(x) === base(y) ? "accent" : isLetter(x) && isLetter(y) ? "letter" : "punct"); }
    } else if (op === "extra") {
      push(given, isSpace(x) ? "␣" : x, "bad");
      err(isSpace(x) ? "extraSpace" : isLetter(x) ? "extraLetter" : "punct");
    } else {
      push(want, isSpace(y) ? "␣" : y, "miss");
      err(isSpace(y) ? "missingSpace" : isLetter(y) ? "missingLetter" : "punct");
    }
  }
  return { given, want, errors };
}

// Número de palabras mal escritas, que faltan o que sobran (sin mayúsculas ni signos).
// accents: false → tampoco cuentan las tildes ni la ñ (para quien no las tiene en el teclado).
export function wordErrors(input, expected, { accents = true } = {}) {
  const fold = (s) => (accents ? s : s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const words = (s) => fold(s.toLowerCase()).replace(/[¿?¡!.,;:"'«»()]/g, " ").split(/\s+/).filter(Boolean);
  const a = words(input), b = words(expected);
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  // Una palabra cambiada cuenta como un error, no como «falta una y sobra otra».
  return Math.max(a.length, b.length) - L[0][0];
}
