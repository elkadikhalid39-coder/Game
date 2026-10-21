// Primera vez: bienvenida, idiomas, modo y edad. También ajustes y control parental.

function showWelcome() {
  screen("plain", "");
  const hero = el("section", "welcome");
  hero.append(
    mascot("cheer", 150),
    el("h1", "wordmark", "hola!"),
    el("p", "greetings", "Hola · Hello · Bonjour · مرحبا · Salut · Привіт · 你好 · سلام"),
  );
  app.append(hero, button("btn big", "Empezar · Start · ابدأ", showNativePicker));
}

// Lista de idiomas: nombre en su propia escritura y código.
function langList(onPick, selected) {
  const list = el("div", "langs");
  for (const code of Object.keys(I18N)) {
    const b = el("button", "lang-row" + (code === selected ? " selected" : ""));
    b.type = "button";
    b.append(el("span", "code", code.toUpperCase()), txt("span", "name", I18N[code].name, code));
    b.onclick = () => onPick(code);
    list.append(b);
  }
  return list;
}

// Paso 1: idioma que habla la persona (antes de saberlo, se pregunta en varios idiomas).
function showNativePicker() {
  screen("plain", "");
  app.append(speech("🗣️ Yo hablo · I speak · Je parle · أنا أتحدث", "talk"),
    langList((code) => { save.native = code; showTargetPicker(); }, save.native));
}

// Paso 2: idioma que quiere aprender. Puede ser el mismo, para reforzarlo o aprender a leerlo.
function showTargetPicker() {
  screen("plain");
  app.append(button("back", "← " + ui("back"), showNativePicker), speech(ui("iLearn"), "talk"),
    langList((code) => { save.target = code; persist(); go(); }, save.target));
}

// Paso 3: adultos o niños.
function showModePicker() {
  screen("plain");
  app.append(speech(ui("chooseMode"), "talk"));
  const box = el("div", "modes");
  const card = (cls, emoji, title, desc, mode) => {
    const b = el("button", "mode " + cls);
    b.type = "button";
    b.append(el("span", "art", emoji), el("strong", "", title), el("span", "", desc));
    b.onclick = () => { save.mode = mode; persist(); go(); };
    return b;
  };
  box.append(card("adult", "🧑‍💼", ui("adults"), ui("adultsDesc"), "adult"),
    card("kid", "🧒", ui("kids"), ui("kidsDesc"), "kids"));
  app.append(box);
}

// Paso 4 (niños): edad.
function showAgePicker() {
  screen("plain");
  app.append(speech(ui("chooseAge"), "talk"));
  const box = el("div", "ages");
  for (const a of AGES) {
    const b = el("button", "age");
    b.type = "button";
    b.append(el("span", "art", a.emoji), el("strong", "", a.id.replace("-", "–")), el("span", "", ui("years")));
    b.onclick = () => { save.age = a.id; persist(); go(); };
    box.append(b);
  }
  app.append(box);
}

// ---------- Control parental ----------
// Una multiplicación sencilla para que los niños pequeños no entren solos en los ajustes.
function showGate(onPass) {
  screen("plain");
  const a = rand(3, 9), b = rand(3, 9);
  const card = el("div", "card gate");
  const input = el("input");
  input.id = "gate-answer";
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  const msg = el("p", "feedback bad");
  const check = () => {
    if (Number(input.value) === a * b) onPass();
    else { msg.textContent = ui("gateWrong"); input.value = ""; }
  };
  input.onkeydown = (e) => { if (e.key === "Enter") check(); };
  card.append(el("p", "prompt", "🔒 " + ui("gateQ", `${a} × ${b}`)), input, msg, button("btn", ui("ok"), check));
  app.append(button("back", "← " + ui("back"), go), card);
  input.focus();
}

// ---------- Ajustes ----------
function settingsCard() {
  const card = el("div", "card settings");
  const row = (icon, label, fn) => {
    const b = button("setting", "", fn);
    b.append(el("span", "icon", icon), el("span", "", label), el("span", "chev", "›"));
    return b;
  };
  card.append(row("🌐", ui("changeLang"), () => { save.native = ""; save.target = ""; showNativePicker(); }));
  card.append(row("🔁", ui("switchMode"), () => { save.mode = ""; persist(); go(); }));
  if (save.mode === "kids") card.append(row("🎂", ui("changeAge"), () => { save.age = ""; persist(); go(); }));
  const calm = el("label", "setting toggle");
  const box = el("input");
  box.type = "checkbox";
  box.id = "calm-mode";
  box.checked = save.calm;
  box.onchange = () => { save.calm = box.checked; persist(); renderBars(); };
  calm.append(el("span", "icon", "🌙"), el("span", "", ui("calm")), box);
  card.append(calm);
  return card;
}

// Ajustes del modo niños (detrás del control parental).
function showSettings() {
  screen("plain");
  app.append(button("back", "← " + ui("back"), go), el("h1", "", "⚙️ " + ui("settings")), settingsCard());
}
