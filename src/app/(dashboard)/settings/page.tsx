"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";

export default function SettingsPage() {
  const { userData, getToken } = useAuth();
  const t = useTranslations("settings");
  const [exportingProducts, setExportingProducts] = useState(false);
  const [exportingBitacora, setExportingBitacora] = useState(false);

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
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">{t("account")}</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">{t("name")}</p>
            <p className="font-medium text-slate-900">{userData?.name || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500">{t("email")}</p>
            <p className="font-medium text-slate-900">{userData?.email || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500">{t("role")}</p>
            <p className="font-medium text-slate-900">{userData?.role || "--"}</p>
          </div>
          <div>
            <p className="text-slate-500">{t("instance")}</p>
            <p className="font-medium text-slate-900">{userData?.instanceId || "--"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">{t("permissions")}</h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <PermissionRow label={t("canCreateLabel")} granted={userData?.canCreateLabel} />
          <PermissionRow label={t("canEditProduct")} granted={userData?.canEditProduct} />
          <PermissionRow label={t("canEditBitacora")} granted={userData?.canEditBitacora} />
          <PermissionRow label={t("canUseAI")} granted={userData?.canUseAI} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">{t("dataExport")}</h3>
        <p className="text-sm text-slate-500">{t("dataExportHint")}</p>
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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {exportingBitacora ? "Exportando..." : t("exportBitacora")}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        LabelFoodTrack v2.0 — Contacta al administrador para cambios de permisos.
      </p>
    </div>
  );
}

function PermissionRow({ label, granted }: { label: string; granted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-700">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          granted
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {granted ? "Si" : "No"}
      </span>
    </div>
  );
}
