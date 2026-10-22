// Cálculos de las PCE, sin pantalla (se prueban en tools/unit-tests.js).

// Corrección de un test según la guía: solo cuentan las primeras `max` preguntas respondidas, en el orden del examen;
// acierto +right, error −wrong, en blanco 0, y el bloque nunca baja de 0.
export function scoreTest(t, list, answers) {
  let counted = 0, total = 0;
  const marks = list.map((q, k) => {
    if (answers[k] === null) return "blank";
    if (counted >= t.max) return "ignored";
    counted++;
    const ok = answers[k] === q.answer;
    total += ok ? t.right : -t.wrong;
    return ok ? "right" : "wrong";
  });
  return { score: Math.max(0, Math.round(total * 100) / 100), marks };
}

// Estimación (fuente secundaria, dato «pce.nota»): acceso = 60 % bachillerato + 40 % media de las PCE;
// admisión = acceso + las dos mejores materias ponderadas (RD 534/2024, art. 22.3: tres decimales).
export function grades(bach, access, weighted) {
  const avg = access.reduce((a, b) => a + b, 0) / access.length;
  const acc = Math.round((0.6 * bach + 0.4 * avg) * 1000) / 1000;
  const extra = weighted.map(([g, w]) => g * w).sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0);
  return { access: acc, admission: Math.round((acc + extra) * 1000) / 1000 };
}
