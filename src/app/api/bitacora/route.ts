import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bitacoraSchema } from "@/lib/validations/bitacora";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [entries, total] = await Promise.all([
      prisma.bitacoraEntry.findMany({
        where: { instanceId: user.instanceId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.bitacoraEntry.count({
        where: { instanceId: user.instanceId },
      }),
    ]);

    return NextResponse.json({ entries, total });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!user.canEditBitacora && user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
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
  });
}
