// Cronómetro de examen (cuenta atrás). Se para solo al cambiar de pantalla.
import { el } from "./dom.js";
import { screenId } from "./shell.js";

export function countdown(minutes, onEnd) {
  const box = el("span", "timer");
  const end = Date.now() + minutes * 60_000;
  const start = Date.now();
  const id = screenId;
  let stopped = false;
  const tick = () => {
    if (stopped || id !== screenId) return;
    const left = Math.max(0, end - Date.now());
    const m = Math.floor(left / 60_000), s = Math.floor((left % 60_000) / 1000);
    box.textContent = "⏱ " + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    box.classList.toggle("low", left < 5 * 60_000);
    if (left === 0) { stopped = true; onEnd?.(); return; }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
  return { el: box, stop: () => { stopped = true; }, elapsedMin: () => Math.round((Date.now() - start) / 60_000) };
}
