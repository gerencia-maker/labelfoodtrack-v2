"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Package,
  Flame,
  Trophy,
  TrendingUp,
  Snowflake,
  Thermometer,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_PRODUCTS: Product[] = [
  { id: "1", code: "R-01", batchAbbr: "PP0003", name: "AJI RANCHERITO", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 90, ambientDays: 0 },
  { id: "2", code: "R-02", batchAbbr: "PP0021", name: "CHIMICHURRI", category: "COCINA INTERMEDIA", refrigeratedDays: 8, frozenDays: 60, ambientDays: 0 },
  { id: "3", code: "R-03", batchAbbr: "PP0056", name: "SALSA TARTARA", category: "COCINA INTERMEDIA", refrigeratedDays: 2, frozenDays: 30, ambientDays: 0 },
  { id: "4", code: "R-04", batchAbbr: "PP0057", name: "VINAGRETA DE LA CASA", category: "COCINA INTERMEDIA", refrigeratedDays: 4, frozenDays: 60, ambientDays: 0 },
  { id: "5", code: "R-05", batchAbbr: "PP0220", name: "VINAGRETA DE MORA", category: "COCINA INTERMEDIA", refrigeratedDays: 15, frozenDays: 90, ambientDays: 0 },
  { id: "6", code: "R-06", batchAbbr: "PP0206", name: "SALSA BURGUER", category: "COCINA INTERMEDIA", refrigeratedDays: 20, frozenDays: 60, ambientDays: 0 },
  { id: "7", code: "R-07", batchAbbr: "PQ01", name: "PANDEQUESO", category: "PANADERIA", refrigeratedDays: 5, frozenDays: 30, ambientDays: 2 },
  { id: "8", code: "R-08", batchAbbr: "AB01", name: "AREPA DE BOYACA", category: "PANADERIA", refrigeratedDays: 7, frozenDays: 60, ambientDays: 3 },
  { id: "9", code: "R-09", batchAbbr: "AL01", name: "ALMOJABANA", category: "PANADERIA", refrigeratedDays: 4, frozenDays: 30, ambientDays: 2 },
  { id: "10", code: "R-10", batchAbbr: "EM01", name: "EMPANADA DE CARNE", category: "FRITOS", refrigeratedDays: 3, frozenDays: 45, ambientDays: 1 },
  { id: "11", code: "R-11", batchAbbr: "BU01", name: "BUÑUELO", category: "FRITOS", refrigeratedDays: 3, frozenDays: 30, ambientDays: 1 },
  { id: "12", code: "R-12", batchAbbr: "QS01", name: "QUESO CAMPESINO", category: "LACTEOS", refrigeratedDays: 15, frozenDays: 90, ambientDays: 0 },
  { id: "13", code: "R-13", batchAbbr: "YG01", name: "YOGURT NATURAL", category: "LACTEOS", refrigeratedDays: 21, frozenDays: 0, ambientDays: 0 },
];

// Mock gamification stats
const MOCK_STATS = [
  { label: "Productos", value: "78", icon: Package, color: "orange", change: "+3 esta semana" },
  { label: "Etiquetas hoy", value: "24", icon: Tag, color: "blue", change: "+12% vs ayer" },
  { label: "Racha activa", value: "7 dias", icon: Flame, color: "red", change: "Record: 14d" },
  { label: "Puntos mes", value: "2,450", icon: Trophy, color: "yellow", change: "Top 5%" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_MODE ? DEMO_PRODUCTS : []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const { getToken, userData } = useAuth();
  const t = useTranslations("products");
  const router = useRouter();

  const canEdit = !!(userData?.role === "ADMIN" || userData?.role === "EDITOR");

  const loadProducts = useCallback(async () => {
    if (DEMO_MODE) return;
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
    const date = dates[product.id] || "";
    const params = new URLSearchParams({
      productId: product.id,
      ...(date && { date }),
    });
    router.push(`/labels/new?${params.toString()}`);
  };

  const colCount = canEdit ? 8 : 7;

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_STATS.map((stat) => (
          <StatsCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
        </div>

        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
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

          {canEdit && (
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
          placeholder="Buscar por codigo, item o categoria"
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
              No se encontraron productos
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canEdit={canEdit}
                date={dates[product.id] || ""}
                onDateChange={(val) => setDates((prev) => ({ ...prev, [product.id]: val }))}
                onProductClick={() => handleProductClick(product)}
              />
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm">
          {/* Title bar */}
          <div className="bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3">
            <h2 className="text-center text-lg font-bold text-white tracking-wide uppercase">
              Rotulacion
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5">
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("code")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("abbreviation")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Item</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("productionDate")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("refrigeration")} (dias)</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t("frozen")} (dias)</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Temp. ambiente (dias)</th>
                {canEdit && (
                  <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide w-16">Editar</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron productos
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
                    dates={dates}
                    onDateChange={(id, val) => setDates((prev) => ({ ...prev, [id]: val }))}
                    onProductClick={handleProductClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {filtered.length} de {products.length} productos
      </p>
    </div>
  );
}

/* ---- Stats Card ---- */
function StatsCard({ stat }: { stat: { label: string; value: string; icon: React.ElementType; color: string; change: string } }) {
  const colorMap: Record<string, string> = {
    orange: "from-orange-500 to-red-500 shadow-orange-500/20",
    blue: "from-blue-500 to-cyan-500 shadow-blue-500/20",
    red: "from-red-500 to-pink-500 shadow-red-500/20",
    yellow: "from-yellow-500 to-orange-500 shadow-yellow-500/20",
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-md", `bg-gradient-to-br ${colorMap[stat.color]}`)}>
          <stat.icon size={20} className="text-white" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px]">
        <TrendingUp size={12} className="text-emerald-500" />
        <span className="text-slate-500 dark:text-slate-400">{stat.change}</span>
      </div>
    </div>
  );
}

/* ---- Product Card ---- */
function ProductCard({
  product,
  canEdit,
  date,
  onDateChange,
  onProductClick,
}: {
  product: Product;
  canEdit: boolean;
  date: string;
  onDateChange: (val: string) => void;
  onProductClick: () => void;
}) {
  const maxDays = Math.max(product.refrigeratedDays, product.frozenDays, product.ambientDays, 1);

  return (
    <div className="group rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-4 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
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
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500/50 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-500/20 transition-colors"
        />
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

/* ---- Category Group (table view) ---- */
function CategoryGroup({
  category,
  items,
  colCount,
  canEdit,
  dates,
  onDateChange,
  onProductClick,
}: {
  category: string;
  items: Product[];
  colCount: number;
  canEdit: boolean;
  dates: Record<string, string>;
  onDateChange: (id: string, val: string) => void;
  onProductClick: (product: Product) => void;
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
            <input
              type="date"
              value={dates[product.id] || ""}
              onChange={(e) => onDateChange(product.id, e.target.value)}
              className="w-full max-w-[140px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500/50 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-200 dark:focus:ring-orange-500/20 transition-colors"
              placeholder="DD/MM/AAAA"
            />
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
