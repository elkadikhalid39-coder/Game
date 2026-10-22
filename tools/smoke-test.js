// Prueba de humo: recorre la app compilada en un navegador real.
// Uso: npm test   (compila y ejecuta)  ·  node tools/smoke-test.js (necesita dist/ y dist-single/ ya compilados)
// Necesita Playwright; PW_CHROMIUM=/ruta/a/chromium si el navegador no está en la ruta por defecto.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "./playwright.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = 4179;
const URL_APP = `http://localhost:${PORT}/`;

// Servidor de la compilación (dist/) con vite preview.
// detached: el servidor va en su propio grupo de procesos para poder cerrarlo entero al final (npx lanza un hijo).
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "pipe", detached: true });
const stopServer = () => { try { process.kill(-server.pid); } catch { /* ya cerrado */ } };
await new Promise((ok, fail) => {
  server.stdout.on("data", (d) => String(d).includes(String(PORT)) && ok());
  server.on("exit", () => fail(new Error("vite preview no arrancó")));
});

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const fails = [];
export const tests = [];
const test = (name, fn) => tests.push([name, fn]);

let lastPage; // para la captura cuando una prueba falla
async function open(saveData, { url = URL_APP, context } = {}) {
  context ||= await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  lastPage = page;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Los datos de prueba usan el formato actual (v3), salvo los de la prueba de migración (llevan «target»).
  if (saveData && !saveData.v && !saveData.target) saveData = { v: 3, ...saveData };
  // Sin voz en el navegador de pruebas: la app usa una pausa corta en su lugar.
  await page.addInitScript((s) => {
    delete window.speechSynthesis;
    if (s && !sessionStorage.getItem("seeded")) { localStorage.setItem("hola-espanol", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); }
  }, saveData);
  await page.goto(url);
  return { page, errors, context };
}

// Contenido para que la prueba sepa la respuesta de los ejercicios de escribir y ordenar.
import { readFileSync } from "node:fs";
const ES = JSON.parse(readFileSync(new URL("../content/i18n/es.json", import.meta.url), "utf8")).t;
const UNITS = JSON.parse(readFileSync(new URL("../content/course/units.json", import.meta.url), "utf8"));
const sortedTokens = (s) => s.split(" ").sort().join(" ");

const progressAt = (unitId, lessons) => {
  const p = {};
  for (const u of UNITS) { if (u.id === unitId) { p[u.id] = lessons; break; } p[u.id] = 4; }
  return p;
};

// Responde el ejercicio que haya en pantalla: bien, o mal si wrong = true.
async function answerCurrent(page, wrong = false) {
  if (await page.$("#write-answer")) {
    const id = await page.getAttribute(".write-box", "data-word");
    await page.fill("#write-answer", wrong ? "xxxxx" : ES[id]);
    return page.click(".write-box .btn");
  }
  if (await page.$(".tray")) {
    const tiles = await page.$$eval(".tray .tile", (ts) => ts.map((t) => t.textContent));
    const sentence = Object.entries(ES).find(([k, v]) => k.startsWith("a_") && sortedTokens(v) === sortedTokens(tiles.join(" ")))[1];
    const words = wrong ? [...sentence.split(" ")].reverse() : sentence.split(" ");
    for (const w of words) await page.click(`.tray .tile:text-is("${w.replace(/"/g, '\\"')}")`);
    return page.click(".exercise .btn");
  }
  return page.click(wrong ? '.opt[data-ok="0"]' : '.opt[data-ok="1"]');
}

// Responde toda la lección: bien siempre, o mal la primera vez que aparece el ejercicio número `wrongAt`.
export async function playLesson(page, wrongAt = -1) {
  let seen = 0;
  for (let g = 0; g < 80 && !(await page.$(".result-stats")); g++) {
    if (await page.$(".sheet .btn")) { await page.click(".sheet .btn"); continue; }
    if (await page.$(".footer .btn")) { await page.click(".footer .btn"); continue; }
    await answerCurrent(page, seen++ === wrongAt);
  }
  return !!(await page.$(".result-stats"));
}

test("primera vez (árabe)", async () => {
  const { page, errors } = await open(null);
  await page.click(".welcome ~ .btn");
  await page.click('.lang-row:has(.name[lang="ar"])');
  return [(await page.$(".node-wrap.current")) && (await page.innerText("#tabbar")).includes("تدرّب"), errors];
});

for (const native of ["ar", "zh", "es"]) {
  test(`lección completa (${native})`, async () => {
    const { page, errors } = await open({ native });
    await page.click(".node-wrap.current .node");
    const perfect = (await playLesson(page)) && (await page.innerText(".result-stats")).includes("100%");
    await page.click(".btn");
    return [perfect && (await page.$$(".node-wrap.done")).length === 1, errors];
  });
}

test("error repetido y repaso", async () => {
  const { page, errors } = await open({ native: "fr" });
  await page.click(".node-wrap.current .node");
  // Se falla el último ejercicio (el 10.º): solo vuelve como segunda oportunidad, que no lo saca de Repasar.
  const notPerfect = (await playLesson(page, 9)) && !(await page.innerText(".result-stats")).includes("100%");
  await page.click(".btn");
  await page.click('.tab[data-tab="review"]');
  const mine = ".menu-row:first-child";
  const listed = !(await page.$eval(mine, (r) => r.classList.contains("locked"))) && (await page.innerText(mine)).includes("1");
  await page.click(mine);
  await playLesson(page);
  await page.click(".btn");
  return [notPerfect && listed && (await page.$eval(mine, (r) => r.classList.contains("locked"))), errors];
});

test("migración del progreso antiguo", async () => {
  const old = { native: "ro", target: "en", mode: "kids", age: "3-5", stickers: ["🦄"], xp: 90,
    progress: { es: { saludos: 3 }, en: { saludos: 1 } }, learned: { es: ["hola", "adios"] } };
  const { page, errors } = await open(old);
  return [(await page.$$(".node-wrap.done")).length === 3 && (await page.innerText("#topbar")).includes("📚 2"), errors];
});

test("perfil y cambio de idioma", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click('.tab[data-tab="profile"]');
  await page.click(".setting:first-child");
  await page.click('.lang-row:has(.name[lang="uk"])');
  return [(await page.innerText("#tabbar")).includes("Практика"), errors];
});

test("funciona sin conexión", async () => {
  const { page, errors, context } = await open({ native: "de" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la segunda carga ya la controla el service worker
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  const ok = (await page.innerText("#tabbar")).includes("Üben");
  const fontsLoaded = await page.evaluate(() => document.fonts.check("600 16px Fredoka"));
  return [ok && fontsLoaded, errors];
});

test("vista previa de un solo archivo", async () => {
  const { page, errors } = await open(null, { url: "file://" + root + "dist-single/hola.html" });
  await page.click(".welcome ~ .btn");
  await page.click('.lang-row:has(.name[lang="pt"])');
  return [!!(await page.$(".node-wrap.current")), errors];
});

test("escribir sin tilde: se acepta y se avisa", async () => {
  const { page, errors } = await open({ native: "en", progress: progressAt("salud", 1) });
  // Lección de escuchar de Salud: termina con un ejercicio de escribir.
  await page.click(".node-wrap.current .node");
  for (let g = 0; g < 30 && !(await page.$("#write-answer")); g++) {
    if (await page.$(".sheet .btn")) await page.click(".sheet .btn");
    else if (await page.$(".footer .btn")) await page.click(".footer .btn");
    else await answerCurrent(page);
  }
  const word = ES[await page.getAttribute(".write-box", "data-word")];
  const plain = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  await page.fill("#write-answer", plain);
  await page.click(".write-box .btn");
  const sheetText = await page.innerText(".sheet");
  // Si la palabra no lleva tilde, basta con que se acepte.
  const ok = (await page.$(".sheet.ok")) && (plain === word || sheetText.includes(word));
  return [ok, errors];
});

test("saltar y pausar el audio", async () => {
  const { page, errors } = await open({ native: "it", progress: { saludos: 1 } });
  await page.click(".node-wrap.current .node"); // lección de escuchar: empieza presentando una palabra
  await page.click(".footer .btn");
  const before = await page.$$eval(".progress > div", (d) => d[0].style.width);
  await page.click('.exits .link:has-text("→")');
  const moved = before !== (await page.$$eval(".progress > div", (d) => d[0].style.width));
  await page.click(".footer .btn"); // la siguiente palabra se presenta antes de escucharla
  // «No puedo escuchar ahora» convierte los ejercicios de escuchar en ejercicios de leer.
  await page.click('.exits .link:has-text("🔇")');
  const noListen = !(await page.$(".audio-controls.big")) && !!(await page.$(".paused-note"));
  const done = await playLesson(page);
  return [moved && noListen && done, errors];
});

test("práctica final y objetivo conseguido", async () => {
  const { page, errors } = await open({ native: "uk", progress: progressAt("saludos", 3) });
  await page.click(".node-wrap.current .node");
  const done = await playLesson(page);
  const won = await page.$(".can-do-won");
  await page.click(".btn");
  await page.click('.tab[data-tab="profile"]');
  const listed = (await page.$$("ul.can-do li.done")).length === 1;
  return [done && won && listed, errors];
});

test("unidades nuevas (Papeleo, escrita en ruso)", async () => {
  const { page, errors } = await open({ native: "ru", progress: progressAt("papeleo", 0) });
  await page.click(".node-wrap.current .node");
  const done = await playLesson(page);
  return [done, errors];
});

// ---------- Fallos que encontró el usuario en el móvil (22/10/2026) ----------
test("Intro en el teclado muestra la corrección (no salta a la siguiente)", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click(".node-wrap.current .node");
  await page.click(".footer .btn"); // presentación de la palabra
  await page.fill("#write-answer", "xxxxx");
  await page.press("#write-answer", "Enter");
  await page.waitForTimeout(300);
  const shown = !!(await page.$(".sheet.bad .diff"));
  return [shown && !!(await page.$("#write-answer")), errors];
});

test("dos toques rápidos en «Continuar» no se saltan la palabra nueva", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const { page, errors } = await open({ native: "fr" }, { context });
  // Entre toques, una pausa como la de una persona (la app ignora toques a menos de 0,35 s de un cambio de pantalla).
  const human = () => page.waitForTimeout(450);
  await human();
  await page.tap(".node-wrap.current .node");
  await human();
  await page.tap(".footer .btn"); // palabra 1
  await human();
  await page.tap('.opt[data-ok="1"]'); // la elige bien
  await human();
  // Dos toques seguidos donde está «Continuar»: el segundo cae sobre el «Continuar» de la palabra 2.
  const box = await (await page.$(".sheet .btn")).boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.touchscreen.tap(x, y);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(200);
  return [!!(await page.$(".card.intro")), errors];
});

test("las pistas no resuelven la palabra y no hay emojis dudosos", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click(".node-wrap.current .node");
  // Adiós se presenta sin dibujo (un emoji de puerta no significa «adiós»).
  let adios = null;
  for (let g = 0; g < 12 && !adios; g++) {
    if ((await page.$(".card.intro")) && (await page.innerText(".card.intro .bigword")) === "Adiós") adios = !(await page.$(".card.intro .bigemoji"));
    if (await page.$(".footer .btn")) await page.click(".footer .btn"); else if (await page.$(".sheet .btn")) await page.click(".sheet .btn"); else await answerCurrent(page);
  }
  // En un dictado, dos pistas: casillas vacías y luego solo la primera letra.
  while (!(await page.$("#write-answer"))) {
    if (await page.$(".footer .btn")) await page.click(".footer .btn"); else if (await page.$(".sheet .btn")) await page.click(".sheet .btn"); else await answerCurrent(page);
  }
  await page.click('.write-box .link:has-text("Pista")');
  const first = await page.$$eval(".hint-box", (b) => b.filter((x) => x.textContent).length);
  await page.click('.write-box .link:has-text("Pista")');
  const second = await page.$$eval(".hint-box", (b) => b.filter((x) => x.textContent).length);
  const noTurtle = !(await page.content()).includes("🐢");
  return [adios === true && first === 0 && second === 1 && noTurtle, errors];
});

test("modo demo: todo abierto sin marcar lecciones como hechas", async () => {
  const { page, errors } = await open({ native: "es", demo: true });
  const locked = (await page.$$(".node-wrap.locked")).length;
  const demoTag = (await page.innerText("#topbar")).includes("DEMO");
  // Se abre directamente la práctica final de la unidad 3 y se termina.
  await (await page.$$(".node-wrap .node"))[2 * 4 + 3].click();
  await playLesson(page);
  await page.click(".btn");
  const done = (await page.$$(".node-wrap.done")).length;
  // Los dos pases, abiertos.
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)");
  await page.click(".menu-row:nth-child(3)"); // DELE, que sin pase está cerrado
  const deleOpen = (await page.$$(".menu-row")).length === 4;
  return [locked === 0 && demoTag && done === 0 && deleOpen, errors];
});

test("calculadora: coma decimal y aviso si una nota no se entiende", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(2)");
  await page.click(".menu-row:nth-child(5)");
  await page.fill("#calc-bach", "7,5");
  await page.fill("#calc-pce-1", "6");
  await page.fill("#calc-pce-2", "seis");
  await page.click(".calc .btn");
  const warned = !!(await page.$("#calc-pce-2.wrong"));
  await page.fill("#calc-pce-2", "٧٫٥"); // cifras árabes: 7,5
  await page.click(".calc .btn");
  // 0,6 · 7,5 + 0,4 · (6 + 7,5) / 2 = 4,5 + 2,7 = 7,2
  return [warned && (await page.innerText(".calc-out")).includes("7,2 / 10"), errors];
});

// ---------- Practicar: dictado y diccionario ----------
test("dictado de palabras: todo bien y una con fallo marcado", async () => {
  const { page, errors } = await open({ native: "fr", progress: { saludos: 1 } });
  await page.click('.tab[data-tab="review"]');
  await page.click(".menu-row:nth-child(2)");
  let marked = false;
  for (let k = 0; k < 8; k++) {
    const text = await page.getAttribute(".write-box", "data-text");
    // La primera se escribe sin la última letra: la corrección debe marcar la letra que falta.
    await page.fill("#write-answer", k === 0 ? text.slice(0, -1) : text);
    await page.click(".write-box .btn");
    if (k === 0) marked = !!(await page.$(".sheet mark.diff-miss"));
    await page.click(".sheet .btn");
  }
  const title = await page.innerText("h1");
  return [marked && title.includes("7 / 8"), errors];
});

test("dictado de frases y diccionario", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click('.tab[data-tab="review"]');
  await page.click(".menu-row:nth-child(3)");
  const text = await page.getAttribute(".write-box", "data-text");
  await page.fill("#write-answer", text.toLowerCase().replace(/[¿?¡!.,]/g, ""));
  await page.click(".write-box .btn");
  const accepted = !!(await page.$(".sheet.ok"));
  await page.click(".sheet .btn");
  await page.click(".lesson-head .icon-btn");
  await page.click(".menu-row:nth-child(4)");
  await page.fill("#dict-search", "cafe");
  const found = (await page.$$(".dict-row")).length === 1 && (await page.innerText(".dict-list")).includes("Café");
  return [accepted && found, errors];
});

// ---------- Pase de Nacionalidad ----------
const DELE = JSON.parse(readFileSync(new URL("../content/exams/dele-a2.json", import.meta.url), "utf8"));
const clickText = (page, text) => page.click(`button:has-text("${text}")`);

test("Mi trámite: adulto que necesita dispensa", async () => {
  const { page, errors } = await open({ native: "es" });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)"); // Nacionalidad
  await page.click(".menu-row:nth-child(1)"); // Mi trámite
  for (const answer of ["18 o más", "Ninguna de estas", "No", "No", "No", "Sí"]) await clickText(page, answer);
  const text = await page.innerText("#app");
  const ok = text.includes("10 años") && text.includes("Necesitas aprobar el DELE A2") && !!(await page.$(".step.important"))
    && (await page.$$(".fact-source a")).length > 10;
  return [ok, errors];
});

test("Mi trámite: menor de 14 años", async () => {
  const { page, errors } = await open({ native: "fr" });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)");
  await page.click(".menu-row:nth-child(1)");
  await clickText(page, "Moins de 14 ans");
  await clickText(page, "Aucune de ces situations");
  const text = await page.innerText("#app");
  return [text.includes("certificats de l'établissement") && !text.includes("DELE A2 ·"), errors];
});

test("CCSE: muestra gratis sin pase", async () => {
  const { page, errors } = await open({ native: "en" });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)");
  await page.click(".menu-row:nth-child(2)"); // CCSE
  const lockedRows = (await page.$$(".menu-row.locked")).length; // tareas 2-5 y simulacro
  await page.click(".menu-row:nth-child(1)"); // práctica tarea 1
  let n = 0;
  for (; n < 10 && !(await page.$("h1")); n++) {
    await page.click('.opt[data-ok="1"]');
    await page.click(".sheet .btn");
  }
  return [lockedRows === 5 && n === 5 && (await page.innerText("h1")).includes("5 / 5"), errors];
});

test("CCSE: simulacro completo con el pase", async () => {
  const { page, errors } = await open({ native: "es", passes: { nacionalidad: true } });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)");
  await page.click(".menu-row:nth-child(2)");
  await page.click(".menu-row:nth-child(6)"); // simulacro
  await page.click(".btn.big");
  const timer = await page.innerText(".timer");
  for (let k = 0; k < 25; k++) {
    await page.click('.opt[data-ok="1"]');
    if (k < 24) await page.click('.exam-nav .btn:has-text("→")');
  }
  await page.click('.exam-nav .btn:has-text("Terminar")');
  const ok = (await page.innerText(".exam-result")).includes("APTO") && (await page.innerText(".exam-result")).includes("25 / 25");
  return [ok && (timer.includes("45:00") || timer.includes("44:5")), errors];
});

// Responde una prueba de comprensión del DELE con las soluciones del contenido.
async function answerComprehension(page, data) {
  for (const t of data.tasks) {
    const qs = t.questions || t.items;
    for (let k = 0; k < qs.length; k++) {
      const sel = await page.$(`#match-${t.id}-${k}`);
      if (sel) await sel.selectOption(String(qs[k].answer));
      else {
        const card = (await page.$$(".exam-q"))[k];
        await (await card.$$(".opt"))[qs[k].answer].click();
      }
    }
    const next = await page.$('.exam-nav .btn:has-text("→")');
    if (next) await next.click(); else await page.click('.exam-nav .btn:has-text("Terminar")');
  }
}

for (const [part, data] of [["reading", DELE.reading], ["listening", DELE.listening]]) {
  test(`DELE: ${part === "reading" ? "lectura" : "auditiva"} 25/25`, async () => {
    const { page, errors } = await open({ native: "es", passes: { nacionalidad: true } });
    await page.click('.tab[data-tab="exams"]');
    await page.click(".menu-row:nth-child(1)");
    await page.click(".menu-row:nth-child(3)"); // DELE
    await page.click(`.menu-row:nth-child(${part === "reading" ? 1 : 2})`);
    await answerComprehension(page, data);
    return [(await page.innerText("h1")).includes("25 de 25"), errors];
  });
}

test("DELE: escritura y oral con autoevaluación", async () => {
  const { page, errors } = await open({ native: "es", passes: { nacionalidad: true } });
  await page.click('.tab[data-tab="exams"]');
  await page.click(".menu-row:nth-child(1)");
  await page.click(".menu-row:nth-child(3)");
  await page.click(".menu-row:nth-child(3)"); // escritura
  await page.fill("#write-E1", "Hola, Irene: gracias por la invitación. ".repeat(7));
  await page.fill("#write-E2", "Vivo en un barrio tranquilo con parques y tiendas. ".repeat(8));
  const counted = (await page.innerText(".step .q-meta.ok")).length > 0;
  await page.click('.btn.big:has-text("Terminar")');
  for (const r of await page.$$(".rubric")) await (await r.$$(".opt"))[2].click();
  await page.click('.btn.big:has-text("Puntuación estimada")');
  const writingOk = (await page.innerText("h1")).includes("17 de 25");
  await page.click(".btn.big");
  await page.click(".menu-row:nth-child(4)"); // oral
  await page.click('.btn.big:has-text("Terminar la preparación")');
  for (let k = 0; k < 3; k++) await page.click(".btn.big");
  for (const r of await page.$$(".rubric")) await (await r.$$(".opt"))[3].click();
  await page.click('.btn.big:has-text("Puntuación estimada")');
  const oralOk = (await page.innerText("h1")).includes("25 de 25");
  await page.click(".btn.big");
  const groups = await page.innerText(".per-task");
  return [counted && writingOk && oralOk && groups.includes("/ 50") , errors];
});

// ---------- Pase de Universidad ----------
const PCE = JSON.parse(readFileSync(new URL("../content/exams/pce.json", import.meta.url), "utf8"));
const openUniversity = async (saveData) => {
  const o = await open(saveData);
  await o.page.click('.tab[data-tab="exams"]');
  await o.page.click(".menu-row:nth-child(2)");
  return o;
};

test("Universidad: Mi ruta desde fuera de la UE (visado aparte)", async () => {
  const { page, errors } = await openUniversity({ native: "ur" });
  await page.click(".menu-row:nth-child(1)");
  await page.click(".options .opt:nth-child(4)"); // fuera de la UE
  await page.click(".options .opt:nth-child(2)"); // sin residencia
  await page.click(".options .opt:nth-child(3)"); // no sabe qué universidad
  const steps = await page.$$eval(".step", (s) => s.length);
  const visa = await page.innerText(".step.important");
  return [steps === 10 && visa.includes("visado") && (await page.$(".step .fact")) !== null, errors];
});

// Responde un test de las PCE según el plan: true = bien, false = mal, null = en blanco.
async function answerPce(page, id, plan, finish = true) {
  const bank = PCE.tests[id].bank;
  const cards = await page.$$(".exam-q");
  for (let k = 0; k < cards.length; k++) {
    if (plan[k] === null) continue;
    const text = await (await cards[k].$(".q-text")).innerText();
    const q = bank.find((x) => x.q === text);
    await (await cards[k].$$(".opt"))[plan[k] ? q.answer : (q.answer + 1) % 3].click();
  }
  if (!finish) return null;
  await page.click('.btn.big:has-text("Terminar")');
  return page.innerText(".exam-result");
}

test("Universidad: test de Inglés gratis (+0,5 / −0,15)", async () => {
  const { page, errors } = await openUniversity({ native: "es" });
  await page.click(".menu-row:nth-child(3)");
  await page.click(".menu-row:nth-child(2)"); // Inglés
  await page.click(".btn.big");
  const result = await answerPce(page, "ingles", [true, true, true, false]);
  return [result.includes("1,35 / 2"), errors];
});

test("Universidad: Historia con el pase, respuestas de más", async () => {
  const { page, errors } = await openUniversity({ native: "es", passes: { universidad: true } });
  await page.click(".menu-row:nth-child(3)");
  await page.click(".menu-row:nth-child(1)"); // Historia
  await page.click(".btn.big");
  // Responde las 8 bien: aparece el aviso y solo cuentan 6.
  await answerPce(page, "historia", Array(8).fill(true), false);
  const warned = await page.$eval(".warn-many", (w) => !w.hidden);
  await page.click('.btn.big:has-text("Terminar")');
  const result = await page.innerText(".exam-result");
  const ignored = await page.$$eval(".review-item", (r) => r.filter((x) => x.innerText.includes("No cuenta")).length);
  return [warned && result.includes("3 / 3") && ignored === 2, errors];
});

test("Universidad: redacción, ortografía y nota", async () => {
  const { page, errors } = await openUniversity({ native: "fr" });
  await page.click(".menu-row:nth-child(4)");
  await page.click(".menu-row:nth-child(1)");
  await page.fill("#pce-summary", "El teletrabajo se ha extendido gracias a internet y tiene ventajas e inconvenientes. ".repeat(5));
  const counted = (await page.$$(".step .q-meta.ok")).length === 1;
  await page.click(".back");
  await page.click(".menu-row:nth-child(4)"); // ortografía
  for (let k = 0; k < PCE.writing.spelling.length; k++) {
    await page.click('.opt[data-ok="1"]');
    await page.click(".sheet .btn");
  }
  const spelling = (await page.innerText("h1")).includes(`${PCE.writing.spelling.length} / ${PCE.writing.spelling.length}`);
  await page.click(".btn.big");
  await page.click(".back");
  await page.click(".menu-row:nth-child(5)"); // nota
  await page.fill("#calc-bach", "8");
  await page.fill("#calc-pce-1", "7");
  await page.fill("#calc-w-1", "9");
  await page.selectOption("#calc-wsel-1", "0.2");
  await page.click(".btn.big");
  const out = await page.innerText(".calc-out");
  return [counted && spelling && out.includes("7,6 / 10") && out.includes("9,4 / 14"), errors];
});

// Los módulos de prueba de cada fase añaden sus casos aquí.
for (const extra of process.argv.slice(2)) await import(new URL(extra, import.meta.url));

// ONLY=texto ejecuta solo las pruebas cuyo nombre lo contiene; SHOTS=carpeta guarda una captura de cada fallo.
const selected = tests.filter(([n]) => !process.env.ONLY || n.includes(process.env.ONLY));
for (const [name, fn] of selected) {
  let ok = false, errors = [];
  try { [ok, errors = []] = await fn(); } catch (e) { errors = [e.message.split("\n")[0]]; }
  if ((!ok || errors.length) && process.env.SHOTS && lastPage) await lastPage.screenshot({ path: `${process.env.SHOTS}/fallo-${name.replace(/\W+/g, "-")}.png` }).catch(() => {});
  console.log(`${ok && !errors.length ? "OK   " : "FALLO"} ${name}${errors.length ? " — " + errors.join(" | ") : ""}`);
  if (!ok || errors.length) fails.push(name);
}
await browser.close();
stopServer();
if (fails.length) { console.error(`\n${fails.length} pruebas fallidas`); process.exit(1); }
console.log(`\nTodo OK (${selected.length} pruebas)`);
process.exit(0);
