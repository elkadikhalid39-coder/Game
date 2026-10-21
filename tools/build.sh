#!/usr/bin/env bash
# Empaqueta el juego en un único HTML (para publicarlo como página o probarlo sin servidor).
# Uso: tools/build.sh [salida]   (por defecto dist/hola.html)
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:-dist/hola.html}"
mkdir -p "$(dirname "$out")"
{
  echo '<title>Hola, Español</title>'
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Lexend:wght@400;500;600;800&display=swap">'
  echo '<style>'
  cat css/style.css
  echo '</style>'
  echo '<header id="topbar" dir="ltr"></header>'
  echo '<main id="app" aria-live="polite"></main>'
  echo '<nav id="tabbar" dir="ltr"></nav>'
  echo '<script>'
  grep -o '<script src="[^"]*"' index.html | sed 's/<script src="//; s/"$//' | while read -r f; do cat "$f"; echo; done
  echo '</script>'
} > "$out"
echo "$out ($(wc -c < "$out") bytes)"
