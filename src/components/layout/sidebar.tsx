"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  Bot,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessNavItem, hasActionPermission } from "@/lib/permissions";

const MotionLink = motion.create(Link);

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { userData, signOut } = useAuth();

  const role = userData?.role || "VIEWER";
  const permisos = userData?.permisos || [];

  const allNavItems = [
    { href: "/", label: t("products"), icon: LayoutDashboard, permKey: "dashboard" },
    { href: "/products/new", label: t("newProduct"), icon: Package, permKey: "products", actionKey: "crear" },
    { href: "/labels", label: t("labels"), icon: Tag, permKey: "labels" },
    { href: "/bitacora", label: t("bitacora"), icon: ClipboardList, permKey: "bitacora" },
    { href: "/ai", label: t("ai"), icon: Bot, permKey: "ai" },
    { href: "/instances", label: t("instances"), icon: Building2, permKey: "instances" },
    { href: "/settings", label: t("settings"), icon: Settings, permKey: "settings" },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!canAccessNavItem(role, permisos, item.permKey)) return false;
    if (item.actionKey) return hasActionPermission(role, permisos, item.permKey, item.actionKey);
    return true;
  });

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo header */}
      <div className="flex h-20 items-center justify-between border-b border-orange-100 dark:border-orange-900/30 px-4 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500"
              style={{ boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)" }}
            >
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-white">Label</span>
              <span className="font-light text-amber-600 dark:text-amber-400">FoodTrack</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500"
              style={{ boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)" }}
            >
              <Tag className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation with motion */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400"
                )}
                title={item.label}
              >
                <Icon size={20} />
              </Link>
            );
          }

          return (
            <motion.div
              key={item.href}
              className="flex items-center cursor-pointer"
              initial="initial"
              whileHover={isActive ? undefined : "hover"}
            >
              {/* Arrow indicator */}
              <motion.div
                variants={{
                  initial: { x: "-100%", opacity: 0 },
                  hover: { x: 0, opacity: 1 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="shrink-0 text-orange-500"
              >
                <ArrowRight strokeWidth={2.5} size={16} />
              </motion.div>

              <MotionLink
                href={item.href}
                variants={{
                  initial: { x: -16 },
                  hover: { x: 0 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 w-full",
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
                )}
              >
                <Icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </MotionLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-orange-100 dark:border-orange-900/30 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-sm font-semibold text-orange-700 dark:text-orange-400">
              <User size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {userData?.name || "Usuario"}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {userData?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
              title={tAuth("logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setCollapsed(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
