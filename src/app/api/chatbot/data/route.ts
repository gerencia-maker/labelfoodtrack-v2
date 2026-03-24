import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY || "";

function unauthorized() {
  return NextResponse.json({ error: "API key inválida" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  // Auth via API key (not Firebase — chatbot is a server)
  const apiKey = request.headers.get("x-api-key") || "";
  if (!CHATBOT_API_KEY || apiKey !== CHATBOT_API_KEY) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get("chatbotId");
  const days = parseInt(searchParams.get("days") || "7");

  if (!chatbotId) {
    return NextResponse.json({ error: "chatbotId es obligatorio" }, { status: 400 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      instance: { name: "Demo", brandName: "Demo Brand" },
      products: [],
      bitacora: [],
      summary: { totalProducts: 0, bitacoraEntries: 0, periodDays: days },
    });
  }

  // Look up instance by chatbotId
  const instance = await prisma.instance.findUnique({
    where: { chatbotId },
    select: { id: true, name: true, brandName: true },
  });

  if (!instance) {
    return NextResponse.json({ error: "Instancia no encontrada para ese chatbotId" }, { status: 404 });
  }

  // Fetch products + bitácora in parallel
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const [products, bitacora] = await Promise.all([
    prisma.product.findMany({
      where: { instanceId: instance.id },
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
        usage: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.bitacoraEntry.findMany({
      where: {
        instanceId: instance.id,
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

  return NextResponse.json({
    instance: { name: instance.name, brandName: instance.brandName },
    products,
    bitacora,
    summary: {
      totalProducts: products.length,
      bitacoraEntries: bitacora.length,
      periodDays: days,
    },
  });
}
