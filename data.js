// Contenido del juego. Cada mundo tiene palabras (emoji + español) y frases útiles.
// Para añadir contenido basta con agregar elementos a estas listas.
const WORLDS = [
  {
    id: "saludos", name: "Saludos", emoji: "👋", color: "#ff9f43",
    words: [
      { es: "Hola", emoji: "👋" },
      { es: "Adiós", emoji: "🚪" },
      { es: "Gracias", emoji: "🙏" },
      { es: "Por favor", emoji: "🥺" },
      { es: "Sí", emoji: "✅" },
      { es: "No", emoji: "❌" },
      { es: "Perdón", emoji: "😅" },
      { es: "Buenas noches", emoji: "🌙" },
    ],
    phrases: [
      { q: "¿Cómo te llamas?", a: "Me llamo Ana.", wrong: ["Tengo tres años.", "Estoy en casa.", "Es una manzana."] },
      { q: "¿Cómo estás?", a: "Estoy bien, gracias.", wrong: ["Me llamo Luis.", "Son las tres.", "Voy al mercado."] },
      { q: "¿De dónde eres?", a: "Soy de Marruecos.", wrong: ["Estoy cansado.", "Tengo hambre.", "Es mi hermano."] },
    ],
  },
  {
    id: "numeros", name: "Números", emoji: "🔢", color: "#54a0ff",
    words: [
      { es: "Uno", emoji: "1️⃣" },
      { es: "Dos", emoji: "2️⃣" },
      { es: "Tres", emoji: "3️⃣" },
      { es: "Cuatro", emoji: "4️⃣" },
      { es: "Cinco", emoji: "5️⃣" },
      { es: "Seis", emoji: "6️⃣" },
      { es: "Siete", emoji: "7️⃣" },
      { es: "Ocho", emoji: "8️⃣" },
      { es: "Nueve", emoji: "9️⃣" },
      { es: "Diez", emoji: "🔟" },
    ],
    phrases: [
      { q: "¿Cuánto cuesta el pan?", a: "Cuesta dos euros.", wrong: ["Me llamo Pan.", "Está en la mesa.", "Es muy bonito."] },
      { q: "¿Cuántos años tienes?", a: "Tengo treinta años.", wrong: ["Soy de Ecuador.", "Estoy bien.", "Son las ocho."] },
    ],
  },
  {
    id: "comida", name: "Comida", emoji: "🍞", color: "#1dd1a1",
    words: [
      { es: "Pan", emoji: "🍞" },
      { es: "Agua", emoji: "💧" },
      { es: "Leche", emoji: "🥛" },
      { es: "Manzana", emoji: "🍎" },
      { es: "Arroz", emoji: "🍚" },
      { es: "Pollo", emoji: "🍗" },
      { es: "Huevo", emoji: "🥚" },
      { es: "Queso", emoji: "🧀" },
      { es: "Pescado", emoji: "🐟" },
      { es: "Café", emoji: "☕" },
    ],
    phrases: [
      { q: "¿Qué quieres?", a: "Quiero un café, por favor.", wrong: ["Me llamo Café.", "Voy al médico.", "Tengo dos hijos."] },
      { q: "¿Tienes hambre?", a: "Sí, tengo mucha hambre.", wrong: ["Soy de Colombia.", "Son las cinco.", "Adiós, hasta luego."] },
    ],
  },
  {
    id: "familia", name: "Familia", emoji: "👨‍👩‍👧", color: "#ee5a9b",
    words: [
      { es: "Madre", emoji: "👩" },
      { es: "Padre", emoji: "👨" },
      { es: "Hijo", emoji: "👦" },
      { es: "Hija", emoji: "👧" },
      { es: "Bebé", emoji: "👶" },
      { es: "Abuela", emoji: "👵" },
      { es: "Abuelo", emoji: "👴" },
      { es: "Familia", emoji: "👨‍👩‍👧‍👦" },
    ],
    phrases: [
      { q: "¿Tienes hijos?", a: "Sí, tengo dos hijos.", wrong: ["No, es un coche.", "Estoy en el trabajo.", "Quiero agua."] },
      { q: "¿Quién es ella?", a: "Es mi madre.", wrong: ["Es una casa.", "Son las diez.", "Tengo sed."] },
    ],
  },
  {
    id: "ciudad", name: "En la ciudad", emoji: "🏙️", color: "#a55eea",
    words: [
      { es: "Casa", emoji: "🏠" },
      { es: "Escuela", emoji: "🏫" },
      { es: "Hospital", emoji: "🏥" },
      { es: "Autobús", emoji: "🚌" },
      { es: "Tienda", emoji: "🏪" },
      { es: "Trabajo", emoji: "💼" },
      { es: "Dinero", emoji: "💶" },
      { es: "Teléfono", emoji: "📱" },
    ],
    phrases: [
      { q: "¿Dónde está el hospital?", a: "Está a la derecha.", wrong: ["Es muy caro.", "Me llamo Pedro.", "Tengo un gato."] },
      { q: "¿Necesitas ayuda?", a: "Sí, necesito ayuda, por favor.", wrong: ["No, es una manzana.", "Tengo cinco años.", "Buenas noches."] },
    ],
  },
  {
    id: "salud", name: "Salud", emoji: "🩺", color: "#ff6b6b",
    words: [
      { es: "Médico", emoji: "🧑‍⚕️" },
      { es: "Medicina", emoji: "💊" },
      { es: "Dolor", emoji: "🤕" },
      { es: "Fiebre", emoji: "🤒" },
      { es: "Ambulancia", emoji: "🚑" },
      { es: "Policía", emoji: "👮" },
      { es: "Ayuda", emoji: "🆘" },
      { es: "Farmacia", emoji: "⚕️" },
    ],
    phrases: [
      { q: "¿Qué te pasa?", a: "Me duele la cabeza.", wrong: ["Quiero pan.", "Soy de Perú.", "Es mi abuelo."] },
      { q: "Es una emergencia.", a: "¡Llame a una ambulancia!", wrong: ["¡Qué buen café!", "Tengo tres hijos.", "Hasta mañana."] },
    ],
  },
];
