"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Package, X, Printer, Loader2, ChevronDown } from "lucide-react";
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
export function PrintFlowModal({ open, onClose, onConfirm, productName }: PrintFlowModalProps) {
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [units, setUnits] = useState<string[]>([]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const qtyRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const t = useTranslations("labels");

  // Load units from API
  const loadUnits = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/units", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
        if (!unit && data.units?.length > 0) setUnit(data.units[0]);
      }
    } catch { /* silent */ }
  }, [getToken, unit]);

  useEffect(() => {
    if (open) {
      setQty("");
      setSaving(false);
      setUnitSearch("");
      setShowUnitDropdown(false);
      loadUnits();
      setTimeout(() => qtyRef.current?.focus(), 100);
    }
  }, [open, loadUnits]);

  // Close unit dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) {
        setShowUnitDropdown(false);
        setUnitSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const filteredUnits = unitSearch
    ? units.filter((u) => u.toLowerCase().includes(unitSearch.toLowerCase()))
    : units;

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
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            {t("quantityHint")}
          </p>
          <div className="flex gap-2">
            {/* Quantity input */}
            <input
              ref={qtyRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={qty}
              onChange={(e) => {
                // Allow digits, dot, comma
                const v = e.target.value.replace(/[^0-9.,]/g, "");
                setQty(v);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 h-12 rounded-xl border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 px-4 text-center text-xl font-bold text-slate-800 dark:text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20 transition-colors"
            />

            {/* Unit selector */}
            <div ref={unitRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowUnitDropdown(!showUnitDropdown); setUnitSearch(""); }}
                className="flex items-center gap-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-300 transition-colors min-w-[70px] justify-between"
              >
                <span>{unit || "..."}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showUnitDropdown && (
                <div className="absolute bottom-full right-0 mb-1 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 overflow-hidden">
                  <div className="p-2">
                    <input
                      autoFocus
                      type="text"
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      placeholder={t("searchUnit")}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredUnits.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 text-center">--</div>
                    ) : (
                      filteredUnits.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => { setUnit(u); setShowUnitDropdown(false); setUnitSearch(""); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors ${
                            u === unit ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {u}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
