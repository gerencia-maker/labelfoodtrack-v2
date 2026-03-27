"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Package, X, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";

interface PrintFlowModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (quantity: string) => Promise<void>;
  productName?: string;
}

/**
 * Modal "Cantidad producida" - pide cantidad + unidad antes de guardar + imprimir.
 */
// Format number with thousand separators (dots), comma as decimal
function formatThousands(value: string): string {
  if (!value) return "";
  const [intPart, decPart] = value.split(",");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}

export function PrintFlowModal({ open, onClose, onConfirm, productName }: PrintFlowModalProps) {
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [units, setUnits] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const qtyRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const t = useTranslations("labels");

  // Load units from API (only when modal opens)
  const loadUnits = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/units", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loadedUnits = data.units || [];
        setUnits(loadedUnits);
        if (loadedUnits.length > 0) setUnit(loadedUnits[0]);
      }
    } catch { /* silent */ }
  }, [getToken]);

  useEffect(() => {
    if (open) {
      setQty("");
      setSaving(false);
      loadUnits();
      setTimeout(() => qtyRef.current?.focus(), 100);
    }
  }, [open, loadUnits]);


  const handleConfirm = async () => {
    if (!qty.trim()) return;
    setSaving(true);
    try {
      const combined = unit ? `${qty.trim()} ${unit}` : qty.trim();
      await onConfirm(combined);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && qty.trim()) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("quantityProduced")}
              </h3>
              {productName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{productName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("quantityHint")}
          </p>

          {/* Quantity + selected unit display */}
          <div className="flex items-center gap-2">
            <input
              ref={qtyRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={formatThousands(qty)}
              onChange={(e) => {
                // Strip formatting, keep only digits, dot, comma (as decimal)
                const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, "");
                // Allow only one comma (decimal separator)
                const parts = raw.split(",");
                const clean = parts.length > 2 ? parts[0] + "," + parts.slice(1).join("") : raw;
                setQty(clean);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 h-14 rounded-xl border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 px-4 text-center text-2xl font-bold text-slate-800 dark:text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20 transition-colors"
            />
            <div className="h-14 flex items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20 px-5 min-w-[60px]">
              <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{unit || "..."}</span>
            </div>
          </div>

          {/* Unit chips */}
          <div className="flex flex-wrap gap-1.5">
            {units.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  u === unit
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-700"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            onClick={handleConfirm}
            disabled={saving || !qty.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {saving ? t("saving") : t("savePrint")}
          </Button>
        </div>
      </div>
    </div>
  );
}
