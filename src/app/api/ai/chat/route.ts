import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Eres FoodBot, un asistente especializado en seguridad alimentaria, rotulado de alimentos, normativa sanitaria (INVIMA, FDA, EU), trazabilidad y buenas practicas de manufactura (BPM).

Respondes en el idioma del usuario. Eres conciso, profesional y practico.

Puedes ayudar con:
- Requisitos de etiquetado segun normativa colombiana (Resolucion 5109), FDA, EU
- Informacion nutricional y declaraciones
- Tiempos de conservacion y cadena de frio
- Alergenos y declaraciones obligatorias
- Ingredientes y aditivos permitidos
- Trazabilidad y bitacora de produccion
- Buenas practicas de manufactura (BPM)

Si no sabes algo con certeza, indicalo claramente. No inventes normativas.`;

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!user.canUseAI && user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos para usar IA" }, { status: 403 });
    }

    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content || "Sin respuesta";

      return NextResponse.json({ reply });
    } catch (err) {
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Error al comunicarse con la IA" },
        { status: 500 }
      );
    }
  });
}
