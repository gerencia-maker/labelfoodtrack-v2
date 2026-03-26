import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";

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
    const effectiveInstanceId = (user.isSuperAdmin || user.email === "gerencia@gestionpg.com") && queryInstanceId
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

  const body = await request.json();
  const { email, password, name, role, permisos, ubicacion } = body;

  const targetInstanceId = (user.isSuperAdmin || user.email === "gerencia@gestionpg.com") && body.instanceId
    ? body.instanceId
    : user.instanceId;

  if (!targetInstanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  if (!email || !name) {
    return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
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
          role: role || "VIEWER",
          permisos: permisos || [],
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
