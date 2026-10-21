# Hola, Español 🌍

Juego para aprender idiomas pensado para personas inmigrantes y sus hijos.

- **12 idiomas** (español, inglés, francés, árabe, rumano, ucraniano, ruso, portugués, chino, urdu, alemán, italiano): la persona elige el que habla y el que quiere aprender.
- **Modo adultos**: 6 mundos de vocabulario y frases útiles, vidas, estrellas y racha.
- **Modo niños (1–3, 3–5, 5–7 años)**: lenguaje, números y "mi mundo"; tarjetas para aprender y luego jugar; trazado de letras, sílabas, contar y sumas. Sin vidas ni tiempo, pensado para niños con dificultades de aprendizaje. Control parental y modo calma.

El plan del producto (competencia, edades, negocio, hoja de ruta) está en [docs/PLAN.md](docs/PLAN.md) y la guía de auditorías en [docs/AUDITORIA.md](docs/AUDITORIA.md).

## Probar
Abre `index.html` en el navegador, o genera un único archivo con `tools/build.sh` (sale en `dist/hola.html`).

## Comprobaciones
- `node tools/check-content.js`: todos los idiomas tienen todos los textos.
- `node tools/smoke-test.js`: juega en un navegador real todas las unidades (necesita Playwright; `PW_CHROMIUM=/ruta/a/chromium` si hace falta).

## Estructura
- `js/i18n/<idioma>.js`: textos de cada idioma (`es.js` es la referencia).
- `js/content.js`: mundos de adultos, unidades de niños, letras y sílabas.
- `js/core.js`: guardado, voz, navegación, ajustes y control parental.
- `js/adult.js` y `js/kids.js`: cada modo de juego.
