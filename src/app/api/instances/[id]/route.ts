import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, checkTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasPermission(user.role, user.permisos, "configuration")) {
    return forbidden();
  }

  const { id } = await params;

  if (!checkTenantAccess(user, id)) {
    return forbidden();
  }

  const body = await request.json();
  const { name, brandName, plan, activo, destinations } = body;

  const existing = await prisma.instance.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Instancia no encontrada" }, { status: 404 });
  }

  const instance = await prisma.instance.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(brandName !== undefined && { brandName }),
      ...(plan !== undefined && { plan }),
      ...(activo !== undefined && { activo }),
      ...(destinations !== undefined && { destinations }),
    },
  });

  return NextResponse.json(instance);
}
