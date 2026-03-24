import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess } from "@/lib/auth";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
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
    select: { id: true, firebaseUid: true, instanceId: true, activo: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  const body = await request.json();
  const { name, role, permisos, status, activo, ubicacion } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(permisos !== undefined && { permisos }),
      ...(ubicacion !== undefined && { ubicacion: ubicacion || null }),
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
      ubicacion: true,
      activo: true,
      instanceId: true,
      createdAt: true,
    },
  });

  // Sync activo status to Firebase (enable/disable user)
  if (activo !== undefined && activo !== target.activo && isFirebaseAdminConfigured) {
    try {
      await adminAuth.updateUser(target.firebaseUid, { disabled: !activo });
    } catch (err) {
      console.error("[users/PUT] Firebase sync error:", err instanceof Error ? err.message : err);
    }
  }

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

  if (id === user.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firebaseUid: true, instanceId: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  // Delete from Firebase Auth
  if (isFirebaseAdminConfigured && !target.firebaseUid.startsWith("pending-")) {
    try {
      await adminAuth.deleteUser(target.firebaseUid);
    } catch (err) {
      console.error("[users/DELETE] Firebase error:", err instanceof Error ? err.message : err);
    }
  }

  // Hard delete from DB
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
