import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations/label";
import { toOptionalDate } from "@/lib/validations/common";
import { hasActionPermission, hasPermission } from "@/lib/permissions";
import { DEMO_LABELS_BY_INSTANCE } from "@/lib/demo-data";
import { buildQrUrl } from "@/lib/label-utils";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.role, user.permisos, "labels")) return forbidden();

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

  // Allow if user has labels.crear OR products.rotular
  if (!hasActionPermission(user.role, user.permisos, "labels", "crear") &&
      !hasActionPermission(user.role, user.permisos, "products", "rotular")) {
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

  if (DEMO_MODE) {
    const id = `demo-label-${Date.now()}`;
    return NextResponse.json(
      { id, ...parsed.data, qrData: buildQrUrl(id), createdAt: new Date().toISOString() },
      { status: 201 }
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, instanceId: user.instanceId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado en la instancia seleccionada" }, { status: 400 });
  }

  const label = await prisma.$transaction(async (tx) => {
    const createdLabel = await tx.label.create({
      data: {
        productName: parsed.data.productName,
        brand: parsed.data.brand,
        netContent: parsed.data.netContent,
        origin: parsed.data.origin,
        productionDate: toOptionalDate(parsed.data.productionDate),
        batch: parsed.data.batch,
        coldChain: parsed.data.coldChain,
        packedBy: parsed.data.packedBy,
        destination: parsed.data.destination,
        productId: product.id,
        instanceId: user.instanceId!,
      },
    });

    const labelWithQr = await tx.label.update({
      where: { id: createdLabel.id },
      data: { qrData: buildQrUrl(createdLabel.id) },
    });

    if (parsed.data.quantityProduced) {
      await tx.bitacoraEntry.create({
        data: {
          productName: parsed.data.productName,
          category: parsed.data.category,
          coldChain: parsed.data.coldChain,
          processDate: toOptionalDate(parsed.data.productionDate),
          expiryRefrigerated: toOptionalDate(parsed.data.expiryRefrigerated),
          expiryFrozen: toOptionalDate(parsed.data.expiryFrozen),
          quantity: parsed.data.netContent,
          quantityProduced: parsed.data.quantityProduced,
          packedBy: parsed.data.packedBy,
          destination: parsed.data.destination,
          batch: parsed.data.batch,
          instanceId: user.instanceId!,
        },
      });
    }

    return labelWithQr;
  });

  return NextResponse.json(label, { status: 201 });
}
