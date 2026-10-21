// Hola, Español — lógica del juego (sin dependencias).
const LESSON_LENGTH = 8;
const MAX_LIVES = 3;
const app = document.getElementById("app");

// ---------- Progreso guardado ----------
function loadSave() {
  try { return JSON.parse(localStorage.getItem("hola-espanol")) || {}; } catch { return {}; }
}
let save = Object.assign({ xp: 0, streak: 0, lastDay: "", stars: {} }, loadSave());
function persist() {
  try { localStorage.setItem("hola-espanol", JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
function today() { return new Date().toISOString().slice(0, 10); }
function touchStreak() {
  const t = today();
  if (save.lastDay === t) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  save.streak = save.lastDay === y ? save.streak + 1 : 1;
  save.lastDay = t;
}
function renderTopbar() {
  document.getElementById("streak").textContent = "🔥 " + save.streak;
  document.getElementById("xp").textContent = "⭐ " + save.xp;
}

// ---------- Utilidades ----------
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

let esVoice = null;
function pickVoice() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  esVoice = voices.find((v) => v.lang.toLowerCase().startsWith("es")) || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  if (esVoice) u.voice = esVoice;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

function beep(ok) {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 660 : 180;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* sin audio */ }
}

// ---------- Pantalla: mapa de mundos ----------
function showMap() {
  renderTopbar();
  app.replaceChildren();
  app.append(el("h1", "", "Hola, Español 🇪🇸"), el("p", "sub", "Elige un mundo y aprende jugando"));
  const map = el("div", "map");
  for (const w of WORLDS) {
    const b = el("button", "world");
    b.style.background = w.color;
    const stars = save.stars[w.id] || 0;
    b.append(el("span", "big", w.emoji), el("span", "", w.name),
      el("span", "stars", "★".repeat(stars) + "☆".repeat(3 - stars)));
    b.onclick = () => startLesson(w);
    map.append(b);
  }
  app.append(map);
}

// ---------- Generación de ejercicios ----------
function makeExercises(world) {
  const words = world.words;
  const others = (item) => shuffle(words.filter((w) => w !== item));
  const list = [];
  for (const w of shuffle(words)) {
    // 1. Mira el dibujo y elige la palabra
    list.push({ type: "see", item: w, options: shuffle([w, ...others(w).slice(0, 3)]) });
    // 2. Escucha y elige el dibujo
    list.push({ type: "hear", item: w, options: shuffle([w, ...others(w).slice(0, 3)]) });
  }
  for (const p of world.phrases) list.push({ type: "phrase", p });
  const pool = shuffle(list);
  // Lección corta: mezcla de palabras y al menos una frase si hay
  const phrases = pool.filter((e) => e.type === "phrase").slice(0, 2);
  const rest = pool.filter((e) => e.type !== "phrase").slice(0, LESSON_LENGTH - phrases.length);
  return shuffle([...rest, ...phrases]);
}

// ---------- Pantalla: lección ----------
function startLesson(world) {
  const state = { world, list: makeExercises(world), i: 0, lives: MAX_LIVES, correct: 0 };
  showExercise(state);
}

function showExercise(s) {
  renderTopbar();
  if (s.lives <= 0 || s.i >= s.list.length) return showResult(s);
  const ex = s.list[s.i];
  app.replaceChildren();

  const back = el("button", "back", "← Salir");
  back.onclick = showMap;
  const lives = el("div", "lives", "❤️".repeat(s.lives) + "🖤".repeat(MAX_LIVES - s.lives));
  const prog = el("div", "progress");
  const bar = el("div"); bar.style.width = (s.i / s.list.length) * 100 + "%";
  prog.append(bar);
  const card = el("div", "card");
  const feedback = el("div", "feedback");
  const next = el("button", "btn", "Seguir ➜");
  next.hidden = true;
  next.onclick = () => { s.i++; showExercise(s); };

  let answered = false;
  const answer = (btn, ok, correctText) => {
    if (answered) return;
    answered = true;
    beep(ok);
    for (const b of card.querySelectorAll(".opt")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) { s.correct++; save.xp += 10; feedback.textContent = "¡Muy bien! 🎉"; feedback.className = "feedback ok"; }
    else { s.lives--; btn.classList.add("wrong"); feedback.textContent = "Respuesta: " + correctText; feedback.className = "feedback bad"; }
    persist(); renderTopbar();
    next.hidden = false; next.focus();
  };

  const addOption = (parent, label, isOk, cls, correctText) => {
    const b = el("button", "opt " + (cls || ""), label);
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(b, isOk, correctText);
    parent.append(b);
  };

  if (ex.type === "see") {
    card.append(el("p", "prompt", "¿Cómo se dice?"), el("div", "bigemoji", ex.item.emoji));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, o.es, o === ex.item, "", ex.item.es);
    card.append(opts);
    speak(ex.item.es);
  } else if (ex.type === "hear") {
    card.append(el("p", "prompt", "Escucha y toca el dibujo"));
    const l = el("button", "listen", "🔊");
    l.onclick = () => speak(ex.item.es);
    card.append(l);
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, o.emoji, o === ex.item, "emoji", ex.item.es);
    card.append(opts);
    speak(ex.item.es);
  } else {
    const l = el("button", "listen small", "🔊");
    l.onclick = () => speak(ex.p.q);
    card.append(el("p", "prompt", "Elige la respuesta"), el("div", "bigword", ex.p.q), l);
    const opts = el("div", "options");
    for (const t of shuffle([ex.p.a, ...ex.p.wrong])) addOption(opts, t, t === ex.p.a, "", ex.p.a);
    card.append(opts);
    speak(ex.p.q);
  }

  card.append(feedback, next);
  app.append(back, lives, prog, card);
}

// ---------- Pantalla: resultado ----------
function showResult(s) {
  const won = s.lives > 0;
  const ratio = s.correct / s.list.length;
  const stars = !won ? 0 : ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
  if (won) {
    touchStreak();
    save.stars[s.world.id] = Math.max(save.stars[s.world.id] || 0, stars);
    save.xp += 20;
  }
  persist(); renderTopbar();

  app.replaceChildren();
  const card = el("div", "card result");
  card.append(
    el("div", "bigemoji", won ? "🏆" : "💪"),
    el("p", "prompt", won ? "¡Lección completada!" : "¡Casi! Inténtalo otra vez"),
    el("p", "", "★".repeat(stars) + "☆".repeat(3 - stars)),
    el("p", "", `Aciertos: ${s.correct} de ${s.list.length}`),
  );
  const again = el("button", "btn", "Jugar otra vez");
  again.onclick = () => startLesson(s.world);
  const home = el("button", "btn ghost", "Volver al mapa");
  home.onclick = showMap;
  app.append(card, again, home);
}

showMap();
