/**
 * Auth v2 — Adapted from FOOD LOGIC MDP.
 * Replaces withAuth() callback pattern with verifyAuth() + utility helpers.
 * Supports super-admin (instanceId = null) with cookie-based instance scoping.
 */

import { NextRequest } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "./firebase-admin";
import { prisma } from "./prisma";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const UNASSIGNED_INSTANCE_ID = "__unassigned__";
let warnedMissingFirebaseAdmin = false;

if (DEMO_MODE && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_DEMO_MODE must never be enabled in production");
}

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
  authTime?: number;
  /** True when user has no instanceId in DB (before cookie scoping) */
  isSuperAdmin: boolean;
}

// Mock user for DEMO_MODE — super-admin (instanceId = null)
const demoUser: AuthUser = {
  id: "demo-user-id",
  firebaseUid: "demo-firebase-uid",
  email: "gerencia@gestionpg.com",
  name: "Gerencia GestionPG",
  role: "ADMIN",
  permisos: ["dashboard", "products", "labels", "bitacora", "configuration", "ai_features", "export", "import", "instances"],
  instanceId: null,
  authTime: Math.floor(Date.now() / 1000),
  isSuperAdmin: true,
};

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  // Demo access must always be explicit. Missing production credentials must fail closed.
  if (DEMO_MODE) {
    // Super-admin: read cookie to scope to a specific instance (same as real auth)
    const cookieInstanceId = request.cookies.get("lft-instance-id")?.value;
    return {
      ...demoUser,
      instanceId: cookieInstanceId || null,
      authTime: Math.floor(Date.now() / 1000),
    };
  }

  if (!isFirebaseAdminConfigured) {
    if (!warnedMissingFirebaseAdmin) {
      console.error("[auth] FIREBASE_SERVICE_ACCOUNT is missing; authentication is disabled");
      warnedMissingFirebaseAdmin = true;
    }
    return null;
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    // Check revocation as well as signature/expiry. This also rejects disabled
    // Firebase users instead of accepting an already-issued token for up to an hour.
    const decoded = await adminAuth.verifyIdToken(token, true);

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
        licenseEndDate: true,
        instanceId: true,
      },
    });

    // Auto-provision: if user doesn't exist by firebaseUid, check by email.
    // Migrated users may have old Firestore UIDs — link them to the new Firebase UID.
    if (!user && decoded.email && decoded.email_verified) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email: { equals: decoded.email, mode: "insensitive" } },
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
          licenseEndDate: true,
          instanceId: true,
        },
      });

      const canRelink =
        existingByEmail?.firebaseUid.startsWith("pending-") ||
        process.env.ALLOW_FIREBASE_UID_RELINK === "true";

      if (existingByEmail && canRelink) {
        // Relinking is restricted to verified emails and must be explicitly
        // enabled unless this is an invited placeholder account.
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
            licenseEndDate: true,
            instanceId: true,
          },
        });
        console.log(`[auth] Linked existing user ${user.email} to Firebase UID ${decoded.uid}`);
      }
    }

    // Bootstrap is explicit and single-purpose. Unknown Firebase users are not
    // automatically inserted into the application database.
    if (!user) {
      const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
      const tokenEmail = decoded.email?.trim().toLowerCase();
      const canBootstrap =
        !!bootstrapEmail &&
        !!tokenEmail &&
        decoded.email_verified === true &&
        tokenEmail === bootstrapEmail;

      if (!canBootstrap) return null;

      const userCount = await prisma.user.count();
      if (userCount !== 0) return null;

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: tokenEmail,
          name: decoded.name || tokenEmail.split("@")[0] || "Administrador",
          role: "ADMIN",
          status: "ACTIVE",
          activo: true,
          permisos: ["dashboard", "products", "labels", "bitacora", "configuration", "ai_features", "export", "import", "instances"],
          instanceId: null,
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
          licenseEndDate: true,
          instanceId: true,
        },
      });
      console.log(`[auth] Bootstrapped administrator ${user.email}`);

      // Create a default instance if none exist
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

    if (
      !user.activo ||
      user.status !== "ACTIVE" ||
      (user.licenseEndDate && user.licenseEndDate.getTime() < Date.now())
    ) {
      return null;
    }

    // Global access must be explicit in the database; no email-address bypasses.
    const isSuper = user.role === "ADMIN" && !user.instanceId;
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
        select: { id: true, name: true, brandName: true, logoUrl: true, plan: true, activo: true },
      });
      if (!inst || (!inst.activo && !isSuper)) return null;
      instance = {
        id: inst.id,
        name: inst.name,
        brandName: inst.brandName,
        logoUrl: inst.logoUrl,
        plan: inst.plan,
      };
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
      authTime: decoded.auth_time,
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
  if (user.isSuperAdmin && !user.instanceId) return {};
  return { instanceId: user.instanceId ?? UNASSIGNED_INSTANCE_ID };
}

export function hasRecentAuthentication(user: AuthUser, maxAgeSeconds = 15 * 60): boolean {
  if (!user.authTime) return false;
  return Math.floor(Date.now() / 1000) - user.authTime <= maxAgeSeconds;
}

/**
 * Check if user has access to a resource by its instanceId.
 */
export function checkTenantAccess(user: AuthUser, resourceInstanceId: string | null): boolean {
  if (user.isSuperAdmin) return true;
  if (!user.instanceId || !resourceInstanceId) return false;
  return resourceInstanceId === user.instanceId;
}
