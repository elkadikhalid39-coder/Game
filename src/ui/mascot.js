import { el } from "./dom.js";

// Identidad de la app: el sello. Quien llega a un país nuevo junta sellos y papeles; aquí cada logro
// es un sello de tinta (como los de un pasaporte), no un personaje.
// mood: happy | talk | cheer | oops (cambia el símbolo del centro y el color de la tinta)
export function mascot(mood = "happy", size = 88) {
  const ink = { cheer: "#b4441f", oops: "#5b6668", happy: "#1f5f66", talk: "#1f5f66" }[mood] || "#1f5f66";
  const center = {
    cheer: `<path d="M38 55l11 11 23-26" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    oops: `<path d="M42 44a16 16 0 1 1-2 18" stroke="${ink}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M34 38l6 8 9-5" stroke="${ink}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  }[mood] || `<path d="M54 34l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill="${ink}"/>`;
  const wrap = el("span", "mascot stamp " + mood);
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `<svg viewBox="0 0 108 108" width="${size}" height="${size}">
    <defs><path id="stamp-ring" d="M54 54m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0"/></defs>
    <circle cx="54" cy="54" r="49" fill="none" stroke="${ink}" stroke-width="4"/>
    <circle cx="54" cy="54" r="42" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text font-family="Lexend, sans-serif" font-size="8.5" font-weight="700" fill="${ink}">
      <textPath href="#stamp-ring" textLength="222" lengthAdjust="spacing">HOLA · ESPAÑOL · HOLA · ESPAÑOL ·</textPath></text>
    <circle cx="54" cy="54" r="27" fill="none" stroke="${ink}" stroke-width="2"/>
    ${center}</svg>`;
  return wrap;
}

// Indicación del ejercicio: una nota con borde de color (sin personaje que hable).
// content: texto o nodo; extra: nodo al final (p. ej. botón de audio). mood se ignora (compatibilidad).
export function speech(content, mood = "talk", extra) {
  const row = el("div", "speech");
  const bubble = el("div", "bubble");
  if (typeof content === "string") bubble.append(el("span", "", content)); else bubble.append(content);
  if (extra) bubble.append(extra);
  row.append(bubble);
  return row;
}
