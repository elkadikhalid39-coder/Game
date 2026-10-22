// Prueba de humo: recorre la app en un navegador real (primera vez, lecciones, repaso, perfil).
// Uso: node tools/smoke-test.js   (necesita Playwright; PW_CHROMIUM=/ruta/a/chromium si hace falta)
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }

const file = "file://" + path.join(__dirname, "..", "index.html");

async function newPage(browser, saveData) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Sin voz en el navegador de pruebas: la app usa una pausa corta en su lugar.
  await page.addInitScript((s) => { delete window.speechSynthesis; if (s) localStorage.setItem("hola-espanol", JSON.stringify(s)); }, saveData);
  await page.goto(file);
  return { page, errors };
}

// Responde la lección: bien siempre, o mal la primera vez que aparece el ejercicio número `wrongAt`.
async function playLesson(page, wrongAt = -1) {
  let seen = 0;
  for (let g = 0; g < 40 && !(await page.$(".result-stats")); g++) {
    if (await page.$(".sheet .btn")) { await page.click(".sheet .btn"); continue; }
    if (await page.$(".footer .btn")) { await page.click(".footer .btn"); continue; }
    await page.click(seen++ === wrongAt ? '.opt[data-ok="0"]' : '.opt[data-ok="1"]');
  }
  return !!(await page.$(".result-stats"));
}

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const fails = [];
  const check = (name, ok, errors = []) => {
    console.log(`${name}: ${ok && !errors.length ? "OK" : "FALLO"}`);
    if (!ok || errors.length) fails.push(`${name} ${errors.join(" | ")}`);
  };

  // Primera vez: bienvenida → idioma → camino.
  {
    const { page, errors } = await newPage(browser, null);
    await page.click(".welcome ~ .btn");
    await page.click('.lang-row:has(.name[lang="ar"])');
    const ok = (await page.$(".node-wrap.current")) && (await page.innerText("#tabbar")).includes("مراجعة");
    check("primera vez (árabe)", ok, errors);
    await page.close();
  }

  // Primera lección del camino con varios idiomas de apoyo (también español → español).
  for (const native of ["ar", "zh", "es"]) {
    const { page, errors } = await newPage(browser, { native });
    await page.click(".node-wrap.current .node");
    const done = await playLesson(page);
    const perfect = done && (await page.innerText(".result-stats")).includes("100%");
    await page.click(".btn");
    const unlocked = (await page.$$(".node-wrap.done")).length === 1;
    check(`lección completa (${native})`, perfect && unlocked, errors);
    await page.close();
  }

  // Un error: se repite al final, la lección se termina igual y el error queda en Repasar hasta acertarlo allí.
  {
    const { page, errors } = await newPage(browser, { native: "fr" });
    await page.click(".node-wrap.current .node");
    // El 2.º ejercicio es una palabra que no vuelve a salir en la lección (salvo su segunda oportunidad).
    const done = await playLesson(page, 1);
    const notPerfect = done && !(await page.innerText(".result-stats")).includes("100%");
    await page.click(".btn");
    await page.click(".tab:nth-child(2)");
    const listed = (await page.$$(".chip-item")).length === 1;
    await page.click(".btn.big");
    await playLesson(page);
    await page.click(".btn");
    const cleared = !(await page.$(".chip-item"));
    check("error repetido y repaso", notPerfect && listed && cleared, errors);
    await page.close();
  }

  // Progreso antiguo (con modo niños y otros idiomas): se conserva lo aprendido en español.
  {
    const old = { native: "ro", target: "en", mode: "kids", age: "3-5", stickers: ["🦄"], xp: 90,
      progress: { es: { saludos: 3 }, en: { saludos: 1 } }, learned: { es: ["hola", "adios"] } };
    const { page, errors } = await newPage(browser, old);
    const doneNodes = (await page.$$(".node-wrap.done")).length;
    const words = await page.innerText("#topbar");
    check("migración del progreso", doneNodes === 3 && words.includes("📚 2"), errors);
    await page.close();
  }

  // Perfil y cambio de idioma.
  {
    const { page, errors } = await newPage(browser, { native: "es" });
    await page.click(".tab:nth-child(3)");
    await page.click(".setting:first-child");
    await page.click('.lang-row:has(.name[lang="uk"])');
    const ok = (await page.innerText("#tabbar")).includes("Повторення");
    check("perfil y cambio de idioma", ok, errors);
    await page.close();
  }

  await browser.close();
  if (fails.length) { console.error("\nFALLOS:\n" + fails.join("\n")); process.exit(1); }
  console.log("\nTodo OK");
})();
