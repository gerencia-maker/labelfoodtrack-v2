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

export function UserManagement() {
  const { getToken, hasActionPermission } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("settings");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<string>("VIEWER");
  const [formPermisos, setFormPermisos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
    setFormRole("VIEWER");
    setFormPermisos([]);
    setShowModal(true);
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPermisos([...user.permisos]);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (editingUser) {
        // Update
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formName,
            role: formRole,
            permisos: formPermisos,
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
        // Create
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formEmail,
            name: formName,
            role: formRole,
            permisos: formPermisos,
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

  async function handleDelete(userId: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: t("userDeleted"), variant: "success" });
      loadUsers();
    }
  }

  function togglePermiso(perm: string) {
    setFormPermisos((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  }

  function selectAllPermisos() {
    setFormPermisos(getAllPermisosWithActions());
  }

  function clearAllPermisos() {
    setFormPermisos([]);
  }

  if (!canManage) return null;

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
          {DEMO_MODE ? "Demo mode — no users to display" : "No hay usuarios registrados"}
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
                <th className="pb-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role as keyof typeof ROLE_ICONS] || Eye;
                const roleColor = ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.VIEWER;
                return (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/30">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {u.name}
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
                          u.activo && u.status === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {u.activo && u.status === "ACTIVE" ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
          <div className="w-full max-w-lg mx-4 rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-[80vh] flex flex-col">
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
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email (only on create) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("email")}</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

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
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermisos}
                        className="text-[10px] text-slate-500 hover:underline"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {PERMISOS_GROUPS.map((group) => (
                      <div key={group.labelKey}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          {group.labelKey}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.permisos.map((perm) => (
                            <label
                              key={perm}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                                formPermisos.includes(perm)
                                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                  : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formPermisos.includes(perm)}
                                onChange={() => togglePermiso(perm)}
                                className="sr-only"
                              />
                              {perm}
                            </label>
                          ))}
                        </div>

                        {/* Sub-actions for modules that have them */}
                        {group.permisos
                          .filter((perm) => MODULE_ACTIONS[perm] && formPermisos.includes(perm))
                          .map((mod) => (
                            <div key={`sub-${mod}`} className="ml-4 mt-1 flex flex-wrap gap-1">
                              {MODULE_ACTIONS[mod].map((action) => {
                                const key = `${mod}.${action.key}`;
                                return (
                                  <label
                                    key={key}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                                      formPermisos.includes(key)
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formPermisos.includes(key)}
                                      onChange={() => togglePermiso(key)}
                                      className="sr-only"
                                    />
                                    {action.key}
                                  </label>
                                );
                              })}
                            </div>
                          ))}
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
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName || (!editingUser && !formEmail)}
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
