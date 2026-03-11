import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin";

/**
 * Temporary debug endpoint — remove after auth is working.
 * Returns server-side config status (no secrets exposed).
 */
export async function GET() {
  const saLength = process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0;
  const saFirst10 = process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 10) || "(empty)";

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      isFirebaseAdminConfigured,
      DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || "(not set)",
      FIREBASE_SERVICE_ACCOUNT_length: saLength,
      FIREBASE_SERVICE_ACCOUNT_preview: saFirst10,
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
