// Convierte dist-single/ en un único HTML (dist-single/hola.html) con el CSS, el JS y las fuentes dentro.
// Se usa para la vista previa publicada, que no admite archivos sueltos ni service worker.
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../dist-single/", import.meta.url);
let html = readFileSync(new URL("index.html", dir), "utf8");
const read = (href) => readFileSync(new URL(href.replace(/^\.\//, ""), dir), "utf8");

const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => read(m[1])).join("\n");
const js = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((m) => read(m[1])).join("\n");
const title = html.match(/<title>.*?<\/title>/)[0];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, "").trim();
// Sin <html>, <head> ni <body>: la página que lo publica pone su propio esqueleto.
// Los iconos no se incluyen (son archivos aparte).
const out = `${title}
<meta name="claude:viewport-fit-sides" content="cover">
<style>${css}</style>
${body}
<script type="module">${js.replaceAll("</script", "<\\/script")}</script>
`;
writeFileSync(new URL("hola.html", dir), out);
console.log(`dist-single/hola.html (${Math.round(out.length / 1024)} KB)`);
