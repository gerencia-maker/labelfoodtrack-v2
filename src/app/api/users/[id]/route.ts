import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "gestionar_usuarios")) {
    return forbidden();
  }

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, instanceId: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  const body = await request.json();
  const { name, role, permisos, status, activo } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(permisos !== undefined && { permisos }),
      ...(status !== undefined && { status }),
      ...(activo !== undefined && { activo }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      permisos: true,
      activo: true,
      instanceId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "gestionar_usuarios")) {
    return forbidden();
  }

  const { id } = await params;

  // Prevent self-deactivation
  if (id === user.id) {
    return NextResponse.json({ error: "No puede desactivar su propia cuenta" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, instanceId: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  // Soft-delete: deactivate instead of hard delete
  await prisma.user.update({
    where: { id },
    data: { activo: false, status: "INACTIVE" },
  });

  return NextResponse.json({ success: true });
}
