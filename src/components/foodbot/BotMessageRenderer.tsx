"use client";

import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseBotMessage,
  type MenuItem,
  type StatItem,
  type AlertItem,
  type ProductItem,
  type ProgressData,
  type InfoBoxData,
} from "@/lib/bot-parser";

interface Props {
  content: string;
  onAction: (label: string) => void;
  timestamp: string;
}

/* ── Bold text formatter (**text** → <strong>) ── */
function formatText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Text Bubble ── */
function TextBubble({ text, timestamp }: { text: string; timestamp: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl rounded-bl-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 px-4 py-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200 shadow-sm">
      <div className="whitespace-pre-wrap break-words">
        {text.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {formatText(line)}
          </span>
        ))}
      </div>
      <p className="text-[10px] mt-1.5 text-right text-slate-400 dark:text-slate-500">
        {timestamp}
      </p>
    </div>
  );
}

/* ── Stats Grid (2-col colored gradient cards) ── */
const STAT_COLORS: Record<string, string> = {
  emerald: "from-emerald-400 to-emerald-600",
  blue: "from-blue-400 to-blue-600",
  orange: "from-orange-400 to-orange-600",
  purple: "from-purple-400 to-purple-600",
  red: "from-red-400 to-red-600",
  teal: "from-teal-400 to-teal-600",
};

function StatsGrid({
  stats,
  onAction,
}: {
  stats: StatItem[];
  onAction: (label: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mt-3">
      {stats.map((stat, i) => {
        const trendUp = stat.trend?.startsWith("+");
        return (
          <button
            key={i}
            onClick={() => onAction(stat.label)}
            className={cn(
              "rounded-xl p-3.5 text-left text-white transition-all hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br",
              STAT_COLORS[stat.color] || STAT_COLORS.emerald
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">{stat.icon}</span>
              {stat.trend && (
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full bg-white/20",
                    trendUp ? "text-green-100" : "text-red-100"
                  )}
                >
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-90">{stat.label}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Alert Cards (critical/warning/normal) ── */
const ALERT_STYLES: Record<string, string> = {
  critical:
    "bg-red-50 dark:bg-red-500/15 border-red-500 text-red-700 dark:text-red-300",
  warning:
    "bg-yellow-50 dark:bg-yellow-500/15 border-yellow-500 text-yellow-700 dark:text-yellow-300",
  normal:
    "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300",
};

function AlertCards({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="flex flex-col gap-2 mt-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border-l-4 px-3.5 py-2.5 text-sm font-medium",
            ALERT_STYLES[alert.type]
          )}
        >
          {alert.content}
        </div>
      ))}
    </div>
  );
}

/* ── Product Cards ── */
const PRODUCT_FIELDS: Record<string, { emoji: string; label: string }> = {
  lote: { emoji: "\ud83d\udccb", label: "Lote" },
  refrigeracion: { emoji: "\u2744\ufe0f", label: "Refrigeraci\u00f3n" },
  congelacion: { emoji: "\ud83e\uddca", label: "Congelaci\u00f3n" },
  stock: { emoji: "\ud83d\udce6", label: "Stock" },
  vida_restante: { emoji: "\u23f0", label: "Vida restante" },
};

function ProductCards({ products }: { products: ProductItem[] }) {
  return (
    <>
      {products.map((product, i) => (
        <div
          key={i}
          className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 p-3.5 transition-colors hover:border-orange-300 dark:hover:border-orange-500/50"
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            {product.codigo && (
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                {product.codigo}
              </span>
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {product.nombre || ""}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {Object.entries(PRODUCT_FIELDS).map(([key, { emoji, label }]) =>
              product[key] ? (
                <div key={key}>
                  {emoji} {label}:{" "}
                  <span className="text-slate-700 dark:text-slate-200">
                    {product[key]}
                  </span>
                </div>
              ) : null
            )}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Progress Bar ── */
const PROGRESS_COLORS: Record<string, string> = {
  green: "from-emerald-400 to-emerald-500",
  yellow: "from-yellow-400 to-yellow-500",
  red: "from-red-400 to-red-500",
};

function ProgressBarComponent({ progress }: { progress: ProgressData }) {
  const percentage = (progress.value / progress.max) * 100;
  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600/50">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
        Vida \u00fatil: {progress.value} de {progress.max} d\u00edas
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            PROGRESS_COLORS[progress.color] || PROGRESS_COLORS.green
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ── Info Box (tip/warning/error) ── */
const INFO_ICONS: Record<string, string> = {
  tip: "\ud83d\udca1",
  warning: "\u26a0\ufe0f",
  error: "\u274c",
};
const INFO_STYLES: Record<string, string> = {
  tip: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  warning:
    "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
  error:
    "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
};

function InfoBox({ info }: { info: InfoBoxData }) {
  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-3.5 py-3 text-sm flex items-start gap-2.5",
        INFO_STYLES[info.type]
      )}
    >
      <span className="text-base shrink-0">{INFO_ICONS[info.type]}</span>
      <span>{info.content}</span>
    </div>
  );
}

/* ── Menu Grid (3-col) ── */
function MenuGrid({
  items,
  onAction,
}: {
  items: MenuItem[];
  onAction: (label: string) => void;
}) {
  return (
    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4">
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-3">
        \u00bfQu\u00e9 te gustar\u00eda saber?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onAction(item.label)}
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-3.5 transition-all hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:-translate-y-0.5"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Submenu (back + list) ── */
function Submenu({
  submenu,
  onAction,
}: {
  submenu: { title: string; items: MenuItem[] };
  onAction: (label: string) => void;
}) {
  return (
    <div className="mt-3">
      <button
        onClick={() => onAction("Ver men\u00fa")}
        className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors mb-2.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {submenu.title}
      </button>
      <div className="flex flex-col gap-2">
        {submenu.items.map((item, i) => (
          <button
            key={i}
            onClick={() => onAction(item.label)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-3 text-sm text-left text-slate-700 dark:text-slate-200 transition-all hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:translate-x-1"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Quick Reply Buttons (pills) ── */
function QuickReplies({
  buttons,
  onAction,
}: {
  buttons: MenuItem[];
  onAction: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={() => onAction(btn.label)}
          className="flex items-center gap-1.5 rounded-full border-2 border-orange-400 dark:border-orange-500 px-4 py-2 text-xs font-medium text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:-translate-y-0.5"
        >
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Main Renderer ── */
export function BotMessageRenderer({ content, onAction, timestamp }: Props) {
  const parsed = parseBotMessage(content);

  return (
    <div>
      {/* Text bubble */}
      <TextBubble text={parsed.text} timestamp={timestamp} />

      {/* Rich content */}
      {parsed.stats.length > 0 && (
        <StatsGrid stats={parsed.stats} onAction={onAction} />
      )}
      {parsed.alerts.length > 0 && <AlertCards alerts={parsed.alerts} />}
      {parsed.products.length > 0 && (
        <ProductCards products={parsed.products} />
      )}
      {parsed.progress && (
        <ProgressBarComponent progress={parsed.progress} />
      )}
      {parsed.infoBox && <InfoBox info={parsed.infoBox} />}
      {parsed.menu && parsed.menu.length > 0 && (
        <MenuGrid items={parsed.menu} onAction={onAction} />
      )}
      {parsed.submenu && parsed.submenu.items.length > 0 && (
        <Submenu submenu={parsed.submenu} onAction={onAction} />
      )}
      {parsed.buttons.length > 0 && (
        <QuickReplies buttons={parsed.buttons} onAction={onAction} />
      )}
    </div>
  );
}
