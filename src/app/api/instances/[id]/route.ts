import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess, hasRecentAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { updateDemoInstance, deleteDemoInstance, getDemoInstance } from "@/lib/demo-data";
import { updateInstanceSchema } from "@/lib/validations/instance";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_instancia")) {
    return forbidden();
  }

  const { id } = await params;

  if (!checkTenantAccess(user, id)) {
    return forbidden();
  }

  const parsed = updateInstanceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, brandName, logoUrl, plan, activo, destinations, packers } = parsed.data;

  if (!user.isSuperAdmin && (plan !== undefined || activo !== undefined)) {
    return NextResponse.json(
      { error: "Solo el administrador global puede cambiar el plan o estado de una instancia" },
      { status: 403 }
    );
  }

  if (DEMO_MODE) {
    const updated = updateDemoInstance(id, { name, brandName, plan, activo, destinations, packers });
    if (!updated) {
      return NextResponse.json({ error: "Instancia no encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  const existing = await prisma.instance.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Instancia no encontrada" }, { status: 404 });
  }

  try {
    const instance = await prisma.instance.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brandName !== undefined && { brandName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(plan !== undefined && { plan }),
        ...(activo !== undefined && { activo }),
        ...(destinations !== undefined && { destinations }),
        ...(packers !== undefined && { packers }),
      },
    });

    console.warn(
      `[security-audit] actor=${user.id} action=instance_update target=${id}`
    );
    return NextResponse.json(instance);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!user.isSuperAdmin) {
    return forbidden();
  }

  if (!hasRecentAuthentication(user)) {
    return NextResponse.json(
      { error: "Vuelve a iniciar sesion antes de eliminar una instancia" },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (DEMO_MODE) {
    const inst = getDemoInstance(id);
    if (inst && inst._count?.users > 0) {
      return NextResponse.json({ error: "hasUsers", count: inst._count.users }, { status: 409 });
    }
    deleteDemoInstance(id);
    return NextResponse.json({ success: true });
  }

  try {
    // Check for associated users
    const userCount = await prisma.user.count({ where: { instanceId: id } });
    if (userCount > 0) {
      return NextResponse.json(
        { error: "hasUsers", count: userCount },
        { status: 409 }
      );
    }

    await prisma.instance.delete({ where: { id } });
    console.warn(
      `[security-audit] actor=${user.id} action=instance_delete target=${id}`
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
