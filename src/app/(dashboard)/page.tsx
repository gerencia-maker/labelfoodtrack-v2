"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_MODE ? DEMO_PRODUCTS : []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [dates, setDates] = useState<Record<string, string>>({});
  const { getToken, userData } = useAuth();
  const t = useTranslations("products");
  const router = useRouter();

  const canEdit = !!(userData?.role === "ADMIN" || userData?.role === "EDITOR" || userData?.canEditProduct);

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

  // Agrupar productos por categoría
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t("new")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por codigo, item o categoria"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3">
          <h2 className="text-center text-lg font-bold text-white tracking-wide uppercase">
            Rotulacion
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-orange-200 bg-orange-50">
              <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">{t("code")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">{t("abbreviation")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">Item</th>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">{t("productionDate")}</th>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">{t("refrigeration")} (dias)</th>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">{t("frozen")} (dias)</th>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">Temp. ambiente (dias)</th>
              {canEdit && (
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wide w-16">Editar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400">
                  Cargando productos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400">
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

      <p className="text-xs text-slate-400">
        {filtered.length} de {products.length} productos
      </p>
    </div>
  );
}

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
      <tr className="bg-slate-50 border-b border-slate-200">
        <td colSpan={colCount} className="px-3 py-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {category}
          </span>
        </td>
      </tr>

      {/* Product rows */}
      {items.map((product, idx) => (
        <tr
          key={product.id}
          className={`border-b border-slate-100 hover:bg-orange-50/50 transition-colors ${
            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
          }`}
        >
          <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{product.code}</td>
          <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{product.batchAbbr || "--"}</td>
          <td className="px-3 py-2.5">
            <button
              onClick={() => onProductClick(product)}
              className="font-bold text-slate-900 uppercase hover:text-orange-600 hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5"
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
              className="w-full max-w-[140px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 bg-white hover:border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-colors"
              placeholder="DD/MM/AAAA"
            />
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700">
            {product.refrigeratedDays || <span className="text-slate-300">N/A</span>}
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700">
            {product.frozenDays || <span className="text-slate-300">N/A</span>}
          </td>
          <td className="px-3 py-2.5 text-center font-medium text-slate-700">
            {product.ambientDays || <span className="text-slate-300">N/A</span>}
          </td>
          {canEdit && (
            <td className="px-3 py-2.5 text-center">
              <Link href={`/products/${product.id}`}>
                <button className="rounded p-1.5 text-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-colors">
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
