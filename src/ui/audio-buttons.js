// Botones de audio: escuchar y escuchar más despacio. Con icono dibujado y texto, sin emojis
// (una tortuga o un altavoz de colores no explican qué hace el botón).
import { ui } from "../core/i18n.js";
import { speak } from "../core/audio.js";
import { TARGET as G } from "../core/state.js";
import { el, button } from "./dom.js";

const SVG = "http://www.w3.org/2000/svg";
// Altavoz con ondas (onda doble en «escuchar», sencilla en «más despacio»).
function speakerIcon(waves = 2) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("speaker-icon");
  const d = ["M4 9h4l5-4v14l-5-4H4z", "M16 9.5a3.5 3.5 0 0 1 0 5", waves > 1 ? "M18.5 7a7 7 0 0 1 0 10" : ""];
  for (const p of d.filter(Boolean)) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", p);
    svg.append(path);
  }
  return svg;
}

// size: "big" (ejercicios de escuchar y dictado) o "small" (junto a una palabra o una frase).
export function audioControls(text, { size = "small", cls = "" } = {}) {
  const row = el("div", `audio-controls ${size} ${cls}`);
  const normal = button("audio-btn-play", "", () => speak(text, G));
  const slow = button("audio-btn-slow", "", () => speak(text, G, { slow: true }));
  if (size === "big") {
    normal.append(speakerIcon(2), el("span", "", ui("play")));
    slow.append(speakerIcon(1), el("span", "", ui("slow")));
  } else {
    normal.append(speakerIcon(2));
    normal.setAttribute("aria-label", ui("play"));
    slow.append(el("span", "", ui("slow")));
  }
  row.append(normal, slow);
  return row;
}

// Solo el botón de escuchar, con icono (filas del diccionario).
export function playButton(text, label) {
  const b = button("audio-btn-play icon", "", () => speak(text, G));
  b.append(speakerIcon(2));
  b.setAttribute("aria-label", label || ui("play"));
  return b;
}
