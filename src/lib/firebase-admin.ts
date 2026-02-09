import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    return initializeApp();
  }

  const decoded = Buffer.from(serviceAccount, "base64").toString("utf-8");
  const credentials = JSON.parse(decoded);

  return initializeApp({
    credential: cert(credentials),
  });
}

const app = getFirebaseAdmin();
export const adminAuth = getAuth(app);
