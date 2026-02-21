import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
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
    const where = user.instanceId ? { instanceId: user.instanceId } : {};

    const users = await prisma.user.findMany({
      where,
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

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const body = await request.json();
  const { email, name, role, permisos } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const newUser = await prisma.user.create({
    data: {
      firebaseUid: `pending-${Date.now()}`,
      email,
      name,
      role: role || "VIEWER",
      permisos: permisos || [],
      instanceId: user.instanceId,
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

  return NextResponse.json(newUser, { status: 201 });
}
