"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Save,
  Loader2,
  Package,
  Thermometer,
  Snowflake,
  Sun,
  Scale,
  Hash,
  MapPin,
  UserCheck,
  ChevronDown,
  Printer,
  Circle,
  CircleCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  calculateExpiry,
  generateBatch,
  buildQuantityLabel,
  buildQrUrl,
} from "@/lib/label-utils";
import type { LabelPreviewData } from "./label-preview";

interface Product {
  id: string;
  code: string;
  name: string;
  batchAbbr: string | null;
  category: string | null;
  sede: string | null;
  ingredients: string | null;
  allergens: string | null;
  storage: string | null;
  usage: string | null;
  packaging: string | null;
  refrigeratedDays: number;
  frozenDays: number;
  ambientDays: number;
  servingSize: number | null;
}

interface LabelFormProps {
  onPreviewChange: (data: LabelPreviewData) => void;
  onSave: (data: LabelSaveData) => Promise<void>;
  defaultValues?: Partial<LabelSaveData>;
  isEdit?: boolean;
  formId?: string;
  printConfigurationReady?: boolean;
  canSubmit?: boolean;
}

export interface LabelSaveData {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  netContent: string;
  origin: string;
  productionDate: string;
  batch: string;
  packedBy: string;
  destination: string;
  coldChain: string;
  expiryRefrigerated: string | null;
  expiryFrozen: string | null;
  qrData: string;
}

const FALLBACK_UNITS = ["g", "kg", "oz", "lb", "ml", "L", "und"];

function parseNetContent(value: string): { qty: string; unit: string } {
  if (!value) return { qty: "", unit: "g" };
  const match = value.match(/^([\d.,]+)\s*(.+)$/);
  if (match) return { qty: match[1], unit: match[2].trim() };
  return { qty: value, unit: "g" };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function LabelForm({
  onPreviewChange,
  onSave,
  defaultValues,
  isEdit,
  formId,
  printConfigurationReady = true,
  canSubmit = true,
}: LabelFormProps) {
  const t = useTranslations("labels");
  const tCommon = useTranslations("common");
  const { getToken, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [packers, setPackers] = useState<string[]>([]);
  const [allUbicaciones, setAllUbicaciones] = useState<string[]>([]);
  const [dynamicUnits, setDynamicUnits] = useState<string[]>(FALLBACK_UNITS);

  // Parse netContent default into qty + unit (e.g. "500 g" -> "500", "g")
  const parsedDefault = parseNetContent(defaultValues?.netContent || "");

  // Form state
  const [productId, setProductId] = useState(defaultValues?.productId || "");
  const [netContentQty, setNetContentQty] = useState(parsedDefault.qty);
  const [netContentUnit, setNetContentUnit] = useState(parsedDefault.unit);
  const [productionDate] = useState(
    defaultValues?.productionDate || new Date().toISOString().split("T")[0]
  );
  const [batch, setBatch] = useState(defaultValues?.batch || "");
  const [packedBy, setPackedBy] = useState(defaultValues?.packedBy || userData?.ubicacion || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [autoGenerateBatch] = useState(!defaultValues?.batch);
  const [coldChainType, setColdChainType] = useState<string>("");

  // Producto seleccionado
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );
  const hasValidProductionDate = isValidDateOnly(productionDate);

  // Opciones de cadena de frio disponibles segun el producto
  const coldChainOptions = useMemo(() => {
    if (!selectedProduct) return [];
    const opts: { value: string; label: string; shortLabel: string; days: number }[] = [];
    if (selectedProduct.refrigeratedDays > 0)
      opts.push({ value: "refrigerado", label: `Refrigerado (0°C a 4°C)`, shortLabel: "Refrigerado", days: selectedProduct.refrigeratedDays });
    if (selectedProduct.frozenDays > 0)
      opts.push({ value: "congelado", label: `Congelado (-18°C a -22°C)`, shortLabel: "Congelado", days: selectedProduct.frozenDays });
    if (selectedProduct.ambientDays > 0)
      opts.push({ value: "ambiente", label: `Ambiente`, shortLabel: "Ambiente", days: selectedProduct.ambientDays });
    return opts;
  }, [selectedProduct]);

  // Auto-seleccionar cadena de frio cuando cambia el producto
  useEffect(() => {
    if (coldChainOptions.length > 0) {
      setColdChainType(coldChainOptions[0].value);
    } else {
      setColdChainType("");
    }
  }, [coldChainOptions]);

  // Cargar productos, instancia y ubicaciones (todo junto)
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    async function loadAll() {
      const token = await getToken();
      if (!token) return;
      loadedRef.current = true;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all in parallel (users may 403 for non-admin — that's OK)
      const [prodRes, instRes, usersRes, unitsRes] = await Promise.all([
        fetch("/api/products", { headers }),
        fetch("/api/instances", { headers }),
        fetch("/api/users", { headers }).catch(() => null),
        fetch("/api/units", { headers }).catch(() => null),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());

      if (instRes.ok) {
        const instances = await instRes.json();
        const effectiveId = userData?.instanceId;
        const current = effectiveId
          ? instances.find((i: { id: string }) => i.id === effectiveId) || instances[0]
          : instances[0];
        if (current) {
          setBrand(current.brandName || current.name || "");
          setDestinations(current.destinations || []);
          setPackers(current.packers || []);
        }
      }

      if (usersRes?.ok) {
        const users: { ubicacion?: string | null }[] = await usersRes.json();
        const ubics = [...new Set(
          users.map((u) => u.ubicacion).filter((u): u is string => !!u)
        )].sort();
        setAllUbicaciones(ubics);
      }

      if (unitsRes?.ok) {
        const data = await unitsRes.json();
        if (Array.isArray(data.units) && data.units.length > 0) {
          setDynamicUnits(data.units);
        }
      }
    }
    loadAll();
  }, [getToken, userData?.instanceId]);

  // Opciones para "Empacado por": merge all sources, deduplicate
  const packedByOptions = useMemo(() => {
    const all = new Set<string>();
    // User's own ubicacion first
    if (userData?.ubicacion) all.add(userData.ubicacion);
    // Super admin: all user ubicaciones
    allUbicaciones.forEach((u) => all.add(u));
    // Instance packers
    packers.forEach((p) => all.add(p));
    return [...all];
  }, [allUbicaciones, packers, userData?.ubicacion]);

  // Fallback: set brand and packedBy from auth context
  useEffect(() => {
    if (!brand && userData?.instance) {
      setBrand(userData.instance.brandName || userData.instance.name || "");
    }
    if (!packedBy && userData?.ubicacion) {
      setPackedBy(userData.ubicacion);
    }
  }, [brand, packedBy, userData]);

  // Generar lote automaticamente
  useEffect(() => {
    if (autoGenerateBatch && selectedProduct?.batchAbbr && productionDate) {
      setBatch(generateBatch(selectedProduct.batchAbbr, productionDate));
    }
  }, [autoGenerateBatch, selectedProduct, productionDate]);

  // Actualizar preview cada vez que cambia el formulario
  useEffect(() => {
    if (!selectedProduct) {
      onPreviewChange({
        brand,
        productName: "",
        netContent: "--",
        productionDate: "",
        batch: "--",
        coldChain: "--",
        expiryRefrigerated: "--",
        expiryFrozen: "--",
        destination: "",
        packedBy: "",
        ingredients: "",
        allergens: "",
        storage: "",
        usage: "",
        qrData: "",
      });
      return;
    }

    // Calcular cadena de frio y vencimientos segun seleccion del usuario
    let coldChain = "--";
    let expiryRefrigerated = "--";
    let expiryFrozen = "--";

    if (coldChainType === "congelado") {
      coldChain = "Congelado (-18 a -22°C)";
      expiryFrozen = calculateExpiry(productionDate, selectedProduct.frozenDays);
      if (selectedProduct.refrigeratedDays > 0) {
        expiryRefrigerated = `Despues de descongelacion: ${selectedProduct.refrigeratedDays} dias`;
      }
    } else if (coldChainType === "refrigerado") {
      coldChain = "Refrigerado (0 a 4°C)";
      expiryRefrigerated = calculateExpiry(productionDate, selectedProduct.refrigeratedDays);
    } else if (coldChainType === "ambiente") {
      coldChain = "Ambiente";
      expiryRefrigerated = calculateExpiry(productionDate, selectedProduct.ambientDays);
    }

    const netContent = netContentQty ? `${netContentQty} ${netContentUnit}` : "";
    const quantityLabel = buildQuantityLabel(netContent, selectedProduct.servingSize);

    const qrData = buildQrUrl(batch);

    onPreviewChange({
      brand,
      productName: selectedProduct.name,
      netContent: quantityLabel,
      productionDate,
      batch,
      coldChain,
      expiryRefrigerated,
      expiryFrozen,
      destination,
      packedBy,
      ingredients: selectedProduct.ingredients || "",
      allergens: selectedProduct.allergens || "",
      storage: selectedProduct.storage || "",
      usage: selectedProduct.usage || "",
      qrData,
    });
  }, [selectedProduct, netContentQty, netContentUnit, productionDate, batch, packedBy, destination, brand, coldChainType, onPreviewChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const netContent = netContentQty ? `${netContentQty} ${netContentUnit}` : "";
      const qrData = buildQrUrl(batch);

      // Compute ISO expiry dates for bitácora storage
      const computeExpiryISO = (days: number): string | null => {
        if (!productionDate || days <= 0) return null;
        const d = new Date(productionDate + "T00:00:00");
        if (isNaN(d.getTime())) return null;
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };

      let coldChain = "";
      let expiryRefrigerated: string | null = null;
      let expiryFrozen: string | null = null;

      if (coldChainType === "congelado") {
        coldChain = "Congelado (-18 a -22°C)";
        expiryFrozen = computeExpiryISO(selectedProduct.frozenDays);
        if (selectedProduct.refrigeratedDays > 0) {
          expiryRefrigerated = computeExpiryISO(selectedProduct.refrigeratedDays);
        }
      } else if (coldChainType === "refrigerado") {
        coldChain = "Refrigerado (0 a 4°C)";
        expiryRefrigerated = computeExpiryISO(selectedProduct.refrigeratedDays);
      } else if (coldChainType === "ambiente") {
        coldChain = "Ambiente";
        expiryRefrigerated = computeExpiryISO(selectedProduct.ambientDays);
      }

      await onSave({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        brand,
        category: selectedProduct.category || "",
        netContent,
        origin: "",
        productionDate,
        batch,
        packedBy,
        destination,
        coldChain,
        expiryRefrigerated,
        expiryFrozen,
        qrData,
      });
    } finally {
      setSaving(false);
    }
  };

  const coldChainLabels: Record<string, string> = {
    refrigerado: t("refrigerated"),
    congelado: t("frozen2"),
    ambiente: t("ambient2"),
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Package size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("productionData")}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {selectedProduct?.name || t("productionDataHint")}
            </p>
          </div>
        </div>
      </div>

      {/* ── 1. Producto ── */}
      {!defaultValues?.productId && (
      <section className="space-y-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <SectionHeader icon={Package} title={t("product")} />
        <div>
          <Label htmlFor="productId">{t("selectProduct")}</Label>
          <Select
            id="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">{t("selectProductPlaceholder")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </Select>
        </div>

        {selectedProduct && (
          <div className="rounded-xl bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-slate-700/50 dark:to-slate-800/50 p-3.5 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-orange-200/60 dark:border-slate-600/40">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-white dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-600 uppercase tracking-wider">
                {selectedProduct.category || "N/A"}
              </span>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{selectedProduct.name}</span>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <Thermometer size={11} className="text-amber-500" />
                Ref. {selectedProduct.refrigeratedDays}d
              </span>
              <span className="inline-flex items-center gap-1">
                <Snowflake size={11} className="text-blue-500" />
                Cong. {selectedProduct.frozenDays}d
              </span>
              {selectedProduct.ambientDays > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Sun size={11} className="text-emerald-500" />
                  Amb. {selectedProduct.ambientDays}d
                </span>
              )}
            </div>
          </div>
        )}
      </section>
      )}

      {/* ── 2. Configuración de etiqueta (todo en una card) ── */}
      <section className="flex flex-1 flex-col">
        {/* Cadena de frío */}
        {coldChainOptions.length > 0 && (
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <label htmlFor="coldChainType" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Thermometer size={14} className="text-blue-500" />
              {t("coldChainTitle")}
            </label>
            <select
              id="coldChainType"
              value={coldChainType}
              onChange={(event) => setColdChainType(event.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {coldChainOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {coldChainLabels[opt.value] || opt.shortLabel} · {opt.days} {t("days")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campos compactos */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          {/* Contenido neto */}
          <div className="space-y-1.5">
            <Label htmlFor="netContentQty" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Scale size={12} className="text-purple-500" />
              {t("weightQty")}
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="netContentQty"
                type="number"
                min="0"
                step="any"
                placeholder="500"
                value={netContentQty}
                onChange={(e) => setNetContentQty(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border-slate-200 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
              />
              <UnitCombobox
                value={netContentUnit}
                units={dynamicUnits}
                onChange={setNetContentUnit}
                searchPlaceholder={t("searchUnit")}
                emptyLabel={tCommon("noResults")}
              />
            </div>
          </div>

          {/* Lote */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="batch" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Hash size={12} className="text-slate-500" />
                {t("batch")}
              </Label>
            </div>
            <Input
              id="batch"
              placeholder="L-010125-0930"
              value={batch}
              readOnly
              className="h-10 rounded-lg border-slate-200 bg-slate-50 font-mono text-xs font-medium dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {/* Empacado por */}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="packedBy" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <UserCheck size={12} className="text-teal-500" />
              {t("packedBy")}
            </Label>
            <select
              id="packedBy"
              value={packedBy}
              onChange={(e) => setPackedBy(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {packedByOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="destination" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <MapPin size={12} className="text-rose-500" />
              {t("destination")}
            </Label>
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 text-xs dark:border-slate-800 dark:bg-slate-950/30">
          <ValidationRow ready={Boolean(selectedProduct)} label={t("validationProduct")} />
          <ValidationRow ready={hasValidProductionDate} label={t("validationDate")} />
          <ValidationRow ready={printConfigurationReady} label={t("validationPrintConfig")} />
        </div>

        {/* Guardar e imprimir — prominente */}
        <div className="mt-auto px-5 py-4">
          <button
            type="submit"
            disabled={saving || !selectedProduct || !hasValidProductionDate || !printConfigurationReady || !canSubmit}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEdit ? t("saveChanges") : t("savePrint")}</span>
                <span className="text-white/60">|</span>
                <Printer className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}

function ValidationRow({ ready, label }: { ready: boolean; label: string }) {
  return (
    <div className={ready ? "flex items-center gap-2 text-emerald-700 dark:text-emerald-400" : "flex items-center gap-2 text-slate-400 dark:text-slate-500"}>
      {ready ? <CircleCheck size={15} /> : <Circle size={15} />}
      <span>{label}</span>
    </div>
  );
}

function UnitCombobox({
  value,
  units,
  onChange,
  searchPlaceholder,
  emptyLabel,
}: {
  value: string;
  units: string[];
  onChange: (value: string) => void;
  searchPlaceholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? units.filter((u) => u.toLowerCase().includes(search.toLowerCase()))
    : units;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); setSearch(""); }}
        className="flex h-10 w-20 items-center justify-between gap-1 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 transition-colors hover:border-purple-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={12} className="text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 overflow-hidden">
          <div className="p-1.5">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">{emptyLabel}</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(u); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors ${
                    u === value ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {u}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Package; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-orange-100 dark:bg-slate-700">
        <Icon size={13} className="text-orange-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
    </div>
  );
}
