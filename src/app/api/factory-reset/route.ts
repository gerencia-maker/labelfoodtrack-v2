import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden, tenantWhere, hasRecentAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActionPermission } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const resetSchema = z
  .object({
    module: z.enum(["all", "products", "labels", "bitacora"]),
    confirmation: z.literal("ELIMINAR"),
  })
  .strict();

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  // Only ADMIN can factory-reset
  if (user.role !== "ADMIN") return forbidden();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "factory_reset")) {
    return forbidden();
  }

  if (!hasRecentAuthentication(user)) {
    return NextResponse.json(
      { error: "Vuelve a iniciar sesion antes de eliminar datos" },
      { status: 403 }
    );
  }

  const limited = enforceRateLimit(request, {
    scope: "factory-reset",
    identifier: user.id,
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (limited) return limited;

  const parsed = resetSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Confirmacion invalida" }, { status: 400 });
  }
  const { module } = parsed.data;

  if (DEMO_MODE) {
    return NextResponse.json({
      success: true,
      deleted: 0,
      demo: true,
      message: "Modo demo: los datos de ejemplo no se pueden eliminar",
    });
  }

  const where = tenantWhere(user);
  if (!where.instanceId) {
    return NextResponse.json(
      { error: "Debe seleccionar una instancia" },
      { status: 400 }
    );
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      switch (module) {
        case "all": {
          const r1 = await tx.bitacoraEntry.deleteMany({ where });
          const r2 = await tx.label.deleteMany({ where });
          const r3 = await tx.product.deleteMany({ where });
          return r1.count + r2.count + r3.count;
        }
        case "products": {
          const r1 = await tx.label.deleteMany({
            where: { ...where, productId: { not: null } },
          });
          const r2 = await tx.product.deleteMany({ where });
          return r1.count + r2.count;
        }
        case "labels": {
          const r = await tx.label.deleteMany({ where });
          return r.count;
        }
        case "bitacora": {
          const r = await tx.bitacoraEntry.deleteMany({ where });
          return r.count;
        }
      }
    });

    console.warn(
      `[security-audit] actor=${user.id} action=factory_reset instance=${where.instanceId} module=${module} deleted=${deleted}`
    );

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("[factory-reset]", err);
    return NextResponse.json(
      { error: "Error al eliminar datos" },
      { status: 500 }
    );
  }
}
