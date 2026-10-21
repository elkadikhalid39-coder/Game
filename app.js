// Hola, Español — lógica del juego (sin dependencias).
const LESSON_LENGTH = 8;
const MAX_LIVES = 3;
const app = document.getElementById("app");

// ---------- Progreso guardado ----------
function loadSave() {
  try { return JSON.parse(localStorage.getItem("hola-espanol")) || {}; } catch { return {}; }
}
let save = Object.assign({ xp: 0, streak: 0, lastDay: "", stars: {}, native: "", target: "" }, loadSave());
const ui = (k) => UI[k][save.native] || UI[k].en;
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
document.getElementById("lang").onclick = showSetup;
function renderTopbar() {
  const l = document.getElementById("lang");
  l.textContent = save.native && save.target ? "🌐 " + save.native.toUpperCase() + "→" + save.target.toUpperCase() : "🌐";
  l.title = save.native ? ui("changeLang") : "Language";
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

// Texto en un idioma concreto: fija lang y dirección (árabe de derecha a izquierda).
function txt(tag, cls, text, lang) {
  const e = el(tag, cls, text);
  e.lang = lang;
  e.dir = LANGS[lang].dir || "ltr";
  return e;
}
function speak(text, lang) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].voice;
  const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(lang));
  if (v) u.voice = v;
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

// ---------- Pantalla: elegir idiomas ----------
function showSetup() {
  renderTopbar();
  app.dir = "ltr";
  app.replaceChildren();
  const sel = { native: save.native, target: save.target };
  app.append(el("h1", "", "Hola 👋 Hello"));
  app.append(el("p", "sub", "Elige tu idioma · Choose your language · اختر لغتك"));

  const go = el("button", "btn", "Empezar · Start");
  const group = (key, other, labelKey) => {
    const box = el("div", "card langs");
    const label = el("p", "prompt", Object.values(UI[labelKey]).join(" · "));
    label.dir = "ltr";
    box.append(label);
    const grid = el("div", "options two");
    box.append(grid);
    return { box, grid, key, other };
  };
  const g1 = group("native", "target", "iSpeak");
  const g2 = group("target", "native", "iLearn");
  const refresh = () => {
    for (const g of [g1, g2]) {
      for (const b of g.grid.children) {
        b.classList.toggle("selected", sel[g.key] === b.dataset.lang);
        b.disabled = sel[g.other] === b.dataset.lang;
      }
    }
    go.disabled = !(sel.native && sel.target);
    if (sel.native) go.textContent = UI.start[sel.native];
  };
  for (const g of [g1, g2]) {
    for (const code of Object.keys(LANGS)) {
      const b = txt("button", "opt", LANGS[code].name, code);
      b.dataset.lang = code;
      b.onclick = () => { sel[g.key] = code; refresh(); };
      g.grid.append(b);
    }
    app.append(g.box);
  }
  go.onclick = () => {
    save.native = sel.native; save.target = sel.target;
    persist(); showMap();
  };
  app.append(go);
  refresh();
}

// ---------- Pantalla: mapa de mundos ----------
function showMap() {
  if (!save.native || !save.target) return showSetup();
  renderTopbar();
  app.dir = LANGS[save.native].dir || "ltr";
  app.replaceChildren();
  app.append(el("h1", "", "Hola 👋 " + LANGS[save.target].name), el("p", "sub", ui("chooseWorld")));
  const map = el("div", "map");
  for (const w of WORLDS) {
    const b = el("button", "world");
    b.style.background = w.color;
    const stars = save.stars[save.target + ":" + w.id] || 0;
    b.append(el("span", "big", w.emoji), el("span", "", w.name[save.native]),
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
  app.dir = LANGS[save.native].dir || "ltr";
  app.replaceChildren();

  const N = save.native, G = save.target;
  const back = el("button", "back", ui("exit"));
  back.onclick = showMap;
  const lives = el("div", "lives", "❤️".repeat(s.lives) + "🖤".repeat(MAX_LIVES - s.lives));
  const prog = el("div", "progress");
  const bar = el("div"); bar.style.width = (s.i / s.list.length) * 100 + "%";
  prog.append(bar);
  const card = el("div", "card");
  const feedback = el("div", "feedback");
  const next = el("button", "btn", ui("next"));
  next.hidden = true;
  next.onclick = () => { s.i++; showExercise(s); };

  let answered = false;
  const answer = (btn, ok, correctText, correctLang, spoken) => {
    if (answered) return;
    answered = true;
    beep(ok);
    for (const b of card.querySelectorAll(".opt")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) { s.correct++; save.xp += 10; feedback.textContent = ui("great"); feedback.className = "feedback ok"; }
    else {
      s.lives--; btn.classList.add("wrong");
      feedback.textContent = ui("answer") + ": " + correctText; feedback.className = "feedback bad";
      feedback.lang = correctLang;
    }
    setTimeout(() => speak(spoken, G), 350);
    persist(); renderTopbar();
    next.hidden = false; next.focus();
  };

  // Una opción: label en el idioma `lang`.
  const addOption = (parent, label, lang, isOk, correctText, correctLang, spoken) => {
    const b = txt("button", "opt", label, lang);
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(b, isOk, correctText, correctLang, spoken);
    parent.append(b);
  };

  if (ex.type === "see") {
    // La persona ve la palabra en SU idioma y elige cómo se dice en el idioma que aprende.
    card.append(el("p", "prompt", ui("howSay")), txt("div", "bigword", ex.item.t[N], N));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, o.t[G], G, o === ex.item, ex.item.t[G], G, ex.item.t[G]);
    card.append(opts);
  } else if (ex.type === "hear") {
    // Escucha la palabra en el idioma que aprende y elige el significado en el suyo.
    card.append(el("p", "prompt", ui("listen")));
    const l = el("button", "listen", "🔊");
    l.onclick = () => speak(ex.item.t[G], G);
    card.append(l);
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, o.t[N], N, o === ex.item, ex.item.t[G], G, ex.item.t[G]);
    card.append(opts);
    speak(ex.item.t[G], G);
  } else {
    const l = el("button", "listen small", "🔊");
    l.onclick = () => speak(ex.p.q[G], G);
    card.append(el("p", "prompt", ui("chooseAnswer")), txt("div", "bigword", ex.p.q[G], G), l,
      txt("p", "hint", ex.p.q[N], N));
    const opts = el("div", "options");
    for (const t of shuffle([ex.p.a, ...ex.p.wrong])) addOption(opts, t[G], G, t === ex.p.a, ex.p.a[G], G, ex.p.a[G]);
    card.append(opts);
    speak(ex.p.q[G], G);
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
    const key = save.target + ":" + s.world.id;
    save.stars[key] = Math.max(save.stars[key] || 0, stars);
    save.xp += 20;
  }
  persist(); renderTopbar();

  app.replaceChildren();
  app.dir = LANGS[save.native].dir || "ltr";
  const card = el("div", "card result");
  card.append(
    el("div", "bigemoji", won ? "🏆" : "💪"),
    el("p", "prompt", won ? ui("done") : ui("retry")),
    el("p", "", "★".repeat(stars) + "☆".repeat(3 - stars)),
    el("p", "", `${ui("score")}: ${s.correct} / ${s.list.length}`),
  );
  const again = el("button", "btn", ui("again"));
  again.onclick = () => startLesson(s.world);
  const home = el("button", "btn ghost", ui("toMap"));
  home.onclick = showMap;
  app.append(card, again, home);
}

showMap();
