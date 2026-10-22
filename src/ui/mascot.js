import { el } from "./dom.js";

// La mascota: un bocadillo de diálogo con cara, porque la app va de hablar.
// mood: happy | talk | cheer | oops
export function mascot(mood = "happy", size = 88) {
  const ink = "#1d2b53";
  const eyes = mood === "cheer"
    ? `<path d="M35 45q7-8 14 0M59 45q7-8 14 0" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="42" cy="45" r="6.5" fill="${ink}"/><circle cx="66" cy="45" r="6.5" fill="${ink}"/>
       <circle cx="44.5" cy="42.5" r="2.2" fill="#fff"/><circle cx="68.5" cy="42.5" r="2.2" fill="#fff"/>`;
  const mouth = {
    oops: `<ellipse cx="54" cy="65" rx="6" ry="7" fill="${ink}"/>`,
    talk: `<path d="M43 60q11 14 22 0z" fill="${ink}"/><path d="M48 66q6 4 12 0" fill="#ff8a7a"/>`,
    cheer: `<path d="M40 58q14 18 28 0z" fill="${ink}"/>`,
  }[mood] || `<path d="M42 60q12 12 24 0" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const wrap = el("span", "mascot " + mood);
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `<svg viewBox="0 0 108 104" width="${size}" height="${size}">
    <path d="M54 7C27 7 9 23 9 45c0 14 7 25 18 32l-5 18 20-11c4 1 8 1.5 12 1.5 27 0 45-16 45-40S81 7 54 7z"
      fill="#ffc83d" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="31" cy="57" r="5.5" fill="#ff8a7a" opacity=".55"/><circle cx="77" cy="57" r="5.5" fill="#ff8a7a" opacity=".55"/>
    ${eyes}${mouth}</svg>`;
  return wrap;
}

// Mascota con globo de texto. content: texto o nodo; extra: nodo al final del globo (p. ej. botón de audio).
export function speech(content, mood = "talk", extra) {
  const row = el("div", "speech");
  const bubble = el("div", "bubble");
  if (typeof content === "string") bubble.append(el("span", "", content)); else bubble.append(content);
  if (extra) bubble.append(extra);
  row.append(mascot(mood, 76), bubble);
  return row;
}
