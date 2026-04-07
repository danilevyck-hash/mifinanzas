export type DefaultCategory = {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Comida", icon: "🍔", color: "#EF4444", keywords: ["restaurante", "almuerzo", "cena", "desayuno", "comida", "café", "pizza", "sushi", "pollo", "carne", "mcdonalds", "kfc", "subway", "uber eats", "pedidos ya", "rappi"] },
  { name: "Supermercado", icon: "🛒", color: "#10B981", keywords: ["super", "supermercado", "super 99", "rey", "riba smith", "pricesmart", "costco", "mercado", "compras"] },
  { name: "Transporte", icon: "🚗", color: "#3B82F6", keywords: ["gasolina", "gas", "uber", "indriver", "taxi", "estacionamiento", "parking", "peaje", "lavado", "taller", "mecánico", "llanta"] },
  { name: "Hogar", icon: "🏠", color: "#8B5CF6", keywords: ["alquiler", "rent", "luz", "agua", "internet", "cable", "gas natural", "mantenimiento", "reparación", "muebles", "decoración"] },
  { name: "Salud", icon: "💊", color: "#EC4899", keywords: ["doctor", "médico", "farmacia", "medicina", "hospital", "clínica", "dentista", "óptica", "lentes", "consulta", "laboratorio"] },
  { name: "Entretenimiento", icon: "🎮", color: "#F59E0B", keywords: ["netflix", "spotify", "cine", "película", "juego", "streaming", "disney", "hbo", "youtube", "suscripción"] },
  { name: "Ropa", icon: "👕", color: "#06B6D4", keywords: ["ropa", "zapatos", "camisa", "pantalón", "vestido", "zara", "h&m", "tienda", "shopping", "mall"] },
  { name: "Educación", icon: "📚", color: "#6366F1", keywords: ["curso", "libro", "escuela", "universidad", "clase", "matrícula", "seminario", "capacitación", "udemy"] },
  { name: "Servicios", icon: "⚡", color: "#F97316", keywords: ["teléfono", "celular", "plan", "seguro", "banco", "comisión", "impuesto", "multa", "trámite"] },
  { name: "Personal", icon: "💆", color: "#14B8A6", keywords: ["peluquería", "barbería", "spa", "gym", "gimnasio", "deporte", "yoga", "corte", "manicure"] },
  { name: "Mascotas", icon: "🐾", color: "#A855F7", keywords: ["veterinario", "mascota", "perro", "gato", "comida mascota", "pet"] },
  { name: "Viajes", icon: "✈️", color: "#0EA5E9", keywords: ["vuelo", "hotel", "airbnb", "viaje", "maleta", "aeropuerto", "boleto", "pasaje", "excursión"] },
  { name: "Regalos", icon: "🎁", color: "#E11D48", keywords: ["regalo", "cumpleaños", "navidad", "aniversario", "presente", "donación"] },
  { name: "Otros", icon: "📌", color: "#6B7280", keywords: [] },
];

export function detectCategory(notes: string, enabledCategories: string[]): string | null {
  if (!notes || notes.trim().length < 2) return null;
  const lower = notes.toLowerCase().trim();
  for (const cat of DEFAULT_CATEGORIES) {
    if (!enabledCategories.includes(cat.name)) continue;
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword)) return cat.name;
    }
  }
  return null;
}

export function getCategoryInfo(name: string): DefaultCategory | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.name === name);
}
