/**
 * Auth v2 — Adapted from FOOD LOGIC MDP.
 * Replaces withAuth() callback pattern with verifyAuth() + utility helpers.
 * Supports super-admin (instanceId = null) with cookie-based instance scoping.
 */

import { NextRequest } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "./firebase-admin";
import { prisma } from "./prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface AuthInstance {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  plan: string;
}

export interface AuthUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  permisos: string[];
  ubicacion?: string | null;
  instanceId: string | null;
  instance?: AuthInstance | null;
  /** True when user has no instanceId in DB (before cookie scoping) */
  isSuperAdmin: boolean;
}

// Mock user for DEMO_MODE — super-admin (instanceId = null)
const demoUser: AuthUser = {
  id: "demo-user-id",
  firebaseUid: "demo-firebase-uid",
  email: "gerencia@gesstionpg.com",
  name: "Gerencia GestionPG",
  role: "ADMIN",
  permisos: ["dashboard", "products", "labels", "bitacora", "configuration", "ai_features", "export", "import", "instances"],
  instanceId: null,
  isSuperAdmin: true,
};

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  // Return demo user if DEMO_MODE or Firebase Admin is not configured
  if (DEMO_MODE || !isFirebaseAdminConfigured) {
    // Super-admin: read cookie to scope to a specific instance (same as real auth)
    const cookieInstanceId = request.cookies.get("lft-instance-id")?.value;
    return {
      ...demoUser,
      instanceId: cookieInstanceId || null,
    };
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        role: true,
        status: true,
        permisos: true,
        ubicacion: true,
        activo: true,
        instanceId: true,
      },
    });

    // Auto-provision: if user doesn't exist by firebaseUid, check by email.
    // Migrated users may have old Firestore UIDs — link them to the new Firebase UID.
    if (!user && decoded.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          role: true,
          status: true,
          permisos: true,
          ubicacion: true,
          activo: true,
          instanceId: true,
        },
      });

      if (existingByEmail) {
        // Link existing user to the new Firebase UID
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { firebaseUid: decoded.uid },
          select: {
            id: true,
            firebaseUid: true,
            email: true,
            name: true,
            role: true,
            status: true,
            permisos: true,
            ubicacion: true,
            activo: true,
            instanceId: true,
          },
        });
        console.log(`[auth] Linked existing user ${user.email} to Firebase UID ${decoded.uid}`);
      }
    }

    // If still no user, create a new one.
    // First user ever becomes super-admin; subsequent users get VIEWER role.
    if (!user) {
      const userCount = await prisma.user.count();
      const isFresh = userCount === 0;

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || "unknown@app.local",
          name: decoded.name || decoded.email?.split("@")[0] || "Usuario",
          role: isFresh ? "ADMIN" : "VIEWER",
          status: "ACTIVE",
          activo: true,
          permisos: isFresh
            ? ["dashboard", "products", "labels", "bitacora", "configuration", "ai_features", "export", "import", "instances"]
            : ["dashboard", "products", "labels"],
          instanceId: null, // super-admin if first, unassigned otherwise
        },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          role: true,
          status: true,
          permisos: true,
          ubicacion: true,
          activo: true,
          instanceId: true,
        },
      });
      console.log(`[auth] Auto-provisioned user ${user.email} as ${user.role}`);

      // Create a default instance if none exist
      if (isFresh) {
        const instanceCount = await prisma.instance.count();
        if (instanceCount === 0) {
          await prisma.instance.create({
            data: {
              name: "Mi Empresa",
              brandName: "Mi Marca",
              destinations: [],
              packers: [],
              plan: "ENTERPRISE",
              activo: true,
            },
          });
          console.log("[auth] Created default instance 'Mi Empresa'");
        }
      }
    }

    if (!user.activo || user.status !== "ACTIVE") {
      return null;
    }

    // Super-admin: instanceId = null OR specific super-admin email
    const SUPER_ADMIN_EMAILS = ["gerencia@gestionpg.com"];
    const isSuper = (user.role === "ADMIN" && !user.instanceId) || SUPER_ADMIN_EMAILS.includes(user.email);
    let effectiveInstanceId = user.instanceId;
    if (isSuper) {
      const cookieInstanceId = request.cookies.get("lft-instance-id")?.value;
      if (cookieInstanceId) {
        effectiveInstanceId = cookieInstanceId;
      }
    }

    // Fetch instance data for the effective instance
    let instance: AuthInstance | null = null;
    if (effectiveInstanceId) {
      const inst = await prisma.instance.findUnique({
        where: { id: effectiveInstanceId },
        select: { id: true, name: true, brandName: true, logoUrl: true, plan: true },
      });
      instance = inst;
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
      permisos: user.permisos,
      ubicacion: user.ubicacion,
      instanceId: effectiveInstanceId,
      instance,
      isSuperAdmin: isSuper,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auth] verifyAuth error:", msg);
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
  if (user.isSuperAdmin) return true;
  return resourceInstanceId === user.instanceId;
}
