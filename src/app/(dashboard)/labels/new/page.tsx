"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { usePrintPreset } from "@/hooks/use-print-preset";
import { LabelForm, type LabelSaveData } from "@/components/labels/label-form";
import { type LabelPreviewData } from "@/components/labels/label-preview";
import { LabelPrint } from "@/components/labels/label-print";
import { PrintFlowModal } from "@/components/labels/print-flow-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function NewLabelPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("labels");
  const { triggerPrint } = usePrintPreset();
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
  const [formCollapsed, setFormCollapsed] = useState(false);

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

    const labelRes = await fetch("/api/labels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pendingSaveData),
    });

    if (!labelRes.ok) {
      const err = await labelRes.json();
      toast({ title: err.error || "Error al guardar etiqueta", variant: "error" });
      return;
    }

    await fetch("/api/bitacora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productName: pendingSaveData.productName,
        category: pendingSaveData.category || null,
        processDate: pendingSaveData.productionDate,
        quantityProduced: quantity,
        quantity: pendingSaveData.netContent || null,
        packedBy: pendingSaveData.packedBy,
        destination: pendingSaveData.destination,
        batch: pendingSaveData.batch,
        coldChain: pendingSaveData.coldChain || null,
        expiryRefrigerated: pendingSaveData.expiryRefrigerated,
        expiryFrozen: pendingSaveData.expiryFrozen,
      }),
    });

    toast({ title: t("saved"), variant: "success" });
    setShowPrintModal(false);
    setTimeout(() => triggerPrint(), 300);
  };

  const handlePrint = () => {
    triggerPrint();
  };

  const hasProduct = !!previewData.productName;

  return (
    <>
      <div className="print:hidden">
        {/* ── Sticky top bar (v1 style) ── */}
        <div className="-mx-6 -mt-6 mb-4 flex items-center justify-between gap-3 border-b border-orange-100 dark:border-orange-900/30 bg-white dark:bg-slate-900 px-4 py-3 shadow-[var(--shadow-warm-sm)]">
          <Link href="/labels">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 dark:text-slate-400">
              <ArrowLeft className="h-4 w-4" />
              {t("backToLabels")}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* ── Collapsible form panel ── */}
        <div className="mb-4">
          <button
            onClick={() => setFormCollapsed(!formCollapsed)}
            className="flex w-full items-center justify-between rounded-t-2xl border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 px-5 py-3 text-left transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/10">
                <Save className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {hasProduct ? previewData.productName : t("newLabel")}
              </span>
              {hasProduct && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  — {previewData.batch} · {previewData.destination || "--"}
                </span>
              )}
            </div>
            {formCollapsed ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {!formCollapsed && (
            <div className="rounded-b-2xl border border-t-0 border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 p-5 shadow-[var(--shadow-warm-sm)]">
              <LabelForm
                onPreviewChange={handlePreviewChange}
                onSave={handleSave}
                defaultValues={{
                  productId: defaultProductId,
                  productionDate: defaultDate,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Real print label preview (HERO — full width) ── */}
        <div className="flex justify-center">
          <div className="w-full max-w-[900px]">
            {hasProduct ? (
              <LabelPrint data={previewData} screenPreview />
            ) : (
              <EmptyPreview brand={previewData.brand} />
            )}
          </div>
        </div>
      </div>

      {/* Print component (hidden on screen) */}
      <div ref={printRef}>
        <LabelPrint data={previewData} />
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
