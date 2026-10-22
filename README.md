# Hola, Español

Aplicación para aprender el español que se necesita para vivir en España y preparar los exámenes oficiales (nacionalidad y universidad). La interfaz y las explicaciones están en 12 idiomas. Funciona sin conexión y se puede instalar en el móvil.

- **Bases del producto**: [docs/PRODUCTO.md](docs/PRODUCTO.md)
- **Hoja de ruta** y datos pendientes de verificar: [docs/HOJA_DE_RUTA.md](docs/HOJA_DE_RUTA.md)
- **Contenido y datos oficiales** (formato y reglas): [docs/CONTENIDO.md](docs/CONTENIDO.md)
- **Auditorías**: [docs/AUDITORIA.md](docs/AUDITORIA.md)

## Desarrollo

```
npm install
npm run dev        # servidor de desarrollo
npm run build      # dist/ (app instalable, sin conexión) y dist-single/hola.html (vista previa en un archivo)
npm test           # comprobaciones de contenido + compilación + prueba de humo en navegador
```

La prueba de humo necesita Playwright y Chromium (`PW_CHROMIUM=/ruta/a/chromium` si no están en la ruta por defecto).

## Estructura

```
content/      datos: idiomas, curso, datos oficiales, exámenes
src/core/     estado guardado (con migraciones), idiomas, voz, navegación, registro de datos oficiales
src/ui/       piezas de interfaz: mascota, marco, panel de respuesta, nota de fuente
src/screens/  bienvenida, idioma y ajustes
src/learn/    curso: camino, lección, repaso y perfil
src/styles/   identidad visual
tools/        comprobaciones, prueba de humo, iconos y empaquetado
```
