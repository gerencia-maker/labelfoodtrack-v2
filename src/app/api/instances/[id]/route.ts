import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { updateDemoInstance, deleteDemoInstance, getDemoInstance } from "@/lib/demo-data";

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

  const body = await request.json();
  const { name, brandName, logoUrl, plan, activo, destinations, packers } = body;

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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
