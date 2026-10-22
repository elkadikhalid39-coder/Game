# Audio pregrabado

La app trae el audio en español ya generado (carpeta `public/audio`), para que suene igual en todos los móviles y funcione sin conexión. Si una frase no está grabada, se lee con la voz del móvil.

## Cómo se genera

1. Instalar Piper: `python -m venv tts && tts/bin/pip install piper-tts` (también hace falta `ffmpeg`).
2. Descargar los modelos de <https://huggingface.co/rhasspy/piper-voices> (archivos `.onnx` y `.onnx.json`) en una carpeta.
3. `tts/bin/python tools/audio/generate.py <carpeta de modelos>`

Hay que volver a generarlo cada vez que cambien las palabras, las frases, las preguntas de conducir o los audios del DELE. `npm run check` avisa si falta alguna frase en la voz neutra.

## Voces y licencias

| Voz (id) | Modelo | Licencia de los datos |
|---|---|---|
| neutra | es_ES-davefx-medium | CC0 |
| es-f, es-m | es_ES-sharvard-medium (hablantes F y M) | CC BY 3.0: Sharvard Corpus, Aubanel, García Lecumberri y Cooke (2014). Hay que citarlo (la app lo hace en la pantalla de voces). |
| mx-f | es_MX-claude-high | Apache 2.0 |
| mx-m | es_MX-ald-medium | Unlicense |

Piper (el programa) es GPL, pero solo se usa para generar los archivos; no va dentro de la app.
No se usa la voz de Argentina (es_AR-daniela) porque su licencia (CC BY-SA) obligaría a compartir el audio con la misma licencia.

Son voces sintéticas neuronales: suenan mucho más naturales que las del móvil, pero no son grabaciones de personas. Para la comprensión auditiva del DELE, lo ideal a largo plazo son grabaciones con locutores.
