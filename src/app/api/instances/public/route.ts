import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Public endpoint — no auth required.
 * Returns only id, name, logoUrl for active instances matching the query.
 * Used by the login page instance selector.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  if (DEMO_MODE) {
    return NextResponse.json([
      { id: "demo-1", name: "RANCHERITO", logoUrl: null },
      { id: "demo-2", name: "DEMO FOODS", logoUrl: null },
    ]);
  }

  try {
    const instances = await prisma.instance.findMany({
      where: {
        activo: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, logoUrl: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    return NextResponse.json(instances);
  } catch {
    return NextResponse.json([]);
  }
}
