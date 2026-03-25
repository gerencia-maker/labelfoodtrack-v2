"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Save,
  Loader2,
  Wand2,
  Package,
  Thermometer,
  Snowflake,
  Sun,
  CalendarDays,
  Scale,
  Hash,
  MapPin,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  calculateExpiry,
  generateBatch,
  buildQuantityLabel,
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

const NET_CONTENT_UNITS = [
  { label: "Peso", options: [
    { value: "g", label: "g (Gramo)" },
    { value: "kg", label: "kg (Kilogramo)" },
    { value: "oz", label: "oz (Onza)" },
    { value: "lb", label: "lb (Libra)" },
  ]},
  { label: "Volumen", options: [
    { value: "ml", label: "ml (Mililitro)" },
    { value: "L", label: "L (Litro)" },
  ]},
  { label: "Unidad", options: [
    { value: "und", label: "und (Unidad)" },
  ]},
];

function parseNetContent(value: string): { qty: string; unit: string } {
  if (!value) return { qty: "", unit: "g" };
  const match = value.match(/^([\d.,]+)\s*(.+)$/);
  if (match) return { qty: match[1], unit: match[2].trim() };
  return { qty: value, unit: "g" };
}

const COLD_CHAIN_META: Record<string, { icon: typeof Thermometer; color: string; bg: string; border: string; activeBg: string }> = {
  refrigerado: { icon: Thermometer, color: "text-white", bg: "bg-amber-500", border: "border-amber-500", activeBg: "bg-amber-500 shadow-lg shadow-amber-500/30" },
  congelado: { icon: Snowflake, color: "text-white", bg: "bg-blue-500", border: "border-blue-500", activeBg: "bg-blue-500 shadow-lg shadow-blue-500/30" },
  ambiente: { icon: Sun, color: "text-white", bg: "bg-emerald-500", border: "border-emerald-500", activeBg: "bg-emerald-500 shadow-lg shadow-emerald-500/30" },
};

export function LabelForm({ onPreviewChange, onSave, defaultValues, isEdit }: LabelFormProps) {
  const t = useTranslations("labels");
  const { getToken, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [packers, setPackers] = useState<string[]>([]);
  const [allUbicaciones, setAllUbicaciones] = useState<string[]>([]);

  // Parse netContent default into qty + unit (e.g. "500 g" -> "500", "g")
  const parsedDefault = parseNetContent(defaultValues?.netContent || "");

  // Form state
  const [productId, setProductId] = useState(defaultValues?.productId || "");
  const [netContentQty, setNetContentQty] = useState(parsedDefault.qty);
  const [netContentUnit, setNetContentUnit] = useState(parsedDefault.unit);
  const [productionDate, setProductionDate] = useState(
    defaultValues?.productionDate || new Date().toISOString().split("T")[0]
  );
  const [batch, setBatch] = useState(defaultValues?.batch || "");
  const [packedBy, setPackedBy] = useState(defaultValues?.packedBy || userData?.ubicacion || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [autoGenerateBatch, setAutoGenerateBatch] = useState(!defaultValues?.batch);
  const [coldChainType, setColdChainType] = useState<string>("");

  // Producto seleccionado
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

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
      const [prodRes, instRes, usersRes] = await Promise.all([
        fetch("/api/products", { headers }),
        fetch("/api/instances", { headers }),
        fetch("/api/users", { headers }).catch(() => null),
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

    const qrPayload = JSON.stringify({
      producto: selectedProduct.name,
      marca: brand,
      lote: batch,
      contenido: quantityLabel,
      produccion: productionDate,
      cadenaFrio: coldChain,
      venceRefrigerado: expiryRefrigerated || undefined,
      venceCongelado: expiryFrozen || undefined,
      envasadoPor: packedBy || undefined,
      destino: destination || undefined,
    });
    const qrData = batch ? qrPayload : "";

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
      const qrData = batch
        ? JSON.stringify({
            producto: selectedProduct.name,
            marca: brand,
            lote: batch,
            contenido: netContent,
            produccion: productionDate,
            envasadoPor: packedBy || undefined,
            destino: destination || undefined,
          })
        : "";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── 1. Producto ── */}
      {!defaultValues?.productId && (
      <section className="space-y-3">
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
      <section className="rounded-2xl border border-orange-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Cadena de frío — pills compactas */}
        {coldChainOptions.length > 0 && (
          <div className="border-b border-orange-100 dark:border-slate-700/50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Thermometer size={11} className="text-orange-400" />
              {t("coldChainTitle")}
            </p>
            <div className="flex gap-2">
              {coldChainOptions.map((opt) => {
                const meta = COLD_CHAIN_META[opt.value];
                const Icon = meta.icon;
                const isSelected = coldChainType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColdChainType(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      isSelected
                        ? `${meta.activeBg} ${meta.color}`
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    <Icon size={13} />
                    {coldChainLabels[opt.value] || opt.shortLabel}
                    <span className="text-[10px] opacity-70">{opt.days}d</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Campos — grid compacto con cards */}
        <div className="grid grid-cols-2 gap-3 px-4 py-3">
          {/* Contenido neto */}
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 border border-purple-200/60 dark:border-purple-500/20 p-3 space-y-1.5">
            <Label htmlFor="netContentQty" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
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
                className="flex-1 h-9 text-sm font-medium bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-500/30 focus:border-purple-400"
              />
              <Select
                id="netContentUnit"
                value={netContentUnit}
                onChange={(e) => setNetContentUnit(e.target.value)}
                className="w-16 h-9 text-sm font-medium bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-500/30"
              >
                {NET_CONTENT_UNITS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.value}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
          </div>

          {/* Lote */}
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-600/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="batch" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                <Hash size={12} className="text-slate-500" />
                {t("batch")}
              </Label>
              {selectedProduct?.batchAbbr && (
                <button
                  type="button"
                  onClick={() => {
                    setAutoGenerateBatch(!autoGenerateBatch);
                    if (!autoGenerateBatch && selectedProduct.batchAbbr) {
                      setBatch(generateBatch(selectedProduct.batchAbbr, productionDate));
                    }
                  }}
                  className="text-[10px] text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-0.5 font-bold"
                >
                  <Wand2 className="h-3 w-3" />
                  {autoGenerateBatch ? t("batchManual") : t("batchAuto")}
                </button>
              )}
            </div>
            <Input
              id="batch"
              placeholder="L-010125-0930"
              value={batch}
              onChange={(e) => {
                setBatch(e.target.value);
                setAutoGenerateBatch(false);
              }}
              readOnly={autoGenerateBatch}
              className={`h-9 text-sm font-medium ${autoGenerateBatch ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-800"}`}
            />
          </div>

          {/* Empacado por */}
          <div className="rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-500/10 dark:to-teal-500/5 border border-teal-200/60 dark:border-teal-500/20 p-3 space-y-1.5">
            <Label htmlFor="packedBy" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold">
              <UserCheck size={12} className="text-teal-500" />
              {t("packedBy")}
            </Label>
            <select
              id="packedBy"
              value={packedBy}
              onChange={(e) => setPackedBy(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-teal-200 bg-white px-2.5 text-sm font-medium dark:border-teal-500/30 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {packedByOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5 border border-rose-200/60 dark:border-rose-500/20 p-3 space-y-1.5">
            <Label htmlFor="destination" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
              <MapPin size={12} className="text-rose-500" />
              {t("destination")}
            </Label>
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-rose-200 bg-white px-2.5 text-sm font-medium dark:border-rose-500/30 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guardar — integrado en la card */}
        <div className="border-t border-orange-100 dark:border-slate-700/50 px-4 py-3">
          <Button
            type="submit"
            disabled={saving || !productId}
            className="w-full gap-2 h-10 text-sm font-semibold"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? t("saveChanges") : t("saveLabel")}
          </Button>
        </div>
      </section>
    </form>
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
