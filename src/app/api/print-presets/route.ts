import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { printPresetSchema } from "@/lib/validations/print-preset";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const preset = await prisma.printPreset.findFirst({
      where: { instanceId: user.instanceId },
    });

    return NextResponse.json(preset);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role === "VIEWER") {
      return NextResponse.json(
        { error: "Sin permisos para modificar configuracion de papel" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = printPresetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.printPreset.findFirst({
      where: { instanceId: user.instanceId },
    });

    let preset;
    if (existing) {
      preset = await prisma.printPreset.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      preset = await prisma.printPreset.create({
        data: { ...parsed.data, instanceId: user.instanceId },
      });
    }

    return NextResponse.json(preset, { status: existing ? 200 : 201 });
  });
}
