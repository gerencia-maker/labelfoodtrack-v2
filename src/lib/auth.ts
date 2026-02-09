import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";
import { prisma } from "./prisma";

type DbUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

export async function withAuth(
  request: NextRequest,
  handler: (user: DbUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authorization.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cuenta inactiva" }, { status: 403 });
    }

    return handler(user);
  } catch {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }
}
