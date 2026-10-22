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
const WORD_BY_EMOJI = Object.fromEntries(UNITS.flatMap((u) => u.words.map((w) => [w.emoji, ES[w.id]])));
const sortedTokens = (s) => s.split(" ").sort().join(" ");

const progressAt = (unitId, lessons) => {
  const p = {};
  for (const u of UNITS) { if (u.id === unitId) { p[u.id] = lessons; break; } p[u.id] = 4; }
  return p;
};

// Responde el ejercicio que haya en pantalla: bien, o mal si wrong = true.
async function answerCurrent(page, wrong = false) {
  if (await page.$("#write-answer")) {
    const emoji = await page.innerText(".exercise .bigemoji");
    await page.fill("#write-answer", wrong ? "xxxxx" : WORD_BY_EMOJI[emoji]);
    return page.click(".exercise .btn");
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
  return [(await page.$(".node-wrap.current")) && (await page.innerText("#tabbar")).includes("مراجعة"), errors];
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
  // El 4.º ejercicio es una palabra que no vuelve a salir en la lección (salvo su segunda oportunidad).
  const notPerfect = (await playLesson(page, 3)) && !(await page.innerText(".result-stats")).includes("100%");
  await page.click(".btn");
  await page.click('.tab[data-tab="review"]');
  const listed = (await page.$$(".chip-item")).length === 1;
  await page.click(".btn.big");
  await playLesson(page);
  await page.click(".btn");
  return [notPerfect && listed && !(await page.$(".chip-item")), errors];
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
  return [(await page.innerText("#tabbar")).includes("Повторення"), errors];
});

test("funciona sin conexión", async () => {
  const { page, errors, context } = await open({ native: "de" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la segunda carga ya la controla el service worker
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  const ok = (await page.innerText("#tabbar")).includes("Wiederholen");
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
    if (await page.$(".sheet .btn")) await page.click(".sheet .btn"); else await answerCurrent(page);
  }
  const emoji = await page.innerText(".exercise .bigemoji");
  const word = WORD_BY_EMOJI[emoji];
  const plain = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  await page.fill("#write-answer", plain);
  await page.click(".exercise .btn");
  const sheetText = await page.innerText(".sheet");
  // Si la palabra no lleva tilde, basta con que se acepte.
  const ok = (await page.$(".sheet.ok")) && (plain === word || sheetText.includes(word));
  return [ok, errors];
});

test("saltar y pausar el audio", async () => {
  const { page, errors } = await open({ native: "it", progress: { saludos: 1 } });
  await page.click(".node-wrap.current .node"); // lección de escuchar
  const before = await page.$$eval(".progress > div", (d) => d[0].style.width);
  await page.click('.exits .link:has-text("→")');
  const moved = before !== (await page.$$eval(".progress > div", (d) => d[0].style.width));
  // «No puedo escuchar ahora» convierte los ejercicios de escuchar en ejercicios de leer.
  await page.click('.exits .link:has-text("🔇")');
  const noListen = !(await page.$(".listen-pair")) && !!(await page.$(".paused-note"));
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
