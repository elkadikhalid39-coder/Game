# Auditorías

Al cerrar cada fase, y siempre antes de publicar, se repasa esta lista y se anota el resultado en el registro de abajo.

## Lista de comprobación

### Producto
- [ ] Todo lo desarrollado encaja en [PRODUCTO.md](PRODUCTO.md). Lo que no encaja, se quita o se apunta como «fuera de esta app».
- [ ] Ninguna pantalla depende de saber leer español para entender cómo se usa.

### Aprendizaje
- [ ] Cada unidad tiene su objetivo «Ya sé…» y enseña antes de preguntar.
- [ ] Las lecciones duran entre 3 y 5 minutos.
- [ ] Los errores vuelven en la misma lección y en Repasar.

### Contenido y fuentes (obligatorio en los pases de pago)
- [ ] La comprobación automática de contenido y de datos pasa sin errores.
- [ ] Cada dato legal o de examen tiene fuente, estado y fecha de comprobación, y ninguno ha superado su fecha de revisión.
- [ ] No hay precios, tasas ni fechas de convocatoria escritos en el contenido.
- [ ] El contenido de examen es original y está revisado por especialistas antes de pasar a *publicado*.
- [ ] Un hablante nativo ha revisado las traducciones (anotar quién y cuándo).

### Accesibilidad
- [ ] Los botones miden al menos 48 px y el texto tiene contraste suficiente.
- [ ] Árabe y urdu se muestran de derecha a izquierda.
- [ ] El modo calma quita animaciones y efectos de sonido.

### Técnica
- [ ] `npm test` pasa (contenido, datos, exámenes, pruebas unitarias, compilación, prueba de humo y accesibilidad).
- [ ] `node tools/check-facts.js --strict` pasa: ningún dato ha superado su fecha de revisión.
- [ ] No hay errores en la consola.
- [ ] Funciona en un Android barato y en un iPhone, también sin conexión.

### Privacidad
- [ ] No sale ningún dato personal del móvil sin consentimiento.
- [ ] No hay anuncios ni analítica con datos personales.

## Registro

### 2026-10-22: fases 1 a 5 (versión para probar)

**Resultado de la lista:**

| Apartado | Estado | Notas |
|---|---|---|
| Producto | ✅ | Todo encaja en PRODUCTO.md. Sin modo niños, sin otros idiomas, sin vidas ni rachas. |
| Aprendizaje | ✅ | 9 unidades con objetivo «Ya sé…»; los errores vuelven en la lección y en Repasar. Falta revisar las unidades con el Plan Curricular del Instituto Cervantes. |
| Contenido y fuentes | ⚠️ | 67 datos con fuente, estado y fecha; `check-facts --strict` pasa. Sin precios, tasas ni fechas escritas (solo precios inventados en ejercicios de A1 y del DELE, que no son tasas). **Todo el contenido de examen está en *borrador*: falta la revisión de un profesor acreditado y de un profesional jurídico.** Traducciones sin revisar por nativos. |
| Accesibilidad | ✅ con límites | `tools/a11y-audit.js` en 11 pantallas: botones de 44 px como mínimo, contraste de 4,5:1 y nombres accesibles. Se corrigieron el verde de los botones (2,5:1 → 5,3:1), el rojo del panel de error, dos colores de unidad y cinco botones pequeños. Árabe y urdu de derecha a izquierda. Falta probar con lector de pantalla real. |
| Técnica | ✅ con límites | `npm test` en verde: 24 pruebas de humo (incluida sin conexión y archivo único) y 18 unitarias. Falta probar en un Android barato y en un iPhone. |
| Privacidad | ✅ | Sin peticiones de red propias, sin anuncios ni analítica; el progreso se guarda solo en el móvil. |

**Datos marcados como no confirmados** (se muestran en la app en amarillo o rojo): reparto de preguntas por tarea del CCSE, dispensa por edad o discapacidad, fórmula 60/40 de la nota con PCE y requisitos actuales del visado de estudios.


### 2026-10-22: fase 0, depuración y bases

**Cambios:**
- Se fijan las bases del producto: aprender español para vivir en España (gratis) y pases de pago para los exámenes oficiales.
- Se retiran el modo niños, el aprendizaje de otros idiomas, las vidas, las rachas y los puntos.
- Los errores se repiten al final de la lección.

**Pendiente:** los datos de la tabla «Datos pendientes» de [HOJA_DE_RUTA.md](HOJA_DE_RUTA.md). Las traducciones siguen sin revisar por nativos.

### 2026-10-21: versión 0.3

Primera auditoría (modo niños incluido, hoy retirado). Sus hallazgos sobre traducciones, voces, emojis, falta de funcionamiento sin conexión y falta de pruebas con usuarios siguen vigentes y están en la hoja de ruta.
