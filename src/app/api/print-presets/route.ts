import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printPresetSchema } from "@/lib/validations/print-preset";
import { hasActionPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const preset = await prisma.printPreset.findFirst({
    where: { ...tenantWhere(user) },
  });

  return NextResponse.json(preset);
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_papel")) {
    return forbidden();
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = printPresetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.printPreset.findFirst({
    where: { instanceId: user.instanceId },
  });

  let preset;
  if (existing) {
    preset = await prisma.printPreset.update({
      where: { id: existing.id },
      data: parsed.data,
    });
  } else {
    preset = await prisma.printPreset.create({
      data: { ...parsed.data, instanceId: user.instanceId },
    });
  }

  return NextResponse.json(preset, { status: existing ? 200 : 201 });
}
