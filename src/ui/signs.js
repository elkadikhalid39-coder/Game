// Señales de tráfico de las preguntas. La app no tiene los pictogramas oficiales y no dibuja una
// señal aproximada: describe con palabras su forma y su color, y dice qué señal es (código del catálogo).
import { ui } from "../core/i18n.js";
import { el } from "./dom.js";
import data from "../../content/exams/senales.json";

const SIGNS = data.signs;
export const SIGN_CODES = Object.keys(SIGNS);

export function signCard(code) {
  const [id, n = ""] = code.split(":");
  const box = el("div", "sign-card");
  box.lang = "es";
  box.dir = "ltr";
  box.append(el("span", "sign-code", ui("roadSign") + (id === "P" ? "" : " " + id)), el("p", "", SIGNS[id].replace("{n}", n)));
  return box;
}
