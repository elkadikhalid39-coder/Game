// Modo niños. Pensado también para niños con dificultades de aprendizaje:
// sin vidas ni tiempo, pocas opciones, todo se escucha, el error no castiga y la respuesta se señala tras dos intentos.
const ageInfo = () => AGES.find((a) => a.id === save.age) || AGES[0];

function unitAvailable(u) {
  if (!u.ages.includes(save.age)) return false;
  if (u.only && save.target !== u.only) return false;
  if (u.script && I18N[save.target].script !== u.script) return false;
  return true;
}

const SUBJECTS = [["lang", "🔤", "subjLang"], ["num", "🔢", "subjNum"], ["world", "🌍", "subjWorld"]];

function showKidsHome() {
  screen("main");
  const hello = el("span", "");
  hello.append(el("span", "", ui("kidsHello")), el("span", "age-chip", ageInfo().emoji + " " + save.age.replace("-", "–") + " " + ui("years")));
  app.append(speech(hello, "happy"));
  for (const [subj, icon, key] of SUBJECTS) {
    const units = KID_UNITS.filter((u) => u.subj === subj && unitAvailable(u));
    if (!units.length) continue;
    const section = el("section", "subject " + subj);
    section.append(el("h2", "", icon + " " + ui(key)));
    const grid = el("div", "tiles");
    for (const u of units) {
      const b = el("button", "tile");
      b.type = "button";
      b.append(el("span", "big", u.icon), el("span", "", ui("u_" + u.id)));
      b.onclick = () => startUnit(u);
      grid.append(b);
    }
    section.append(grid);
    app.append(section);
  }
  const album = button("album-card", "", showAlbum);
  album.append(el("span", "big", "📒"), el("strong", "", ui("stickers")),
    el("span", "album-preview", save.stickers.slice(-5).join(" ") || "❔ ❔ ❔"));
  app.append(album);
}

// Álbum: cada pegatina distinta conseguida; las que faltan, en silueta.
function showAlbum() {
  screen("main");
  const have = new Set(save.stickers);
  app.append(speech(ui("stickers") + " · " + have.size + " / " + STICKERS.length, "cheer"));
  const grid = el("div", "album-grid");
  for (const s of STICKERS) grid.append(el("span", have.has(s) ? "slot-sticker" : "slot-sticker empty", have.has(s) ? s : "?"));
  app.append(grid, button("btn ghost", "🏠 " + ui("back"), showKidsHome));
}

// ---------- Construcción de una sesión ----------
const vocabItem = ([id, emoji]) => ({ id, emoji, word: tr(id, save.target), native: tr(id, save.native) });
const letterItem = (L) => {
  const [, word, emoji] = ES_LETTERS.find((x) => x[0] === L);
  return { letter: L, word, emoji };
};
const numWord = (n) => tr("n" + n, save.target);
function numberOptions(n, max, count) {
  const set = new Set([n]);
  for (const d of shuffle([-2, -1, 1, 2, 3])) if (set.size < count && n + d >= 1 && n + d <= max) set.add(n + d);
  while (set.size < count) set.add(rand(1, max));
  return shuffle([...set]);
}
function choicesFrom(item, pool, key) {
  return shuffle([item, ...pick(pool.filter((p) => p[key] !== item[key]), ageInfo().choices - 1)]);
}

function startUnit(u) {
  const len = ageInfo().length;
  let items = [], ex = [];
  if (u.kind === "vocab" || u.kind === "read") {
    const pool = (u.kind === "read" ? Object.values(KID_WORDS).flat() : KID_WORDS[u.set]).map(vocabItem);
    items = pick(pool, save.age === "1-3" ? 3 : 4);
    ex = Array.from({ length: len }, (_, i) => {
      const item = items[i % items.length];
      return { kind: u.kind === "read" ? "read" : "find", item, options: choicesFrom(item, pool, "id") };
    });
  } else if (u.kind === "letters") {
    const pool = [...u.letters].map(letterItem);
    items = pick(pool, Math.min(pool.length, 4));
    ex = Array.from({ length: len }, (_, i) => {
      const item = items[i % items.length];
      return { kind: "starts", item, options: choicesFrom(item, pool, "letter") };
    });
  } else if (u.kind === "trace") {
    items = pick([...u.letters], 3).map((letter) => ({ letter }));
    ex = items.map((item) => ({ kind: "trace", item }));
  } else if (u.kind === "count") {
    const max = save.age === "3-5" ? 5 : 10;
    items = pick([...Array(max).keys()].map((k) => k + 1), 3).sort((a, b) => a - b).map((n) => ({ n, emoji: pick(COUNT_ITEMS, 1)[0] }));
    ex = Array.from({ length: len }, () => {
      const n = rand(1, max);
      return { kind: "count", item: { n, emoji: pick(COUNT_ITEMS, 1)[0] }, nums: numberOptions(n, max, ageInfo().choices) };
    });
  } else if (u.kind === "syllables") {
    items = pick(ES_SYLLABLES, 4).map(([syl, emoji]) => ({ syl, emoji, word: syl.join("") }));
    ex = items.map((item) => ({ kind: "build", item }));
  } else if (u.kind === "sum") {
    items = [{ a: 2, b: 1, emoji: "🍎" }];
    ex = Array.from({ length: len }, () => {
      const a = rand(1, 5), b = rand(1, Math.min(5, 10 - a));
      return { kind: "sum", item: { a, b, emoji: pick(COUNT_ITEMS, 1)[0] }, nums: numberOptions(a + b, 10, ageInfo().choices) };
    });
  }
  showLearn({ u, items, ex, i: 0 }, 0);
}

// ---------- Aprende: tarjetas con dibujo, palabra y sonido ----------
function learnCard(u, item) {
  const G = save.target, N = save.native, nodes = [];
  let say = [];
  if (u.kind === "vocab" || u.kind === "read") {
    nodes.push(el("div", "bigemoji", item.emoji), txt("div", "bigword", item.word, G));
    if (N !== G) nodes.push(txt("p", "hint", item.native, N));
    say = [[item.word, G]];
  } else if (u.kind === "letters") {
    nodes.push(el("div", "bigletter", item.letter + " " + item.letter.toLowerCase()),
      el("div", "bigemoji", item.emoji), txt("div", "bigword", item.letter + " → " + item.word, "es"));
    say = [[item.letter, "es"], [item.word, "es"]];
  } else if (u.kind === "trace") {
    nodes.push(el("div", "bigletter outline", item.letter));
    say = [[item.letter, G]];
  } else if (u.kind === "count") {
    nodes.push(el("div", "group", item.emoji.repeat(item.n)), el("div", "bigletter", String(item.n)), txt("div", "bigword", numWord(item.n), G));
    say = [[numWord(item.n), G]];
  } else if (u.kind === "syllables") {
    nodes.push(el("div", "bigemoji", item.emoji), txt("div", "bigword", item.syl.join(" · "), "es"));
    say = [...item.syl.map((s) => [s, "es"]), [item.word, "es"]];
  } else if (u.kind === "sum") {
    const { a, b, emoji } = item;
    nodes.push(el("div", "group", emoji.repeat(a) + " + " + emoji.repeat(b)), el("div", "bigletter", `${a} + ${b} = ${a + b}`),
      el("div", "group", emoji.repeat(a + b)));
    say = [[`${numWord(a)} ${uiT("plus")} ${numWord(b)}`, G], [numWord(a + b), G]];
  }
  return { nodes, say };
}

function showLearn(st, k) {
  screen("main");
  const { nodes, say } = learnCard(st.u, st.items[k]);
  const card = el("div", "card kid learn");
  const visual = el("button", "visual");
  visual.append(...nodes);
  visual.onclick = () => speak(say);
  const nav = el("div", "nav");
  if (k > 0) nav.append(button("btn ghost-dark", "◀", () => showLearn(st, k - 1))); else nav.classList.add("single");
  nav.append(k < st.items.length - 1
    ? button("btn", "▶", () => showLearn(st, k + 1))
    : button("btn", "▶ " + ui("play"), () => showKidExercise(st)));
  card.append(visual, nav);
  app.append(speech("👀 " + ui("learn") + " · " + (k + 1) + "/" + st.items.length, "talk"), card);
  speak(say);
}

// ---------- Juega ----------
function showKidExercise(st) {
  if (st.i >= st.ex.length) return showKidReward(st);
  const ex = st.ex[st.i], item = ex.item, G = save.target;
  screen("main");

  const dots = el("div", "dots");
  st.ex.forEach((_, k) => dots.append(el("span", k < st.i ? "done" : k === st.i ? "now" : "")));
  const card = el("div", "card kid");
  const prompt = el("span", "");
  let say = [];
  const repeat = button("listen small", "🔊", () => speak(say));
  const talk = speech(prompt, "talk", repeat);
  // La mascota reacciona: celebra al acertar y pone cara de sorpresa al fallar.
  const react = (mood) => talk.querySelector(".mascot").replaceWith(mascot(mood, 76));

  let tries = 0, finished = false;
  const success = (spoken) => {
    if (finished) return;
    finished = true;
    beep(true);
    react("cheer");
    celebrate();
    st.i++;
    const id = screenId;
    speak([...spoken, [uiT("great"), G]]).then(() => { if (id === screenId) showKidExercise(st); });
  };
  const miss = (btn, hintBtn) => {
    tries++;
    beep(false);
    react("oops");
    btn.classList.remove("shake");
    void btn.offsetWidth;
    btn.classList.add("shake");
    speak(uiT("tryAgain"), G);
    if (tries >= 2 && hintBtn) hintBtn.classList.add("pulse");
  };
  // Opciones de respuesta: una incorrecta se desactiva para que quede una opción menos.
  const optionGrid = (opts, label, isOk, onOk, cls = "pic") => {
    const grid = el("div", "options cols-" + opts.length);
    const buttons = opts.map((o) => {
      const b = el("button", "opt " + cls);
      b.type = "button";
      const l = label(o);
      if (typeof l === "string") b.textContent = l; else b.append(l);
      b.dataset.ok = isOk(o) ? "1" : "0";
      return b;
    });
    const right = buttons.find((b) => b.dataset.ok === "1");
    buttons.forEach((b, j) => {
      b.onclick = () => {
        if (finished) return;
        if (b === right) { b.classList.add("correct"); onOk(opts[j]); } else { b.disabled = true; miss(b, right); }
      };
      grid.append(b);
    });
    return grid;
  };

  if (ex.kind === "find") {
    prompt.textContent = ui("touch");
    card.append(txt("div", "bigword", item.word, G),
      optionGrid(ex.options, (o) => o.emoji, (o) => o === item, () => success([[item.word, G]])));
    say = [[uiT("touch"), G], [item.word, G]];
  } else if (ex.kind === "read") {
    prompt.textContent = ui("read");
    card.append(txt("div", "bigword", item.word, G),
      optionGrid(ex.options, (o) => o.emoji, (o) => o === item, () => success([[item.word, G]])));
    say = [[uiT("read"), G]];
    repeat.onclick = () => speak(item.word, G);
  } else if (ex.kind === "starts") {
    prompt.textContent = ui("startsWith", item.letter);
    card.append(el("div", "bigletter", item.letter),
      optionGrid(ex.options, (o) => o.emoji, (o) => o === item, () => success([[item.word, "es"]])));
    say = [[uiT("startsWith", item.letter), G]];
  } else if (ex.kind === "count") {
    prompt.textContent = ui("howMany");
    card.append(el("div", "group", item.emoji.repeat(item.n)),
      optionGrid(ex.nums, String, (n) => n === item.n, () => success([[numWord(item.n), G]]), "num"));
    say = [[uiT("howMany"), G]];
  } else if (ex.kind === "sum") {
    const { a, b, emoji } = item;
    prompt.textContent = ui("sum");
    card.append(el("div", "group", emoji.repeat(a) + " + " + emoji.repeat(b)),
      optionGrid(ex.nums, String, (n) => n === a + b, () => success([[`${numWord(a)} ${uiT("plus")} ${numWord(b)}`, G], [numWord(a + b), G]]), "num"));
    say = [[uiT("sum"), G]];
  } else if (ex.kind === "build") {
    prompt.textContent = ui("build");
    card.append(el("div", "bigemoji", item.emoji), syllableBoard(item, success, miss));
    say = [[uiT("build"), G], [item.word, "es"]];
  } else if (ex.kind === "trace") {
    prompt.textContent = ui("trace") + ": " + item.letter;
    card.append(traceBoard(item.letter, () => success([[item.letter, G]])));
    say = [[uiT("trace"), G], [item.letter, G]];
  }

  app.append(dots, talk, card);
  speak(say);
}

// Formar una palabra tocando las sílabas en orden.
function syllableBoard(item, success, miss) {
  const wrap = el("div", "build");
  const slots = el("div", "slots");
  const slotEls = item.syl.map(() => slots.appendChild(el("span", "slot", " ")));
  let order = shuffle(item.syl);
  while (order.join() === item.syl.join()) order = shuffle(item.syl);
  const tiles = el("div", "options cols-" + order.length);
  let pos = 0;
  const tileEls = order.map((s) => {
    const b = button("opt syl", s, () => {
      if (s !== item.syl[pos]) return miss(b, tileEls.find((t) => !t.disabled && t.textContent === item.syl[pos]));
      slotEls[pos].textContent = s;
      slotEls[pos].classList.add("filled");
      b.disabled = true;
      b.classList.add("used");
      tileEls.forEach((t) => t.classList.remove("pulse"));
      pos++;
      if (pos === item.syl.length) success([[item.word, "es"]]);
      else speak(s, "es");
    });
    b.lang = "es";
    tiles.append(b);
    return b;
  });
  wrap.append(slots, tiles);
  return wrap;
}

// Trazar una letra con el dedo. Se da por buena si el trazo cubre buena parte de la letra
// y la mayor parte del trazo cae sobre ella (criterio generoso a propósito).
function traceBoard(letter, onSuccess) {
  const S = Math.min(300, Math.max(200, app.clientWidth - 64));
  const dpr = window.devicePixelRatio || 1;
  const cv = el("canvas", "trace-canvas");
  cv.width = cv.height = S * dpr;
  cv.style.width = cv.style.height = S + "px";
  cv.setAttribute("aria-label", letter);
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.body);
  const font = `800 ${Math.round(S * 0.78)}px Lexend, system-ui, sans-serif`;
  const glyph = (c, color) => {
    c.font = font; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = color;
    c.fillText(letter, S / 2, S * 0.54);
  };
  const offscreen = () => { const c = el("canvas"); c.width = c.height = S; return c.getContext("2d", { willReadFrequently: true }); };
  const pen = (c, color) => { c.lineCap = c.lineJoin = "round"; c.lineWidth = S * 0.1; c.strokeStyle = color; };
  let mask, ink, done = false;
  const reset = () => {
    ctx.clearRect(0, 0, S, S);
    glyph(ctx, css.getPropertyValue("--trace-guide").trim() || "#e4e7fb");
    pen(ctx, css.getPropertyValue("--trace-ink").trim() || "#ff6b6b");
    const m = offscreen(); glyph(m, "#000"); mask = m.getImageData(0, 0, S, S).data;
    ink = offscreen(); pen(ink, "#000");
  };
  const check = () => {
    const d = ink.getImageData(0, 0, S, S).data;
    let letterPx = 0, covered = 0, inkPx = 0, inside = 0;
    for (let i = 3; i < d.length; i += 12) {
      const L = mask[i] > 0, I = d[i] > 0;
      if (L) { letterPx++; if (I) covered++; }
      if (I) { inkPx++; if (L) inside++; }
    }
    if (!done && inkPx && covered / letterPx >= 0.55 && inside / inkPx >= 0.45) { done = true; onSuccess(); }
  };
  let last = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
  const line = (a, b) => { for (const c of [ctx, ink]) { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } };
  cv.onpointerdown = (e) => { if (done) return; cv.setPointerCapture?.(e.pointerId); last = pos(e); line(last, last); };
  cv.onpointermove = (e) => { if (!last) return; const p = pos(e); line(last, p); last = p; };
  cv.onpointerup = cv.onpointercancel = () => { if (!last) return; last = null; check(); };
  reset();
  const wrap = el("div", "trace");
  wrap.append(cv, button("btn ghost-dark", "🧽 " + ui("erase"), () => { if (!done) reset(); }));
  return wrap;
}

// ---------- Premio ----------
function showKidReward(st) {
  const sticker = pick(STICKERS, 1)[0];
  save.stickers.push(sticker);
  touchStreak();
  persist();
  screen("main");
  celebrate();
  const card = el("div", "card result kid");
  card.append(mascot("cheer", 110), el("div", "sticker", sticker), el("p", "prompt", ui("newSticker")));
  app.append(card,
    button("btn", "🔁 " + ui("again"), () => startUnit(st.u)),
    button("btn ghost", "🏠 " + ui("back"), showKidsHome));
  speak(uiT("great"), save.target);
}
