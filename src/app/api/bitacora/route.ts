import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bitacoraSchema } from "@/lib/validations/bitacora";
import { hasActionPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_ENTRIES_BY_INSTANCE: Record<string, unknown[]> = {
  "demo-inst-1": [
    { id: "1", productName: "Pandequeso", category: "PANADERIA", coldChain: "Refrigerado", processDate: "2026-02-09T08:00:00Z", expiryRefrigerated: "2026-02-14T08:00:00Z", expiryFrozen: "2026-03-11T08:00:00Z", quantity: "50 und", quantityProduced: "5 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "PQ-090226", createdAt: "2026-02-09T08:00:00Z", instanceId: "demo-inst-1" },
    { id: "2", productName: "Arepa de Boyaca", category: "PANADERIA", coldChain: "Congelado", processDate: "2026-02-09T07:00:00Z", expiryRefrigerated: "2026-02-16T07:00:00Z", expiryFrozen: "2026-04-10T07:00:00Z", quantity: "100 und", quantityProduced: "10 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "AB-090226", createdAt: "2026-02-09T07:00:00Z", instanceId: "demo-inst-1" },
    { id: "3", productName: "Empanada de Carne", category: "FRITOS", coldChain: "Refrigerado", processDate: "2026-02-08T10:00:00Z", expiryRefrigerated: "2026-02-11T10:00:00Z", expiryFrozen: "2026-03-25T10:00:00Z", quantity: "200 und", quantityProduced: "15 kg", packedBy: "Ana Garcia", destination: "NM", batch: "EM-080226", createdAt: "2026-02-08T10:00:00Z", instanceId: "demo-inst-1" },
    { id: "4", productName: "Queso Campesino", category: "LACTEOS", coldChain: "Refrigerado", processDate: "2026-02-08T06:00:00Z", expiryRefrigerated: "2026-02-23T06:00:00Z", expiryFrozen: "2026-05-09T06:00:00Z", quantity: "20 bloques", quantityProduced: "8 kg", packedBy: "Maria Lopez", destination: "ALZATE", batch: "QS-080226", createdAt: "2026-02-08T06:00:00Z", instanceId: "demo-inst-1" },
    { id: "5", productName: "Buñuelo", category: "FRITOS", coldChain: null, processDate: "2026-02-07T09:00:00Z", expiryRefrigerated: "2026-02-10T09:00:00Z", expiryFrozen: "2026-03-09T09:00:00Z", quantity: "150 und", quantityProduced: "12 kg", packedBy: "Carlos Perez", destination: "MIRANORTE", batch: "BU-070226", createdAt: "2026-02-07T09:00:00Z", instanceId: "demo-inst-1" },
  ],
  "demo-inst-2": [
    { id: "20", productName: "Ensalada Organica", category: "ENSALADAS", coldChain: "Refrigerado", processDate: "2026-02-09T10:00:00Z", expiryRefrigerated: "2026-02-12T10:00:00Z", expiryFrozen: null, quantity: "30 und", quantityProduced: "6 kg", packedBy: "Juan Rios", destination: "BOGOTA", batch: "ORG01-090226", createdAt: "2026-02-09T10:00:00Z", instanceId: "demo-inst-2" },
    { id: "21", productName: "Bowl de Quinoa", category: "PLATOS", coldChain: "Refrigerado", processDate: "2026-02-08T11:00:00Z", expiryRefrigerated: "2026-02-12T11:00:00Z", expiryFrozen: "2026-04-09T11:00:00Z", quantity: "25 und", quantityProduced: "8 kg", packedBy: "Laura Diaz", destination: "MEDELLIN", batch: "ORG03-080226", createdAt: "2026-02-08T11:00:00Z", instanceId: "demo-inst-2" },
  ],
};

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

  if (!hasActionPermission(user.role, user.permisos, "bitacora", "crear")) {
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
