import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { isFirebaseAdminConfigured, adminAuth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const hasBearer = !!authHeader?.startsWith("Bearer ");
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

  // Quick debug: try verifyIdToken separately to catch its specific error
  let tokenVerifyStatus = "not_tested";
  let tokenVerifyError = "";
  if (hasBearer && isFirebaseAdminConfigured) {
    const token = authHeader!.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      tokenVerifyStatus = "ok:" + decoded.uid;
    } catch (err) {
      tokenVerifyStatus = "error";
      tokenVerifyError = err instanceof Error ? err.message : String(err);
    }
  }

  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      {
        error: "No autorizado",
        debug: {
          hasBearer,
          isFirebaseAdminConfigured,
          demoMode: demoMode || "(not set)",
          firebaseServiceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
          tokenVerifyStatus,
          tokenVerifyError: tokenVerifyError || undefined,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json(user);
}
