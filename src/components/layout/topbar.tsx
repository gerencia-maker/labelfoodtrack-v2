"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslations } from "next-intl";
import { LogOut, User, Globe, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstanceSelector } from "./instance-selector";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { userData, signOut } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useTranslations("auth");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lft-theme");
    if (saved === "dark") {
      // Theme preference is only available after the client mounts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lft-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lft-theme", "light");
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-orange-100 bg-white px-3 dark:border-orange-900/30 dark:bg-slate-900 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 md:hidden"
        >
          <Menu size={20} />
        </button>
        {userData?.instance?.logoUrl && (
          <img
            src={userData.instance.logoUrl}
            alt={userData.instance.name}
            className="h-9 max-w-[120px] md:max-w-[160px] rounded-lg object-contain"
          />
        )}
        <div className="hidden min-w-0 min-[480px]:block">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {userData?.instance?.name || userData?.name || ""}
          </h2>
          {userData?.instance?.brandName && userData.instance.brandName !== userData.instance.name && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {userData.instance.brandName}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Super-admin instance selector */}
        <InstanceSelector />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          title="Dark mode"
        >
          {dark ? <Sun size={16} className="text-orange-400" /> : <Moon size={16} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          title="Cambiar idioma"
        >
          <Globe size={14} />
          {locale.toUpperCase()}
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <User size={16} />
          <span>{userData?.email}</span>
          <span className="rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
            {userData?.role}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          title={t("logout")}
          className="hidden text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:inline-flex"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
