import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const products = await prisma.product.findMany({
      where: { instanceId: user.instanceId },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(products);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos para crear productos" }, { status: 403 });
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
  });
}
