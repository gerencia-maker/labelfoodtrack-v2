import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/** True when FIREBASE_SERVICE_ACCOUNT is empty/missing */
export const isFirebaseAdminConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT;

console.log("[firebase-admin] isFirebaseAdminConfigured:", isFirebaseAdminConfigured);
console.log("[firebase-admin] FIREBASE_SERVICE_ACCOUNT length:", process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.log("[firebase-admin] No service account — using default app");
    return initializeApp();
  }

  try {
    const decoded = Buffer.from(serviceAccount, "base64").toString("utf-8");
    const credentials = JSON.parse(decoded);
    console.log("[firebase-admin] Loaded service account for project:", credentials.project_id);
    console.log("[firebase-admin] Client email:", credentials.client_email);

    return initializeApp({
      credential: cert(credentials),
    });
  } catch (err) {
    console.error("[firebase-admin] Error parsing service account:", err instanceof Error ? err.message : err);
    return initializeApp();
  }
}

const app = getFirebaseAdmin();
export const adminAuth = getAuth(app);
