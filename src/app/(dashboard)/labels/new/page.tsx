"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { LabelForm, type LabelSaveData } from "@/components/labels/label-form";
import { LabelPreview, type LabelPreviewData } from "@/components/labels/label-preview";
import { LabelPrint } from "@/components/labels/label-print";
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

  const handlePreviewChange = useCallback((data: LabelPreviewData) => {
    setPreviewData(data);
  }, []);

  const handleSave = async (data: LabelSaveData) => {
    if (DEMO_MODE) {
      toast({ title: t("saved"), variant: "success" });
      router.push("/labels");
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/labels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: err.error || "Error al guardar etiqueta", variant: "error" });
      return;
    }

    toast({ title: t("saved"), variant: "success" });
    router.push("/labels");
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
              <h1 className="text-2xl font-bold text-slate-900">{t("newLabel")}</h1>
              <p className="text-sm text-slate-500">{t("newLabelSubtitle")}</p>
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
              <h3 className="text-sm font-semibold text-slate-500 mb-2">{t("preview")}</h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
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
    </>
  );
}
