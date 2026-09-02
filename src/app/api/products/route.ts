import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { hasActionPermission, hasPermission } from "@/lib/permissions";
import { DEMO_PRODUCTS_BY_INSTANCE } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.role, user.permisos, "products")) return forbidden();

  if (DEMO_MODE) {
    if (user.instanceId && DEMO_PRODUCTS_BY_INSTANCE[user.instanceId]) {
      return NextResponse.json(DEMO_PRODUCTS_BY_INSTANCE[user.instanceId]);
    }
    // Super-admin without instance selected: return all
    return NextResponse.json(Object.values(DEMO_PRODUCTS_BY_INSTANCE).flat());
  }

  const products = await prisma.product.findMany({
    where: { ...tenantWhere(user) },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "products", "crear")) {
    return forbidden();
  }

  if (DEMO_MODE) {
    const body = await request.json();
    return NextResponse.json({ id: `demo-product-${Date.now()}`, ...body, instanceId: user.instanceId }, { status: 201 });
  }

  if (!user.instanceId) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findFirst({
    where: { code: parsed.data.code, instanceId: user.instanceId },
  });

  if (existing) {
    return NextResponse.json({ error: "Ya existe un producto con ese codigo" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, instanceId: user.instanceId },
  });

  return NextResponse.json(product, { status: 201 });
}
