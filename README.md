# Hola, Español

Aplicación para aprender el español que se necesita para vivir en España y preparar los exámenes oficiales (nacionalidad y universidad). La interfaz y las explicaciones están en 12 idiomas.

- **Bases del producto** (qué es, para quién, estructura, reglas de contenido y fuentes, decisiones): [docs/PRODUCTO.md](docs/PRODUCTO.md)
- **Hoja de ruta** y datos pendientes de verificar: [docs/HOJA_DE_RUTA.md](docs/HOJA_DE_RUTA.md)
- **Auditorías**: [docs/AUDITORIA.md](docs/AUDITORIA.md)

## Estado

Fase 0 terminada: curso con 6 unidades (camino de lecciones, repaso de errores, perfil). Los pases de examen empiezan en la fase 3.

## Probar
Abre `index.html` en el navegador, o genera un único archivo con `tools/build.sh` (sale en `dist/hola.html`).

## Comprobaciones
- `node tools/check-content.js`: todos los idiomas tienen todos los textos y el contenido no usa ids inexistentes.
- `node tools/smoke-test.js`: recorre la app en un navegador real (necesita Playwright; `PW_CHROMIUM=/ruta/a/chromium` si hace falta).

## Estructura
- `js/i18n/<idioma>.js`: textos de cada idioma de apoyo (`es.js` es la referencia).
- `js/content.js`: unidades del curso.
- `js/core.js`: progreso guardado (con migración), idiomas, voz y navegación.
- `js/ui.js`: piezas de interfaz (mascota, globo, barras, panel de respuesta).
- `js/onboarding.js`: bienvenida, idioma y ajustes.
- `js/learn.js`: camino de lecciones, lección, repaso y perfil.
- `css/style.css`: identidad visual.
