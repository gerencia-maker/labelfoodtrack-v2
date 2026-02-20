import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { hasActionPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

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
