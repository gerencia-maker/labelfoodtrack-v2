import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bitacoraSchema } from "@/lib/validations/bitacora";
import { hasActionPermission } from "@/lib/permissions";
import { DEMO_ENTRIES_BY_INSTANCE } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

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
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

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
      processDate: parsed.data.processDate ? new Date(parsed.data.processDate) : null,
      expiryRefrigerated: parsed.data.expiryRefrigerated
        ? new Date(parsed.data.expiryRefrigerated)
        : null,
      expiryFrozen: parsed.data.expiryFrozen
        ? new Date(parsed.data.expiryFrozen)
        : null,
      quantity: parsed.data.quantity,
      quantityProduced: parsed.data.quantityProduced,
      packedBy: parsed.data.packedBy,
      destination: parsed.data.destination,
      batch: parsed.data.batch,
      traceDate: parsed.data.traceDate ? new Date(parsed.data.traceDate) : null,
      instanceId: user.instanceId,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
