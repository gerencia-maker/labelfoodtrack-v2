import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, hasRecentAuthentication } from "@/lib/auth";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validations/user";
import { enforceRateLimit } from "@/lib/rate-limit";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "gestionar_usuarios")) {
    return forbidden();
  }

  if (DEMO_MODE) {
    return NextResponse.json([]);
  }

  try {
    const queryInstanceId = request.nextUrl.searchParams.get("instanceId");
    const effectiveInstanceId = user.isSuperAdmin && queryInstanceId
      ? queryInstanceId
      : user.instanceId;
    const where = effectiveInstanceId ? { instanceId: effectiveInstanceId } : {};

    const users = await prisma.user.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "gestionar_usuarios")) {
    return forbidden();
  }

  const limited = enforceRateLimit(request, {
    scope: "user-create",
    identifier: user.id,
    limit: 20,
    windowMs: 60 * 60_000,
  });
  if (limited) return limited;

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, name, role, permisos, ubicacion, instanceId } = parsed.data;

  if (role === "ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo un administrador puede asignar el rol ADMIN" },
      { status: 403 }
    );
  }
  if (role === "ADMIN" && !hasRecentAuthentication(user)) {
    return NextResponse.json(
      { error: "Vuelve a iniciar sesion antes de crear un administrador" },
      { status: 403 }
    );
  }

  const targetInstanceId = user.isSuperAdmin && instanceId
    ? instanceId
    : user.instanceId;

  if (!targetInstanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const targetInstance = await prisma.instance.findUnique({
    where: { id: targetInstanceId },
    select: { id: true, activo: true },
  });
  if (!targetInstance || !targetInstance.activo) {
    return NextResponse.json({ error: "Instancia no disponible" }, { status: 400 });
  }

  // Check if user already exists in DB
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json({ error: "Firebase Admin no configurado" }, { status: 500 });
    }

    // 1. Create Firebase Auth user
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    try {
      // 2. Create Prisma user with real Firebase UID
      const newUser = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email,
          name,
          role,
          permisos: role === "EDITOR" ? [...new Set(permisos)] : [],
          ubicacion: ubicacion || null,
          instanceId: targetInstanceId,
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

      console.warn(
        `[security-audit] actor=${user.id} action=user_create target=${newUser.id} instance=${targetInstanceId} role=${newUser.role}`
      );
      return NextResponse.json(newUser, { status: 201 });
    } catch (dbError) {
      // Rollback: delete Firebase user if Prisma create fails
      await adminAuth.deleteUser(firebaseUser.uid);
      throw dbError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear usuario";
    // Firebase-specific error messages
    if (message.includes("email-already-exists")) {
      return NextResponse.json({ error: "El email ya existe en Firebase Auth" }, { status: 409 });
    }
    console.error("[users/POST] Error:", message);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}
