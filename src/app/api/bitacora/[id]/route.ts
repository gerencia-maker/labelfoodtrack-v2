import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "bitacora", "eliminar")) {
    return forbidden();
  }

  const { id } = await params;

  const entry = await prisma.bitacoraEntry.findFirst({
    where: { id, ...tenantWhere(user) },
  });

  if (!entry) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  await prisma.bitacoraEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
