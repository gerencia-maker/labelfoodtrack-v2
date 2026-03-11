"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { RequirePermission } from "@/components/require-permission";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  FileSpreadsheet,
  Upload,
  Printer,
  Save,
  Loader2,
  User,
  Users,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserManagement } from "@/components/settings/user-management";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function SettingsPage() {
  const { userData } = useAuth();
  const t = useTranslations("settings");

  return (
    <RequirePermission permission="configuration">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="flex flex-wrap w-full">
            <TabsTrigger value="account">
              <User className="h-4 w-4" />
              {t("account")}
            </TabsTrigger>
            <TabsTrigger value="paper">
              <Printer className="h-4 w-4" />
              {t("paperConfig")}
            </TabsTrigger>
            {userData?.role === "ADMIN" && (
              <TabsTrigger value="users">
                <Users className="h-4 w-4" />
                {t("users")}
              </TabsTrigger>
            )}
            <TabsTrigger value="export">
              <Download className="h-4 w-4" />
              {t("dataExport")}
            </TabsTrigger>
            {userData?.role === "ADMIN" && (
              <TabsTrigger
                value="factory-reset"
                className="text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:text-red-400 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-300"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("factoryReset")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>

          {/* Paper Config Tab */}
          <TabsContent value="paper">
            <PaperConfigTab />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <ExportTab />
          </TabsContent>

          {/* Factory Reset Tab */}
          <TabsContent value="factory-reset">
            <FactoryResetTab />
          </TabsContent>
        </Tabs>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          LabelFoodTrack v2.0 — Contacta al administrador para cambios de
          permisos.
        </p>
      </div>
    </RequirePermission>
  );
}

/* ─── Account Tab ─── */
function AccountTab() {
  const { userData, changePassword } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (newPwd.length < 6) {
      toast({ title: t("passwordTooShort"), variant: "error" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: t("passwordMismatch"), variant: "error" });
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      toast({ title: t("passwordChanged"), variant: "success" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast({ title: t("currentPasswordWrong"), variant: "error" });
      } else if (code === "auth/weak-password") {
        toast({ title: t("passwordTooShort"), variant: "error" });
      } else {
        toast({ title: t("passwordChangeError"), variant: "error" });
      }
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
          {t("account")}
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("name")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {userData?.name || "--"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("email")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {userData?.email || "--"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t("role")}</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {userData?.role || "--"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">
              {t("instance")}
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {userData?.instanceId || "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <Lock className="h-5 w-5 text-slate-500" />
          {t("changePassword")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("changePasswordHint")}
        </p>

        <div className="max-w-sm space-y-3">
          {/* Current password */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t("currentPassword")}
            </label>
            <div className="relative">
              <input
                type={showCurrentPwd ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t("newPassword")}
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{t("passwordHint")}</p>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPwd ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirmPwd && confirmPwd !== newPwd
                    ? "border-red-300 dark:border-red-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPwd && confirmPwd !== newPwd && (
              <p className="text-[10px] text-red-500 mt-1">{t("passwordMismatch")}</p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPwd || !currentPwd || newPwd.length < 6 || newPwd !== confirmPwd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changingPwd ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {t("changePasswordBtn")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <ShieldCheck className="h-5 w-5 text-slate-500" />
          {t("permissions")}
        </h3>

        {userData?.role === "ADMIN" ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Administrador — acceso completo a todos los modulos
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(userData?.permisos || []).length > 0 ? (
              (userData?.permisos || []).map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                >
                  {perm}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Sin permisos asignados
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Paper Config Tab ─── */
function PaperConfigTab() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [paperLoading, setPaperLoading] = useState(true);
  const [paperSaving, setPaperSaving] = useState(false);
  const [presetName, setPresetName] = useState("Etiqueta estandar");
  const [widthMm, setWidthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(45);
  const [marginTop, setMarginTop] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape"
  );
  const [stockType, setStockType] = useState("Die-Cut Labels");

  useEffect(() => {
    if (DEMO_MODE) {
      setPaperLoading(false);
      return;
    }
    async function load() {
      const token = await getToken();
      if (!token) {
        setPaperLoading(false);
        return;
      }
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

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
        <Printer className="h-5 w-5 text-slate-500" />
        {t("paperConfig")}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("paperConfigHint")}
      </p>

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
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                  {t("marginTop")}
                </label>
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
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                  {t("marginRight")}
                </label>
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
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                  {t("marginBottom")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={marginBottom}
                  onChange={(e) =>
                    setMarginBottom(Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                  {t("marginLeft")}
                </label>
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
                onChange={(e) =>
                  setOrientation(e.target.value as "portrait" | "landscape")
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="landscape">{t("landscape")}</option>
                <option value="portrait">{t("portrait")}</option>
              </select>
            </div>

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
  );
}

/* ─── Export Tab ─── */
function ExportTab() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [exportingProducts, setExportingProducts] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [exportingBitacora, setExportingBitacora] = useState(false);
  const [exportingBitacoraXlsx, setExportingBitacoraXlsx] = useState(false);

  const handleExport = async (
    endpoint: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({ title: "No autenticado", variant: "error" });
        return;
      }
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast({
          title: err?.error || `Error ${res.status}`,
          variant: "error",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Archivo descargado", variant: "success" });
    } catch {
      toast({ title: "Error al descargar", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImportProducts = async (file: File) => {
    setImportingProducts(true);
    try {
      const token = await getToken();
      if (!token) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error || "Error al importar",
          variant: "error",
        });
        return;
      }
      toast({
        title: `${data.created} creados, ${data.updated} actualizados${data.skipped > 0 ? `, ${data.skipped} omitidos` : ""}`,
        variant: "success",
      });
    } catch {
      toast({ title: "Error al importar archivo", variant: "error" });
    } finally {
      setImportingProducts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
          {t("dataExport")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("dataExportHint")}
        </p>

        {/* Productos */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("exportProductsTitle")}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exporta el indice completo de productos en Excel. El archivo exportado puede re-importarse.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                handleExport(
                  "/api/products/export?format=xlsx",
                  `productos_${new Date().toISOString().split("T")[0]}.xlsx`,
                  setExportingProducts
                )
              }
              disabled={exportingProducts}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingProducts ? "Exportando..." : t("exportProductsXlsx")}
            </button>
            <label
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-4 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-300 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer ${importingProducts ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Upload className="h-4 w-4" />
              {importingProducts ? "Importando..." : t("importProducts")}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={importingProducts}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportProducts(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Bitacora */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("exportBitacoraTitle")}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Descarga el registro de bitacora en CSV o Excel.
          </p>
          <div className="flex flex-wrap gap-2">
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
              {exportingBitacora ? "Exportando..." : "CSV"}
            </button>
            <button
              onClick={() =>
                handleExport(
                  "/api/bitacora/export?format=xlsx",
                  `bitacora_${new Date().toISOString().split("T")[0]}.xlsx`,
                  setExportingBitacoraXlsx
                )
              }
              disabled={exportingBitacoraXlsx}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingBitacoraXlsx ? "Exportando..." : "Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Factory Reset Tab ─── */
function FactoryResetTab() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetModule, setResetModule] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const modules = [
    {
      key: "products",
      title: t("resetProducts"),
      description: t("resetProductsDesc"),
    },
    {
      key: "labels",
      title: t("resetLabels"),
      description: t("resetLabelsDesc"),
    },
    {
      key: "bitacora",
      title: t("resetBitacora"),
      description: t("resetBitacoraDesc"),
    },
  ];

  const getModuleName = (key: string) => {
    const m = modules.find((mod) => mod.key === key);
    if (m) return m.title;
    if (key === "all") return t("resetAllData");
    return key;
  };

  const handleOpenReset = (module: string) => {
    setResetModule(module);
    setConfirmText("");
    setResetDialogOpen(true);
  };

  const handleFactoryReset = async () => {
    if (confirmText !== "ELIMINAR") {
      toast({ title: t("resetMustType"), variant: "error" });
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/factory-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ module: resetModule }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: `${t("resetSuccess")} (${data.deleted} registros)`,
          variant: "success",
        });
        setResetDialogOpen(false);
        setConfirmText("");
        setResetModule("");
        // Reload to reflect changes
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Error", variant: "error" });
      }
    } catch {
      toast({ title: t("resetError"), variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-red-200 dark:border-red-800/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-600">{t("factoryReset")}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("factoryResetDesc")}
        </p>

        {/* Warning banner */}
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-300 font-bold text-sm">
            {t("resetWarning")}
          </p>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1">
            {t("factoryResetDesc")}
          </p>
        </div>

        {/* Delete All */}
        <div className="border-2 border-red-300 dark:border-red-700 rounded-xl p-5 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-red-900 dark:text-red-300 text-lg mb-1">
                {t("resetAllData")}
              </h4>
              <p className="text-red-700 dark:text-red-400 text-sm">
                {t("resetAllDataDesc")}
              </p>
            </div>
            <button
              onClick={() => handleOpenReset("all")}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              {t("resetAllData")}
            </button>
          </div>
        </div>

        {/* Delete by module */}
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">
            {t("resetByModule")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.key}
                className="border border-orange-200 dark:border-orange-800/50 rounded-lg p-4 hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
              >
                <div className="mb-3">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {mod.title}
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {mod.description}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenReset(mod.key)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {resetDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-bold text-red-600">
                {t("resetConfirmTitle")}
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t("resetConfirmDesc")}
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
              <p className="font-bold text-red-900 dark:text-red-300 text-sm">
                {getModuleName(resetModule)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("resetTypeConfirm")}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                disabled={isDeleting}
                className="w-full rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setResetDialogOpen(false);
                  setConfirmText("");
                  setResetModule("");
                }}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFactoryReset}
                disabled={confirmText !== "ELIMINAR" || isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Paper Preview ─── */
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
          style={{
            left: innerX,
            top: innerY,
            width: innerW,
            height: innerH,
          }}
        />
      </div>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        {width} x {height} mm
      </span>
    </div>
  );
}
