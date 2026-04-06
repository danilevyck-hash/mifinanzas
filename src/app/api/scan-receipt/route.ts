import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OCR no configurado" }, { status: 500 });

  const { image_url } = await request.json();
  if (!image_url) return NextResponse.json({ error: "Falta image_url" }, { status: 400 });

  try {
    // Fetch the image and convert to base64
    const imgRes = await fetch(image_url);
    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString("base64");
    const mediaType = imgRes.headers.get("content-type") || "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `Analiza esta factura/recibo y extrae:
1. El monto TOTAL a pagar (el número final, el más grande)
2. Una categoría sugerida basada en el tipo de negocio/producto

Responde SOLO con JSON, sin texto adicional:
{"amount": 32.50, "category": "Comida", "notes": "Descripcion breve del negocio o producto"}

Reglas:
- amount debe ser un número decimal (sin símbolos de moneda)
- Si el monto tiene formato latinoamericano (32.214 o 32,214) interpretalo correctamente. Si tiene punto de miles y el total es un número grande (ej: 32.214), el monto real es 32214.
- category debe ser una de: Casa, Carro, Comida, Salud, Entretenimiento, Ropa, Educacion, Tecnologia, Servicios, Transporte, Gym, Mascotas, Viaje, Restaurante, Mercado, Shopping
- Para gasolina/combustible usa "Carro"
- notes: nombre del negocio o producto principal (máximo 30 caracteres)`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "Error al analizar recibo" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo leer el recibo" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      amount: parsed.amount || 0,
      category: parsed.category || "",
      notes: parsed.notes || "",
    });
  } catch (err) {
    console.error("Scan receipt error:", err);
    return NextResponse.json({ error: "Error al procesar recibo" }, { status: 500 });
  }
}
