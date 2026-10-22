// Piezas de interfaz compartidas: creación de elementos, mascota, barras y panel de respuesta.
const app = document.getElementById("app");
const topbar = document.getElementById("topbar");
const tabbar = document.getElementById("tabbar");

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
// Texto en un idioma concreto: fija lang y dirección (árabe y urdu de derecha a izquierda).
function txt(tag, cls, text, lang) {
  const e = el(tag, cls, text);
  e.lang = lang;
  e.dir = dirOf(lang);
  return e;
}
function button(cls, label, onclick) {
  const b = el("button", cls, label);
  b.type = "button";
  b.onclick = onclick;
  return b;
}

// La mascota: un bocadillo de diálogo con cara, porque la app va de hablar.
// mood: happy | talk | cheer | oops
function mascot(mood = "happy", size = 88) {
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

// Mascota con globo de texto. content: texto o nodo.
function speech(content, mood = "talk", extra) {
  const row = el("div", "speech");
  const bubble = el("div", "bubble");
  if (typeof content === "string") bubble.append(el("span", "", content)); else bubble.append(content);
  if (extra) bubble.append(extra);
  row.append(mascot(mood, 76), bubble);
  return row;
}

// ---------- Pantalla ----------
// Cada cambio de pantalla incrementa screenId; así una acción con retraso sabe si sigue en la misma pantalla.
let screenId = 0;
// layout: "plain" (sin barras), "main" (barra superior + inferior en adultos), "lesson" (cabecera propia)
function screen(layout = "main", lang = save.native) {
  screenId++;
  document.querySelector(".sheet")?.remove();
  app.replaceChildren();
  app.dir = lang ? dirOf(lang) : "ltr";
  document.body.dataset.layout = layout;
  renderBars();
  window.scrollTo(0, 0);
}

function renderBars() {
  topbar.replaceChildren();
  tabbar.replaceChildren();
  document.body.classList.toggle("calm", save.calm);
  if (document.body.dataset.layout !== "main" || !save.native) return;
  const lang = button("chip lang", "", showProfile);
  lang.append(el("span", "code", save.native.toUpperCase()), txt("span", "", I18N[save.native].name, save.native));
  topbar.append(lang, el("span", "stat", "📚 " + forTarget("learned").length));
  const tab = (icon, key, fn, name) => {
    const b = button("tab" + (currentTab === name ? " active" : ""), "", fn);
    b.append(el("span", "icon", icon), el("span", "", ui(key)));
    return b;
  };
  const pending = mistakesFor().length;
  const review = tab("🔁", "tabReview", showReview, "review");
  if (pending) review.append(el("span", "badge", String(pending)));
  tabbar.append(tab("🗺️", "tabLearn", showPath, "path"), review, tab("👤", "tabProfile", showProfile, "profile"));
}
let currentTab = "path";

// Panel inferior con el resultado de una respuesta.
function sheet(ok, title, detail, detailLang, onContinue) {
  const s = el("div", "sheet " + (ok ? "ok" : "bad"));
  const inner = el("div", "sheet-inner");
  const head = el("div", "sheet-head");
  head.append(el("span", "sheet-icon", ok ? "✓" : "✕"), el("strong", "", title));
  inner.append(head);
  if (detail) inner.append(txt("p", "sheet-detail", detail, detailLang));
  const go = button("btn " + (ok ? "" : "danger"), ui("next"), () => { s.remove(); onContinue(); });
  inner.append(go);
  s.append(inner);
  s.dir = dirOf(save.native);
  document.body.append(s);
  go.focus();
}

// Lluvia de emojis al acertar (se omite en modo calma o con movimiento reducido).
function celebrate() {
  if (save.calm || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 14; i++) {
    const c = el("span", "confetti", pick(["⭐", "🎉", "✨", "🌟", "🎈"], 1)[0]);
    c.style.left = rand(5, 95) + "vw";
    c.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.append(c);
    setTimeout(() => c.remove(), 1600);
  }
}
