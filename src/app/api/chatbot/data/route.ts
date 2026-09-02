import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY || "";

function unauthorized() {
  return NextResponse.json({ error: "API key inválida" }, { status: 401 });
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get("chatbotId");
  const requestedDays = Number.parseInt(searchParams.get("days") || "7", 10);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 90) : 7;

  if (!chatbotId || chatbotId.length > 100) {
    return NextResponse.json({ error: "chatbotId es obligatorio" }, { status: 400 });
  }

  // Derive a different credential for every tenant from the server-only master
  // key. Compromise of one chatbot credential cannot read another tenant.
  const apiKey = request.headers.get("x-api-key") || "";
  const expectedApiKey = CHATBOT_API_KEY
    ? createHmac("sha256", CHATBOT_API_KEY).update(`chatbot:${chatbotId}`).digest("hex")
    : "";
  if (!expectedApiKey || !secretsMatch(apiKey, expectedApiKey)) {
    return unauthorized();
  }

  const limited = enforceRateLimit(request, {
    scope: "chatbot-data",
    identifier: chatbotId,
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

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
    where: { chatbotId, activo: true },
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
      take: 500,
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

  return NextResponse.json(
    {
      instance: { name: instance.name, brandName: instance.brandName },
      products,
      bitacora,
      summary: {
        totalProducts: products.length,
        bitacoraEntries: bitacora.length,
        periodDays: days,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
