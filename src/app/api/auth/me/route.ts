import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  console.log("[auth/me] isFirebaseAdminConfigured:", isFirebaseAdminConfigured);
  console.log("[auth/me] DEMO_MODE:", process.env.NEXT_PUBLIC_DEMO_MODE);
  console.log("[auth/me] has Authorization header:", !!authHeader);

  const user = await verifyAuth(request);
  if (!user) {
    console.log("[auth/me] verifyAuth returned null — returning 401");
    return unauthorized();
  }

  console.log("[auth/me] user:", user.email, "role:", user.role);
  return NextResponse.json(user);
}
