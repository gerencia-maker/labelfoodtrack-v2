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

    // Extract date as YYYY-MM-DD using UTC to avoid timezone shift
    const toDateStr = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Calculate expiry dates from productionDate + product days
    const computeExpiry = (days: number): string | null => {
      if (!label.productionDate || days <= 0) return null;
      const d = new Date(label.productionDate);
      d.setUTCDate(d.getUTCDate() + days);
      return toDateStr(d);
    };

    const p = label.product;
    const expiryRefrigerated = p ? computeExpiry(p.refrigeratedDays) : null;
    const expiryFrozen = p ? computeExpiry(p.frozenDays) : null;
    const expiryAmbient = p ? computeExpiry(p.ambientDays) : null;

    const prodDateISO = label.productionDate ? toDateStr(label.productionDate) : null;

    return NextResponse.json({
      productName: label.productName,
      batch: label.batch,
      netContent: label.netContent,
      productionDate: prodDateISO,
      packedBy: label.packedBy,
      destination: label.destination,
      coldChain: label.coldChain,
      expiryRefrigerated,
      expiryFrozen,
      expiryAmbient,
      product: label.product,
      instance: label.instance,
    });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
