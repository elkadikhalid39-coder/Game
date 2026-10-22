# Contenido y datos oficiales

Cómo se añade contenido a la app sin romper las reglas de [PRODUCTO.md](PRODUCTO.md) (apartado 6).

## Dónde está cada cosa

| Carpeta | Qué contiene |
|---|---|
| `content/i18n/<idioma>.json` | Textos de interfaz (`ui`) y traducciones del curso (`t`) de cada idioma de apoyo. `es.json` es la referencia. `_order.json` fija el orden en pantalla. |
| `content/course/units.json` | Unidades del curso: palabras (id + dibujo), frases (id + respuestas incorrectas) y objetivo. |
| `content/facts/*.json` | Datos legales y de examen con su fuente (ver abajo). |
| `content/exams/ccse.json`, `dele-a2.json` | Pase de Nacionalidad: banco CCSE y simulacro DELE A2. |
| `content/exams/pce.json` | Pase de Universidad: las 25 materias PCE (guía, modelo, tipo), fichas, bancos de test con la puntuación de cada guía y redacción académica. Lo comprueba `tools/check-exams.js` (la puntuación máxima debe salir de las reglas y los textos modelo deben cumplir las líneas de la guía). |

## Datos oficiales (`content/facts/*.json`)

Cada archivo es una lista de datos. Formato:

```json
{
  "id": "nac.plazo_resolucion",
  "text": "El Ministerio de Justicia tiene un año para resolver; si no responde, la solicitud se entiende denegada.",
  "note": "Texto opcional con matices.",
  "status": "confirmado",
  "sources": [
    { "name": "Real Decreto 1004/2015, art. 11.3", "url": "https://www.boe.es/buscar/act.php?id=BOE-A-2015-12047", "official": true }
  ],
  "checked": "2026-10-22",
  "reviewDays": 180
}
```

- `status`:
  - `confirmado`: leído en una fuente oficial. Exige al menos una fuente con `official: true`.
  - `fuente_secundaria`: solo lo dicen fuentes no oficiales (academias, abogados, blogs).
  - `sin_confirmar`: dudoso o contradictorio. La app lo muestra en rojo.
- `text` va en español sencillo. Las traducciones de datos legales son orientativas y se marcan así.
- **No se escriben precios, tasas ni fechas de convocatoria.** Se enlaza a la página oficial.
- `reviewDays`: cada cuánto hay que volver a comprobarlo. `node tools/check-facts.js` avisa cuando toca, y con `--strict` (antes de publicar) falla.

En la app, `factNote(id)` muestra el dato con su estado, su fuente y la fecha de comprobación, y `sourceLine(id)` muestra solo la línea de fuente.

## Contenido de examen

- Siempre original: nunca se copian preguntas, textos ni audios de manuales o exámenes oficiales.
- Cada pregunta lleva `status`: `borrador` → `revisado` → `publicado`. Hasta la revisión por especialistas todo es `borrador`, y la app lo indica.
- Cuando una pregunta depende de un dato que cambia (población, número de comunidades, cargos), lleva la referencia a su fuente y el año.

## Comprobaciones

```
npm run check     # textos completos en los 12 idiomas y registro de datos válido
npm test          # lo anterior + compilar + prueba de humo en navegador (incluye sin conexión) + accesibilidad
npm run audit     # antes de publicar: accesibilidad y datos caducados (falla si alguno ha superado su revisión)
```
