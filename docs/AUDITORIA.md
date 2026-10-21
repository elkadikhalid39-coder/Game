# Auditorías

Cada dos semanas (o antes de una publicación) repasamos esta lista y anotamos lo encontrado en el registro de abajo.

## Lista de comprobación

### Aprendizaje
- [ ] Cada unidad enseña antes de preguntar (tarjetas "Aprende").
- [ ] La dificultad sube poco a poco y encaja con la edad (ver PLAN, apartado 5).
- [ ] En niños: sin castigos, pista tras dos intentos, todo con audio.
- [ ] Lo que se falla se vuelve a practicar.

### Contenido e idiomas
- [ ] `node tools/check-content.js` pasa sin errores.
- [ ] Un hablante nativo ha revisado cada idioma (anotar quién y cuándo).
- [ ] Las frases no asumen un género cuando no hace falta.
- [ ] Los dibujos representan bien cada palabra en todos los móviles.
- [ ] No hay contenido culturalmente delicado sin necesidad.

### Accesibilidad
- [ ] Los botones miden al menos 48 px, y más en niños.
- [ ] El texto tiene contraste suficiente sobre su fondo.
- [ ] El modo calma quita animaciones y efectos de sonido.
- [ ] Se puede usar con teclado y se ve el foco.
- [ ] Árabe y urdu se muestran de derecha a izquierda.

### Técnica
- [ ] `node tools/smoke-test.js` pasa (todas las unidades, todas las edades).
- [ ] No hay errores en la consola.
- [ ] Funciona en un móvil Android barato y en un iPhone.
- [ ] Hay voz disponible para cada idioma en los móviles de prueba (anotar cuáles faltan).

### Privacidad y legal
- [ ] No se envían datos fuera del dispositivo sin consentimiento.
- [ ] El control parental protege ajustes, compras y enlaces externos.
- [ ] No hay anuncios en el modo niños.
- [ ] Las licencias de imágenes, voces y fuentes permiten el uso previsto.

### Negocio
- [ ] Lo gratuito sigue siendo útil por sí solo.
- [ ] Los precios y lo que incluye cada plan están claros.

## Registro

### 2026-10-21: versión 0.3 (primera auditoría)

**Estado:** 12 idiomas; modo adultos con 6 mundos; modo niños con 3 edades y 11 unidades; control parental; modo calma; prueba automática completa.

**Hallazgos:**
1. Las traducciones no las ha revisado ningún nativo; en árabe, ruso, ucraniano y urdu hay formas en masculino ("¿tienes hambre?").
2. Los emojis cambian según el móvil, y algunos dibujos son flojos (Ñ de ñu 🐃, W de wifi 📶).
3. La voz depende del móvil: puede faltar en urdu, árabe o rumano, y entonces no suena nada.
4. Letras, vocales y sílabas solo existen para aprender español.
5. El progreso se guarda solo en el navegador y hay un único perfil de niño.
6. No funciona sin conexión (todavía no es PWA).
7. El trazado no enseña el orden de los trazos.
8. Contenido para 1–3 años escaso: 3 unidades.
9. Faltan pruebas con usuarios reales y la revisión de un especialista.

**Acciones:** pasan a las fases 1–3 del plan.
