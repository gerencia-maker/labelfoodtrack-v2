import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { hasActionPermission } from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_PRODUCTS_BY_INSTANCE: Record<string, unknown[]> = {
  "demo-inst-1": [
    { id: "1", code: "R-01", batchAbbr: "PP0003", name: "AJI RANCHERITO", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 90, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "2", code: "R-02", batchAbbr: "PP0021", name: "CHIMICHURRI", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 60, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "3", code: "R-03", batchAbbr: "PP0056", name: "SALSA TARTARA", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 30, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "4", code: "R-04", batchAbbr: "PP0057", name: "VINAGRETA DE LA CASA", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "5", code: "R-05", batchAbbr: "PP0220", name: "VINAGRETA DE MORA", category: "COCINA INTERMEDIA", refrigeratedDays: 15, frozenDays: 90, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "6", code: "R-06", batchAbbr: "PP0206", name: "SALSA BURGUER", category: "COCINA INTERMEDIA", refrigeratedDays: 20, frozenDays: 60, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "7", code: "R-07", batchAbbr: "PQ01", name: "PANDEQUESO", category: "PANADERIA", refrigeratedDays: 5, frozenDays: 30, ambientDays: 2, instanceId: "demo-inst-1" },
    { id: "8", code: "R-08", batchAbbr: "AB01", name: "AREPA DE BOYACA", category: "PANADERIA", refrigeratedDays: 7, frozenDays: 60, ambientDays: 3, instanceId: "demo-inst-1" },
    { id: "9", code: "R-09", batchAbbr: "AL01", name: "ALMOJABANA", category: "PANADERIA", refrigeratedDays: 4, frozenDays: 30, ambientDays: 2, instanceId: "demo-inst-1" },
    { id: "10", code: "R-10", batchAbbr: "EM01", name: "EMPANADA DE CARNE", category: "FRITOS", refrigeratedDays: 3, frozenDays: 45, ambientDays: 1, instanceId: "demo-inst-1" },
    { id: "11", code: "R-11", batchAbbr: "BU01", name: "BUNUELO", category: "FRITOS", refrigeratedDays: 3, frozenDays: 30, ambientDays: 1, instanceId: "demo-inst-1" },
    { id: "12", code: "R-12", batchAbbr: "QS01", name: "QUESO CAMPESINO", category: "LACTEOS", refrigeratedDays: 15, frozenDays: 90, ambientDays: 0, instanceId: "demo-inst-1" },
    { id: "13", code: "R-13", batchAbbr: "YG01", name: "YOGURT NATURAL", category: "LACTEOS", refrigeratedDays: 21, frozenDays: 0, ambientDays: 0, instanceId: "demo-inst-1" },
  ],
  "demo-inst-2": [
    { id: "20", code: "GT-01", batchAbbr: "ORG01", name: "ENSALADA ORGANICA", category: "ENSALADAS", refrigeratedDays: 3, frozenDays: 0, ambientDays: 0, instanceId: "demo-inst-2" },
    { id: "21", code: "GT-02", batchAbbr: "ORG02", name: "JUGO VERDE DETOX", category: "BEBIDAS", refrigeratedDays: 2, frozenDays: 30, ambientDays: 0, instanceId: "demo-inst-2" },
    { id: "22", code: "GT-03", batchAbbr: "ORG03", name: "BOWL DE QUINOA", category: "PLATOS", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, instanceId: "demo-inst-2" },
    { id: "23", code: "GT-04", batchAbbr: "ORG04", name: "GRANOLA ARTESANAL", category: "SNACKS", refrigeratedDays: 0, frozenDays: 0, ambientDays: 90, instanceId: "demo-inst-2" },
  ],
};

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

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
