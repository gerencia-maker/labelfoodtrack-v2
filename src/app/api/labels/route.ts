import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations/label";
import { hasActionPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

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
