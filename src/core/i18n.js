// Idiomas de apoyo: textos de interfaz (ui) y traducciones del contenido (t), en content/i18n/<código>.json.
import order from "../../content/i18n/_order.json";
import { save } from "./state.js";

const files = import.meta.glob("../../content/i18n/*.json", { eager: true, import: "default" });
export const LANGS = order;
export const I18N = Object.fromEntries(order.map((code) => [code, files[`../../content/i18n/${code}.json`]]));

export const dirOf = (lang) => I18N[lang]?.dir || "ltr";
const fill = (s, x) => (x === undefined ? s : String(s).replaceAll("{x}", x));
// Texto de interfaz en el idioma de la persona (con el español como reserva).
export const ui = (k, x) => fill((I18N[save.native] || I18N.es).ui[k] ?? I18N.es.ui[k] ?? k, x);
// Traducción de un contenido (palabra, frase, nombre de unidad) a un idioma.
export const tr = (id, lang) => I18N[lang].t[id] ?? I18N.es.t[id] ?? id;
