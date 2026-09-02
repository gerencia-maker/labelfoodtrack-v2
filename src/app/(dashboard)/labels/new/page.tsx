"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { usePrintPreset } from "@/hooks/use-print-preset";
import { LabelForm, type LabelSaveData } from "@/components/labels/label-form";
import { type LabelPreviewData } from "@/components/labels/label-preview";
import { LabelPrint } from "@/components/labels/label-print";
import { PrintFlowModal } from "@/components/labels/print-flow-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save } from "lucide-react";
import Link from "next/link";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function NewLabelPage() {
  const { getToken, hasActionPermission } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("labels");
  const { preset, triggerPrint } = usePrintPreset();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const defaultProductId = searchParams.get("productId") || undefined;
  const defaultDate = searchParams.get("date") || undefined;

  const [previewData, setPreviewData] = useState<LabelPreviewData>({
    brand: "",
    productName: "",
    netContent: "--",
    productionDate: "",
    batch: "--",
    coldChain: "--",
    expiryRefrigerated: "--",
    expiryFrozen: "--",
    destination: "",
    packedBy: "",
    ingredients: "",
    allergens: "",
    storage: "",
    usage: "",
    qrData: "",
  });

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<LabelSaveData | null>(null);

  // Intercept Ctrl+P / Cmd+P → open print modal instead of browser print
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (previewData.productName) {
          setShowPrintModal(true);
        }
      }
    };
    // Block browser beforeprint as fallback
    const handleBeforePrint = (e: Event) => {
      if (!showPrintModal) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeydown, { capture: true });
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      document.removeEventListener("keydown", handleKeydown, { capture: true });
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [previewData.productName, showPrintModal]);

  const handlePreviewChange = useCallback((data: LabelPreviewData) => {
    setPreviewData(data);
  }, []);

  const handleSave = async (data: LabelSaveData) => {
    setPendingSaveData(data);
    setShowPrintModal(true);
  };

  const handlePrintConfirm = async (quantity: string) => {
    if (!pendingSaveData) return;

    const token = await getToken();

    if (DEMO_MODE) {
      toast({ title: t("saved"), variant: "success" });
      setShowPrintModal(false);
      setTimeout(() => triggerPrint(), 300);
      return;
    }

    if (!token) return;

    try {
      const labelRes = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...pendingSaveData, quantityProduced: quantity }),
      });

      if (!labelRes.ok) {
        const err = await labelRes.json();
        toast({ title: err.error || "Error al guardar etiqueta", variant: "error" });
        return;
      }

      const savedLabel = await labelRes.json();
      if (savedLabel.qrData) {
        setPreviewData((current) => ({ ...current, qrData: savedLabel.qrData }));
      }

      toast({ title: t("saved"), variant: "success" });
      setPendingSaveData(null);
      setShowPrintModal(false);
      setTimeout(() => triggerPrint(), 300);
    } catch {
      toast({ title: "No fue posible guardar la etiqueta", variant: "error" });
    }
  };

  const handlePrint = () => {
    triggerPrint();
  };

  const hasProduct = !!previewData.productName;

  return (
    <>
      <div className="print:hidden">
        {/* ── Sticky top bar (v1 style) ── */}
        <div className="-mx-3 -mt-3 mb-4 flex items-center justify-between gap-3 border-b border-orange-100 bg-white px-3 py-3 shadow-[var(--shadow-warm-sm)] dark:border-orange-900/30 dark:bg-slate-900 sm:-mx-4 sm:-mt-4 sm:px-4 md:-mx-6 md:-mt-6">
          <Link href="/labels">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 dark:text-slate-400">
              <ArrowLeft className="h-4 w-4" />
              {t("backToLabels")}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {hasActionPermission("labels", "imprimir") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!hasProduct}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                {t("print")}
              </Button>
            )}
          </div>
        </div>

        {/* ── Two-column layout: Form left, Preview right ── */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left column — Form */}
          <div className="w-full lg:w-[420px] lg:shrink-0">
            <div className="rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 shadow-[var(--shadow-warm-sm)] overflow-hidden">
              <LabelForm
                onPreviewChange={handlePreviewChange}
                onSave={handleSave}
                defaultValues={{
                  productId: defaultProductId,
                  productionDate: defaultDate,
                }}
              />
            </div>
          </div>

          {/* Right column — Preview (sticky) */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-4">
              {hasProduct ? (
                <LabelPrint data={previewData} screenPreview preset={preset} />
              ) : (
                <EmptyPreview brand={previewData.brand} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print component (hidden on screen) */}
      <div ref={printRef}>
        <LabelPrint data={previewData} preset={preset} />
      </div>

      {/* Print quantity modal */}
      <PrintFlowModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handlePrintConfirm}
        productName={previewData.productName}
      />
    </>
  );
}

function EmptyPreview({ brand }: { brand: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 p-12 text-center shadow-[var(--shadow-warm-sm)]">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4">
        <Save className="h-7 w-7 text-orange-300 dark:text-orange-500/50" />
      </div>
      {brand && (
        <p className="text-xs font-bold uppercase tracking-widest text-orange-300 dark:text-orange-500/40 mb-2">{brand}</p>
      )}
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Selecciona un producto arriba para ver la vista previa
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        La etiqueta se genera automaticamente con los datos del producto
      </p>
    </div>
  );
}
