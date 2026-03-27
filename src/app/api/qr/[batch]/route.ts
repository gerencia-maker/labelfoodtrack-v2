import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch: string }> }
) {
  const { batch } = await params;

  if (DEMO_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const label = await prisma.label.findFirst({
      where: { batch },
      include: {
        product: {
          select: {
            name: true,
            code: true,
            category: true,
            ingredients: true,
            allergens: true,
            storage: true,
            usage: true,
            refrigeratedDays: true,
            frozenDays: true,
            ambientDays: true,
          },
        },
        instance: {
          select: {
            name: true,
            brandName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      productName: label.productName,
      batch: label.batch,
      netContent: label.netContent,
      productionDate: label.productionDate,
      packedBy: label.packedBy,
      destination: label.destination,
      product: label.product,
      instance: label.instance,
    });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
