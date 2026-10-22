# Hola, Español: bases del producto

Versión del 22 de octubre de 2026. Este documento manda sobre cualquier otro del repositorio. Si una idea no encaja aquí, no se desarrolla, o se apunta en «Fuera de esta app».

## 1. Qué es

**Hola, Español es una aplicación para aprender el español que se necesita para vivir en España y para aprobar los exámenes oficiales que exige el país.**

No es un juego. Usa recursos de las apps de idiomas (lecciones cortas, audio, corrección inmediata, repaso) solo cuando ayudan a aprender.

## 2. Para quién

Jóvenes y adultos que viven en España o van a venir, con un nivel de español de cero a A2.

- La interfaz y las explicaciones están en su idioma: 12 idiomas de apoyo (español, inglés, francés, árabe, rumano, ucraniano, ruso, portugués, chino, urdu, alemán e italiano).
- Se puede usar con poca lectura: todo lleva audio y dibujo.
- También sirve a quien ya habla español (por ejemplo, de Latinoamérica) y necesita preparar el examen CCSE o la universidad.

## 3. El problema que resuelve

1. **Comunicarse en situaciones reales**: médico, trabajo, vivienda, papeleo. Las clases gratuitas tienen listas de espera y horarios que no encajan con el trabajo.
2. **Aprobar los exámenes oficiales**: los requisitos están dispersos en normas y webs oficiales, cambian y se explican mal. La preparación privada cuesta dinero por hora de clase.

## 4. Estructura

La app tiene dos partes.

### Aprender (gratis)

Un curso de español de A1 a A2, organizado por situaciones de la vida en España:

| Nivel | Unidades |
|---|---|
| A1 | Primeros pasos · Números y datos personales · Comida y compras · Familia · La ciudad y el transporte · Salud |
| A1–A2 | Trabajo · Vivienda · Papeleo (cita previa, empadronamiento, formularios, contratos) |
| A2 | Por definir con el Plan Curricular del Instituto Cervantes |

- Cada unidad empieza con un objetivo concreto: «Al terminar podrás pedir cita en el médico».
- Cada unidad tiene lecciones cortas de 3 a 5 minutos (palabras, escuchar, frases y una práctica final de premio).
- **Cada palabra se presenta antes de preguntarla** y se practica sobre todo **escribiéndola**: al dictado (se oye y se escribe) y desde su idioma. Reconocer entre opciones solo se usa justo después de presentar la palabra.
- **Solo se usa un dibujo si representa la palabra sin dudas** (🍞 pan, 🚑 ambulancia). Las palabras abstractas o dudosas (adiós, por favor, perdón, alquiler…) no llevan dibujo, y los botones usan iconos con texto, no emojis.
- **Nunca se pregunta solo con un dibujo**: un emoji se interpreta de muchas maneras (🥺 puede ser «por favor», «perdón» o «lo siento»). El dibujo acompaña a la palabra o a la traducción, nunca las sustituye. Quien tiene el español como idioma hace dictados en lugar de ejercicios de traducción.
- La corrección marca **en qué letra está el fallo** (también las tildes), no solo si está bien o mal.
- Las pistas nunca resuelven la palabra: primero dicen cuántas letras tiene y después la primera letra. Una palabra acertada con pista vuelve a Repasar.
- Los errores vuelven al final de la lección y en la pestaña Practicar.

### Practicar (gratis)

| Apartado | Estado |
|---|---|
| **Mis errores**: lo que se ha fallado, para repasarlo | Hecho |
| **Dictado** de palabras y de frases, con la corrección letra a letra | Hecho |
| **Diccionario** de las palabras del curso, con audio y búsqueda en español o en su idioma | Hecho |
| **Escribir un texto** (unas 10 líneas) y recibir la corrección de los fallos | Necesita IA (ver abajo) |
| **Cámara**: hacer una foto a un objeto y saber cómo se dice en español | Necesita IA (ver abajo) |
| **Tutor con IA**: preguntar dudas y practicar conversaciones | Necesita IA (ver abajo) |

### Funciones con IA (planificadas)

La corrección de textos libres, la cámara y el tutor necesitan un modelo de IA. Antes de construirlas hay que decidir:

1. **Servidor propio.** La clave de la IA no puede ir dentro de la app. Hace falta un pequeño servidor que reciba la petición y llame a la IA.
2. **Coste.** Cada corrección o foto cuesta dinero. Propuesta: incluirlas en los pases de pago, o un número limitado de usos gratis al día.
3. **Privacidad.** Los textos y las fotos salen del móvil. Hace falta consentimiento explícito, no guardar nada en el servidor, avisar de no fotografiar a personas ni documentos, y, para menores de 14 años, consentimiento de los padres.
4. **Sin conexión.** Estas funciones solo van con internet; el resto de la app sigue funcionando sin conexión.
5. **Calidad.** La IA corrige, pero puede equivocarse: la app lo dice y no la usa para datos legales ni de examen oficiales.
- No hay vidas, ligas, rachas, anuncios ni registro obligatorio.

### Exámenes oficiales (de pago)

Preparación profesional de los exámenes que se exigen en España. Cada examen es un **pase de pago** independiente, porque se prepara una vez y no hace falta una suscripción para siempre. Cada pase tiene una muestra gratuita para que se vea su calidad antes de pagar.

| Pase | Contenido |
|---|---|
| **Nacionalidad española** | «Mi trámite» (lista de comprobación personalizada) · CCSE (temario por tareas, banco de preguntas, simulacro) · DELE A2 (las cuatro pruebas, simulacros, rúbricas, día del examen) |
| **Universidad en España** | «Mi ruta a la universidad» (homologación, UNEDasiss, PCE, inscripción) · fichas por materia · redacción académica en español · simulacros |

**Por ser de pago, este contenido tiene que ser oficial, correcto y estar actualizado.** Las reglas del apartado 6 son obligatorias.

## 5. Principios de diseño

1. Audio en todas las frases, con botón de velocidad lenta. Dibujo o imagen de apoyo siempre que sea posible.
2. Salidas sin culpa: «No puedo escuchar ahora» y «Saltar».
3. Corrección inmediata en un panel inferior verde o rojo, con la solución y su audio.
4. Se aceptan varias respuestas válidas y errores pequeños (tildes, artículos), indicando la forma correcta.
5. Lecciones de 3 a 5 minutos. La ruta muestra en qué unidad estás y cuánto falta.
6. El progreso se mide en cosas que ya sabes hacer («Ya sé pedir cita»), no en puntos ni rachas.
7. Se empieza sin registro. La cuenta solo hace falta para comprar un pase y recuperarlo en otro móvil.
8. Nunca hace falta leer español para entender cómo se usa la app.
9. Funciona sin internet. Los enlaces oficiales se abren cuando hay conexión.

## 6. Reglas de contenido y fuentes (obligatorias)

1. **Jerarquía de fuentes**:
   - Primero, la normativa y los organismos oficiales: BOE, Ministerio de Justicia, Instituto Cervantes, UNED/UNEDasiss, Ministerio de Educación y Ministerio de Asuntos Exteriores.
   - Todo lo demás (academias, abogados, vídeos, blogs) es información complementaria y se marca como tal.
2. **Cada dato legal o de examen** se guarda con:
   - su fuente (nombre y enlace);
   - la fecha de comprobación;
   - su estado: *confirmado*, *fuente secundaria* o *sin confirmar*.

   La app lo muestra siempre: «Fuente · Última comprobación».
3. **No se escriben en el código** precios, tasas ni fechas de convocatoria. Se enlaza a la página oficial.
4. **El contenido de examen es original.** No se copian preguntas, textos ni audios de manuales o exámenes oficiales (el manual CCSE tiene derechos reservados del Instituto Cervantes). Sí se usan sus temarios y formatos como guía.
5. **Ciclo de publicación** del contenido de pago: *borrador* → *revisado* → *publicado*.
   - Revisa un profesor de español acreditado (preferiblemente examinador DELE) y, para los trámites, un profesional jurídico.
   - En los pases solo se muestra lo *publicado*.
6. **Revisión periódica**: cada dato tiene una fecha de próxima revisión. El manual CCSE cambia cada año, y la prueba de acceso a la universidad para estudiantes de fuera de la UE puede cambiar con un real decreto en preparación.
7. **Aviso visible** en los pases: la app prepara los exámenes, pero no sustituye al Instituto Cervantes, a la UNED, a la Administración ni al asesoramiento jurídico.
8. **Privacidad**:
   - Sin anuncios ni analítica con datos personales.
   - El progreso se guarda en el móvil.
   - Edad de consentimiento para el tratamiento de datos: 14 años; por debajo hace falta el de los padres (Ley Orgánica 3/2018, art. 7, comprobado en el BOE el 22/10/2026). La app no pide datos personales.

## 7. Decisiones tomadas

| Decisión | Motivo |
|---|---|
| **Solo se aprende español** (las otras 11 lenguas son de apoyo) | Todo el contenido (trabajo, trámites, exámenes) es de España. Enseñar varios idiomas dispersaba el producto. |
| **Fuera el modo niños** | Mezclar alfabetización infantil con exámenes oficiales confunde a ambos públicos. Puede ser otra app en el futuro. |
| **Sin vidas, rachas ni puntos** | Bloquear por errores o presionar con rachas no ayuda a quien estudia después de trabajar. |
| **Español de España** en el audio | Los exámenes, los trámites y la vida diaria del usuario son en España. |
| **Voces**: sintéticas del móvil en desarrollo; generadas con calidad y revisadas antes de lanzar los pases | La auditiva del DELE necesita audio natural, igual en todos los móviles y sin conexión. |
| **Micrófono**: fuera hasta después del lanzamiento | Privacidad y complejidad; no es imprescindible para aprobar. |
| **Escribir antes que elegir** (dictado y escritura como ejercicios principales; nunca preguntas con solo un dibujo) | Recordar y escribir una palabra fija el aprendizaje mucho más que reconocerla entre opciones, y los dibujos solos son ambiguos. |
| **Pestañas**: Aprender · Practicar · Exámenes · Perfil | «Repasar» pasa a ser un apartado de Practicar, junto al dictado, el diccionario y las funciones futuras. |
| **Nivel 0 de alfabetización**: después del lanzamiento | Necesita el capítulo 4 de LASLLIAM y un especialista. Es importante y queda en la hoja de ruta. |
| **Modelo de negocio**: Aprender gratis; un pase de pago por examen; licencias para entidades más adelante | El examen se prepara una vez. Lo esencial para vivir debe ser gratis. |
| **Nombre**: se mantiene «Hola, Español» | Ahora la app enseña solo español y el nombre describe bien lo que hace. |
| **Plataforma**: aplicación web instalable (PWA) y después Android e iOS con la misma base | Una sola base de código. Las tiendas se necesitan para cobrar los pases. |

## 8. Fuera de esta app

- App infantil (letras, números, trazado), a futuro y por separado.
- Aprender otros idiomas distintos del español.
- Clases con profesor en directo (posible extra más adelante).
- Visado de estudios: la app solo avisa de que es un trámite aparte y enlaza a la fuente oficial cuando esté verificada.

La hoja de ruta está en [HOJA_DE_RUTA.md](HOJA_DE_RUTA.md) y la lista de auditoría en [AUDITORIA.md](AUDITORIA.md).
