"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { LabelPreview, type LabelPreviewData } from "@/components/labels/label-preview";
import { LabelPrint } from "@/components/labels/label-print";
import { PrintFlowModal } from "@/components/labels/print-flow-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Trash2, Copy } from "lucide-react";
import Link from "next/link";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface LabelDetail {
  id: string;
  productName: string;
  brand: string | null;
  netContent: string | null;
  productionDate: string | null;
  batch: string | null;
  expiry: string | null;
  packedBy: string | null;
  destination: string | null;
  qrData: string | null;
  createdAt: string;
  product: {
    code: string;
    name: string;
    category: string | null;
    ingredients: string | null;
    allergens: string | null;
    storage: string | null;
    usage: string | null;
    refrigeratedDays: number;
    frozenDays: number;
    ambientDays: number;
  } | null;
}

const DEMO_LABELS: Record<string, LabelDetail> = {
  "1": {
    id: "1", productName: "Pandequeso", brand: "RANCHERITO", netContent: "500 g",
    productionDate: "2026-02-09", batch: "PQ-090226-0800", expiry: null,
    packedBy: "Nuestra cocina intermedia Alzate Norena S.A.S", destination: "ALZATE",
    qrData: "https://labelfoodtrack.com/t/PQ-090226-0800", createdAt: "2026-02-09T08:30:00Z",
    product: { code: "P001", name: "Pandequeso", category: "Panaderia",
      ingredients: "Harina de maiz, queso costeño, almidon de yuca, huevos, mantequilla, sal",
      allergens: "Gluten, Lacteos, Huevo", storage: "Conservar refrigerado (0-4°C)",
      usage: "Listo para hornear. Hornear a 200°C por 15-20 min.",
      refrigeratedDays: 5, frozenDays: 30, ambientDays: 2 },
  },
  "2": {
    id: "2", productName: "Arepa de Boyaca", brand: "RANCHERITO", netContent: "1 kg",
    productionDate: "2026-02-09", batch: "AB-090226-0700", expiry: null,
    packedBy: "Centro de acopio", destination: "MIRANORTE",
    qrData: "https://labelfoodtrack.com/t/AB-090226-0700", createdAt: "2026-02-09T07:15:00Z",
    product: { code: "P002", name: "Arepa de Boyaca", category: "Panaderia",
      ingredients: "Maiz pelao, cuajada fresca, mantequilla, azucar, sal",
      allergens: "Lacteos", storage: "Conservar refrigerado (0-4°C)",
      usage: "Calentar en sarten o plancha por ambos lados.",
      refrigeratedDays: 7, frozenDays: 60, ambientDays: 3 },
  },
  "3": {
    id: "3", productName: "Empanada de Carne", brand: "RANCHERITO", netContent: "100 g",
    productionDate: "2026-02-08", batch: "EM-080226-1000", expiry: null,
    packedBy: "Nuestra cocina intermedia Alzate Norena S.A.S", destination: "NM",
    qrData: "https://labelfoodtrack.com/t/EM-080226-1000", createdAt: "2026-02-08T10:45:00Z",
    product: { code: "P003", name: "Empanada de Carne", category: "Fritos",
      ingredients: "Masa: harina de maiz, agua, sal, achiote. Relleno: carne molida, papa, cebolla, comino, ajo",
      allergens: "Gluten", storage: "Conservar congelado (-18°C)",
      usage: "Freir en aceite caliente (180°C) por 4-5 min.",
      refrigeratedDays: 3, frozenDays: 45, ambientDays: 1 },
  },
  "4": {
    id: "4", productName: "Queso Campesino", brand: "RANCHERITO", netContent: "250 g",
    productionDate: "2026-02-08", batch: "QS-080226-0600", expiry: null,
    packedBy: "Centro de acopio", destination: "ALZATE",
    qrData: "https://labelfoodtrack.com/t/QS-080226-0600", createdAt: "2026-02-08T06:20:00Z",
    product: { code: "P006", name: "Queso Campesino", category: "Lacteos",
      ingredients: "Leche pasteurizada, cuajo, sal, cloruro de calcio",
      allergens: "Lacteos", storage: "Conservar refrigerado (2-6°C). No congelar.",
      usage: "Consumo directo. Ideal para acompañar arepas y pan.",
      refrigeratedDays: 15, frozenDays: 90, ambientDays: 0 },
  },
  "5": {
    id: "5", productName: "Buñuelo", brand: "RANCHERITO", netContent: "300 g",
    productionDate: "2026-02-07", batch: "BU-070226-0900", expiry: null,
    packedBy: "Nuestra cocina intermedia Alzate Norena S.A.S", destination: "MIRANORTE",
    qrData: "https://labelfoodtrack.com/t/BU-070226-0900", createdAt: "2026-02-07T09:00:00Z",
    product: { code: "P005", name: "Buñuelo", category: "Fritos",
      ingredients: "Queso costeño, almidon de yuca, harina de maiz, huevos, azucar, polvo de hornear",
      allergens: "Lacteos, Huevo, Gluten", storage: "Conservar a temperatura ambiente",
      usage: "Freir en aceite a 160°C por 6-8 min.",
      refrigeratedDays: 3, frozenDays: 30, ambientDays: 1 },
  },
};

function buildExpiryDate(prodDate: string, days: number): string {
  if (!prodDate || days <= 0) return "--";
  const d = new Date(prodDate);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function resolveColdChain(ref: number, froz: number, amb: number): string {
  if (ref > 0 && froz > 0) return "Refrigerado / Congelado";
  if (ref > 0) return "Refrigerado";
  if (froz > 0) return "Congelado";
  if (amb > 0) return "Ambiente";
  return "--";
}

export default function LabelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getToken, userData } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("labels");

  const [label, setLabel] = useState<LabelDetail | null>(
    DEMO_MODE ? (DEMO_LABELS[id] || null) : null
  );
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const canDelete = userData?.role === "ADMIN" || userData?.role === "EDITOR";

  const loadLabel = useCallback(async () => {
    if (DEMO_MODE) return;
    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/labels/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setLabel(await res.json());
    }
    setLoading(false);
  }, [id, getToken]);

  useEffect(() => {
    loadLabel();
  }, [loadLabel]);

  const handleDelete = async () => {
    if (!confirm("Eliminar esta etiqueta?")) return;

    if (DEMO_MODE) {
      toast({ title: t("deleted"), variant: "success" });
      router.push("/labels");
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/labels/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      toast({ title: t("deleted"), variant: "success" });
      router.push("/labels");
    }
  };

  // Print flow: show modal, then create bitacora entry + print
  const handlePrintClick = () => {
    setShowPrintModal(true);
  };

  const handlePrintConfirm = async (quantity: string) => {
    if (!label) return;

    if (DEMO_MODE) {
      setShowPrintModal(false);
      setTimeout(() => window.print(), 300);
      return;
    }

    const token = await getToken();
    if (!token) return;

    // Compute cold chain from product data
    const p = label.product;
    const coldChain = p
      ? resolveColdChain(p.refrigeratedDays, p.frozenDays, p.ambientDays)
      : null;

    // Create bitacora entry with quantity
    await fetch("/api/bitacora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productName: label.productName,
        processDate: label.productionDate,
        quantityProduced: quantity,
        packedBy: label.packedBy,
        destination: label.destination,
        batch: label.batch,
        coldChain: coldChain !== "--" ? coldChain : null,
      }),
    });

    setShowPrintModal(false);
    setTimeout(() => window.print(), 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!label) {
    return <div className="text-center py-20 text-slate-500">Etiqueta no encontrada</div>;
  }

  const p = label.product;
  const previewData: LabelPreviewData = {
    brand: label.brand || "RANCHERITO",
    productName: label.productName,
    netContent: label.netContent || "--",
    productionDate: label.productionDate || "",
    batch: label.batch || "--",
    coldChain: p ? resolveColdChain(p.refrigeratedDays, p.frozenDays, p.ambientDays) : "--",
    expiryRefrigerated: p && label.productionDate ? buildExpiryDate(label.productionDate, p.refrigeratedDays) : "--",
    expiryFrozen: p && label.productionDate ? buildExpiryDate(label.productionDate, p.frozenDays) : "--",
    destination: label.destination || "",
    packedBy: label.packedBy || "",
    ingredients: p?.ingredients || "",
    allergens: p?.allergens || "",
    storage: p?.storage || "",
    usage: p?.usage || "",
    qrData: label.qrData || "",
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{label.productName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {label.batch} — {new Date(label.createdAt).toLocaleDateString("es-CO", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintClick}>
              <Printer className="h-4 w-4" />
              {t("print")}
            </Button>
            <Link href="/labels/new">
              <Button variant="outline">
                <Copy className="h-4 w-4" />
                Duplicar
              </Button>
            </Link>
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content: Preview + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t("preview")}</h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 shadow-sm">
              <LabelPreview data={previewData} />
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Detalles</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label={t("product")} value={`${p?.code || "---"} - ${label.productName}`} />
              <Detail label={t("batch")} value={label.batch} mono />
              <Detail label={t("productionDate")} value={label.productionDate ? new Date(label.productionDate).toLocaleDateString("es-CO") : "--"} />
              <Detail label={t("netContent")} value={label.netContent} />
              <Detail label={t("coldChain")} value={previewData.coldChain} />
              <Detail label={t("expiryRef")} value={previewData.expiryRefrigerated} />
              <Detail label={t("expiryCong")} value={previewData.expiryFrozen} />
              <Detail label={t("packedBy")} value={label.packedBy} />
              <Detail label={t("destination")} value={label.destination} badge />
            </div>

            {p?.ingredients && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Ingredientes</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{p.ingredients}</p>
              </div>
            )}

            {p?.allergens && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Alergenos</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{p.allergens}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print */}
      <LabelPrint data={previewData} />

      {/* Modal cantidad producida */}
      <PrintFlowModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handlePrintConfirm}
        productName={label.productName}
      />
    </>
  );
}

function Detail({ label, value, mono, badge }: { label: string; value: string | null; mono?: boolean; badge?: boolean }) {
  return (
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-xs">{label}</p>
      {badge && value ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
          {value}
        </span>
      ) : (
        <p className={`font-medium text-slate-900 dark:text-slate-100 ${mono ? "font-mono text-xs" : ""}`}>
          {value || "--"}
        </p>
      )}
    </div>
  );
}
