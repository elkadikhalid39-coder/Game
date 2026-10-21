// Modo adultos: mundos con vocabulario y frases, vidas y estrellas.
const LESSON_LENGTH = 8;
const MAX_LIVES = 3;

const wordsOf = (world) => world.words.map(([id, emoji]) => ({ id, emoji }));

function showMap() {
  renderTopbar();
  screen();
  app.append(el("h1", "", "👋 " + I18N[save.target].name), el("p", "sub", ui("chooseWorld")));
  const map = el("div", "map");
  for (const w of WORLDS) {
    const b = el("button", "world");
    b.style.background = w.color;
    const stars = save.stars[save.target + ":" + w.id] || 0;
    b.append(el("span", "big", w.emoji), txt("span", "", tr("w_" + w.id, save.native), save.native),
      el("span", "stars", "★".repeat(stars) + "☆".repeat(3 - stars)));
    b.onclick = () => startLesson(w);
    map.append(b);
  }
  app.append(map);
}

function makeExercises(world) {
  const words = wordsOf(world);
  const others = (item) => pick(words.filter((w) => w.id !== item.id), 3);
  const list = [];
  for (const w of shuffle(words)) {
    list.push({ type: "see", item: w, options: shuffle([w, ...others(w)]) });
    list.push({ type: "hear", item: w, options: shuffle([w, ...others(w)]) });
  }
  const phrases = pick(world.phrases, 2).map(([id, wrong]) => ({ type: "phrase", id, wrong }));
  const rest = shuffle(list).slice(0, LESSON_LENGTH - phrases.length);
  return shuffle([...rest, ...phrases]);
}

function startLesson(world) {
  showExercise({ world, list: makeExercises(world), i: 0, lives: MAX_LIVES, correct: 0 });
}

function showExercise(s) {
  renderTopbar();
  if (s.lives <= 0 || s.i >= s.list.length) return showResult(s);
  const ex = s.list[s.i];
  const N = save.native, G = save.target;
  screen();

  const lives = el("div", "lives", "❤️".repeat(s.lives) + "🖤".repeat(MAX_LIVES - s.lives));
  const prog = el("div", "progress");
  const bar = el("div"); bar.style.width = (s.i / s.list.length) * 100 + "%";
  prog.append(bar);
  const card = el("div", "card");
  const feedback = el("div", "feedback");
  const next = button("btn", ui("next") + " ➜", () => { s.i++; showExercise(s); });
  next.hidden = true;

  let answered = false;
  const answer = (btn, ok, correctText, spoken) => {
    if (answered) return;
    answered = true;
    beep(ok);
    for (const b of card.querySelectorAll(".opt")) {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    }
    if (ok) { s.correct++; save.xp += 10; feedback.textContent = ui("great") + " 🎉"; feedback.className = "feedback ok"; }
    else {
      s.lives--; btn.classList.add("wrong");
      feedback.textContent = ui("answer") + ": " + correctText; feedback.className = "feedback bad";
    }
    setTimeout(() => speak(spoken, G), 350);
    persist(); renderTopbar();
    next.hidden = false; next.focus();
  };
  const addOption = (parent, label, lang, isOk, correctText, spoken) => {
    const b = txt("button", "opt", label, lang);
    b.dataset.ok = isOk ? "1" : "0";
    b.onclick = () => answer(b, isOk, correctText, spoken);
    parent.append(b);
  };

  if (ex.type === "see") {
    // La palabra en el idioma de la persona; elige cómo se dice en el idioma que aprende.
    // Si habla el mismo idioma que aprende, se muestra el dibujo en lugar de la palabra.
    card.append(el("p", "prompt", ui("howSay")), N === G ? el("div", "bigemoji", ex.item.emoji) : txt("div", "bigword", tr(ex.item.id, N), N));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, G), G, o === ex.item, tr(ex.item.id, G), tr(ex.item.id, G));
    card.append(opts);
  } else if (ex.type === "hear") {
    // Escucha en el idioma que aprende y elige el significado en el suyo.
    card.append(el("p", "prompt", ui("listen")), button("listen", "🔊", () => speak(tr(ex.item.id, G), G)));
    const opts = el("div", "options two");
    for (const o of ex.options) addOption(opts, tr(o.id, N), N, o === ex.item, tr(ex.item.id, G), tr(ex.item.id, G));
    card.append(opts);
    speak(tr(ex.item.id, G), G);
  } else {
    const q = "q_" + ex.id, a = "a_" + ex.id;
    card.append(el("p", "prompt", ui("chooseAnswer")), txt("div", "bigword", tr(q, G), G),
      button("listen small", "🔊", () => speak(tr(q, G), G)));
    if (N !== G) card.append(txt("p", "hint", tr(q, N), N));
    const opts = el("div", "options");
    for (const id of shuffle([a, ...ex.wrong.map((w) => "a_" + w)])) addOption(opts, tr(id, G), G, id === a, tr(a, G), tr(a, G));
    card.append(opts);
    speak(tr(q, G), G);
  }

  card.append(feedback, next);
  app.append(button("back", "← " + ui("exit"), showMap), lives, prog, card);
}

function showResult(s) {
  const won = s.lives > 0;
  const ratio = s.correct / s.list.length;
  const stars = !won ? 0 : ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
  if (won) {
    touchStreak();
    const key = save.target + ":" + s.world.id;
    save.stars[key] = Math.max(save.stars[key] || 0, stars);
    save.xp += 20;
    celebrate();
  }
  persist(); renderTopbar();
  screen();
  const card = el("div", "card result");
  card.append(
    el("div", "bigemoji", won ? "🏆" : "💪"),
    el("p", "prompt", won ? ui("done") : ui("retry")),
    el("p", "", "★".repeat(stars) + "☆".repeat(3 - stars)),
    el("p", "", `${ui("score")}: ${s.correct} / ${s.list.length}`),
  );
  app.append(card, button("btn", ui("again"), () => startLesson(s.world)), button("btn ghost", ui("toMap"), showMap));
}
