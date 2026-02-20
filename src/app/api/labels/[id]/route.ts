import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const { id } = await params;

  const label = await prisma.label.findFirst({
    where: { id, ...tenantWhere(user) },
    include: {
      product: true,
    },
  });

  if (!label) {
    return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(label);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "labels", "eliminar")) {
    return forbidden();
  }

  const { id } = await params;

  const label = await prisma.label.findFirst({
    where: { id, ...tenantWhere(user) },
  });

  if (!label) {
    return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
  }

  await prisma.label.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
