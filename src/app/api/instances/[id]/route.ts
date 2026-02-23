import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasPermission(user.role, user.permisos, "configuration")) {
    return forbidden();
  }

  const { id } = await params;

  if (!checkTenantAccess(user, id)) {
    return forbidden();
  }

  const body = await request.json();
  const { name, brandName, plan, activo, destinations } = body;

  if (DEMO_MODE) {
    return NextResponse.json({ id, name, brandName, plan, activo, destinations });
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
        ...(plan !== undefined && { plan }),
        ...(activo !== undefined && { activo }),
        ...(destinations !== undefined && { destinations }),
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

  // Only super-admin can delete instances
  if (user.instanceId) return forbidden();

  if (!hasPermission(user.role, user.permisos, "instances")) {
    return forbidden();
  }

  const { id } = await params;

  if (DEMO_MODE) {
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
