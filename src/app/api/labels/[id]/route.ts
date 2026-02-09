import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const { id } = await params;

    const label = await prisma.label.findFirst({
      where: { id, instanceId: user.instanceId },
      include: {
        product: true,
      },
    });

    if (!label) {
      return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(label);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    const label = await prisma.label.findFirst({
      where: { id, instanceId: user.instanceId },
    });

    if (!label) {
      return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
    }

    await prisma.label.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
