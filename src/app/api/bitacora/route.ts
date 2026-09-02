import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bitacoraSchema } from "@/lib/validations/bitacora";
import { toOptionalDate } from "@/lib/validations/common";
import { hasActionPermission, hasPermission } from "@/lib/permissions";
import { DEMO_ENTRIES_BY_INSTANCE } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.role, user.permisos, "bitacora")) return forbidden();

  if (DEMO_MODE) {
    let entries: unknown[];
    if (user.instanceId && DEMO_ENTRIES_BY_INSTANCE[user.instanceId]) {
      entries = DEMO_ENTRIES_BY_INSTANCE[user.instanceId];
    } else {
      entries = Object.values(DEMO_ENTRIES_BY_INSTANCE).flat();
    }
    return NextResponse.json({ entries, total: entries.length });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number.parseInt(searchParams.get("limit") || "100", 10);
  const requestedOffset = Number.parseInt(searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
  const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

  const [entries, total] = await Promise.all([
    prisma.bitacoraEntry.findMany({
      where: { ...tenantWhere(user) },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.bitacoraEntry.count({
      where: { ...tenantWhere(user) },
    }),
  ]);

  return NextResponse.json({ entries, total });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  // Allow if user has bitacora.crear OR products.rotular (printing flow)
  if (!hasActionPermission(user.role, user.permisos, "bitacora", "crear") &&
      !hasActionPermission(user.role, user.permisos, "products", "rotular")) {
    return forbidden();
  }

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ id: `demo-entry-${Date.now()}`, ...body, createdAt: new Date().toISOString() }, { status: 201 });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = bitacoraSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const entry = await prisma.bitacoraEntry.create({
    data: {
      productName: parsed.data.productName,
      category: parsed.data.category,
      coldChain: parsed.data.coldChain,
      processDate: toOptionalDate(parsed.data.processDate),
      expiryRefrigerated: toOptionalDate(parsed.data.expiryRefrigerated),
      expiryFrozen: toOptionalDate(parsed.data.expiryFrozen),
      quantity: parsed.data.quantity,
      quantityProduced: parsed.data.quantityProduced,
      packedBy: parsed.data.packedBy,
      destination: parsed.data.destination,
      batch: parsed.data.batch,
      traceDate: toOptionalDate(parsed.data.traceDate),
      instanceId: user.instanceId,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
