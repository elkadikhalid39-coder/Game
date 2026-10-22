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

// Compara lo escrito con lo correcto letra a letra (sin distinguir mayúsculas; una tilde distinta es un fallo).
// → { given: [{ t, k }], want: [{ t, k }] }
//   given: k = "ok" | "bad" (letra que sobra o es distinta)
//   want:  k = "ok" | "miss" (letra que falta o es distinta) | "soft" (signo o espacio que falta: no cuenta)
export function diffChars(input, expected) {
  const a = [...input.trim()], b = [...expected.trim()];
  const eq = (x, y) => x.toLowerCase() === y.toLowerCase();
  // Subsecuencia común más larga.
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) L[i][j] = eq(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const given = [], want = [];
  const push = (list, t, k) => {
    const last = list[list.length - 1];
    if (last && last.k === k) last.t += t; else list.push({ t, k });
  };
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && eq(a[i], b[j])) { push(given, a[i++], "ok"); push(want, b[j++], "ok"); }
    else if (j < b.length && (i >= a.length || L[i][j + 1] >= L[i + 1][j])) { push(want, b[j], isLetter(b[j]) ? "miss" : "soft"); j++; }
    else { push(given, a[i], isLetter(a[i]) ? "bad" : "ok"); i++; }
  }
  return { given, want };
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
