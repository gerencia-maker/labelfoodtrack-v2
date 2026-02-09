"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { LabelForm, type LabelSaveData } from "@/components/labels/label-form";
import { LabelPreview, type LabelPreviewData } from "@/components/labels/label-preview";
import { LabelPrint } from "@/components/labels/label-print";
import { PrintFlowModal } from "@/components/labels/print-flow-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function NewLabelPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("labels");
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const defaultProductId = searchParams.get("productId") || undefined;
  const defaultDate = searchParams.get("date") || undefined;

  const [previewData, setPreviewData] = useState<LabelPreviewData>({
    brand: "RANCHERITO",
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

  // Print flow modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<LabelSaveData | null>(null);

  const handlePreviewChange = useCallback((data: LabelPreviewData) => {
    setPreviewData(data);
  }, []);

  // When form calls onSave, we intercept to show the quantity modal first
  const handleSave = async (data: LabelSaveData) => {
    setPendingSaveData(data);
    setShowPrintModal(true);
  };

  // After user enters quantity and confirms in the modal
  const handlePrintConfirm = async (quantity: string) => {
    if (!pendingSaveData) return;

    const token = await getToken();

    if (DEMO_MODE) {
      toast({ title: t("saved"), variant: "success" });
      setShowPrintModal(false);
      setTimeout(() => window.print(), 300);
      return;
    }

    if (!token) return;

    // 1. Save label
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

    // 2. Create bitacora entry with quantity
    await fetch("/api/bitacora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productName: pendingSaveData.productName,
        processDate: pendingSaveData.productionDate,
        quantityProduced: quantity,
        packedBy: pendingSaveData.packedBy,
        destination: pendingSaveData.destination,
        batch: pendingSaveData.batch,
        coldChain: previewData.coldChain !== "--" ? previewData.coldChain : null,
      }),
    });

    toast({ title: t("saved"), variant: "success" });
    setShowPrintModal(false);

    // 3. Print
    setTimeout(() => window.print(), 300);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/labels">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("newLabel")}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("newLabelSubtitle")}</p>
            </div>
          </div>

          <Button variant="outline" onClick={handlePrint} disabled={!previewData.productName}>
            <Printer className="h-4 w-4" />
            {t("print")}
          </Button>
        </div>

        {/* Layout: Formulario + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <LabelForm
              onPreviewChange={handlePreviewChange}
              onSave={handleSave}
              defaultValues={{
                productId: defaultProductId,
                productionDate: defaultDate,
              }}
            />
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="sticky top-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t("preview")}</h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 shadow-sm">
                <LabelPreview data={previewData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de impresion (oculto en pantalla) */}
      <div ref={printRef}>
        <LabelPrint data={previewData} />
      </div>

      {/* Modal cantidad producida */}
      <PrintFlowModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handlePrintConfirm}
        productName={previewData.productName}
      />
    </>
  );
}
