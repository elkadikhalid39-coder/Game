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
export function migrate(old, known = () => true) {
  const v3 = old.v >= 3;
  // Hasta la v2, el progreso estaba agrupado por idioma de aprendizaje: { es: {...}, en: {...} }.
  const pick = (key, empty) => (v3 ? old[key] : old[key]?.[TARGET]) ?? empty;
  return {
    v: SAVE_VERSION,
    native: old.native && known(old.native) ? old.native : "",
    calm: !!old.calm,
    progress: pick("progress", {}), // { [unidad]: lecciones completadas }
    mistakes: pick("mistakes", []), // [{ k: "w" | "p", id }]
    learned: pick("learned", []), // [ids de palabras acertadas]
    exams: (v3 && old.exams) || {}, // resultados de simulacros: { [examen]: [{ fecha, nota, apto }] }
    passes: (v3 && old.passes) || {}, // pases desbloqueados: { nacionalidad: true }
    noAudioUntil: (v3 && old.noAudioUntil) || 0,
    demo: typeof old.demo === "boolean" ? old.demo : DEMO_DEFAULT, // modo demo: todas las lecciones y los pases abiertos
  };
}

export const save = migrate(load());

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
