import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEFAULT_UNITS = [
  // Peso - Métrico
  "g", "kg", "mg",
  // Peso - Imperial
  "oz", "lb",
  // Volumen - Métrico
  "ml", "L", "cl", "dl",
  // Volumen - Imperial
  "fl oz", "gal", "qt", "pt", "cup",
  // Unidades
  "und", "pza", "par", "docena",
];

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (DEMO_MODE) {
    return NextResponse.json({ units: DEFAULT_UNITS });
  }

  if (!user.instanceId) {
    return NextResponse.json({ units: DEFAULT_UNITS });
  }

  const instance = await prisma.instance.findUnique({
    where: { id: user.instanceId },
    select: { units: true },
  });

  const units = instance?.units?.length ? instance.units : DEFAULT_UNITS;

  return NextResponse.json({ units });
}

export async function PUT(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (
    user.role !== "ADMIN" &&
    !hasPermission(user.role, user.permisos, "configuration")
  ) {
    return forbidden();
  }

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ units: body.units ?? DEFAULT_UNITS });
  }

  if (!user.instanceId) {
    return NextResponse.json(
      { error: "Seleccione una instancia primero" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { units } = body;

  if (!Array.isArray(units) || !units.every((u: unknown) => typeof u === "string")) {
    return NextResponse.json(
      { error: "units debe ser un array de strings" },
      { status: 400 }
    );
  }

  const updated = await prisma.instance.update({
    where: { id: user.instanceId },
    data: { units },
    select: { units: true },
  });

  return NextResponse.json({ units: updated.units });
}
