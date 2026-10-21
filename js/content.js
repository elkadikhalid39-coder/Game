// Contenido del juego. Los textos están en js/i18n/<idioma>.js; aquí solo hay ids, dibujos y estructura.

// ---------- Modo adultos ----------
// words: [id, emoji]. phrases: [id, [ids de respuestas incorrectas]] → usa q_<id>, a_<id>.
const WORLDS = [
  { id: "saludos", emoji: "👋", color: "#ff9f43",
    words: [["hola", "👋"], ["adios", "🚪"], ["gracias", "🙏"], ["porfavor", "🥺"], ["si", "✅"], ["no", "❌"], ["perdon", "😅"], ["buenasnoches", "🌙"]],
    phrases: [["nombre", ["edad", "donde", "hijos"]], ["estar", ["nombre", "precio", "donde"]], ["origen", ["hambre", "quien", "precio"]]] },
  { id: "numeros", emoji: "🔢", color: "#54a0ff",
    words: [["n1", "1️⃣"], ["n2", "2️⃣"], ["n3", "3️⃣"], ["n4", "4️⃣"], ["n5", "5️⃣"], ["n6", "6️⃣"], ["n7", "7️⃣"], ["n8", "8️⃣"], ["n9", "9️⃣"], ["n10", "🔟"]],
    phrases: [["precio", ["estar", "quien", "origen"]], ["edad", ["origen", "donde", "estar"]]] },
  { id: "comida", emoji: "🍞", color: "#1dd1a1",
    words: [["pan", "🍞"], ["agua", "💧"], ["leche", "🥛"], ["manzana", "🍎"], ["arroz", "🍚"], ["pollo", "🍗"], ["huevo", "🥚"], ["queso", "🧀"], ["pescado", "🐟"], ["cafe", "☕"]],
    phrases: [["querer", ["edad", "hijos", "origen"]], ["hambre", ["origen", "precio", "quien"]]] },
  { id: "familia", emoji: "👨‍👩‍👧", color: "#ee5a9b",
    words: [["madre", "👩"], ["padre", "👨"], ["hijo", "👦"], ["hija", "👧"], ["bebe", "👶"], ["abuela", "👵"], ["abuelo", "👴"], ["familia", "👨‍👩‍👧‍👦"]],
    phrases: [["hijos", ["donde", "precio", "nombre"]], ["quien", ["precio", "edad", "donde"]]] },
  { id: "ciudad", emoji: "🏙️", color: "#a55eea",
    words: [["casa", "🏠"], ["escuela", "🏫"], ["hospital", "🏥"], ["autobus", "🚌"], ["tienda", "🏪"], ["trabajo", "💼"], ["dinero", "💶"], ["telefono", "📱"]],
    phrases: [["donde", ["nombre", "hambre", "edad"]], ["ayuda", ["precio", "quien", "nombre"]]] },
  { id: "salud", emoji: "🩺", color: "#ff6b6b",
    words: [["medico", "🧑‍⚕️"], ["medicina", "💊"], ["dolor", "🤕"], ["fiebre", "🤒"], ["ambulancia", "🚑"], ["policia", "👮"], ["ayuda", "🆘"], ["farmacia", "⚕️"]],
    phrases: [["pasa", ["precio", "nombre", "donde"]], ["emerg", ["precio", "estar", "nombre"]]] },
];

// ---------- Modo niños ----------
const AGES = [
  { id: "1-3", emoji: "👶", choices: 2, length: 4 },
  { id: "3-5", emoji: "🧒", choices: 3, length: 5 },
  { id: "5-7", emoji: "🎒", choices: 3, length: 6 },
];

// Vocabulario con traducción en todos los idiomas.
const KID_WORDS = {
  animales: [["perro", "🐶"], ["gato", "🐱"], ["vaca", "🐮"], ["pato", "🦆"], ["oveja", "🐑"], ["caballo", "🐴"], ["pajaro", "🐦"], ["pez", "🐟"]],
  colores: [["rojo", "🔴"], ["azul", "🔵"], ["amarillo", "🟡"], ["verde", "🟢"], ["naranja", "🟠"], ["morado", "🟣"]],
  cuerpo: [["mano", "✋"], ["pie", "🦶"], ["ojo", "👁️"], ["boca", "👄"], ["nariz", "👃"], ["oreja", "👂"]],
};

// Letras y sílabas en español (solo se muestran cuando se aprende español).
const ES_LETTERS = [
  ["A", "avión", "✈️"], ["B", "barco", "⛵"], ["C", "casa", "🏠"], ["D", "dado", "🎲"], ["E", "elefante", "🐘"],
  ["F", "foca", "🦭"], ["G", "gato", "🐱"], ["H", "helado", "🍦"], ["I", "isla", "🏝️"], ["J", "jirafa", "🦒"],
  ["K", "kiwi", "🥝"], ["L", "luna", "🌙"], ["M", "mano", "✋"], ["N", "nube", "☁️"], ["Ñ", "ñu", "🐃"],
  ["O", "oso", "🐻"], ["P", "pato", "🦆"], ["Q", "queso", "🧀"], ["R", "ratón", "🐭"], ["S", "sol", "☀️"],
  ["T", "tomate", "🍅"], ["U", "uvas", "🍇"], ["V", "vaca", "🐮"], ["W", "wifi", "📶"], ["Y", "yoyó", "🪀"], ["Z", "zapato", "👟"],
];
const ES_SYLLABLES = [
  [["pa", "to"], "🦆"], [["ca", "sa"], "🏠"], [["lu", "na"], "🌙"], [["ga", "to"], "🐱"], [["me", "sa"], "🪑"],
  [["so", "pa"], "🍲"], [["pe", "rro"], "🐶"], [["sa", "po"], "🐸"], [["ma", "no"], "✋"], [["mo", "no"], "🐒"],
  [["to", "ma", "te"], "🍅"], [["pe", "lo", "ta"], "⚽"], [["pa", "ja", "ro"], "🐦"], [["ca", "ba", "llo"], "🐴"],
];

// Unidades del modo niños. subj: lang | num | world.
// only: el idioma que se aprende debe ser ese. script: el alfabeto del idioma que se aprende.
const KID_UNITS = [
  { id: "animales", subj: "world", icon: "🐶", ages: ["1-3", "3-5", "5-7"], kind: "vocab", set: "animales" },
  { id: "colores", subj: "world", icon: "🎨", ages: ["1-3", "3-5"], kind: "vocab", set: "colores" },
  { id: "cuerpo", subj: "world", icon: "✋", ages: ["1-3", "3-5"], kind: "vocab", set: "cuerpo" },
  { id: "vocales", subj: "lang", icon: "🅰️", ages: ["3-5"], kind: "letters", letters: "AEIOU", only: "es" },
  { id: "trazarV", subj: "lang", icon: "✏️", ages: ["3-5"], kind: "trace", letters: "AEIOU", script: "latin" },
  { id: "contar", subj: "num", icon: "🔢", ages: ["3-5", "5-7"], kind: "count" },
  { id: "abc", subj: "lang", icon: "🔤", ages: ["5-7"], kind: "letters", letters: "ABCDEFGHIJKLMNÑOPQRSTUVWYZ", only: "es" },
  { id: "trazar", subj: "lang", icon: "✍️", ages: ["5-7"], kind: "trace", letters: "aeioumpslntd", script: "latin" },
  { id: "silabas", subj: "lang", icon: "🧩", ages: ["5-7"], kind: "syllables", only: "es" },
  { id: "leer", subj: "lang", icon: "📖", ages: ["5-7"], kind: "read" },
  { id: "sumas", subj: "num", icon: "➕", ages: ["5-7"], kind: "sum" },
];

const STICKERS = ["🦄", "🚀", "🌈", "🦁", "🐼", "🍦", "⚽", "🎈", "🐢", "🌻", "🐙", "🦋", "🦖", "🍓", "🎸", "🐧", "⭐", "🧸"];
const COUNT_ITEMS = ["🍎", "⭐", "🐟", "🎈", "🚗", "🌸", "🐞"];
