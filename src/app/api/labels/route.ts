import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations/label";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const labels = await prisma.label.findMany({
      where: { instanceId: user.instanceId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { code: true, name: true, category: true } },
      },
    });

    return NextResponse.json(labels);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!user.canCreateLabel && user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos para crear etiquetas" }, { status: 403 });
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
  });
}
