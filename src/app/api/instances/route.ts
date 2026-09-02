import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDemoInstances, createDemoInstance } from "@/lib/demo-data";
import { createInstanceSchema } from "@/lib/validations/instance";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (DEMO_MODE) {
    return NextResponse.json(getDemoInstances());
  }

  try {
    // Super-admin or gerencia email: list all instances
    if (user.isSuperAdmin) {
      const instances = await prisma.instance.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true } } },
      });
      return NextResponse.json(instances);
    }

    // Regular user: return their own instance
    if (!user.instanceId) return NextResponse.json([]);
    const instance = await prisma.instance.findUnique({
      where: { id: user.instanceId },
      select: {
        id: true,
        name: true,
        brandName: true,
        logoUrl: true,
        plan: true,
        activo: true,
        destinations: true,
        packers: true,
        units: true,
      },
    });

    return NextResponse.json(instance ? [instance] : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!user.isSuperAdmin) {
    return forbidden();
  }

  const parsed = createInstanceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, brandName, logoUrl, plan, destinations, packers } = parsed.data;

  if (DEMO_MODE) {
    const inst = createDemoInstance({
      name,
      brandName: brandName || null,
      plan,
      destinations,
      packers,
    });
    return NextResponse.json(inst, { status: 201 });
  }

  try {
    const instance = await prisma.instance.create({
      data: {
        name,
        brandName: brandName || null,
        logoUrl: logoUrl || null,
        plan,
        destinations,
        packers,
      },
      include: { _count: { select: { users: true } } },
    });

    console.warn(
      `[security-audit] actor=${user.id} action=instance_create target=${instance.id}`
    );
    return NextResponse.json(instance, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}
