# Hoja de ruta

Cada fase termina con la prueba automática en verde, un enlace para probar y un resumen de lo que cambió y de lo que queda por decidir. Las semanas son orientativas.

## Fase 0: depuración y bases (hecha)

- [x] Bases del producto en [PRODUCTO.md](PRODUCTO.md).
- [x] Fuera el modo niños, el aprendizaje de otros idiomas, las vidas, las rachas y los puntos.
- [x] Los errores de una lección vuelven al final de esa misma lección.
- [x] Código, pruebas y documentación limpios.

## Fase 1: estructura técnica (hecha)

- [x] Proyecto con módulos y Vite, sin framework.
- [x] Datos de contenido en archivos separados del código (`content/`).
- [x] Funciona sin internet (PWA) e instalable, con las fuentes tipográficas incluidas.
- [x] Registro de datos legales con fuente, estado y fecha de comprobación ([CONTENIDO.md](CONTENIDO.md)), más una comprobación automática que falla si falta algo.
- [x] Migración del progreso guardado.

## Fase 2: curso A1 (hecha)

- [x] Motor de lecciones según los principios:
  - audio normal y lento en todo;
  - «No puedo escuchar ahora» (15 minutos sin ejercicios de escuchar) y «Saltar»;
  - ejercicio de escribir con corrección tolerante (tildes, artículos, una errata) y teclas con las letras del español;
  - ejercicio de ordenar palabras;
  - práctica final de premio en cada unidad;
  - cabecera fija con la unidad y su objetivo.
- [x] Objetivo «Ya sé…» en cada unidad, celebración al conseguirlo y lista en el perfil.
- [x] Unidades nuevas: Trabajo, Vivienda y Papeleo (9 unidades, 36 lecciones).
- [ ] Revisión de las unidades con el Plan Curricular del Instituto Cervantes. Pendiente: no se ha podido leer todavía.

## Fase 3: pase de Nacionalidad (hecha, en estado «borrador»)

- [x] Datos verificados en el BOE el 22/10/2026 (Código Civil art. 22, RD 1004/2015, Orden JUS/1625/2016 consolidada, LO 3/2018 art. 7): 44 datos con fuente, estado y fecha en `content/facts/`.
- [x] «Mi trámite»: 6 preguntas como máximo → lista personalizada (residencia, pruebas, dispensa, documentos, presentación, plazos, validez), cada punto con su fuente oficial. Gratis.
- [x] CCSE: 60 preguntas originales con la proporción del manual (24, 7, 5, 7, 17), práctica por tareas con explicación y fuente, simulacro de 25 preguntas en 45 minutos, apto con 15 y aciertos por tarea.
- [x] DELE A2: simulacro original de las cuatro pruebas con el formato de la guía oficial (lectura y auditiva de 25 preguntas, audio dos veces con dos voces; escritura con contador de palabras; oral con 12 minutos de preparación y examinador), autoevaluación con rúbrica y estimación por grupos.
- [x] Muestra gratuita (Mi trámite y 5 preguntas del CCSE) y desbloqueo del pase simulado (sin pago).
- [ ] Ampliar el banco CCSE a 300 preguntas.
- [ ] Más simulacros del DELE A2 y voces grabadas para la auditiva.
- [ ] Volver a comprobar los datos del Instituto Cervantes (su web estaba en mantenimiento el 22/10/2026).

**Correcciones a la investigación encontradas al verificar:**
- Los certificados oficiales de idiomas eximen solo del DELE, no del CCSE (RD 1004/2015, disposición adicional cuarta).
- El Tribunal Supremo anuló en 2024 el inciso del art. 12.1 del RD 1004/2015 que dejaba sin efecto la concesión por perder la «buena conducta cívica» antes de jurar.
- La vigencia de 4 años es del certificado CCSE (Orden JUS/1625/2016, art. 10.4).
- La dispensa por edad (70 años o más) o discapacidad (65 % o más) no aparece en la normativa oficial leída: se muestra como «sin confirmar».

## Fase 4: pase de Universidad (hecha, en estado «borrador»)

- [x] 23 datos verificados el 22/10/2026 en fuentes oficiales (UNEDasiss, guías PCE 2025-26 de la UNED, RD 534/2024 y RD 482/2025, Ministerio de Educación) en `content/facts/universidad.json`.
- [x] «Mi ruta a la universidad»: 3 preguntas como máximo (dónde terminó el bachillerato, si necesita visado, universidad pública o privada) → pasos con su fuente: homologación, acreditación UNEDasiss, materias, plazos, día del examen, inscripción, nota, visado (trámite aparte) y aviso del proyecto de reforma. Gratis.
- [x] Materias PCE: las 25 materias oficiales con su tipo de prueba, guía, modelo de examen y fecha de la guía. Ficha completa (formato, puntuación, programa) de las 5 guías leídas: Lengua, Historia de España, Inglés, Matemáticas y Matemáticas Aplicadas a las CC. SS.
- [x] Simulacros de la parte de test con la puntuación de cada guía (aciertos, errores que restan, máximo de respuestas que cuentan y aviso si se responde de más): Historia (18 preguntas originales), Inglés (12, muestra gratis), Matemáticas (16) y MACS (16).
- [x] Redacción académica (bloque 1 de Lengua): 2 textos originales con resumen, tema e ideas, y texto argumentativo; contador de líneas aproximado, lista de comprobación, modelos, conectores y práctica de los errores que restan.
- [x] Calculadora de nota de acceso y de admisión, marcada como estimación (la fórmula 60/40 es de fuente secundaria).
- [ ] Fichas de las otras 20 materias (leer sus guías).
- [ ] Simulacros de la parte de desarrollo (comentario de texto, temas, problemas) con rúbrica.
- [x] Visado de estudios confirmado el 22/10/2026 en el Real Decreto 1155/2024 (arts. 34 a 36, 53 y 54) y en una ficha consular de junio de 2025.
- [ ] Confirmar en fuente oficial la fórmula de la nota de acceso con PCE (solo la publican universidades, como la UPM).

## Fase 5: calidad y lanzamiento (en curso)

Hecho el 22/10/2026: auditoría automática de accesibilidad (`tools/a11y-audit.js`, incluida en `npm test`) y corrección de contraste y tamaños, revisión de datos caducados (`npm run audit`) y registro en [AUDITORIA.md](AUDITORIA.md). Lo que sigue necesita personas o cuentas externas:


- [ ] Revisión por especialistas (profesor de español acreditado y profesional jurídico) y paso de *borrador* a *publicado*.
- [ ] Voces de calidad para todo el contenido.
- [ ] Revisión de traducciones por nativos.
- [x] Accesibilidad automática y privacidad (edad mínima de 14 años confirmada en la LO 3/2018, art. 7).
- [ ] Prueba con lector de pantalla (TalkBack y VoiceOver) y en móviles reales.
- [ ] Empaquetado para Android e iOS y pagos.
- [ ] Beta cerrada con usuarios reales (una ONG o una escuela de adultos).

## Después del lanzamiento

- Nivel 0 de alfabetización (LASLLIAM).
- Unidades A2 completas.
- Micrófono para practicar la pronunciación.
- Licencias para entidades.

## Datos pendientes de verificar en fuente oficial

| Dato | Dónde mirarlo |
|---|---|
| Dispensa por edad (70 años o más) o discapacidad (65 % o más) | Sede del Ministerio de Justicia |
| Caso de la ESO cursada en España (exención del DELE, del CCSE o solo de la dispensa previa) | Orden JUS/1018/2022 y sede del Ministerio de Justicia |
| Reparto de preguntas por tarea en el examen CCSE (10, 3, 2, 3 y 7) y que los errores no restan | Especificaciones de la prueba CCSE (web del Cervantes en mantenimiento el 22/10/2026) |
| Duración y reglas de cada PCE (confirmadas solo en 5 materias) | Guía de cada materia en UNEDasiss |
| Fórmula de la nota de acceso con PCE (60 % + 40 %) | Normativa de la UNED o del Ministerio de Universidades |
| Plan Curricular A1–A2, manual CCSE 2026 completo y capítulo 4 de LASLLIAM | Instituto Cervantes y Consejo de Europa |
