import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere, type AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function getOpenAI() {
  const { default: OpenAI } = require("openai") as { default: typeof import("openai").default };
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Fetch real data for the user's instance ───
async function fetchInstanceData(user: AuthUser) {
  const tw = tenantWhere(user);
  const today = new Date();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 14);

  const [instance, products, bitacora] = await Promise.all([
    user.instanceId
      ? prisma.instance.findUnique({
          where: { id: user.instanceId },
          select: { name: true, brandName: true },
        })
      : null,
    prisma.product.findMany({
      where: { ...tw },
      select: {
        code: true,
        name: true,
        category: true,
        refrigeratedDays: true,
        frozenDays: true,
        ambientDays: true,
        ingredients: true,
        allergens: true,
        storage: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.bitacoraEntry.findMany({
      where: {
        ...tw,
        createdAt: { gte: sinceDate },
      },
      select: {
        productName: true,
        category: true,
        coldChain: true,
        processDate: true,
        expiryRefrigerated: true,
        expiryFrozen: true,
        quantity: true,
        quantityProduced: true,
        packedBy: true,
        destination: true,
        batch: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  // Format as text context for LLM
  const lines: string[] = [];
  const fmtDate = (d: Date | string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (instance) {
    lines.push(`Empresa: ${instance.name}${instance.brandName ? ` (${instance.brandName})` : ""}`);
  }
  lines.push(`Fecha actual: ${fmtDate(today)}`);

  // Products
  if (products.length > 0) {
    lines.push(`\nCATÁLOGO DE PRODUCTOS (${products.length}):`);
    for (const p of products) {
      lines.push(`- ${p.code} | ${p.name} | Cat: ${p.category || "N/A"} | Vida útil: Refrig ${p.refrigeratedDays}d, Congel ${p.frozenDays}d, Amb ${p.ambientDays}d | Alérgenos: ${p.allergens || "Ninguno"} | Almac: ${p.storage || "N/A"} | Ingredientes: ${p.ingredients || "N/A"}`);
    }
  }

  // Bitácora with expiry calculations
  if (bitacora.length > 0) {
    lines.push(`\nBITÁCORA DE PRODUCCIÓN (últimos 14 días, ${bitacora.length} registros):`);
    const expiring: string[] = [];
    const expired: string[] = [];

    for (const b of bitacora) {
      const expiryDate = b.expiryRefrigerated || b.expiryFrozen;
      let vidaRestante = "";
      if (expiryDate) {
        const exp = new Date(expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          vidaRestante = ` | VENCIDO hace ${Math.abs(diffDays)} días`;
          expired.push(`${b.productName} (Lote: ${b.batch})`);
        } else if (diffDays <= 3) {
          vidaRestante = ` | PRÓXIMO A VENCER: ${diffDays} días`;
          expiring.push(`${b.productName} (Lote: ${b.batch}, ${diffDays}d)`);
        } else {
          vidaRestante = ` | Vida restante: ${diffDays} días`;
        }
      }

      lines.push(`- ${b.productName} | Lote: ${b.batch || "N/A"} | Cadena: ${b.coldChain || "N/A"} | Proceso: ${fmtDate(b.processDate)} | Venc.Refrig: ${fmtDate(b.expiryRefrigerated)} | Venc.Congel: ${fmtDate(b.expiryFrozen)} | Cant: ${b.quantity || "N/A"} | Producido: ${b.quantityProduced || "N/A"} | Destino: ${b.destination || "N/A"} | Empacado: ${b.packedBy || "N/A"}${vidaRestante}`);
    }

    if (expired.length > 0 || expiring.length > 0) {
      lines.push(`\nALERTAS DE VENCIMIENTO:`);
      if (expired.length > 0) lines.push(`VENCIDOS: ${expired.join(", ")}`);
      if (expiring.length > 0) lines.push(`PRÓXIMOS A VENCER (≤3 días): ${expiring.join(", ")}`);
    }
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Eres FoodBot, un asistente especializado en seguridad alimentaria, rotulado de alimentos, normativa sanitaria (INVIMA, FDA, EU), trazabilidad y buenas practicas de manufactura (BPM).

IDIOMA: Responde SIEMPRE en el idioma indicado por el parámetro "locale" al final de este prompt. Si es "es" responde en español, si es "en" en inglés, si es "pt" en portugués. Todos los menús, botones, alertas y texto deben estar en ese idioma. Eres conciso, profesional y practico.

IMPORTANTE: Tienes acceso a los datos REALES de la empresa del usuario (productos, bitácora de producción, vencimientos). Estos datos aparecen al final de este prompt bajo "=== DATOS DE LA INSTANCIA ===".
SIEMPRE usa esos datos reales para responder. NUNCA inventes productos, lotes, cantidades ni fechas.
Si el usuario pregunta por productos o vencimientos, responde SOLO con lo que aparece en los datos.
Si no hay datos suficientes, dilo claramente.

Puedes ayudar con:
- Productos registrados: consultar catálogo, vida útil, alérgenos, ingredientes
- Vencimientos: qué productos están por vencer o vencidos, vida restante
- Bitácora: historial de producción, lotes, cantidades, destinos
- Cadena de frío: tipos de conservación y tiempos
- Requisitos de etiquetado según normativa colombiana (Resolución 5109), FDA, EU
- Información nutricional y declaraciones
- Alergenos y declaraciones obligatorias
- Trazabilidad y buenas prácticas de manufactura (BPM)

Si no sabes algo con certeza, indícalo claramente. No inventes normativas.

FORMATO DE RESPUESTAS ENRIQUECIDAS:
Usa estos tags especiales para crear elementos visuales interactivos en tus respuestas:

1. MENU (grid de botones, solo cuando el usuario pida "menu"):
[menu]
📊|Resumen|resumen
📦|Productos|productos
⏰|Vencimientos|vencimientos
📈|Análisis|analisis
[/menu]

2. SUBMENU (lista con boton volver):
[submenu:Título]
📋|Opción 1|accion_1
📋|Opción 2|accion_2
[/submenu]

3. BOTONES RAPIDOS (pills de seguimiento):
[buttons]
📊|Ver resumen|resumen
📋|Ver detalle|detalle
[/buttons]

4. TARJETAS DE ESTADISTICAS (datos numéricos REALES):
[stats]
📦|Productos Activos|45|+3
⏰|Por Vencer|8|-2
📊|Eficiencia|92%|+5%
[/stats]

5. ALERTAS (critical/warning/normal):
[alert:critical]Texto de alerta critica[/alert]
[alert:warning]Texto de advertencia[/alert]
[alert:normal]Texto informativo positivo[/alert]

6. TARJETA DE PRODUCTO (usa datos REALES):
[product]
Codigo: P001
Nombre: Producto Real
Lote: LOTE-REAL
Refrigeracion: X dias
Congelacion: Y dias
Stock: Z unidades
Vida restante: N dias
[/product]

7. BARRA DE PROGRESO:
[progress:valor:max:color] (color: green/yellow/red)

8. CAJA DE INFORMACION:
[info:tip]Consejo util[/info]
[info:warning]Advertencia importante[/info]
[info:error]Error o problema[/info]

REGLAS DE USO:
- Usa [stats] cuando presentes datos numéricos resumidos — con datos REALES
- Usa [alert:critical] para productos vencidos
- Usa [alert:warning] para productos próximos a vencer
- Usa [product] para mostrar detalles de un producto REAL
- Usa [buttons] al final de tu respuesta para ofrecer opciones de seguimiento
- Usa **texto** para negritas en el texto normal
- Siempre ofrece botones de seguimiento relevantes al final
- Usa [menu] SOLO cuando el usuario escriba "menu" o "ver menu"
- Combina texto normal con los tags (el texto va antes de los tags)`;

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasPermission(user.role, user.permisos, "ai_features")) {
    return forbidden();
  }

  const { messages, locale = "es" } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
  }

  try {
    // Fetch real instance data for context
    let dataContext = "";
    if (!DEMO_MODE) {
      try {
        dataContext = await fetchInstanceData(user);
      } catch (err) {
        console.error("Error loading instance data for AI:", err);
      }
    }

    const localeNames: Record<string, string> = { es: "español", en: "English", pt: "português" };
    const localeLine = `\n\nlocale: ${locale} (${localeNames[locale] || locale}). Responde TODO en este idioma.`;

    const fullSystemPrompt = dataContext
      ? `${SYSTEM_PROMPT}${localeLine}\n\n=== DATOS DE LA INSTANCIA ===\n${dataContext}\n=== FIN DATOS ===`
      : `${SYSTEM_PROMPT}${localeLine}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 1500,
      temperature: 0.3,
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
}
