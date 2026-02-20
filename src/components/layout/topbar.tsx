"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslations } from "next-intl";
import { LogOut, User, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstanceSelector } from "./instance-selector";

export function Topbar() {
  const { userData, signOut } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useTranslations("auth");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lft-theme");
    if (saved === "dark") {
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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 px-6 backdrop-blur-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {userData?.name ?? ""}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Super-admin instance selector */}
        <InstanceSelector />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-orange-400 transition-colors"
          title="Dark mode"
        >
          {dark ? <Sun size={16} className="text-orange-400" /> : <Moon size={16} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
          className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
