"use client";

import { useState, useRef, useEffect } from "react";
import { Package, X, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PrintFlowModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (quantity: string) => Promise<void>;
  productName?: string;
}

/**
 * Modal "Cantidad producida" - replica del flujo v1 (startPrintFlow / confirmPrintFlow).
 * Pide la cantidad antes de guardar la etiqueta + crear bitacora + imprimir.
 */
export function PrintFlowModal({ open, onClose, onConfirm, productName }: PrintFlowModalProps) {
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuantity("");
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!quantity.trim()) return;
    setSaving(true);
    try {
      await onConfirm(quantity.trim());
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && quantity.trim()) {
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
                Cantidad producida
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
            Ingresa la cantidad producida antes de guardar e imprimir.
          </p>
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="Ej: 50, 2 kg, 10 bolsas..."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center text-lg font-semibold"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            onClick={handleConfirm}
            disabled={saving || !quantity.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : "Guardar e imprimir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
