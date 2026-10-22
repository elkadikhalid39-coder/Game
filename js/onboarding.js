// Primera vez: bienvenida e idioma de la persona. También los ajustes.

function showWelcome() {
  screen("plain", "");
  const hero = el("section", "welcome");
  hero.append(
    mascot("cheer", 140),
    el("h1", "wordmark", "Hola, Español"),
    el("p", "greetings", "Hola · Hello · Bonjour · مرحبا · Salut · Привіт · 你好 · سلام"),
  );
  app.append(hero, button("btn big", "Empezar · Start · ابدأ", showNativePicker));
}

// Idioma de la persona: el de la interfaz, las traducciones y las explicaciones.
// Antes de saberlo, se pregunta en varios idiomas. Puede ser el español.
function showNativePicker() {
  screen("plain", "");
  const list = el("div", "langs");
  for (const code of Object.keys(I18N)) {
    const b = el("button", "lang-row" + (code === save.native ? " selected" : ""));
    b.type = "button";
    b.append(el("span", "code", code.toUpperCase()), txt("span", "name", I18N[code].name, code));
    b.onclick = () => { save.native = code; persist(); go(); };
    list.append(b);
  }
  app.append(speech("🗣️ Yo hablo · I speak · Je parle · أنا أتحدث", "talk"), list);
}

function settingsCard() {
  const card = el("div", "card settings");
  const row = el("button", "setting");
  row.type = "button";
  row.append(el("span", "icon", "🌐"), el("span", "", ui("changeLang")), el("span", "chev", "›"));
  row.onclick = showNativePicker;
  card.append(row);
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
