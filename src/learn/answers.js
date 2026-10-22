// Corrección de respuestas escritas en español: acepta pequeños errores e indica la forma correcta.

// Minúsculas, sin signos de puntuación, espacios simples y sin artículo inicial (el, la, un…).
export function normalize(s, { accents = true } = {}) {
  let out = s.toLowerCase().replace(/[¿?¡!.,;:"'«»()]/g, " ").replace(/\s+/g, " ").trim();
  out = out.replace(/^(el|la|los|las|un|una|unos|unas) /, "");
  // Sin tildes, pero la ñ es una letra distinta y se conserva.
  if (!accents) out = out.replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ");
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

// → { ok, note }: note = null (perfecto) | "accent" (solo faltan o sobran tildes) | "typo" (una letra de diferencia).
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
