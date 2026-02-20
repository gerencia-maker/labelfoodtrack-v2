"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Building2, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstanceOption {
  id: string;
  name: string;
  brandName: string | null;
  plan: string;
  activo: boolean;
}

export function InstanceSelector() {
  const { isSuperAdmin, getToken } = useAuth();
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInstances = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/instances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadInstances();

    // Read current cookie
    const match = document.cookie.match(/lft-instance-id=([^;]+)/);
    if (match) {
      setSelectedId(match[1]);
    }
  }, [isSuperAdmin, loadInstances]);

  if (!isSuperAdmin) return null;

  const selectInstance = (id: string) => {
    setSelectedId(id);
    setOpen(false);

    if (id) {
      document.cookie = `lft-instance-id=${id};path=/;max-age=${60 * 60 * 24 * 365}`;
    } else {
      document.cookie = "lft-instance-id=;path=/;max-age=0";
    }

    // Reload to apply new scope
    window.location.reload();
  };

  const selected = instances.find((i) => i.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
          selected
            ? "border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
            : "border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400"
        )}
        disabled={loading}
      >
        {selected ? (
          <Building2 size={14} />
        ) : (
          <Globe size={14} />
        )}
        <span className="max-w-[140px] truncate">
          {loading ? "..." : selected ? selected.name : "Todas las instancias"}
        </span>
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
            <button
              onClick={() => selectInstance("")}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                !selectedId && "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400"
              )}
            >
              <Globe size={14} />
              <span className="font-medium">Todas las instancias</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

            {instances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => selectInstance(inst.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                  selectedId === inst.id && "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                )}
              >
                <Building2 size={14} className="shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{inst.name}</p>
                  {inst.brandName && (
                    <p className="truncate text-slate-400 dark:text-slate-500">{inst.brandName}</p>
                  )}
                </div>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  inst.plan === "ENTERPRISE"
                    ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {inst.plan}
                </span>
              </button>
            ))}

            {instances.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-slate-400">No hay instancias</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
