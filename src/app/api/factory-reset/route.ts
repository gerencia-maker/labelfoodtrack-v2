import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  // Only ADMIN can factory-reset
  if (user.role !== "ADMIN") return forbidden();

  if (!hasPermission(user.role, user.permisos, "configuration")) {
    return forbidden();
  }

  const where = tenantWhere(user);
  if (!where.instanceId) {
    return NextResponse.json(
      { error: "Debe seleccionar una instancia" },
      { status: 400 }
    );
  }

  const { module } = await request.json();

  try {
    let deleted = 0;

    switch (module) {
      case "all": {
        // Order matters: labels reference products
        const r1 = await prisma.bitacoraEntry.deleteMany({ where });
        const r2 = await prisma.label.deleteMany({ where });
        const r3 = await prisma.product.deleteMany({ where });
        deleted = r1.count + r2.count + r3.count;
        break;
      }
      case "products": {
        // Delete labels linked to products first, then products
        const r1 = await prisma.label.deleteMany({
          where: { ...where, productId: { not: null } },
        });
        const r2 = await prisma.product.deleteMany({ where });
        deleted = r1.count + r2.count;
        break;
      }
      case "labels": {
        const r = await prisma.label.deleteMany({ where });
        deleted = r.count;
        break;
      }
      case "bitacora": {
        const r = await prisma.bitacoraEntry.deleteMany({ where });
        deleted = r.count;
        break;
      }
      default:
        return NextResponse.json(
          { error: "Modulo no valido" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("[factory-reset]", err);
    return NextResponse.json(
      { error: "Error al eliminar datos" },
      { status: 500 }
    );
  }
}
