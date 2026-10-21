// Modo adultos: camino de lecciones por unidades, repaso de errores y perfil.
const MAX_LIVES = 3;
// Cada unidad (mundo) tiene tres lecciones que se desbloquean en orden.
const LESSON_TYPES = [
  { type: "words", icon: "🔤", key: "lessonWords" },
  { type: "listen", icon: "🎧", key: "lessonListen" },
  { type: "phrases", icon: "💬", key: "lessonPhrases" },
];

const wordsOf = (world) => world.words.map(([id, emoji]) => ({ id, emoji, world }));
const worldOfWord = (id) => WORLDS.find((w) => w.words.some(([wid]) => wid === id));
const worldOfPhrase = (id) => WORLDS.find((w) => w.phrases.some(([pid]) => pid === id));
const doneIn = (world) => forTarget("progress")[world.id] || 0;

// ---------- Camino ----------
function showPath() {
  currentTab = "path";
  screen("main");
  const path = el("div", "path");
  let foundCurrent = false;
  WORLDS.forEach((w, wi) => {
    const banner = el("div", "unit");
    banner.style.setProperty("--unit", w.color);
    const text = el("div", "unit-text");
    text.append(el("span", "unit-kicker", ui("unit") + " " + (wi + 1)), txt("strong", "", tr("w_" + w.id, save.native), save.native));
    banner.append(text, el("span", "unit-emoji", w.emoji));
    path.append(banner);
    LESSON_TYPES.forEach((lt, li) => {
      const done = doneIn(w) > li;
      const current = !done && !foundCurrent;
      if (current) foundCurrent = true;
      const state = done ? "done" : current ? "current" : "locked";
      const node = el("div", "node-wrap " + state);
      node.style.setProperty("--x", [0, 1, 0][li] * (wi % 2 ? -1 : 1));
      const b = el("button", "node");
      b.type = "button";
      b.style.setProperty("--unit", w.color);
      b.append(el("span", "", state === "locked" ? "🔒" : done ? "✓" : lt.icon));
      b.setAttribute("aria-label", ui(lt.key) + (state === "locked" ? " 🔒" : ""));
      b.disabled = state === "locked";
      b.onclick = () => startLesson(w, li);
      if (current) node.append(el("span", "start-tag", ui("start")));
      node.append(b, el("span", "node-label", ui(lt.key)));
      path.append(node);
    });
  });
  app.append(path);
  // Baja hasta la lección que toca (después de que el navegador coloque la página).
  const current = app.querySelector(".node-wrap.current");
  if (current) requestAnimationFrame(() => current.scrollIntoView({ block: "center" }));
}

// ---------- Ejercicios ----------
function wordExercise(item, type) {
  const pool = wordsOf(item.world);
  const options = shuffle([item, ...pick(pool.filter((w) => w.id !== item.id), 3)]);
  return { type, item, options };
}
function phraseExercise(id) {
  const [, wrong] = worldOfPhrase(id).phrases.find(([pid]) => pid === id);
  return { type: "phrase", id, wrong };
}

function makeLesson(world, li) {
  const words = shuffle(wordsOf(world));
  if (LESSON_TYPES[li].type === "words") {
    // Tres palabras nuevas: primero se presentan y luego se practican.
    const fresh = words.slice(0, 3);
    const list = fresh.flatMap((w) => [{ type: "intro", item: w }, wordExercise(w, "see")]);
    return [...list, wordExercise(words[3], "see"), wordExercise(fresh[0], "hear")];
  }
  if (LESSON_TYPES[li].type === "listen") return words.slice(0, 7).map((w) => wordExercise(w, "hear")).concat(wordExercise(words[7] || words[0], "see"));
  const phrases = world.phrases.map(([id]) => phraseExercise(id));
  return shuffle([...phrases, ...phrases.map((p) => ({ ...p })), wordExercise(words[0], "see"), wordExercise(words[1], "hear")]);
}

function makeReview() {
  return pick(mistakesFor(), 8).map((m) => {
    if (m.k === "p") return phraseExercise(m.id);
    const w = worldOfWord(m.id);
    return wordExercise(wordsOf(w).find((x) => x.id === m.id), Math.random() < 0.5 ? "see" : "hear");
  });
}

function startLesson(world, li) {
  runLesson({ world, li, list: makeLesson(world, li), i: 0, lives: MAX_LIVES, correct: 0, graded: 0 });
}
function startReview() {
  const list = makeReview();
  if (list.length) runLesson({ review: true, list, i: 0, lives: MAX_LIVES, correct: 0, graded: 0 });
}

function noteResult(ex, ok) {
  const key = ex.type === "phrase" ? { k: "p", id: ex.id } : { k: "w", id: ex.item.id };
  const list = forTarget("mistakes");
  const at = list.findIndex((m) => m.k === key.k && m.id === key.id);
  if (!ok && at < 0) list.push(key);
  if (ok && at >= 0) list.splice(at, 1);
  if (ok && key.k === "w") { const l = forTarget("learned"); if (!l.includes(key.id)) l.push(key.id); }
}

// ---------- Lección ----------
function runLesson(s) {
  if (s.lives <= 0 || s.i >= s.list.length) return showResult(s);
  const ex = s.list[s.i];
  const N = save.native, G = save.target;
  screen("lesson");

  const head = el("div", "lesson-head");
  const bar = el("div", "progress");
  const fillBar = el("div");
  fillBar.style.width = (s.i / s.list.length) * 100 + "%";
  bar.append(fillBar);
  head.append(button("icon-btn", "✕", s.review ? showReview : showPath), bar, el("span", "hearts", "❤️ " + s.lives));
  app.append(head);
  const next = () => { s.i++; runLesson(s); };

  if (ex.type === "intro") {
    const card = el("div", "card intro");
    card.append(el("div", "bigemoji", ex.item.emoji), txt("div", "bigword", tr(ex.item.id, G), G));
    if (N !== G) card.append(txt("p", "hint", tr(ex.item.id, N), N));
    card.append(button("listen", "🔊", () => speak(tr(ex.item.id, G), G)));
    app.append(speech(ui("newWord"), "talk"), card, el("div", "footer-space"));
    const foot = el("div", "footer");
    foot.append(button("btn", ui("next"), next));
    app.append(foot);
    speak(tr(ex.item.id, G), G);
    return;
  }

  let answered = false;
  const area = el("div", "exercise");
  const answer = (btn, ok, solution, spoken) => {
    if (answered) return;
    answered = true;
    beep(ok);
    s.graded++;
    for (const b of area.querySelectorAll(".opt")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) { s.correct++; save.xp += 10; } else { s.lives--; btn.classList.add("wrong"); }
    noteResult(ex, ok);
    persist();
    speak(spoken, G);
    sheet(ok, ok ? ui("great") : ui("answer") + ":", ok ? "" : solution, G, next);
  };
  const addOption = (parent, label, lang, isOk, solution) => {
    const b = txt("button", "opt", label, lang);
    b.type = "button";
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(b, isOk, solution, solution);
    parent.append(b);
  };

  if (ex.type === "see") {
    // La palabra en el idioma de la persona (o el dibujo si es el mismo idioma); se elige en el que aprende.
    app.append(speech(ui("howSay"), "talk"));
    area.append(N === G ? el("div", "bigemoji", ex.item.emoji) : txt("div", "bigword", tr(ex.item.id, N), N));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, G), G, o === ex.item, tr(ex.item.id, G));
    area.append(opts);
  } else if (ex.type === "hear") {
    // Escucha en el idioma que aprende y elige el significado en el suyo.
    app.append(speech(ui("listen"), "talk"));
    area.append(button("listen big", "🔊", () => speak(tr(ex.item.id, G), G)));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, N), N, o === ex.item, tr(ex.item.id, G));
    area.append(opts);
    speak(tr(ex.item.id, G), G);
  } else {
    const q = "q_" + ex.id, a = "a_" + ex.id;
    app.append(speech(ui("chooseAnswer"), "talk"));
    const quote = el("div", "quote");
    quote.append(button("listen small", "🔊", () => speak(tr(q, G), G)), txt("span", "", tr(q, G), G));
    area.append(quote);
    if (N !== G) area.append(txt("p", "hint", tr(q, N), N));
    const opts = el("div", "options");
    for (const id of shuffle([a, ...ex.wrong.map((w) => "a_" + w)])) addOption(opts, tr(id, G), G, id === a, tr(a, G));
    area.append(opts);
    speak(tr(q, G), G);
  }
  app.append(area);
}

function showResult(s) {
  const won = s.lives > 0;
  const accuracy = s.graded ? Math.round((s.correct / s.graded) * 100) : 100;
  if (won) {
    touchStreak();
    save.xp += 20;
    if (!s.review) {
      const p = forTarget("progress");
      p[s.world.id] = Math.max(p[s.world.id] || 0, s.li + 1);
    }
    celebrate();
  }
  persist();
  screen("plain");
  const stats = el("div", "result-stats");
  const stat = (label, value, cls) => {
    const d = el("div", "result-stat " + cls);
    d.append(el("span", "", label), el("strong", "", value));
    return d;
  };
  stats.append(stat("⭐ " + ui("points"), "+" + (s.correct * 10 + (won ? 20 : 0)), "sun"),
    stat("🎯 " + ui("score"), accuracy + "%", "mint"),
    stat("🔥 " + ui("streak"), String(save.streak), "coral"));
  app.append(mascot(won ? "cheer" : "oops", 140),
    el("h1", "", won ? ui("done") : ui("retry")), stats,
    button("btn big", ui("next"), s.review ? showReview : showPath),
    ...(won ? [] : [button("btn ghost", ui("again"), () => (s.review ? startReview() : startLesson(s.world, s.li)))]));
}

// ---------- Repasar ----------
function showReview() {
  currentTab = "review";
  screen("main");
  const list = mistakesFor();
  app.append(el("h1", "", "🔁 " + ui("tabReview")));
  if (!list.length) {
    app.append(speech(ui("reviewEmpty"), "happy"));
    return;
  }
  app.append(speech(ui("reviewCount", list.length), "talk"));
  const chips = el("div", "chips");
  for (const m of list.slice(0, 30)) {
    const text = m.k === "p" ? tr("q_" + m.id, save.target) : tr(m.id, save.target);
    chips.append(txt("span", "chip-item", text, save.target));
  }
  app.append(chips, button("btn big", ui("reviewStart"), startReview));
}

// ---------- Perfil ----------
function showProfile() {
  currentTab = "profile";
  screen("main");
  const head = el("div", "profile-head");
  const names = el("div", "");
  names.append(txt("strong", "", I18N[save.native].name + " → " + I18N[save.target].name, save.native), el("span", "", ui("tagline")));
  head.append(mascot("happy", 84), names);
  const grid = el("div", "stats");
  const lessons = Object.values(forTarget("progress")).reduce((a, b) => a + b, 0);
  const tile = (icon, value, label, cls) => {
    const d = el("div", "stat-tile " + cls);
    d.append(el("span", "icon", icon), el("strong", "", String(value)), el("span", "", label));
    return d;
  };
  grid.append(tile("🔥", save.streak, ui("streak"), "coral"), tile("⭐", save.xp, ui("points"), "sun"),
    tile("📚", forTarget("learned").length, ui("wordsLearned"), "mint"), tile("✅", lessons + " / " + WORLDS.length * LESSON_TYPES.length, ui("lessonsDone"), "grape"));
  app.append(head, grid, el("h2", "section", "⚙️ " + ui("settings")), settingsCard());
}
