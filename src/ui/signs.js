// Señales de tráfico dibujadas para la app (SVG propio, sin imágenes de terceros).
// Códigos del catálogo oficial citados en el Reglamento General de Circulación (anexo I).
// Uso: signSvg("R-301:50") → velocidad máxima 50; signSvg("R-2") → STOP.
const NS = "http://www.w3.org/2000/svg";
const RED = "#c8102e", BLUE = "#0b4ea2", WHITE = "#fff", INK = "#111";

function make(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}
const text = (svg, x, y, size, value, fill = INK) =>
  (make("text", { x, y, "font-size": size, "font-family": "Arial, Helvetica, sans-serif", "font-weight": 700, "text-anchor": "middle", "dominant-baseline": "central", fill }, svg).textContent = value);

const DRAW = {
  // Ceda el paso: triángulo con el vértice hacia abajo, borde rojo.
  "R-1": (s) => {
    make("polygon", { points: "8,14 92,14 50,90", fill: RED, "stroke-linejoin": "round" }, s);
    make("polygon", { points: "24,23 76,23 50,70", fill: WHITE }, s);
  },
  // Detención obligatoria (STOP): octógono rojo.
  "R-2": (s) => {
    make("polygon", { points: "30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30", fill: RED, stroke: WHITE, "stroke-width": 3 }, s);
    text(s, 50, 51, 27, "STOP", WHITE);
  },
  // Entrada prohibida: círculo rojo con franja blanca horizontal.
  "R-101": (s) => {
    make("circle", { cx: 50, cy: 50, r: 46, fill: RED }, s);
    make("rect", { x: 18, y: 41, width: 64, height: 18, fill: WHITE }, s);
  },
  // Velocidad máxima: corona roja con la cifra.
  "R-301": (s, n) => {
    make("circle", { cx: 50, cy: 50, r: 46, fill: RED }, s);
    make("circle", { cx: 50, cy: 50, r: 35, fill: WHITE }, s);
    text(s, 50, 52, n.length > 2 ? 28 : 36, n);
  },
  // Velocidad mínima: círculo azul con la cifra en blanco.
  "R-411": (s, n) => {
    make("circle", { cx: 50, cy: 50, r: 46, fill: BLUE }, s);
    text(s, 50, 52, n.length > 2 ? 30 : 38, n, WHITE);
  },
  // Advertencia de peligro: triángulo con el vértice hacia arriba y borde rojo.
  P: (s) => {
    make("polygon", { points: "50,8 94,88 6,88", fill: RED, "stroke-linejoin": "round" }, s);
    make("polygon", { points: "50,26 79,78 21,78", fill: WHITE }, s);
    text(s, 50, 58, 34, "!");
  },
};

export const SIGN_CODES = Object.keys(DRAW);

export function signSvg(code, label = "") {
  const [id, value = ""] = code.split(":");
  const svg = make("svg", { viewBox: "0 0 100 100", class: "road-sign", role: "img" });
  if (label) svg.setAttribute("aria-label", label);
  DRAW[id](svg, value);
  return svg;
}
