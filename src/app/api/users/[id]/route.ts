import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess, hasRecentAuthentication } from "@/lib/auth";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { isActiveAdmin, updateUserSchema } from "@/lib/validations/user";
import { enforceRateLimit } from "@/lib/rate-limit";

async function isLastActiveAdmin(target: {
  id: string;
  instanceId: string | null;
  role: string;
  status: string;
  activo: boolean;
}): Promise<boolean> {
  if (!isActiveAdmin(target)) return false;

  const remainingAdmins = await prisma.user.count({
    where: {
      id: { not: target.id },
      instanceId: target.instanceId,
      role: "ADMIN",
      status: "ACTIVE",
      activo: true,
    },
  });
  return remainingAdmins === 0;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "gestionar_usuarios")) {
    return forbidden();
  }

  const limited = enforceRateLimit(request, {
    scope: "user-update",
    identifier: user.id,
    limit: 60,
    windowMs: 60 * 60_000,
  });
  if (limited) return limited;

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firebaseUid: true,
      instanceId: true,
      role: true,
      status: true,
      activo: true,
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  const parsed = updateUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, role, permisos, status, activo, ubicacion } = parsed.data;

  if ((target.role === "ADMIN" || role === "ADMIN") && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo un administrador puede gestionar administradores" },
      { status: 403 }
    );
  }

  const changesSecurityState =
    role !== undefined || permisos !== undefined || status !== undefined || activo !== undefined;
  if (id === user.id && changesSecurityState) {
    return NextResponse.json(
      { error: "No puedes cambiar tu propio rol, permisos o estado" },
      { status: 400 }
    );
  }
  if (changesSecurityState && !hasRecentAuthentication(user)) {
    return NextResponse.json(
      { error: "Vuelve a iniciar sesion antes de cambiar accesos" },
      { status: 403 }
    );
  }

  const nextState = {
    ...target,
    role: role ?? target.role,
    status: status ?? target.status,
    activo: activo ?? target.activo,
  };
  if (isActiveAdmin(target) && !isActiveAdmin(nextState) && (await isLastActiveAdmin(target))) {
    return NextResponse.json(
      { error: "La instancia debe conservar al menos un administrador activo" },
      { status: 409 }
    );
  }

  const shouldDisableFirebase = !nextState.activo || nextState.status !== "ACTIVE";
  const wasDisabledInFirebase = !target.activo || target.status !== "ACTIVE";

  if (
    shouldDisableFirebase !== wasDisabledInFirebase &&
    isFirebaseAdminConfigured &&
    !target.firebaseUid.startsWith("pending-")
  ) {
    try {
      await adminAuth.updateUser(target.firebaseUid, { disabled: shouldDisableFirebase });
    } catch (err) {
      console.error("[users/PUT] Firebase sync error:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "No se pudo sincronizar el estado de autenticacion" },
        { status: 502 }
      );
    }
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(permisos !== undefined && {
          permisos: (role ?? target.role) === "EDITOR" ? [...new Set(permisos)] : [],
        }),
        ...(role !== undefined && role !== "EDITOR" && { permisos: [] }),
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
  } catch (err) {
    if (
      shouldDisableFirebase !== wasDisabledInFirebase &&
      isFirebaseAdminConfigured &&
      !target.firebaseUid.startsWith("pending-")
    ) {
      await adminAuth
        .updateUser(target.firebaseUid, { disabled: wasDisabledInFirebase })
        .catch(() => undefined);
    }
    throw err;
  }

  console.warn(
    `[security-audit] actor=${user.id} action=user_update target=${id} instance=${target.instanceId ?? "global"}`
  );
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

  const limited = enforceRateLimit(request, {
    scope: "user-delete",
    identifier: user.id,
    limit: 20,
    windowMs: 60 * 60_000,
  });
  if (limited) return limited;

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firebaseUid: true,
      instanceId: true,
      role: true,
      status: true,
      activo: true,
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!checkTenantAccess(user, target.instanceId)) {
    return forbidden();
  }

  if (!hasRecentAuthentication(user)) {
    return NextResponse.json(
      { error: "Vuelve a iniciar sesion antes de eliminar usuarios" },
      { status: 403 }
    );
  }

  if (target.role === "ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo un administrador puede eliminar administradores" },
      { status: 403 }
    );
  }

  if (await isLastActiveAdmin(target)) {
    return NextResponse.json(
      { error: "La instancia debe conservar al menos un administrador activo" },
      { status: 409 }
    );
  }

  // Remove application access first. Unknown Firebase users cannot be
  // auto-provisioned again, so a provider cleanup failure cannot restore access.
  await prisma.user.delete({ where: { id } });

  console.warn(
    `[security-audit] actor=${user.id} action=user_delete target=${id} instance=${target.instanceId ?? "global"}`
  );

  // Delete from Firebase Auth
  if (isFirebaseAdminConfigured && !target.firebaseUid.startsWith("pending-")) {
    try {
      await adminAuth.deleteUser(target.firebaseUid);
    } catch (err) {
      console.error("[users/DELETE] Firebase error:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ success: true });
}
