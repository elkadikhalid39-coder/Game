// Carga Playwright del proyecto o, si no está, la instalación global del entorno.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
export const chromium = pw.chromium;
