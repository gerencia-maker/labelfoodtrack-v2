import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    const entry = await prisma.bitacoraEntry.findFirst({
      where: { id, instanceId: user.instanceId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    await prisma.bitacoraEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
