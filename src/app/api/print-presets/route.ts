import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printPresetSchema } from "@/lib/validations/print-preset";
import { hasActionPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** GET — list all presets for the instance */
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (DEMO_MODE) {
    return NextResponse.json([]);
  }

  const presets = await prisma.printPreset.findMany({
    where: { ...tenantWhere(user) },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json(presets);
}

/** POST — create a new preset */
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_papel")) {
    return forbidden();
  }

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ id: "demo-preset", ...body }, { status: 201 });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }
  const instanceId = user.instanceId;

  const body = await request.json();
  const parsed = printPresetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // A saved template is immediately the active print configuration.
  const preset = await prisma.$transaction(async (tx) => {
    await tx.printPreset.updateMany({
      where: { instanceId },
      data: { isActive: false },
    });
    return tx.printPreset.create({
      data: {
        ...parsed.data,
        isActive: true,
        instanceId,
      },
    });
  });

  return NextResponse.json(preset, { status: 201 });
}
