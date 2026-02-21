/**
 * Auth v2 — Adapted from FOOD LOGIC MDP.
 * Replaces withAuth() callback pattern with verifyAuth() + utility helpers.
 * Supports super-admin (instanceId = null) with cookie-based instance scoping.
 */

import { NextRequest } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "./firebase-admin";
import { prisma } from "./prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface AuthUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  permisos: string[];
  instanceId: string | null;
}

// Mock user for DEMO_MODE
const demoUser: AuthUser = {
  id: "demo-user-id",
  firebaseUid: "demo-firebase-uid",
  email: "demo@labelfoodtrack.app",
  name: "Usuario Demo",
  role: "ADMIN",
  permisos: [],
  instanceId: "demo-instance-id",
};

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  // Return demo user if DEMO_MODE or Firebase Admin is not configured
  if (DEMO_MODE || !isFirebaseAdminConfigured) {
    return demoUser;
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        role: true,
        status: true,
        permisos: true,
        activo: true,
        instanceId: true,
      },
    });

    if (!user || !user.activo || user.status !== "ACTIVE") {
      return null;
    }

    // Super-admin: instanceId = null, use cookie to scope to a specific instance
    let effectiveInstanceId = user.instanceId;
    if (user.role === "ADMIN" && !user.instanceId) {
      const cookieInstanceId = request.cookies.get("lft-instance-id")?.value;
      if (cookieInstanceId) {
        effectiveInstanceId = cookieInstanceId;
      }
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
      permisos: user.permisos,
      instanceId: effectiveInstanceId,
    };
  } catch {
    return null;
  }
}

// --- Response helpers ---

export function unauthorized() {
  return new Response(JSON.stringify({ error: "No autorizado" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function forbidden() {
  return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export function requireRole(user: AuthUser, allowedRoles: string[]): Response | null {
  if (!allowedRoles.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

// --- Tenant scoping helpers ---

/**
 * Returns a Prisma where filter for tenant isolation.
 * Super-admin (instanceId null) sees everything; tenant users see only their data.
 */
export function tenantWhere(user: AuthUser): { instanceId?: string } {
  return user.instanceId ? { instanceId: user.instanceId } : {};
}

/**
 * Check if user has access to a resource by its instanceId.
 */
export function checkTenantAccess(user: AuthUser, resourceInstanceId: string | null): boolean {
  if (!user.instanceId) return true; // super-admin
  return resourceInstanceId === user.instanceId;
}
