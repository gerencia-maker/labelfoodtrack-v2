"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Tag } from "lucide-react";
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

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_LABELS: LabelItem[] = [
  { id: "1", productName: "Pandequeso", brand: "RANCHERITO", batch: "PQ-090226-0800", destination: "ALZATE", createdAt: "2026-02-09T08:30:00Z", product: { code: "P001", name: "Pandequeso", category: "Panaderia" } },
  { id: "2", productName: "Arepa de Boyaca", brand: "RANCHERITO", batch: "AB-090226-0700", destination: "MIRANORTE", createdAt: "2026-02-09T07:15:00Z", product: { code: "P002", name: "Arepa de Boyaca", category: "Panaderia" } },
  { id: "3", productName: "Empanada de Carne", brand: "RANCHERITO", batch: "EM-080226-1000", destination: "NM", createdAt: "2026-02-08T10:45:00Z", product: { code: "P003", name: "Empanada de Carne", category: "Fritos" } },
  { id: "4", productName: "Queso Campesino", brand: "RANCHERITO", batch: "QS-080226-0600", destination: "ALZATE", createdAt: "2026-02-08T06:20:00Z", product: { code: "P006", name: "Queso Campesino", category: "Lacteos" } },
  { id: "5", productName: "Buñuelo", brand: "RANCHERITO", batch: "BU-070226-0900", destination: "MIRANORTE", createdAt: "2026-02-07T09:00:00Z", product: { code: "P005", name: "Buñuelo", category: "Fritos" } },
];

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelItem[]>(DEMO_MODE ? DEMO_LABELS : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const { getToken, userData } = useAuth();

  const canCreate = userData?.canCreateLabel || userData?.role === "ADMIN" || userData?.role === "EDITOR";
  const canDelete = userData?.role === "ADMIN" || userData?.role === "EDITOR";

  const loadLabels = useCallback(async () => {
    if (DEMO_MODE) return;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Etiquetas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Etiquetas generadas recientemente.
          </p>
        </div>

        {canCreate && (
          <Link href="/labels/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva etiqueta
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : labels.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">No hay etiquetas generadas</p>
          {canCreate && (
            <Link href="/labels/new">
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4" />
                Crear primera etiqueta
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map((label) => (
            <Link
              key={label.id}
              href={`/labels/${label.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {label.productName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {label.product?.code || "---"} | {label.brand || "---"}
                  </p>
                </div>

                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(label.id);
                    }}
                    className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {label.batch && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                    {label.batch}
                  </span>
                )}
                {label.destination && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    {label.destination}
                  </span>
                )}
              </div>

              <p className="mt-2 text-[10px] text-slate-400">
                {new Date(label.createdAt).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">{labels.length} etiquetas</p>
    </div>
  );
}
