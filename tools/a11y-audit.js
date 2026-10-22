// Auditoría básica de accesibilidad en un navegador real: recorre las pantallas principales y comprueba
// nombre accesible de controles, tamaño de los botones (mínimo 44 px de alto) y contraste del texto (4,5:1; 3:1 si es grande).
// Uso: node tools/a11y-audit.js  (necesita dist/ compilado: npm run audit compila antes; PW_CHROMIUM=/ruta/a/chromium si hace falta)
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "./playwright.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = 4180;
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "pipe", detached: true });
await new Promise((ok, fail) => {
  server.stdout.on("data", (d) => String(d).includes(String(PORT)) && ok());
  server.on("exit", () => fail(new Error("vite preview no arrancó")));
});
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

// Recorridos: [nombre, datos guardados, clics]. Un clic con «?» delante solo se hace si el elemento está en pantalla.
const TOURS = [
  ["bienvenida", null, []],
  ["camino", { native: "ar" }, []],
  ["lección", { native: "ar" }, [".current .node"]],
  ["respuesta incorrecta", { native: "fr" }, [".current .node", "?.footer .btn", "?.footer .btn", "?.footer .btn", '.opt[data-ok="0"]']],
  ["perfil", { native: "es" }, ['.tab[data-tab="profile"]']],
  ["nivel", { native: "ar", level: null }, []],
  ["objetivo", { native: "ar" }, ['.tab[data-tab="profile"]', '.setting:has-text("🧭")']],
  ["voces", { native: "ur" }, ['.tab[data-tab="profile"]', '.setting:has-text("🔊")']],
  ["dictado", { native: "ar" }, ['.tab[data-tab="review"]', ".menu-row:nth-child(2)", ".menu-row:nth-child(1)", "?#write-answer", ".write-box .btn"]],
  ["diccionario", { native: "zh" }, ['.tab[data-tab="review"]', ".menu-row:nth-child(3)"]],
  // Con errores guardados aparece el contador rojo de la pestaña Repasar.
  ["repasar", { native: "es", mistakes: [{ k: "w", id: "hola" }] }, ['.tab[data-tab="review"]']],
  ["exámenes", { native: "ur" }, ['.tab[data-tab="exams"]']],
  ["nacionalidad", { native: "es" }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(1)"]],
  ["ccse", { native: "es", passes: { nacionalidad: true } }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(1)", ".menu-row:nth-child(1)"]],
  ["pregunta CCSE", { native: "ar", passes: { nacionalidad: true } }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(1)", ".menu-row:nth-child(1)", ".menu-row:nth-child(1)", ".menu-row:nth-child(1)", ".btn.big", '.opt[data-ok="0"] >> nth=0']],
  ["conducir", { native: "ar" }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(3)"]],
  ["universidad", { native: "fr" }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(2)"]],
  ["test PCE", { native: "es" }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(2)", ".menu-row:nth-child(2)", ".menu-row:nth-child(2)", ".btn.big"]],
  ["nota PCE", { native: "ar" }, ['.tab[data-tab="exams"]', ".menu-row:nth-child(2)", ".secondary-actions .link:nth-child(2)"]],
];

const problems = [];
try {
for (const [name, data, clicks] of TOURS) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.addInitScript((s) => {
    delete window.speechSynthesis;
    if (s && !sessionStorage.getItem("seeded")) { localStorage.setItem("hola-espanol", JSON.stringify({ v: 3, level: 0, ...s })); sessionStorage.setItem("seeded", "1"); }
  }, data);
  await page.goto(`http://localhost:${PORT}/`);
  // Un selector con «?» delante es opcional: se pulsa solo si está en pantalla.
  for (const c of clicks) {
    if (c.startsWith("?")) {
      if (await page.$(c.slice(1))) await page.click(c.slice(1), { timeout: 5000 }).catch(() => problems.push(`${name}: no se pudo pulsar ${c}`));
      continue;
    }
    await page.click(c, { timeout: 5000 }).catch(() => problems.push(`${name}: no se pudo pulsar ${c}`));
  }
  await page.waitForTimeout(300);
  const found = await page.evaluate(() => {
    const out = [];
    const lum = (c) => {
      const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    // Fondo efectivo: el primer antepasado con fondo opaco.
    const bg = (e) => {
      for (let n = e; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        const a = c.match(/[\d.]+/g);
        if (a && (a.length < 4 || Number(a[3]) > 0.9)) return c;
      }
      return "rgb(255,255,255)";
    };
    // Nombre accesible: aria-label primero; un nombre hecho solo de símbolos («✕», «›») no sirve a un lector de pantalla.
    const label = (e) => e.getAttribute("aria-label") || e.labels?.[0]?.innerText || e.innerText?.trim() || e.title || e.placeholder;
    const named = (e) => /[\p{L}\p{N}]/u.test(label(e) || "");
    for (const e of document.querySelectorAll("button, a, input, select, textarea")) {
      const r = e.getBoundingClientRect();
      if (!r.width || getComputedStyle(e).visibility === "hidden") continue;
      const desc = (e.tagName + " «" + (label(e) || "").slice(0, 30) + "»");
      if (!named(e)) out.push("sin nombre accesible: " + e.outerHTML.slice(0, 80));
      if (e.tagName === "BUTTON" && r.height < 44) out.push(`botón de ${Math.round(r.height)} px de alto: ${desc}`);
    }
    for (const e of document.querySelectorAll("body *")) {
      // Solo texto propio, sin contar los emojis (son dibujos, no texto).
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\s]/gu, ""));
      if (!own || !e.getBoundingClientRect().width) continue;
      const s = getComputedStyle(e);
      // La transparencia (opacity de la propia caja o de sus antepasados) aclara el texto hacia el fondo.
      let alpha = 1;
      for (let n = e; n; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity);
      if (e.closest(":disabled")) continue; // los controles desactivados no tienen requisito de contraste (WCAG 1.4.3)
      const back = bg(e).match(/[\d.]+/g).slice(0, 3).map(Number);
      const fore = s.color.match(/[\d.]+/g).slice(0, 3).map(Number).map((v, i) => v * alpha + back[i] * (1 - alpha));
      const l1 = lum(`rgb(${fore.join(",")})`), l2 = lum(`rgb(${back.join(",")})`);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const large = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) out.push(`contraste ${ratio.toFixed(2)}: «${e.textContent.trim().slice(0, 40)}»`);
    }
    return [...new Set(out)];
  });
  for (const f of found) problems.push(`${name}: ${f}`);
  await page.context().close();
}
} finally {
  // Pase lo que pase, se cierran el navegador y el servidor (si no, el puerto queda ocupado para la próxima vez).
  await browser.close().catch(() => {});
  try { process.kill(-server.pid); } catch { /* ya cerrado */ }
}
if (problems.length) { console.error(problems.join("\n")); console.error(`\n${problems.length} avisos de accesibilidad`); process.exit(1); }
console.log(`OK accesibilidad: ${TOURS.length} pantallas sin avisos.`);
process.exit(0);
