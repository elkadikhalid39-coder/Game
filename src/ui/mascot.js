import { el } from "./dom.js";

// Estilo «Línea»: la app se orienta como la señalética del metro. En lugar de una mascota, pictogramas
// cuadrados con un color por significado (azul: información, verde: hecho, rojo: atención).
// mood: happy | talk | cheer | oops (los mismos nombres de antes, para no cambiar las llamadas) y brand (la «ñ» de la app)
const SIGN = { talk: ["info", "i"], happy: ["info", "→"], cheer: ["ok", "✓"], oops: ["warn", "!"], brand: ["info", "ñ"] };

export function mascot(mood = "happy", size = 88) {
  const [kind, glyph] = SIGN[mood] || SIGN.happy;
  const wrap = el("span", "mascot pictogram " + kind, glyph);
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.setProperty("--size", Math.round(size * 0.7) + "px");
  return wrap;
}

// Panel de indicación (como un cartel azul de información). content: texto o nodo; extra: nodo al final.
export function speech(content, mood = "talk", extra) {
  const row = el("div", "speech");
  const bubble = el("div", "bubble");
  if (typeof content === "string") bubble.append(el("span", "", content)); else bubble.append(content);
  if (extra) bubble.append(extra);
  const icon = el("span", "panel-icon", (SIGN[mood] || SIGN.talk)[1]);
  icon.setAttribute("aria-hidden", "true");
  row.append(icon, bubble);
  return row;
}
