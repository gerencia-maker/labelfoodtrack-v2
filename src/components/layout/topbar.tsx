"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslations } from "next-intl";
import { LogOut, User, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          {userData?.name ?? ""}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Dark mode"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Cambiar idioma"
        >
          <Globe size={14} />
          {locale.toUpperCase()}
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <User size={16} />
          <span>{userData?.email}</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {userData?.role}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={signOut} title={t("logout")}>
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
