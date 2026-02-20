"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { Download, Printer, Save, Loader2 } from "lucide-react";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function SettingsPage() {
  const { userData, getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");
  const [exportingProducts, setExportingProducts] = useState(false);
  const [exportingBitacora, setExportingBitacora] = useState(false);

  // Paper config state
  const [paperLoading, setPaperLoading] = useState(true);
  const [paperSaving, setPaperSaving] = useState(false);
  const [presetName, setPresetName] = useState("Etiqueta estandar");
  const [widthMm, setWidthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(45);
  const [marginTop, setMarginTop] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [stockType, setStockType] = useState("Die-Cut Labels");

  // Load paper preset
  useEffect(() => {
    if (DEMO_MODE) {
      setPaperLoading(false);
      return;
    }
    async function load() {
      const token = await getToken();
      if (!token) { setPaperLoading(false); return; }
      try {
        const res = await fetch("/api/print-presets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setPresetName(data.name);
            setWidthMm(data.widthMm);
            setHeightMm(data.heightMm);
            setMarginTop(data.marginTop);
            setMarginRight(data.marginRight);
            setMarginBottom(data.marginBottom);
            setMarginLeft(data.marginLeft);
            setOrientation(data.orientation);
            setStockType(data.stockType || "Die-Cut Labels");
          }
        }
      } catch {
        // Use defaults
      }
      setPaperLoading(false);
    }
    load();
  }, [getToken]);

  const handleSavePaper = async () => {
    setPaperSaving(true);
    try {
      if (DEMO_MODE) {
        toast({ title: t("paperSaved"), variant: "success" });
        return;
      }
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/print-presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: presetName,
          widthMm,
          heightMm,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          orientation,
          stockType: stockType || null,
        }),
      });
      if (res.ok) {
        toast({ title: t("paperSaved"), variant: "success" });
      } else {
        const err = await res.json();
        toast({ title: err.error || "Error", variant: "error" });
      }
    } finally {
      setPaperSaving(false);
    }
  };

  const handleExport = async (
    endpoint: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">{t("account")}</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("name")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{userData?.name || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("email")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{userData?.email || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("role")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{userData?.role || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("instance")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{userData?.instanceId || "--"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">{t("permissions")}</h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <PermissionRow label={t("canCreateLabel")} granted={userData?.canCreateLabel} />
          <PermissionRow label={t("canEditProduct")} granted={userData?.canEditProduct} />
          <PermissionRow label={t("canEditBitacora")} granted={userData?.canEditBitacora} />
          <PermissionRow label={t("canUseAI")} granted={userData?.canUseAI} />
        </div>
      </div>

      {/* Paper Configuration Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <Printer className="h-5 w-5 text-slate-500" />
          {t("paperConfig")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("paperConfigHint")}</p>

        {paperLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Name + Stock Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("presetName")}
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("stockType")}
                </label>
                <select
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Die-Cut Labels">Die-Cut Labels</option>
                  <option value="Continuous Roll">Continuous Roll</option>
                  <option value="Thermal Labels">Thermal Labels</option>
                </select>
              </div>
            </div>

            {/* Width + Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("paperWidth")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="500"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("paperHeight")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="500"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                {t("margins")}
              </label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{t("marginTop")}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marginTop}
                    onChange={(e) => setMarginTop(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{t("marginRight")}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marginRight}
                    onChange={(e) => setMarginRight(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{t("marginBottom")}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{t("marginLeft")}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Orientation + Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("orientation")}
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="landscape">{t("landscape")}</option>
                  <option value="portrait">{t("portrait")}</option>
                </select>
              </div>

              {/* Paper Preview */}
              <div className="flex flex-col items-center justify-center">
                <PaperPreview
                  width={widthMm}
                  height={heightMm}
                  mt={marginTop}
                  mr={marginRight}
                  mb={marginBottom}
                  ml={marginLeft}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <button
                onClick={handleSavePaper}
                disabled={paperSaving || !presetName}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {paperSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("savePaperConfig")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">{t("dataExport")}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("dataExportHint")}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() =>
              handleExport(
                "/api/products/export?format=csv",
                `productos_${new Date().toISOString().split("T")[0]}.csv`,
                setExportingProducts
              )
            }
            disabled={exportingProducts}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {exportingProducts ? "Exportando..." : t("exportProducts")}
          </button>
          <button
            onClick={() =>
              handleExport(
                "/api/bitacora/export?format=csv",
                `bitacora_${new Date().toISOString().split("T")[0]}.csv`,
                setExportingBitacora
              )
            }
            disabled={exportingBitacora}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {exportingBitacora ? "Exportando..." : t("exportBitacora")}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        LabelFoodTrack v2.0 — Contacta al administrador para cambios de permisos.
      </p>
    </div>
  );
}

function PermissionRow({ label, granted }: { label: string; granted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          granted
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
        }`}
      >
        {granted ? "Si" : "No"}
      </span>
    </div>
  );
}

function PaperPreview({
  width,
  height,
  mt,
  mr,
  mb,
  ml,
}: {
  width: number;
  height: number;
  mt: number;
  mr: number;
  mb: number;
  ml: number;
}) {
  const maxDisplay = 160;
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  const scale = maxDisplay / Math.max(safeW, safeH);
  const w = safeW * scale;
  const h = safeH * scale;
  const innerW = Math.max((safeW - ml - mr) * scale, 0);
  const innerH = Math.max((safeH - mt - mb) * scale, 0);
  const innerX = ml * scale;
  const innerY = mt * scale;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
        style={{ width: w, height: h }}
      >
        <div
          className="absolute border border-dashed border-blue-400 dark:border-blue-500 rounded-sm bg-blue-50/50 dark:bg-blue-500/10"
          style={{ left: innerX, top: innerY, width: innerW, height: innerH }}
        />
      </div>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        {width} x {height} mm
      </span>
    </div>
  );
}
