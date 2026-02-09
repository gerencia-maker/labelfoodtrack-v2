"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock gamification data
const MOCK_LEVEL = 12;
const MOCK_XP = 780;
const MOCK_XP_MAX = 1000;
const MOCK_STREAK = 7;
const MOCK_POINTS = 2450;
const MOCK_TITLE = "Chef Senior";
const MOCK_ACHIEVEMENTS = [
  { emoji: "🏷️", label: "100 etiquetas" },
  { emoji: "📦", label: "50 productos" },
  { emoji: "🔥", label: "7 dias racha" },
  { emoji: "⭐", label: "Experto" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { userData } = useAuth();

  const navItems = [
    { href: "/", label: t("products"), icon: LayoutDashboard },
    { href: "/products/new", label: t("newProduct"), icon: Package },
    { href: "/labels", label: t("labels"), icon: Tag },
    { href: "/bitacora", label: t("bitacora"), icon: ClipboardList },
    { href: "/ai", label: t("ai"), icon: Bot },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  const initials = userData?.name
    ? userData.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-700/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
              <span className="text-xs font-black text-white">LFT</span>
            </div>
            <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">
              LabelFood
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
            <span className="text-[10px] font-black text-white">LFT</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* User Profile (gamified) */}
      {!collapsed && (
        <div className="border-b border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            {/* Avatar with level badge */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-bold text-white shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-black text-yellow-900 ring-2 ring-white dark:ring-slate-800">
                {MOCK_LEVEL}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {userData?.name || "Usuario"}
              </p>
              <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                {MOCK_TITLE}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Star size={12} className="fill-current" />
              <span className="font-semibold">{MOCK_POINTS.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
              <Flame size={12} className="fill-current" />
              <span className="font-semibold">{MOCK_STREAK}d</span>
            </div>
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
              <Zap size={12} className="fill-current" />
              <span className="font-semibold">Nv.{MOCK_LEVEL}</span>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>XP</span>
              <span>{MOCK_XP}/{MOCK_XP_MAX}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                style={{ width: `${(MOCK_XP / MOCK_XP_MAX) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed user avatar */}
      {collapsed && (
        <div className="border-b border-slate-200 dark:border-slate-700/50 py-3 flex justify-center">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[7px] font-black text-yellow-900 ring-1 ring-white dark:ring-slate-800">
              {MOCK_LEVEL}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                size={20}
                className={cn(
                  "shrink-0",
                  isActive && "text-orange-500 dark:text-orange-400"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mini achievements */}
      {!collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-700/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Logros
          </p>
          <div className="flex gap-2">
            {MOCK_ACHIEVEMENTS.map((a) => (
              <div
                key={a.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50 text-sm cursor-default hover:scale-110 transition-transform"
                title={a.label}
              >
                {a.emoji}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand button for collapsed state */}
      {collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-700/50 p-2">
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
