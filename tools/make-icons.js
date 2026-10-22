// Genera los iconos PNG de la app instalable a partir de public/icons/icon.svg.
// Uso: node tools/make-icons.js   (necesita Playwright)
import { readFileSync } from "node:fs";
import { chromium } from "./playwright.js";

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();
// [archivo, tamaño, margen]: el icono «maskable» deja margen porque Android lo recorta en círculo.
for (const [name, size, pad] of [["icon-192.png", 192, 0.1], ["icon-512.png", 512, 0.1], ["maskable-512.png", 512, 0.22]]) {
  const inner = Math.round(size * (1 - 2 * pad));
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:#eaf2ff">
    <div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", '<svg width="100%" height="100%" ')}</div></body>`);
  await page.screenshot({ path: new URL("../public/icons/" + name, import.meta.url).pathname });
}
await browser.close();
console.log("Iconos generados");
