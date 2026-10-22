// Progreso guardado en el dispositivo (localStorage), con migración entre versiones.
// Solo se aprende español; el idioma de la persona es el de la interfaz y las explicaciones.
export const TARGET = "es";
const SAVE_KEY = "hola-espanol";
const SAVE_VERSION = 3;
// La vista previa publicada (compilación de un solo archivo) es una demo: arranca con todo desbloqueado.
const DEMO_DEFAULT = import.meta.env?.MODE === "single";

function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}

// v1 (modo niños, varios idiomas de aprendizaje) y v2 → v3. Se conserva lo aprendido en español.
export const GOALS = ["daily", "nat", "drive", "uni", "unknown"];
export function migrate(old, known = () => true) {
  const v3 = old.v >= 3;
  // Hasta la v2, el progreso estaba agrupado por idioma de aprendizaje: { es: {...}, en: {...} }.
  const pick = (key, empty) => (v3 ? old[key] : old[key]?.[TARGET]) ?? empty;
  const hadProgress = Object.keys(pick("progress", {})).length > 0 || pick("learned", []).length > 0;
  return {
    v: SAVE_VERSION,
    native: old.native && known(old.native) ? old.native : "",
    calm: !!old.calm,
    voice: (v3 && old.voice) || "neutra", // voz del audio en español (content/voices.json)
    rhythm: (v3 && old.rhythm) || "normal", // manera de hablar: slow | normal | fast
    // Nivel de español que dice tener (0 de cero · 1 un poco · 2 me defiendo · 3 bastante bien); null: aún no se ha preguntado.
    // Quien ya tenía progreso no vuelve a ver las preguntas iniciales: nivel 0 y entra al camino.
    level: [0, 1, 2, 3].includes(old.level) ? old.level : hadProgress ? 0 : null,
    // Qué necesita ahora: daily | nat | drive | uni | unknown; null: no se ha preguntado (se abre el camino).
    goal: GOALS.includes(old.goal) ? old.goal : null,
    // Lo último que dejó a medias, para la tarjeta «Continuar»: { kind: "lesson", unit, li } o { kind: "exam", route, arg }.
    resume: (v3 && old.resume) || null,
    progress: pick("progress", {}), // { [unidad]: lecciones completadas }
    mistakes: pick("mistakes", []), // [{ k: "w" | "p", id }]
    learned: pick("learned", []), // [ids de palabras acertadas]
    exams: (v3 && old.exams) || {}, // resultados de simulacros: { [examen]: [{ fecha, nota, apto }] }
    passes: (v3 && old.passes) || {}, // pases desbloqueados: { nacionalidad: true }
    noAudioUntil: (v3 && old.noAudioUntil) || 0,
    deleModel: (v3 && old.deleModel) || 0, // simulacro DELE elegido (0: modelo 1, 1: modelo 2)
    ccseFails: (v3 && old.ccseFails) || [], // preguntas falladas del CCSE, para repasarlas
    drivingFails: (v3 && old.drivingFails) || [], // preguntas falladas del test de conducir, para repasarlas
    demo: typeof old.demo === "boolean" ? old.demo : DEMO_DEFAULT, // modo demo: todas las lecciones y los pases abiertos
  };
}

export const save = migrate(load());

// Lo último empezado y no terminado (tarjeta «Continuar»). Se borra al terminarlo.
export function setResume(r) { save.resume = r; persist(); }
export function clearResume(kind) { if (save.resume?.kind === kind) { save.resume = null; persist(); } }

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
