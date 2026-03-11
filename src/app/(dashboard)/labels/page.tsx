"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { RequirePermission } from "@/components/require-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Tag, Search, Printer, Eye } from "lucide-react";
import Link from "next/link";

interface LabelItem {
  id: string;
  productName: string;
  brand: string | null;
  batch: string | null;
  destination: string | null;
  createdAt: string;
  product: { code: string; name: string; category: string | null } | null;
}

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { getToken, userData } = useAuth();

  const canCreate = userData?.role === "ADMIN" || userData?.role === "EDITOR";
  const canDelete = userData?.role === "ADMIN" || userData?.role === "EDITOR";

  const loadLabels = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch("/api/labels", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLabels(data);
      }
    } catch (err) {
      console.error("Error loading labels:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta etiqueta?")) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/labels/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setLabels((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const filtered = labels.filter(
    (l) =>
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      (l.batch && l.batch.toLowerCase().includes(search.toLowerCase())) ||
      (l.destination && l.destination.toLowerCase().includes(search.toLowerCase())) ||
      (l.product?.code && l.product.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <RequirePermission permission="labels">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Etiquetas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {labels.length} etiquetas generadas
            </p>
          </div>

          {canCreate && (
            <Link href="/labels/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva etiqueta
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por producto, lote, destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : labels.length === 0 ? (
          <div className="rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 p-12 text-center shadow-[var(--shadow-warm-sm)]">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-orange-400" />
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300">No hay etiquetas generadas</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Crea tu primera etiqueta desde un producto</p>
            {canCreate && (
              <Link href="/labels/new">
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Crear primera etiqueta
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 shadow-[var(--shadow-warm-sm)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-orange-200 dark:border-orange-500/20 bg-orange-50/80 dark:bg-orange-500/5">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Lote</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide hidden sm:table-cell">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide hidden md:table-cell">Destino</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      No se encontraron etiquetas
                    </td>
                  </tr>
                ) : (
                  filtered.map((label, idx) => (
                    <tr
                      key={label.id}
                      className={`border-b border-orange-100 dark:border-orange-900/20 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors ${
                        idx % 2 === 1 ? "bg-orange-50/30 dark:bg-orange-500/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <Link
                            href={`/labels/${label.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                          >
                            {label.productName}
                          </Link>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {label.product?.code || "---"}
                            {label.product?.category && ` · ${label.product.category}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {label.batch ? (
                          <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                            {label.batch}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {label.brand || "--"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {label.destination ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            {label.destination}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {new Date(label.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/labels/${label.id}`}>
                            <button className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(label.id)}
                              className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {filtered.length} de {labels.length} etiquetas
          </p>
        )}
      </div>
    </RequirePermission>
  );
}
