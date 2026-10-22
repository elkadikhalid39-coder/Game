// Contenido del curso. Los textos están en js/i18n/<idioma>.js; aquí solo hay ids, dibujos y estructura.

// words: [id, emoji]. phrases: [id, [ids de respuestas incorrectas]] → usa q_<id>, a_<id>.
const WORLDS = [
  { id: "saludos", emoji: "👋", color: "#e8590c",
    words: [["hola", "👋"], ["adios", "🚪"], ["gracias", "🙏"], ["porfavor", "🥺"], ["si", "✅"], ["no", "❌"], ["perdon", "😅"], ["buenasnoches", "🌙"]],
    phrases: [["nombre", ["edad", "donde", "hijos"]], ["estar", ["nombre", "precio", "donde"]], ["origen", ["hambre", "quien", "precio"]]] },
  { id: "numeros", emoji: "🔢", color: "#1f6fd1",
    words: [["n1", "1️⃣"], ["n2", "2️⃣"], ["n3", "3️⃣"], ["n4", "4️⃣"], ["n5", "5️⃣"], ["n6", "6️⃣"], ["n7", "7️⃣"], ["n8", "8️⃣"], ["n9", "9️⃣"], ["n10", "🔟"]],
    phrases: [["precio", ["estar", "quien", "origen"]], ["edad", ["origen", "donde", "estar"]]] },
  { id: "comida", emoji: "🍞", color: "#0f8f6a",
    words: [["pan", "🍞"], ["agua", "💧"], ["leche", "🥛"], ["manzana", "🍎"], ["arroz", "🍚"], ["pollo", "🍗"], ["huevo", "🥚"], ["queso", "🧀"], ["pescado", "🐟"], ["cafe", "☕"]],
    phrases: [["querer", ["edad", "hijos", "origen"]], ["hambre", ["origen", "precio", "quien"]]] },
  { id: "familia", emoji: "👨‍👩‍👧", color: "#c2255c",
    words: [["madre", "👩"], ["padre", "👨"], ["hijo", "👦"], ["hija", "👧"], ["bebe", "👶"], ["abuela", "👵"], ["abuelo", "👴"], ["familia", "👨‍👩‍👧‍👦"]],
    phrases: [["hijos", ["donde", "precio", "nombre"]], ["quien", ["precio", "edad", "donde"]]] },
  { id: "ciudad", emoji: "🏙️", color: "#7048e8",
    words: [["casa", "🏠"], ["escuela", "🏫"], ["hospital", "🏥"], ["autobus", "🚌"], ["tienda", "🏪"], ["trabajo", "💼"], ["dinero", "💶"], ["telefono", "📱"]],
    phrases: [["donde", ["nombre", "hambre", "edad"]], ["ayuda", ["precio", "quien", "nombre"]]] },
  { id: "salud", emoji: "🩺", color: "#c92a2a",
    words: [["medico", "🧑‍⚕️"], ["medicina", "💊"], ["dolor", "🤕"], ["fiebre", "🤒"], ["ambulancia", "🚑"], ["policia", "👮"], ["ayuda", "🆘"], ["farmacia", "⚕️"]],
    phrases: [["pasa", ["precio", "nombre", "donde"]], ["emerg", ["precio", "estar", "nombre"]]] },
];
