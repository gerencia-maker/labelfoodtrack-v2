"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/require-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  MapPin,
  Crown,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InstanceData {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  plan: string;
  activo: boolean;
  destinations: string[];
  packers: string[];
  _count?: { users: number };
}

interface FormData {
  name: string;
  brandName: string;
  logoUrl: string;
  plan: string;
  destinations: string[];
  packers: string[];
}

const EMPTY_FORM: FormData = {
  name: "",
  brandName: "",
  logoUrl: "",
  plan: "BASIC",
  destinations: [],
  packers: [],
};

export default function InstancesPage() {
  return (
    <RequirePermission permission="instances">
      <InstancesContent />
    </RequirePermission>
  );
}

function InstancesContent() {
  const { getToken } = useAuth();
  const t = useTranslations("instances");
  const tc = useTranslations("common");

  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newDest, setNewDest] = useState("");
  const [newPacker, setNewPacker] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInstances = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/instances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInstances(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (inst: InstanceData) => {
    setEditingId(inst.id);
    setForm({
      name: inst.name,
      brandName: inst.brandName || "",
      logoUrl: inst.logoUrl || "",
      plan: inst.plan,
      destinations: [...inst.destinations],
      packers: [...(inst.packers || [])],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewDest("");
    setNewPacker("");
  };

  const addDestination = () => {
    const val = newDest.trim().toUpperCase();
    if (val && !form.destinations.includes(val)) {
      setForm({ ...form, destinations: [...form.destinations, val] });
    }
    setNewDest("");
  };

  const removeDestination = (d: string) => {
    setForm({ ...form, destinations: form.destinations.filter((x) => x !== d) });
  };

  const addPacker = () => {
    const val = newPacker.trim();
    if (val && !form.packers.includes(val)) {
      setForm({ ...form, packers: [...form.packers, val] });
    }
    setNewPacker("");
  };

  const removePacker = (p: string) => {
    setForm({ ...form, packers: form.packers.filter((x) => x !== p) });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const formData = new globalThis.FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) return;

      const url = editingId ? `/api/instances/${editingId}` : "/api/instances";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          brandName: form.brandName.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          plan: form.plan,
          destinations: form.destinations,
          packers: form.packers,
        }),
      });

      if (res.ok) {
        closeForm();
        loadInstances();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/instances/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteConfirm(null);
        loadInstances();
      } else {
        const data = await res.json();
        if (data.error === "hasUsers") {
          alert(t("hasUsers", { count: data.count }));
        }
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          {t("new")}
        </Button>
      </div>

      {/* Form (create/edit) */}
      {showForm && (
        <div className="rounded-2xl border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-[var(--shadow-warm-sm)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingId ? t("editInstance") : t("new")}
            </h2>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={20} />
            </button>
          </div>

          {/* Logo upload */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("logo")}
            </label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) handleLogoUpload(file);
                }}
                className={cn(
                  "flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors overflow-hidden",
                  form.logoUrl
                    ? "border-transparent"
                    : "border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-500 bg-orange-50/50 dark:bg-slate-900"
                )}
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                ) : form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImageIcon size={20} />
                    <span className="text-[10px]">{t("uploadLogo")}</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = "";
                }}
              />

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload size={14} />
                  </Button>
                </div>
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: "" })}
                    className="text-xs text-red-500 hover:underline"
                  >
                    {t("removeLogo")}
                  </button>
                )}
                <p className="text-[10px] text-slate-400">{t("logoHint")}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("name")} *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="RANCHERITO"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("brandName")}
              </label>
              <Input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="Marca comercial"
              />
            </div>

            {/* Plan */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("plan")}
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="BASIC">BASIC</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            {/* Destinations */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("destinations")}
              </label>
              <div className="flex gap-2">
                <Input
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDestination())}
                  placeholder="ALZATE"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addDestination}>
                  <Plus size={14} />
                </Button>
              </div>
              {form.destinations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.destinations.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      <MapPin size={10} />
                      {d}
                      <button
                        onClick={() => removeDestination(d)}
                        className="ml-0.5 text-slate-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Packers (Empacado por) */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("packers")}
              </label>
              <div className="flex gap-2">
                <Input
                  value={newPacker}
                  onChange={(e) => setNewPacker(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPacker())}
                  placeholder="Nombre empacador"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPacker}>
                  <Plus size={14} />
                </Button>
              </div>
              {form.packers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.packers.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300"
                    >
                      {p}
                      <button
                        onClick={() => removePacker(p)}
                        className="ml-0.5 text-orange-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={closeForm}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "..." : t("saveInstance")}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 py-16">
          <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("noInstances")}</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
            <Plus size={14} />
            {t("new")}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[var(--shadow-warm-sm)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100 dark:border-slate-700 bg-orange-50/50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("plan")}
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("destinations")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("users")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {instances.map((inst) => (
                <tr key={inst.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {inst.logoUrl ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <img
                            src={inst.logoUrl}
                            alt={inst.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-white",
                          inst.activo
                            ? "bg-gradient-to-br from-orange-400 to-red-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        )}>
                          <Building2 size={16} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{inst.name}</p>
                        {inst.brandName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{inst.brandName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      inst.plan === "ENTERPRISE"
                        ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {inst.plan === "ENTERPRISE" && <Crown size={10} />}
                      {inst.plan}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inst.destinations?.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                        >
                          <MapPin size={8} />
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Users size={12} />
                      {inst._count?.users ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(inst)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500 transition-colors"
                        title={tc("edit")}
                      >
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === inst.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(inst.id)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          >
                            {tc("confirm")}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(inst.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title={tc("delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
