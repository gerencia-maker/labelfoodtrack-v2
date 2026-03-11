"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Shield,
  ShieldCheck,
  Eye,
  Power,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  PERMISOS_GROUPS,
  MODULE_ACTIONS,
  getAllPermisosWithActions,
} from "@/lib/permissions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permisos: string[];
  activo: boolean;
  instanceId: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = ["ADMIN", "EDITOR", "VIEWER"] as const;
const ROLE_ICONS = {
  ADMIN: Shield,
  EDITOR: ShieldCheck,
  VIEWER: Eye,
};
const ROLE_COLORS = {
  ADMIN: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
  EDITOR: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
  VIEWER: "bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400",
};

const PERM_GROUP_LABELS: Record<string, string> = {
  modules: "Modulos",
  config: "Configuracion",
  dataOps: "Datos",
  ai: "IA",
};

const PERM_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Productos",
  labels: "Etiquetas",
  bitacora: "Bitacora",
  configuration: "Configuracion",
  instances: "Instancias",
  import: "Importar",
  export: "Exportar",
  ai_features: "IA",
};

const ACTION_LABELS: Record<string, string> = {
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  importar: "Importar",
  editar_papel: "Papel",
  editar_instancia: "Instancia",
  gestionar_usuarios: "Usuarios",
  sync_sheets: "Sync Sheets",
};

export function UserManagement() {
  const { getToken, hasActionPermission, userData } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<string>("VIEWER");
  const [formPermisos, setFormPermisos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const canManage = hasActionPermission("configuration", "gestionar_usuarios");

  useEffect(() => {
    if (!canManage) return;
    loadUsers();
  }, [canManage]);

  async function loadUsers() {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function openCreate() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("VIEWER");
    setFormPermisos([]);
    setExpandedModules(new Set());
    setShowModal(true);
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormPermisos([...user.permisos]);
    setExpandedModules(new Set());
    setShowModal(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    if (!editingUser && !formEmail.trim()) return;
    if (!editingUser && formPassword.length < 6) {
      toast({ title: t("passwordTooShort"), variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formName,
            role: formRole,
            permisos: formRole === "EDITOR" ? formPermisos : [],
          }),
        });
        if (res.ok) {
          toast({ title: t("userSaved"), variant: "success" });
          setShowModal(false);
          loadUsers();
        } else {
          const err = await res.json();
          toast({ title: err.error || "Error", variant: "error" });
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            name: formName,
            role: formRole,
            permisos: formRole === "EDITOR" ? formPermisos : [],
          }),
        });
        if (res.ok) {
          toast({ title: t("userSaved"), variant: "success" });
          setShowModal(false);
          loadUsers();
        } else {
          const err = await res.json();
          toast({ title: err.error || "Error", variant: "error" });
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActivo(user: UserRow) {
    setTogglingUser(user.id);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: !user.activo }),
      });
      if (res.ok) {
        toast({
          title: user.activo ? t("userDeactivated") : t("userActivated"),
          variant: "success",
        });
        loadUsers();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Error", variant: "error" });
      }
    } finally {
      setTogglingUser(null);
    }
  }

  async function handleDelete(userId: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: t("userDeleted"), variant: "success" });
      setDeleteConfirm(null);
      loadUsers();
    } else {
      const err = await res.json();
      toast({ title: err.error || "Error", variant: "error" });
    }
  }

  function togglePermiso(perm: string) {
    setFormPermisos((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  }

  function toggleModuleExpanded(mod: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

  function selectAllPermisos() {
    setFormPermisos(getAllPermisosWithActions());
  }

  function clearAllPermisos() {
    setFormPermisos([]);
  }

  if (!canManage) return null;

  const isSelf = (userId: string) => userData?.id === userId;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Users className="h-5 w-5 text-slate-500" />
          {t("users")}
        </h3>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addUser")}
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{t("manageUsers")}</p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          {DEMO_MODE ? "Demo mode — no users to display" : t("noUsers")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50 text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">{t("name")}</th>
                <th className="pb-2 font-medium">{t("email")}</th>
                <th className="pb-2 font-medium">{t("userRole")}</th>
                <th className="pb-2 font-medium">{t("userStatus")}</th>
                <th className="pb-2 font-medium text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role as keyof typeof ROLE_ICONS] || Eye;
                const roleColor = ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.VIEWER;
                const self = isSelf(u.id);
                return (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/30">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      <span className="flex items-center gap-1.5">
                        {u.name}
                        {self && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                            {t("you")}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
                        <RoleIcon className="h-3 w-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.activo
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {u.activo ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          title={t("editUser")}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!self && (
                          <>
                            <button
                              onClick={() => handleToggleActivo(u)}
                              disabled={togglingUser === u.id}
                              title={u.activo ? t("deactivate") : t("activate")}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.activo
                                  ? "hover:bg-amber-50 dark:hover:bg-amber-500/10 text-emerald-500 hover:text-amber-600"
                                  : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600"
                              }`}
                            >
                              {togglingUser === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {deleteConfirm === u.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="px-2 py-1 text-[10px] font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  {t("confirmDelete")}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 text-[10px] font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                  {t("cancel")}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(u.id)}
                                title={t("deleteUser")}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingUser ? t("editUser") : t("addUser")}
              </h4>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("name")}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("email")}</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={!!editingUser}
                  placeholder={t("emailPlaceholder")}
                  className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 ${
                    editingUser ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Password (only on create) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("password")}</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{t("passwordHint")}</p>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("userRole")}</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r === "ADMIN" ? "Admin — Acceso completo" : r === "EDITOR" ? "Editor — Permisos personalizados" : "Viewer — Solo lectura"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role info banner */}
              {formRole === "ADMIN" && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {t("adminFullAccess")}
                  </p>
                </div>
              )}

              {formRole === "VIEWER" && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {t("viewerReadOnly")}
                  </p>
                </div>
              )}

              {/* Permissions (only for EDITOR) */}
              {formRole === "EDITOR" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("userPermissions")}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllPermisos}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t("selectAll")}
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermisos}
                        className="text-[10px] text-slate-500 hover:underline"
                      >
                        {t("clearAll")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {PERMISOS_GROUPS.map((group) => (
                      <div key={group.labelKey}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          {PERM_GROUP_LABELS[group.labelKey] || group.labelKey}
                        </p>
                        <div className="space-y-1">
                          {group.permisos.map((perm) => {
                            const hasActions = !!MODULE_ACTIONS[perm];
                            const isExpanded = expandedModules.has(perm);
                            const isChecked = formPermisos.includes(perm);
                            const subActions = MODULE_ACTIONS[perm] || [];
                            const activeSubCount = subActions.filter((a) =>
                              formPermisos.includes(`${perm}.${a.key}`)
                            ).length;

                            return (
                              <div key={perm}>
                                <div className="flex items-center gap-1.5">
                                  <label
                                    className={`flex-1 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => togglePermiso(perm)}
                                      className="sr-only"
                                    />
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                                      isChecked
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-slate-300 dark:border-slate-600"
                                    }`}>
                                      {isChecked && "✓"}
                                    </span>
                                    {PERM_LABELS[perm] || perm}
                                    {hasActions && isChecked && activeSubCount > 0 && (
                                      <span className="text-[9px] bg-blue-200 dark:bg-blue-500/30 px-1 rounded">
                                        {activeSubCount}/{subActions.length}
                                      </span>
                                    )}
                                  </label>
                                  {hasActions && isChecked && (
                                    <button
                                      type="button"
                                      onClick={() => toggleModuleExpanded(perm)}
                                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Sub-actions (expandable) */}
                                {hasActions && isChecked && isExpanded && (
                                  <div className="ml-6 mt-1 mb-1 flex flex-wrap gap-1">
                                    {subActions.map((action) => {
                                      const key = `${perm}.${action.key}`;
                                      const subChecked = formPermisos.includes(key);
                                      return (
                                        <label
                                          key={key}
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
                                            subChecked
                                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-500"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={subChecked}
                                            onChange={() => togglePermiso(key)}
                                            className="sr-only"
                                          />
                                          <span className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${
                                            subChecked
                                              ? "bg-blue-500 border-blue-500 text-white"
                                              : "border-slate-300 dark:border-slate-600"
                                          }`}>
                                            {subChecked && "✓"}
                                          </span>
                                          {ACTION_LABELS[action.key] || action.key}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName || (!editingUser && (!formEmail || formPassword.length < 6))}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("saveUser")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
