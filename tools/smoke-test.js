// Prueba de humo: juega una lección de adultos y todas las unidades de niños en un navegador real.
// Uso: tools/build.sh && node tools/smoke-test.js   (necesita Playwright y Chromium)
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }

const file = "file://" + path.join(__dirname, "..", "index.html");
const shots = process.env.SHOTS; // carpeta opcional para capturas

async function newPage(browser, saveData) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Sin voz en el navegador de pruebas: el juego usa una pausa corta en su lugar.
  await page.addInitScript((s) => { delete window.speechSynthesis; if (s) localStorage.setItem("hola-espanol", JSON.stringify(s)); }, saveData);
  await page.goto(file);
  return { page, errors };
}

async function trace(page) {
  // Recorre la letra guía fila a fila, como haría un dedo sobre ella.
  await page.evaluate(() => {
    const cv = document.querySelector(".trace-canvas");
    const r = cv.getBoundingClientRect();
    const S = r.width, k = cv.width / S;
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    const on = (x, y) => d[(Math.round(y * k) * cv.width + Math.round(x * k)) * 4 + 3] > 0;
    const fire = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { clientX: r.left + x, clientY: r.top + y, pointerId: 1, bubbles: true }));
    for (let y = 2; y < S; y += 8) {
      let start = null;
      for (let x = 0; x <= S; x += 2) {
        const inside = x < S && on(x, y);
        if (inside && start === null) start = x;
        if (!inside && start !== null) { fire("pointerdown", start, y); fire("pointermove", x - 2, y); fire("pointerup", x - 2, y); start = null; }
      }
    }
  });
}

async function playKidUnit(page) {
  while (await page.$(".learn")) await page.click(".nav .btn:last-child");
  for (let guard = 0; guard < 40; guard++) {
    if (await page.$(".sticker")) return true;
    if (await page.$(".trace-canvas")) { await trace(page); }
    else if (await page.$(".opt.syl")) {
      for (const b of await page.$$(".opt.syl:not([disabled])")) { await b.click().catch(() => {}); }
    } else if (await page.$('.opt[data-ok="1"]:not(.correct)')) { await page.click('.opt[data-ok="1"]:not(.correct)'); }
    await page.waitForTimeout(700);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const fails = [];

  // Adultos: árabe → español, y chino → inglés.
  for (const [native, target] of [["ar", "es"], ["zh", "en"], ["es", "es"]]) {
    const { page, errors } = await newPage(browser, { native, target, mode: "adult" });
    await page.click(".world");
    for (let i = 0; i < 8; i++) { await page.click('.opt[data-ok="1"]'); await page.click(".btn"); }
    const ok = await page.$(".result") && (await page.innerText(".result")).includes("8 / 8");
    console.log(`adultos ${native}→${target}: ${ok ? "OK" : "FALLO"}`);
    if (!ok || errors.length) fails.push(`adultos ${native}→${target} ${errors}`);
    await page.close();
  }

  // Primera vez: elegir idiomas, modo y edad desde cero.
  {
    const { page, errors } = await newPage(browser, null);
    await page.click('.opt[lang="fr"]');
    await page.click('.opt[lang="es"]');
    await page.click(".mode:nth-child(2)");
    await page.click(".mode:nth-child(2)");
    const ok = (await page.innerText("#app")).includes("Voyelles");
    console.log(`primera vez fr→es niños 3–5: ${ok ? "OK" : "FALLO"}`);
    if (shots) await page.screenshot({ path: path.join(shots, "kids-home.png"), fullPage: true });
    if (!ok || errors.length) fails.push("primera vez " + errors);
    await page.close();
  }

  // Niños: todas las unidades de cada edad (aprendiendo español), y una edad aprendiendo chino.
  for (const [target, age] of [["es", "1-3"], ["es", "3-5"], ["es", "5-7"], ["zh", "5-7"]]) {
    const { page, errors } = await newPage(browser, { native: "en", target, mode: "kids", age });
    const count = (await page.$$(".tile")).length;
    for (let i = 0; i < count; i++) {
      const tile = (await page.$$(".tile"))[i];
      const name = await tile.innerText();
      await tile.click();
      if (shots && i === 0) await page.screenshot({ path: path.join(shots, `kids-${target}-${age}-learn.png`) });
      const ok = await playKidUnit(page);
      console.log(`niños ${target} ${age} ${name.replace(/\s+/g, " ")}: ${ok ? "OK" : "FALLO"}`);
      if (!ok) fails.push(`niños ${target} ${age} ${name}`);
      await page.click("#topbar .chip");
    }
    if (errors.length) fails.push(`niños ${target} ${age}: ${errors}`);
    await page.close();
  }

  // Control parental: respuesta incorrecta no entra, correcta sí.
  {
    const { page } = await newPage(browser, { native: "es", target: "en", mode: "kids", age: "3-5" });
    await page.click("#topbar .chip:last-child");
    await page.fill("#gate-answer", "1");
    await page.click(".gate .btn");
    const blocked = !(await page.$("#calm-mode"));
    const q = await page.innerText(".gate .prompt");
    const [a, b] = q.match(/(\d+) × (\d+)/).slice(1).map(Number);
    await page.fill("#gate-answer", String(a * b));
    await page.click(".gate .btn");
    const ok = blocked && !!(await page.$("#calm-mode"));
    console.log(`control parental: ${ok ? "OK" : "FALLO"}`);
    if (!ok) fails.push("control parental");
    await page.close();
  }

  await browser.close();
  if (fails.length) { console.error("\nFALLOS:\n" + fails.join("\n")); process.exit(1); }
  console.log("\nTodo OK");
})();
