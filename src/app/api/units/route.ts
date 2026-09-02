import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { z } from "zod";

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

const unitsSchema = z
  .array(z.string().trim().min(1).max(32))
  .max(100)
  .transform((units) => [...new Set(units)]);

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

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_unidades")) {
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

  const parsed = unitsSchema.safeParse((await request.json()).units);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Las unidades no son validas" },
      { status: 400 }
    );
  }

  const updated = await prisma.instance.update({
    where: { id: user.instanceId },
    data: { units: parsed.data },
    select: { units: true },
  });

  return NextResponse.json({ units: updated.units });
}
