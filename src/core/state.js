// Progreso guardado en el dispositivo (localStorage), con migración entre versiones.
// Solo se aprende español; el idioma de la persona es el de la interfaz y las explicaciones.
export const TARGET = "es";
const SAVE_KEY = "hola-espanol";
const SAVE_VERSION = 3;

function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}

// v1 (modo niños, varios idiomas de aprendizaje) y v2 → v3. Se conserva lo aprendido en español.
export function migrate(old, known = () => true) {
  const s = {
    v: SAVE_VERSION,
    native: old.native && known(old.native) ? old.native : "",
    calm: !!old.calm,
    progress: old.progress?.[TARGET] || {}, // { [unidad]: lecciones completadas }
    mistakes: old.mistakes?.[TARGET] || [], // [{ k: "w" | "p", id }]
    learned: old.learned?.[TARGET] || [], // [ids de palabras acertadas]
    exams: old.v >= 3 ? old.exams || {} : {}, // resultados de simulacros: { [examen]: [{ fecha, nota, apto }] }
    passes: old.v >= 3 ? old.passes || {} : {}, // pases desbloqueados: { nacionalidad: true }
    noAudioUntil: 0,
  };
  // Formato v1/v2: los datos estaban agrupados por idioma de aprendizaje.
  if (old.v >= 3) Object.assign(s, { progress: old.progress, mistakes: old.mistakes, learned: old.learned, noAudioUntil: old.noAudioUntil || 0 });
  return s;
}

export const save = migrate(load());

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sin almacenamiento */ }
}
