import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { getDemoInstances, createDemoInstance } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (DEMO_MODE) {
    return NextResponse.json(getDemoInstances());
  }

  try {
    // Super-admin or gerencia email: list all instances
    if (user.isSuperAdmin || user.email === "gerencia@gestionpg.com") {
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
    });

    return NextResponse.json(instance ? [instance] : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  // Only super-admin email can create instances
  if (user.email !== "gerencia@gestionpg.com") {
    return forbidden();
  }

  const body = await request.json();
  const { name, brandName, logoUrl, plan, destinations, packers } = body;

  if (!name) {
    return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const inst = createDemoInstance({
      name,
      brandName: brandName || null,
      plan: plan || "BASIC",
      destinations: destinations || [],
      packers: packers || [],
    });
    return NextResponse.json(inst, { status: 201 });
  }

  try {
    const instance = await prisma.instance.create({
      data: {
        name,
        brandName: brandName || null,
        logoUrl: logoUrl || null,
        plan: plan || "BASIC",
        destinations: destinations || [],
        packers: packers || [],
      },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json(instance, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}
