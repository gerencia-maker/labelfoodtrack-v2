import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch: string }> }
) {
  const { batch } = await params;

  const limited = enforceRateLimit(request, {
    scope: "public-qr",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  // New QR codes contain the opaque, globally unique label ID. Predictable
  // legacy batch numbers are intentionally rejected to preserve tenant isolation.
  if (!/^c[a-z0-9]{20,30}$/i.test(batch)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const include = {
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
    } as const;

    const label = await prisma.label.findUnique({
      where: { id: batch },
      include,
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

    return NextResponse.json(
      {
        productName: label.productName,
        batch: label.batch,
        netContent: label.netContent,
        productionDate: prodDateISO,
        coldChain: label.coldChain,
        expiryRefrigerated,
        expiryFrozen,
        expiryAmbient,
        product: label.product,
        instance: label.instance,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
