"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Pencil,
  Tag,
  LayoutGrid,
  List,
  Snowflake,
  Thermometer,
  Sun,
  CalendarCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  code: string;
  batchAbbr: string | null;
  name: string;
  category: string | null;
  refrigeratedDays: number;
  frozenDays: number;
  ambientDays: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const { getToken, hasActionPermission, isSuperAdmin } = useAuth();
  const t = useTranslations("products");
  const router = useRouter();
  const { toast } = useToast();

  const canCreate = hasActionPermission("products", "crear");
  const canEdit = hasActionPermission("products", "editar");
  const canRotular = hasActionPermission("products", "rotular");
  const canEditDate = hasActionPermission("products", "editar_fecha");
  const today = new Date().toISOString().split("T")[0];
  const dateLabels = { today: t("today"), clearDate: t("clearDate"), useTodayDate: t("useTodayDate") };

  const [dateResetKey, setDateResetKey] = useState(0);
  const handleDateChange = (productId: string, value: string) => {
    if (value && value < today && !isSuperAdmin) {
      toast({ title: t("pastDateError"), variant: "error" });
      setDates((prev) => ({ ...prev, [productId]: "" }));
      setDateResetKey((k) => k + 1);
      return;
    }
    setDates((prev) => ({ ...prev, [productId]: value }));
  };

  const loadProducts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      const cat = p.category || "SIN CATEGORIA";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [filtered]);

  const handleProductClick = (product: Product) => {
    if (!canRotular) {
      toast({ title: "Permisos insuficientes", variant: "error" });
      return;
    }
    const date = dates[product.id] || "";
    const params = new URLSearchParams({
      productId: product.id,
      ...(date && { date }),
    });
    router.push(`/labels/new?${params.toString()}`);
  };

  const colCount = canEdit ? 8 : 7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
        </div>

        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-orange-200 dark:border-orange-900/30 overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "table"
                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "cards"
                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          {canCreate && (
            <Link href="/products/new">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md shadow-orange-500/25">
                <Plus className="h-4 w-4" />
                {t("new")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Cards View */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500">
              {t("noProducts")}
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canEdit={canEdit}
                canEditDate={canEditDate}
                date={dates[product.id] || ""}
                onDateChange={(val) => handleDateChange(product.id, val)}
                minDate={today}
                onProductClick={() => handleProductClick(product)}
                dateLabels={dateLabels}
              />
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-900 shadow-[var(--shadow-warm-sm)]">
          {/* Title bar */}
          <div className="bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3">
            <h2 className="text-center text-lg font-bold text-white tracking-wide uppercase">
              {t("rotulacion")}
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5">
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("code")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("abbreviation")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("item")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("productionDate")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("refrigeration")} ({t("days")})</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("frozen")} ({t("days")})</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("ambientDays")}</th>
                {canEdit && (
                  <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide w-16">{t("editCol")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    {t("loadingProducts")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    {t("noProducts")}
                  </td>
                </tr>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => (
                  <CategoryGroup
                    key={category}
                    category={category}
                    items={items}
                    colCount={colCount}
                    canEdit={canEdit}
                    canEditDate={canEditDate}
                    dates={dates}
                    onDateChange={handleDateChange}
                    minDate={today}
                    onProductClick={handleProductClick}
                    dateResetKey={dateResetKey}
                    dateLabels={dateLabels}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {filtered.length} {t("ofTotal")} {products.length}
      </p>
    </div>
  );
}

/* ---- Product Card ---- */
function ProductCard({
  product,
  canEdit,
  canEditDate,
  date,
  onDateChange,
  minDate,
  onProductClick,
  dateLabels,
}: {
  product: Product;
  canEdit: boolean;
  canEditDate: boolean;
  date: string;
  onDateChange: (val: string) => void;
  minDate: string;
  onProductClick: () => void;
  dateLabels?: { today: string; clearDate: string; useTodayDate: string };
}) {
  const maxDays = Math.max(product.refrigeratedDays, product.frozenDays, product.ambientDays, 1);

  return (
    <div className="group rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-white dark:bg-slate-900 p-4 shadow-[var(--shadow-warm-sm)] hover:shadow-[var(--shadow-warm-md)] hover:border-orange-200 hover:scale-[1.01] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <button
            onClick={onProductClick}
            className="text-sm font-bold text-slate-900 dark:text-white uppercase hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left truncate block w-full"
          >
            {product.name}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {product.code} · {product.batchAbbr || "--"}
          </p>
        </div>
        {canEdit && (
          <Link href={`/products/${product.id}`}>
            <button className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Link>
        )}
      </div>

      {/* Category badge */}
      <div className="mb-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
          {product.category || "SIN CATEGORIA"}
        </span>
      </div>

      {/* Temperature bars */}
      <div className="space-y-2">
        <TempBar
          icon={Thermometer}
          label="Ref."
          days={product.refrigeratedDays}
          max={maxDays}
          color="from-blue-400 to-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-500/20"
          textColor="text-blue-600 dark:text-blue-400"
        />
        <TempBar
          icon={Snowflake}
          label="Cong."
          days={product.frozenDays}
          max={maxDays}
          color="from-cyan-400 to-indigo-500"
          bgColor="bg-indigo-100 dark:bg-indigo-500/20"
          textColor="text-indigo-600 dark:text-indigo-400"
        />
        <TempBar
          icon={Sun}
          label="Amb."
          days={product.ambientDays}
          max={maxDays}
          color="from-amber-400 to-orange-500"
          bgColor="bg-orange-100 dark:bg-orange-500/20"
          textColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Date input */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        {canEditDate ? (
          <DateQuickPicker
            value={date}
            today={minDate}
            onChange={onDateChange}
            labels={dateLabels}
          />
        ) : (
          <span className="text-xs text-slate-400">--</span>
        )}
      </div>
    </div>
  );
}

/* ---- Temperature Bar ---- */
function TempBar({
  icon: Icon,
  label,
  days,
  max,
  color,
  bgColor,
  textColor,
}: {
  icon: React.ElementType;
  label: string;
  days: number;
  max: number;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  const pct = max > 0 ? (days / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex items-center gap-1 w-14 shrink-0", textColor)}>
        <Icon size={12} />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className={cn("flex-1 h-2 rounded-full overflow-hidden", bgColor)}>
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 w-8 text-right">
        {days > 0 ? `${days}d` : "--"}
      </span>
    </div>
  );
}

/* ---- Date Quick Picker ---- */
function DateQuickPicker({
  value,
  today,
  onChange,
  resetKey,
  labels,
}: {
  value: string;
  today: string;
  onChange: (val: string) => void;
  resetKey?: number;
  labels?: { today: string; clearDate: string; useTodayDate: string };
}) {
  // Local state for partial input while typing
  const [localDay, setLocalDay] = useState(() => value ? String(parseInt(value.split("-")[2])) : "");
  const [localMonth, setLocalMonth] = useState(() => value ? String(parseInt(value.split("-")[1])) : "");
  const [localYear, setLocalYear] = useState(() => value ? value.split("-")[0] : "");

  // Sync from parent when value changes externally (e.g. "Hoy" button, clear, or rejected date)
  const prevValue = useRef(value);
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    const resetChanged = resetKey !== prevResetKey.current;
    prevResetKey.current = resetKey;
    if (value !== prevValue.current || resetChanged) {
      prevValue.current = value;
      if (value) {
        const [y, m, d] = value.split("-");
        // Keep partial inputs synchronized after an external reset/today action.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalDay(String(parseInt(d)));
        setLocalMonth(String(parseInt(m)));
        setLocalYear(y);
      } else {
        setLocalDay("");
        setLocalMonth("");
        setLocalYear("");
      }
    }
  }, [value, resetKey]);

  const tryEmitDate = (d: string, m: string, y: string) => {
    const day = parseInt(d);
    const month = parseInt(m);
    const year = parseInt(y);
    if (!day || !month || !year || y.length < 4) return;

    const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(iso + "T00:00:00");
    if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() + 1 !== month) return;
    // Let parent handle past-date validation (shows toast)
    prevValue.current = iso;
    onChange(iso);
  };

  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const handleDay = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 2);
    setLocalDay(clean);
    tryEmitDate(clean, localMonth, localYear);
    if (clean.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 2);
    setLocalMonth(clean);
    tryEmitDate(localDay, clean, localYear);
    if (clean.length === 2) yearRef.current?.focus();
  };

  const handleYear = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 4);
    setLocalYear(clean);
    tryEmitDate(localDay, localMonth, clean);
  };

  const inputClass = "w-[36px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 py-1 text-xs text-center text-slate-600 dark:text-slate-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-500/20 transition-colors";

  return (
    <div className="flex items-center gap-1 justify-center">
      <div className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="DD"
          value={localDay}
          onChange={(e) => handleDay(e.target.value)}
          className={inputClass}
          onClick={(e) => e.stopPropagation()}
        />
        <span>/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="MM"
          value={localMonth}
          onChange={(e) => handleMonth(e.target.value)}
          className={inputClass}
          onClick={(e) => e.stopPropagation()}
        />
        <span>/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="AAAA"
          value={localYear}
          onChange={(e) => handleYear(e.target.value)}
          className={cn(inputClass, "w-[46px]")}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(today); }}
        className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 px-2 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors whitespace-nowrap"
        title={labels?.useTodayDate || "Use today's date"}
      >
        <CalendarCheck size={11} />
        {labels?.today || "Today"}
      </button>
      {value && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
          className="rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          title={labels?.clearDate || "Clear date"}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ---- Category Group (table view) ---- */
function CategoryGroup({
  category,
  items,
  colCount,
  canEdit,
  canEditDate,
  dates,
  onDateChange,
  minDate,
  onProductClick,
  dateResetKey,
  dateLabels,
}: {
  category: string;
  items: Product[];
  colCount: number;
  canEdit: boolean;
  canEditDate: boolean;
  dates: Record<string, string>;
  onDateChange: (id: string, val: string) => void;
  minDate: string;
  onProductClick: (product: Product) => void;
  dateResetKey?: number;
  dateLabels?: { today: string; clearDate: string; useTodayDate: string };
}) {
  return (
    <>
      {/* Category header row */}
      <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700/50">
        <td colSpan={colCount} className="px-3 py-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {category}
          </span>
        </td>
      </tr>

      {/* Product rows */}
      {items.map((product, idx) => (
        <tr
          key={product.id}
          className={cn(
            "border-b border-slate-100 dark:border-slate-700/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors",
            idx % 2 === 0
              ? "bg-white dark:bg-transparent"
              : "bg-slate-50/30 dark:bg-slate-700/10"
          )}
        >
          <td className="px-3 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{product.code}</td>
          <td className="px-3 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{product.batchAbbr || "--"}</td>
          <td className="px-3 py-2.5">
            <button
              onClick={() => onProductClick(product)}
              className="font-bold text-slate-900 dark:text-slate-100 uppercase hover:text-orange-600 dark:hover:text-orange-400 hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5"
            >
              {product.name}
              <Tag className="h-3 w-3 text-orange-400 opacity-0 group-hover:opacity-100" />
            </button>
          </td>
          <td className="px-3 py-1.5 text-center">
            {canEditDate ? (
              <DateQuickPicker
                value={dates[product.id] || ""}
                today={minDate}
                onChange={(val) => onDateChange(product.id, val)}
                resetKey={dateResetKey}
                labels={dateLabels}
              />
            ) : (
              <span className="text-xs text-slate-400">--</span>
            )}
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">
            {product.refrigeratedDays || <span className="text-slate-300 dark:text-slate-600">N/A</span>}
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">
            {product.frozenDays || <span className="text-slate-300 dark:text-slate-600">N/A</span>}
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">
            {product.ambientDays || <span className="text-slate-300 dark:text-slate-600">N/A</span>}
          </td>
          {canEdit && (
            <td className="px-3 py-2.5 text-center">
              <Link href={`/products/${product.id}`}>
                <button className="rounded p-1.5 text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </Link>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
