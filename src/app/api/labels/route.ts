import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations/label";
import { hasActionPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_LABELS_BY_INSTANCE: Record<string, unknown[]> = {
  "demo-inst-1": [
    { id: "1", productName: "Pandequeso", brand: "RANCHERITO", batch: "PQ-090226-0800", destination: "ALZATE", createdAt: "2026-02-09T08:30:00Z", product: { code: "R-07", name: "PANDEQUESO", category: "PANADERIA" }, instanceId: "demo-inst-1" },
    { id: "2", productName: "Arepa de Boyaca", brand: "RANCHERITO", batch: "AB-090226-0700", destination: "MIRANORTE", createdAt: "2026-02-09T07:15:00Z", product: { code: "R-08", name: "AREPA DE BOYACA", category: "PANADERIA" }, instanceId: "demo-inst-1" },
    { id: "3", productName: "Empanada de Carne", brand: "RANCHERITO", batch: "EM-080226-1000", destination: "NM", createdAt: "2026-02-08T10:45:00Z", product: { code: "R-10", name: "EMPANADA DE CARNE", category: "FRITOS" }, instanceId: "demo-inst-1" },
    { id: "4", productName: "Queso Campesino", brand: "RANCHERITO", batch: "QS-080226-0600", destination: "ALZATE", createdAt: "2026-02-08T06:20:00Z", product: { code: "R-12", name: "QUESO CAMPESINO", category: "LACTEOS" }, instanceId: "demo-inst-1" },
    { id: "5", productName: "Buñuelo", brand: "RANCHERITO", batch: "BU-070226-0900", destination: "MIRANORTE", createdAt: "2026-02-07T09:00:00Z", product: { code: "R-11", name: "BUÑUELO", category: "FRITOS" }, instanceId: "demo-inst-1" },
  ],
  "demo-inst-2": [
    { id: "20", productName: "Ensalada Organica", brand: "GRUPO DE LA TIERRA", batch: "ORG01-090226", destination: "BOGOTA", createdAt: "2026-02-09T10:00:00Z", product: { code: "GT-01", name: "ENSALADA ORGANICA", category: "ENSALADAS" }, instanceId: "demo-inst-2" },
    { id: "21", productName: "Jugo Verde Detox", brand: "GRUPO DE LA TIERRA", batch: "ORG02-080226", destination: "MEDELLIN", createdAt: "2026-02-08T09:00:00Z", product: { code: "GT-02", name: "JUGO VERDE DETOX", category: "BEBIDAS" }, instanceId: "demo-inst-2" },
  ],
};

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (DEMO_MODE) {
    if (user.instanceId && DEMO_LABELS_BY_INSTANCE[user.instanceId]) {
      return NextResponse.json(DEMO_LABELS_BY_INSTANCE[user.instanceId]);
    }
    return NextResponse.json(Object.values(DEMO_LABELS_BY_INSTANCE).flat());
  }

  const labels = await prisma.label.findMany({
    where: { ...tenantWhere(user) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { code: true, name: true, category: true } },
    },
  });

  return NextResponse.json(labels);
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "labels", "crear")) {
    return forbidden();
  }

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ id: `demo-label-${Date.now()}`, ...body, createdAt: new Date().toISOString() }, { status: 201 });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = labelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const label = await prisma.label.create({
    data: {
      productName: parsed.data.productName,
      brand: parsed.data.brand,
      netContent: parsed.data.netContent,
      origin: parsed.data.origin,
      productionDate: parsed.data.productionDate
        ? new Date(parsed.data.productionDate)
        : null,
      batch: parsed.data.batch,
      packedBy: parsed.data.packedBy,
      destination: parsed.data.destination,
      productId: parsed.data.productId,
      instanceId: user.instanceId,
    },
  });

  return NextResponse.json(label, { status: 201 });
}
