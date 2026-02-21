"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import {
  hasPermission as checkPermission,
  hasActionPermission as checkActionPermission,
  type PermisoCodigo,
} from "@/lib/permissions";

interface UserData {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  permisos: string[];
  instanceId: string | null;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getToken: () => Promise<string | null>;
  hasPermission: (permission: PermisoCodigo) => boolean;
  hasActionPermission: (module: string, action: string) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_USER_DATA: UserData = {
  id: "demo-user",
  firebaseUid: "demo-uid",
  email: "gerencia@gesstionpg.com",
  name: "Gerencia GestionPG",
  role: "ADMIN",
  permisos: ["dashboard", "products", "labels", "bitacora", "configuration", "ai_features", "export", "import", "instances"],
  instanceId: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // In DEMO_MODE, check if user was previously "logged out"
      const demoLoggedOut = sessionStorage.getItem("lft-demo-logout");
      if (!demoLoggedOut) {
        setUserData(DEMO_USER_DATA);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setUserData({
              ...data,
              permisos: data.permisos ?? [],
            });
          } else {
            setUserData(null);
          }
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      // In DEMO_MODE, accept any credentials and set the demo user
      sessionStorage.removeItem("lft-demo-logout");
      setUserData(DEMO_USER_DATA);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      sessionStorage.setItem("lft-demo-logout", "true");
    } else {
      await firebaseSignOut(auth);
    }
    setUserData(null);
  };

  const resetPassword = async (email: string) => {
    if (DEMO_MODE) return;
    await sendPasswordResetEmail(auth, email);
  };

  const getToken = async () => {
    if (DEMO_MODE) return "demo-token";
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  };

  const hasPermission = useCallback(
    (permission: PermisoCodigo) => {
      if (!userData) return false;
      return checkPermission(userData.role, userData.permisos, permission);
    },
    [userData]
  );

  const hasActionPermission = useCallback(
    (module: string, action: string) => {
      if (!userData) return false;
      return checkActionPermission(userData.role, userData.permisos, module, action);
    },
    [userData]
  );

  const isSuperAdmin = userData?.role === "ADMIN" && !userData?.instanceId;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userData,
        loading,
        signIn,
        signOut,
        resetPassword,
        getToken,
        hasPermission,
        hasActionPermission,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
