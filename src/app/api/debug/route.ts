import { NextRequest, NextResponse } from "next/server";
import { isFirebaseAdminConfigured, adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

/**
 * Temporary debug endpoint — remove after auth is working.
 * Tests each component: config, Firebase Admin, DB connection.
 */
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    config: {
      isFirebaseAdminConfigured,
      DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || "(not set)",
      FIREBASE_SERVICE_ACCOUNT_length: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
      DATABASE_URL_set: !!process.env.DATABASE_URL,
    },
  };

  // Test 1: Database connection + list users
  try {
    const users = await prisma.user.findMany({
      select: { email: true, firebaseUid: true, role: true, status: true, instanceId: true },
    });
    const instanceCount = await prisma.instance.count();
    results.database = {
      status: "ok",
      instanceCount,
      users: users.map((u) => ({
        email: u.email,
        firebaseUid: u.firebaseUid.substring(0, 10) + "...",
        role: u.role,
        status: u.status,
        instanceId: u.instanceId ? u.instanceId.substring(0, 8) + "..." : null,
      })),
    };
  } catch (err) {
    results.database = {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 2: Firebase Admin token verification (if Bearer token provided)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      results.firebaseVerify = {
        status: "ok",
        uid: decoded.uid,
        email: decoded.email,
      };
    } catch (err) {
      results.firebaseVerify = {
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    results.firebaseVerify = { status: "skipped", reason: "no Bearer token" };
  }

  return NextResponse.json(results);
}
