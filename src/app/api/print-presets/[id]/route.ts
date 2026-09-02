import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printPresetSchema } from "@/lib/validations/print-preset";
import { hasActionPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type Ctx = { params: Promise<{ id: string }> };

/** PUT — update a preset */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_papel")) {
    return forbidden();
  }

  const { id } = await ctx.params;

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ id, ...body });
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
    where: { id, instanceId: user.instanceId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Preset no encontrado" }, { status: 404 });
  }

  const preset = await prisma.printPreset.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json(preset);
}

/** DELETE — remove a preset */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_papel")) {
    return forbidden();
  }

  const { id } = await ctx.params;

  if (DEMO_MODE) {
    return NextResponse.json({ ok: true });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const preset = await prisma.printPreset.findFirst({
    where: { id, instanceId: user.instanceId },
  });
  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.printPreset.delete({ where: { id: preset.id } });

  // If deleted preset was active, activate another one
  if (preset.isActive && user.instanceId) {
    const next = await prisma.printPreset.findFirst({
      where: { instanceId: user.instanceId },
    });
    if (next) {
      await prisma.printPreset.update({
        where: { id: next.id },
        data: { isActive: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

/** PATCH — activate this preset (deactivate others) */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_papel")) {
    return forbidden();
  }

  const { id } = await ctx.params;

  if (DEMO_MODE) {
    return NextResponse.json({ ok: true });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "No instance" }, { status: 400 });
  }


  const preset = await prisma.printPreset.findFirst({
    where: { id, instanceId: user.instanceId },
    select: { id: true },
  });
  if (!preset) {
    return NextResponse.json({ error: "Preset no encontrado" }, { status: 404 });
  }

  // Keep activation atomic so an instance never ends up with a partial update.
  await prisma.$transaction([
    prisma.printPreset.updateMany({
      where: { instanceId: user.instanceId },
      data: { isActive: false },
    }),
    prisma.printPreset.update({
      where: { id: preset.id },
      data: { isActive: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
