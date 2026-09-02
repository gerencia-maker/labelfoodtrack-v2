"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !userData) {
      router.push("/login");
    }
  }, [userData, loading, router]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBF7] dark:bg-[#0F0A03]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFBF7] dark:bg-[#0F0A03]">
      <Sidebar className="hidden md:flex" />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative h-full w-fit shadow-2xl">
            <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
