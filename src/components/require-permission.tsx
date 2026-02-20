"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { PermisoCodigo } from "@/lib/permissions";

interface RequirePermissionProps {
  permission: PermisoCodigo;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Page-level guard: redirects to / if the user lacks the required permission.
 * Wrap page content: <RequirePermission permission="labels">...</RequirePermission>
 */
export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { hasPermission, loading, userData } = useAuth();
  const router = useRouter();

  const allowed = !loading && userData && hasPermission(permission);

  useEffect(() => {
    if (!loading && userData && !hasPermission(permission)) {
      router.replace("/");
    }
  }, [loading, userData, permission, hasPermission, router]);

  if (loading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      )
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
