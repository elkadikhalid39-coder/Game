# Reinicio del producto: elegir un nicho y rehacerlo bien

Documento de traspaso para empezar una sesión nueva. Resume qué hay, por qué no funciona y cómo decidir qué
se queda. Lo que diga este documento sobre cifras del mercado está **por verificar**: la primera tarea es
comprobarlo con fuentes.

## Diagnóstico (22/10/2026)

La app mezcla cuatro productos con públicos distintos:

| Parte | Para quién | Problema |
| --- | --- | --- |
| Curso de español desde cero (11 unidades) | Recién llegados sin español | Compite con Duolingo, Babbel, etc. Contenido corto y básico, audio sintético que repite las mismas frases. |
| Nacionalidad: CCSE + DELE A2 + «Mi caso» | Residentes que piden la nacionalidad | Nivel muy superior al del curso: quien empieza de cero no puede hacerlo. |
| Carnet de conducir (DGT, permiso B) | Cualquiera que se saque el carnet | Muy por debajo de la competencia: unos 9 preguntas por tema frente a miles de preguntas (Todotest, AutoescuelaApp…), sin fotos ni señales reales. |
| Universidad: PCE UNEDasiss | Estudiantes extranjeros que entran a la universidad | Público pequeño pero coherente; mucho temario (25 materias). |

Además, el diseño es pobre: sin fotos ni ilustraciones, sin una identidad clara, tres estilos distintos en una sesión.

## Qué se puede reutilizar

- **Datos con fuente** (`content/facts/`, 143 datos con fuente, estado y fecha de revisión) y el comprobador `tools/check-facts.js`.
- **CCSE**: 300 preguntas con explicación y fuente (`content/exams/ccse.json`), glosario en 11 idiomas.
- **DELE A2**: 2 modelos completos (lectura, auditiva con audio a dos voces, escritura, oral).
- **PCE**: fichas de 25 materias y 62 preguntas de test.
- **Técnica**: Vite + JS sin framework, interfaz en 12 idiomas (árabe y urdu de derecha a izquierda), audio sin conexión por paquetes,
  migración del progreso guardado, pruebas en navegador (`npm test`) y auditoría de accesibilidad.

## Opciones de nicho a comparar

Criterios: tamaño del problema, competencia, si existen **datos oficiales** que lo sostengan, qué ventaja propia
tenemos (idiomas de la interfaz, explicación con fuente) y cuánto contenido hace falta para ser mejor que lo que ya hay.

1. **Nacionalidad española por residencia** (CCSE + DELE A2 + trámite paso a paso), en el idioma de cada persona.
   Fuentes oficiales: manual CCSE del Instituto Cervantes (las preguntas del examen salen de ahí), Código Civil, sede de Justicia.
   Ventaja posible: explicación en 11 idiomas y el trámite completo en un sitio. Por verificar: cuántas personas lo piden al año y qué apps hay.
2. **Acceso a la universidad para estudiantes extranjeros** (PCE UNEDasiss + homologación + ruta).
   Fuentes: UNEDasiss (exámenes anteriores, guías por materia). Por verificar: número de candidatos, qué academias y apps compiten.
3. **Español para el trámite** (no un curso general): frases y documentos para cita previa, padrón, médico, trabajo.
   Solo tendría sentido como apoyo de la opción 1 o 2, no como producto que compita con Duolingo.
4. **Carnet de conducir**: descartar salvo que se encuentre un hueco claro (p. ej. canje de permisos extranjeros explicado en
   su idioma). Igualar el banco de preguntas de la competencia no es realista.

## Cómo seguir

1. **Investigar** (sin tocar código): para cada opción, cifras oficiales, competencia (apps, precios, número de preguntas,
   reseñas) y qué documentos oficiales existen. Cada dato, con enlace y fecha.
2. **Decidir** un nicho (como mucho uno principal y uno de apoyo) con una tabla comparativa.
3. **Rehacer la estructura** solo para ese nicho: quitar lo demás del producto (dejarlo en una rama, no borrarlo de la historia).
4. **Contenido verídico primero**: cada pregunta cuelga de un dato con fuente; nada inventado ni reescrito de memoria.
5. **Diseño con medios reales**: fotos e ilustraciones con licencia clara (o encargadas), una sola identidad visual.
6. **Audio**: decidir si voces sintéticas bastan o hacen falta grabaciones; no repetir las mismas frases.

## Reglas que siguen vigentes

- No cambiar el formato guardado sin migración (clave `hola-espanol`, `src/core/state.js`).
- Textos de interfaz en los 12 idiomas (`tools/add-ui.js`); las preguntas de examen no se traducen.
- Lo que está en borrador no pasa a confirmado sin revisión.
- `npm test` en verde antes de cada push.
