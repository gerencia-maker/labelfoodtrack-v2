import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const hasBearer = !!authHeader?.startsWith("Bearer ");
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

  console.log("[auth/me] isFirebaseAdminConfigured:", isFirebaseAdminConfigured);
  console.log("[auth/me] DEMO_MODE:", demoMode);
  console.log("[auth/me] has Authorization header:", hasBearer);

  const user = await verifyAuth(request);
  if (!user) {
    console.log("[auth/me] verifyAuth returned null — returning 401");
    // Return diagnostic info so we can debug from the browser
    return NextResponse.json(
      {
        error: "No autorizado",
        debug: {
          hasBearer,
          isFirebaseAdminConfigured,
          demoMode: demoMode || "(not set)",
          firebaseServiceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
        },
      },
      { status: 401 }
    );
  }

  console.log("[auth/me] user:", user.email, "role:", user.role);
  return NextResponse.json(user);
}
