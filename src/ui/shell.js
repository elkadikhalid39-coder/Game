// Marco de la app: cambio de pantalla, barras superior e inferior, panel de respuesta y celebración.
import { I18N, ui, dirOf } from "../core/i18n.js";
import { save } from "../core/state.js";
import { stopAudio } from "../core/audio.js";
import { go } from "../core/router.js";
import { el, txt, button } from "./dom.js";

export const app = document.getElementById("app");
const topbar = document.getElementById("topbar");
const tabbar = document.getElementById("tabbar");

// Pestañas de la barra inferior: [nombre de ruta, icono, texto].
const TABS = [["path", "🗺️", "tabLearn"], ["exams", "🎓", "tabExams"], ["review", "✍️", "tabPractice"], ["profile", "👤", "tabProfile"]];
let currentTab = "path";
export const setTab = (name) => { currentTab = name; };

// Cada cambio de pantalla incrementa screenId; así una acción con retraso sabe si sigue en la misma pantalla.
export let screenId = 0;

// Protección contra toques que «atraviesan» a la pantalla nueva: el botón «Continuar» o «Saltar» de la
// pantalla siguiente suele aparecer justo debajo del dedo. No cuenta un clic que:
//   - viene de un toque que empezó antes del cambio (el mismo toque, repetido por el navegador);
//   - es un segundo toque con el dedo muy seguido (menos de 0,35 s después del cambio);
//   - lo genera el teclado (Intro) justo después del cambio, como el «Enviar» del teclado del móvil.
let changedAt = 0, downAt = 0, downType = "";
const markChange = () => { changedAt = performance.now(); };
document.addEventListener("pointerdown", (e) => { downAt = performance.now(); downType = e.pointerType; }, true);
document.addEventListener("click", (e) => {
  if (!e.isTrusted || !changedAt) return;
  const since = performance.now() - changedAt;
  const fromKeyboard = e.detail === 0;
  const stale = !fromKeyboard && downAt < changedAt && since < 1000;
  const tooSoon = (fromKeyboard || downType === "touch") && since < 350;
  if (stale || tooSoon) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
// layout: "plain" (sin barras), "main" (barras superior e inferior), "lesson" (cabecera propia)
export function screen(layout = "main", lang = save.native) {
  screenId++;
  markChange();
  stopAudio(); // al cambiar de pantalla se corta el audio que estuviera sonando
  document.querySelector(".sheet")?.remove();
  document.body.classList.remove("tramite"); // cada pantalla de examen lo vuelve a poner (ver tscreen en exams/common.js)
  app.replaceChildren();
  app.dir = lang ? dirOf(lang) : "ltr";
  document.body.dataset.layout = layout;
  renderBars();
  window.scrollTo(0, 0);
}

export function renderBars() {
  topbar.replaceChildren();
  tabbar.replaceChildren();
  document.body.classList.toggle("calm", save.calm);
  if (document.body.dataset.layout !== "main" || !save.native) return;
  const lang = button("chip lang", "", () => go("profile"));
  lang.append(el("span", "code", save.native.toUpperCase()), txt("span", "", I18N[save.native].name, save.native));
  topbar.append(lang);
  // Aviso visible de que es una demo con todo abierto.
  if (save.demo) topbar.append(el("span", "pill demo", ui("demoTag")));
  topbar.append(el("span", "stat", "📚 " + save.learned.length));
  for (const [name, icon, key] of TABS) {
    const b = button("tab" + (currentTab === name ? " active" : ""), "", () => go(name));
    b.dataset.tab = name;
    b.append(el("span", "icon", icon), el("span", "", ui(key)));
    if (name === "review" && save.mistakes.length) b.append(el("span", "badge", String(save.mistakes.length)));
    tabbar.append(b);
  }
}

// Panel inferior con el resultado de una respuesta.
export function sheet(ok, title, detail, detailLang, onContinue, extra) {
  const s = el("div", "sheet " + (ok ? "ok" : "bad"));
  const inner = el("div", "sheet-inner");
  const head = el("div", "sheet-head");
  head.append(el("span", "sheet-icon", ok ? "✓" : "✕"), el("strong", "", title));
  inner.append(head);
  if (detail) inner.append(txt("p", "sheet-detail", detail, detailLang));
  if (extra) inner.append(extra);
  const next = button("btn " + (ok ? "" : "danger"), ui("next"), () => { s.remove(); onContinue(); });
  inner.append(next);
  s.append(inner);
  s.dir = dirOf(save.native);
  document.body.append(s);
  markChange();
  next.focus({ preventScroll: true });
}

// Lluvia de emojis al terminar (se omite en modo calma o con movimiento reducido).
export function celebrate() {
  if (document.body.classList.contains("tramite") || save.calm || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // «Llegada»: una franja verde recorre la parte de arriba, como el tren que entra en la estación.
  const bar = el("span", "arrive");
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);
  setTimeout(() => bar.remove(), 1300);
}
