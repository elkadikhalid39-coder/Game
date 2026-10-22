// Recorrido completo de la demo (dist-single/hola.html, con todo desbloqueado): entra en todos los apartados
// y en cada pantalla comprueba errores de la página, textos rotos («undefined», «{x}»…), anchura mayor que el
// móvil y botones sin texto. Guarda una captura por pantalla si se indica SHOTS=carpeta.
// Uso: node tools/walkthrough.js  (después de npm run build). LANGS=es,ar para elegir idiomas.
import { fileURLToPath } from "node:url";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "./playwright.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const URL_DEMO = "file://" + root + "dist-single/hola.html";
const load = (p) => JSON.parse(readFileSync(new URL("../content/" + p, import.meta.url), "utf8"));
const ES = load("i18n/es.json").t;
const UNITS = load("course/units.json");
const PCE = load("exams/pce.json");
const DGT = load("exams/conducir.json");
const DELE = load("exams/dele-a2.json");
const LANGS = (process.env.LANGS || "es,fr,ar").split(",");
const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const problems = [];
let screens = 0;

async function newPage(native, extra = {}) {
  const page = await (await browser.newContext({ viewport: { width: 375, height: 740 } })).newPage();
  page.on("pageerror", (e) => problems.push(`[${native}] error de la página: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`[${native}] consola: ${m.text()}`));
  await page.addInitScript((s) => {
    delete window.speechSynthesis;
    if (!sessionStorage.getItem("seeded")) { localStorage.setItem("hola-espanol", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); }
  }, { v: 3, native, demo: true, ...extra });
  await page.goto(URL_DEMO);
  return page;
}

// Revisa la pantalla actual y guarda la captura.
async function inspect(page, native, name) {
  screens++;
  await page.waitForTimeout(80);
  const found = await page.evaluate(() => {
    const out = [];
    const text = document.body.innerText;
    for (const bad of ["undefined", "NaN", "[object", "{x}", "null"]) if (text.includes(bad)) out.push(`texto roto «${bad}»`);
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`la página es más ancha que la pantalla (${document.documentElement.scrollWidth}px)`);
    for (const b of document.querySelectorAll("button")) {
      const r = b.getBoundingClientRect();
      if (r.width && !b.innerText.trim() && !b.getAttribute("aria-label") && !b.querySelector("svg")) out.push("botón vacío: " + b.outerHTML.slice(0, 60));
    }
    return out;
  });
  for (const f of found) problems.push(`[${native}] ${name}: ${f}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${native}-${String(screens).padStart(3, "0")}-${name.replace(/\W+/g, "-")}.png`, fullPage: true });
}

const pause = (page) => page.waitForTimeout(400); // tras cambiar de pantalla, como una persona
async function click(page, sel) { await page.click(sel); await pause(page); }
const sortedTokens = (s) => s.split(" ").sort().join(" ");

// Responde bien cualquier ejercicio de lección (con la información de las pruebas).
async function answer(page) {
  if (await page.$("#write-answer")) {
    const id = await page.getAttribute(".write-box", "data-word");
    await page.fill("#write-answer", ES[id]);
    return click(page, ".write-box .btn");
  }
  if (await page.$(".tray")) {
    const tiles = await page.$$eval(".tray .tile", (ts) => ts.map((t) => t.textContent));
    const sentence = Object.entries(ES).find(([k, v]) => k.startsWith("a_") && sortedTokens(v) === sortedTokens(tiles.join(" ")))[1];
    for (const w of sentence.split(" ")) await page.click(`.tray .tile:text-is("${w.replace(/"/g, '\\"')}")`);
    return click(page, ".exercise .btn");
  }
  return click(page, '.opt[data-ok="1"]');
}

async function playLesson(page, native, label) {
  const kinds = new Set();
  for (let g = 0; g < 60; g++) {
    if (await page.$(".result-stats")) return true;
    if (await page.$(".sheet .btn")) { await click(page, ".sheet .btn"); continue; }
    if (await page.$(".footer .btn")) {
      if (!kinds.has("intro")) { kinds.add("intro"); await inspect(page, native, label + " presentación"); }
      await click(page, ".footer .btn");
      continue;
    }
    const kind = (await page.$("#write-answer")) ? "escribir" : (await page.$(".tray")) ? "ordenar" : "elegir";
    if (!kinds.has(kind)) { kinds.add(kind); await inspect(page, native, `${label} ${kind}`); }
    await answer(page);
  }
  problems.push(`[${native}] ${label}: la lección no termina`);
  return false;
}

async function backToTab(page, tab) {
  await page.goto(URL_DEMO);
  await pause(page);
  await click(page, `.tab[data-tab="${tab}"]`);
}

for (const native of LANGS) {
  // ---------- Aprender: las 36 lecciones (en el primer idioma) o una unidad (en los demás) ----------
  const page = await newPage(native);
  await inspect(page, native, "camino");
  const units = native === LANGS[0] ? UNITS : UNITS.slice(0, 1);
  for (const [n, u] of units.entries()) {
    for (let li = 0; li < 4; li++) {
      await page.goto(URL_DEMO);
      await pause(page);
      const nodes = await page.$$(".node-wrap .node");
      await nodes[n * 4 + li].click();
      await pause(page);
      if (await playLesson(page, native, `${u.id} lección ${li + 1}`)) {
        if (li === 3) await inspect(page, native, `${u.id} resultado`);
      }
    }
  }

  // ---------- Practicar ----------
  await backToTab(page, "review");
  await inspect(page, native, "practicar");
  if (!(await page.$eval(".menu-row:first-child", (r) => r.classList.contains("locked")))) {
    await click(page, ".menu-row:first-child");
    await playLesson(page, native, "repaso");
    await backToTab(page, "review");
  }
  for (const [row, mode] of [[2, "palabras"], [3, "frases"]]) {
    await click(page, `.menu-row:nth-child(${row})`);
    for (let k = 0; k < 8 && (await page.$(".write-box")); k++) {
      const text = await page.getAttribute(".write-box", "data-text");
      await page.fill("#write-answer", k === 0 ? text.slice(1) : text); // la primera, mal
      await click(page, ".write-box .btn");
      if (k === 0) await inspect(page, native, `dictado ${mode} corrección`);
      await click(page, ".sheet .btn");
    }
    await inspect(page, native, `dictado ${mode} resultado`);
    await backToTab(page, "review");
  }
  await click(page, ".menu-row:nth-child(4)");
  await page.fill("#dict-search", "a");
  await inspect(page, native, "diccionario");

  // ---------- Exámenes: Nacionalidad ----------
  await backToTab(page, "exams");
  await inspect(page, native, "exámenes");
  await click(page, ".menu-row:nth-child(1)");
  await inspect(page, native, "nacionalidad");
  // Mi trámite: todos los caminos de respuesta.
  for (const path of [[1, 1], [2, 4], [3, 1, 1, 1], [3, 2, 2, 1, 2], [3, 4, 2, 2, 2, 1], [3, 3, 2, 2, 1]]) {
    await click(page, ".menu-row:nth-child(1)");
    for (const opt of path) if (await page.$(".options .opt")) await click(page, `.options .opt:nth-child(${opt})`);
    await inspect(page, native, "mi trámite " + path.join(""));
    await click(page, ".back");
  }
  await click(page, ".menu-row:nth-child(4)");
  await inspect(page, native, "fuentes nacionalidad");
  await click(page, ".back");
  // CCSE: práctica de cada tarea y simulacro.
  await click(page, ".menu-row:nth-child(2)");
  await inspect(page, native, "ccse");
  for (let t = 1; t <= 5; t++) {
    await click(page, `.menu-row:nth-child(${t})`);
    for (let k = 0; k < 10 && !(await page.$(".btn.big")); k++) {
      await click(page, ".opt >> nth=0");
      if (k === 0) await inspect(page, native, `ccse tarea ${t}`);
      await click(page, ".sheet .btn");
    }
    await click(page, ".btn.big");
  }
  await click(page, ".menu-row:nth-child(6)");
  await click(page, ".btn.big");
  for (let k = 0; k < 25; k++) {
    await page.click(".exam-q .opt >> nth=0");
    if (k < 24) await click(page, '.exam-nav .btn:has-text("→")');
  }
  await inspect(page, native, "ccse simulacro");
  await page.click(".exam-nav .btn >> nth=1");
  await pause(page);
  await inspect(page, native, "ccse resultado");
  // DELE: las cuatro pruebas.
  await backToTab(page, "exams");
  await click(page, ".menu-row:nth-child(1)");
  await click(page, ".menu-row:nth-child(3)");
  await inspect(page, native, "dele");
  for (const [row, data] of [[1, DELE.reading], [2, DELE.listening]]) {
    await click(page, `.menu-row:nth-child(${row})`);
    for (const t of data.tasks) {
      await inspect(page, native, `dele ${t.id}`);
      const next = await page.$('.exam-nav .btn:has-text("→")');
      if (next) await click(page, '.exam-nav .btn:has-text("→")'); else await click(page, ".exam-nav .btn >> nth=1");
    }
    await inspect(page, native, `dele resultado ${row}`);
    await click(page, ".btn.big");
  }
  await click(page, ".menu-row:nth-child(3)");
  await page.fill("#write-E1", "Hola, Irene: gracias por la invitación. ".repeat(7));
  await inspect(page, native, "dele escritura");
  await click(page, '.btn.big >> nth=-1');
  for (const r of await page.$$(".rubric")) await (await r.$$(".opt"))[2].click();
  await inspect(page, native, "dele autoevaluación");
  await click(page, ".btn.big >> nth=-1");
  await click(page, ".btn.big");
  await click(page, ".menu-row:nth-child(4)");
  await inspect(page, native, "dele oral preparación");
  await click(page, ".btn.big");
  for (let k = 0; k < 3; k++) { if (k === 0) await inspect(page, native, "dele oral tarea"); await click(page, ".btn.big"); }
  await inspect(page, native, "dele oral autoevaluación");

  // ---------- Exámenes: Universidad ----------
  await backToTab(page, "exams");
  await click(page, ".menu-row:nth-child(2)");
  await inspect(page, native, "universidad");
  for (const path of [[1, 3], [2, 1, 1], [3, 2, 2], [4, 2, 3]]) {
    await click(page, ".menu-row:nth-child(1)");
    for (const opt of path) if (await page.$(".options .opt")) await click(page, `.options .opt:nth-child(${opt})`);
    await inspect(page, native, "mi ruta " + path.join(""));
    await click(page, ".back");
  }
  await click(page, ".menu-row:nth-child(2)");
  await inspect(page, native, "materias");
  for (let k = 1; k <= 5; k++) {
    await click(page, `.menu .menu-row:nth-child(${k})`);
    await inspect(page, native, `materia ${k}`);
    await click(page, ".back");
  }
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(3)");
  await inspect(page, native, "simulacros pce");
  for (const [k, id] of Object.keys(PCE.tests).entries()) {
    await click(page, `.menu-row:nth-child(${k + 1})`);
    await click(page, ".btn.big");
    for (const c of await page.$$(".exam-q")) await (await c.$$(".opt"))[0].click();
    await inspect(page, native, `test ${id}`);
    await click(page, ".btn.big >> nth=-1");
    await inspect(page, native, `test ${id} resultado`);
    await click(page, ".btn.big");
  }
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(4)");
  await inspect(page, native, "redacción");
  for (const k of [1, 2]) {
    await click(page, `.menu-row:nth-child(${k})`);
    await page.fill("#pce-summary", "El texto explica las ventajas y los inconvenientes del tema. ".repeat(6));
    await inspect(page, native, `redacción texto ${k}`);
    await click(page, ".back");
  }
  await click(page, ".menu-row:nth-child(3)");
  await inspect(page, native, "conectores");
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(4)");
  for (let k = 0; k < PCE.writing.spelling.length; k++) {
    await click(page, '.opt[data-ok="1"]');
    if (k === 0) await inspect(page, native, "ortografía");
    await click(page, ".sheet .btn");
  }
  await inspect(page, native, "ortografía resultado");
  await click(page, ".btn.big");
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(5)");
  await page.fill("#calc-bach", "7,5");
  await page.fill("#calc-pce-1", "6");
  await click(page, ".calc .btn");
  await inspect(page, native, "nota");
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(6)");
  await inspect(page, native, "fuentes universidad");

  // ---------- Exámenes: Conducir ----------
  await backToTab(page, "exams");
  await click(page, ".menu-row:nth-child(3)");
  await inspect(page, native, "conducir");
  for (const path of [[2], [1, 1], [1, 2, 1], [1, 2, 2], [1, 3]]) {
    await click(page, ".menu-row:nth-child(1)");
    for (const opt of path) if (await page.$(".options .opt")) await click(page, `.options .opt:nth-child(${opt})`);
    await inspect(page, native, "conducir mi caso " + path.join(""));
    await click(page, ".back");
  }
  await click(page, ".menu-row:nth-child(2)");
  await inspect(page, native, "conducir temas");
  for (let k = 1; k <= DGT.topics.length; k++) {
    await click(page, `.menu-row:nth-child(${k})`);
    if (k === 1) await inspect(page, native, "conducir ficha");
    await click(page, ".btn.big");
    for (let g = 0; g < 12 && !(await page.$(".btn.big")); g++) {
      await click(page, '.opt[data-ok="1"]');
      if (g === 0 && k === 1) await inspect(page, native, "conducir pregunta");
      await click(page, ".sheet .btn");
    }
    await click(page, ".btn.big");
    await click(page, ".back");
  }
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(3)");
  await click(page, ".btn.big");
  for (let k = 0; k < DGT.mock.questions; k++) {
    await page.click('.exam-q .opt[data-ok="1"]');
    if (k < DGT.mock.questions - 1) await click(page, '.exam-nav .btn:has-text("→")');
  }
  await inspect(page, native, "conducir simulacro");
  await click(page, ".exam-nav .btn >> nth=1");
  await inspect(page, native, "conducir resultado");
  await click(page, ".btn.big");
  await click(page, ".menu-row:nth-child(5)");
  await inspect(page, native, "conducir vocabulario");
  await click(page, ".back");
  await click(page, ".menu-row:nth-child(6)");
  await inspect(page, native, "fuentes conducir");

  // ---------- Perfil ----------
  await backToTab(page, "profile");
  await inspect(page, native, "perfil");
  await page.context().close();
}

await browser.close();
console.log(`${screens} pantallas revisadas en ${LANGS.length} idiomas.`);
if (problems.length) { console.error([...new Set(problems)].join("\n")); console.error(`\n${new Set(problems).size} problemas`); process.exit(1); }
console.log("OK recorrido completo sin problemas.");
