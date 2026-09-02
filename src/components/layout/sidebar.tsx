"use client";

import { Fragment, useState } from "react";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessNavItem, hasActionPermission } from "@/lib/permissions";

const MotionLink = motion.create(Link);

interface SidebarProps {
  className?: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ className, mobile = false, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { userData, signOut } = useAuth();

  const role = userData?.role || "VIEWER";
  const permisos = userData?.permisos || [];

  const allNavItems = [
    { href: "/", label: t("products"), icon: LayoutDashboard, permKey: "dashboard", group: "production" },
    { href: "/products/new", label: t("newProduct"), icon: Package, permKey: "products", actionKey: "crear", group: "production" },
    { href: "/labels", label: t("labels"), icon: Tag, permKey: "labels", group: "production" },
    { href: "/bitacora", label: t("bitacora"), icon: ClipboardList, permKey: "bitacora", group: "production" },
    { href: "/ai", label: t("ai"), icon: Bot, permKey: "ai", group: "production" },
    { href: "/instances", label: t("instances"), icon: Building2, permKey: "instances", group: "administration" },
    { href: "/settings", label: t("settings"), icon: Settings, permKey: "settings", group: "administration" },
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
        mobile ? "h-full w-72 max-w-[85vw]" : collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo header */}
      <div className="flex h-16 items-center justify-between border-b border-orange-100 px-3.5 transition-colors hover:bg-orange-50/50 dark:border-orange-900/30 dark:hover:bg-orange-500/5">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
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
          <Link href="/" className="mx-auto" onClick={onNavigate}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500"
              style={{ boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)" }}
            >
              <Tag className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        {!collapsed && !mobile && (
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Contraer menu"
            className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {mobile && (
          <button
            onClick={onNavigate}
            aria-label="Cerrar menu"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:text-slate-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
          >
            <X size={19} />
          </button>
        )}
      </div>

      {/* Navigation with motion */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, index) => {
          const isActive = item.href === "/"
            ? pathname === "/" || (pathname.startsWith("/products/") && pathname !== "/products/new")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const startsGroup = index === 0 || navItems[index - 1]?.group !== item.group;
          const groupLabel = item.group === "production"
            ? t("productionSection")
            : t("administrationSection");

          return (
            <Fragment key={item.href}>
              {startsGroup && !collapsed && (
                <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {groupLabel}
                </p>
              )}
              {startsGroup && collapsed && index > 0 && (
                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              )}
              {collapsed ? (
                <Link
                  href={item.href}
                  onClick={onNavigate}
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
              ) : (
                <motion.div
                  className="flex cursor-pointer items-center"
                  initial="initial"
                  whileHover={isActive ? undefined : "hover"}
                >
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
                    onClick={onNavigate}
                    variants={{
                      initial: { x: -16 },
                      hover: { x: 0 },
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-500/20"
                        : "text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span>{item.label}</span>
                  </MotionLink>
                </motion.div>
              )}
            </Fragment>
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
              aria-label={tAuth("logout")}
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
              aria-label="Expandir menu"
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
