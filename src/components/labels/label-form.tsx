"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Wand2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  resolveColdChain,
  buildExpiryText,
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
  netContent: string;
  origin: string;
  productionDate: string;
  batch: string;
  packedBy: string;
  destination: string;
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

export function LabelForm({ onPreviewChange, onSave, defaultValues, isEdit }: LabelFormProps) {
  const { getToken, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [packers, setPackers] = useState<string[]>([]);

  // Parse netContent default into qty + unit (e.g. "500 g" → "500", "g")
  const parsedDefault = parseNetContent(defaultValues?.netContent || "");

  // Form state
  const [productId, setProductId] = useState(defaultValues?.productId || "");
  const [netContentQty, setNetContentQty] = useState(parsedDefault.qty);
  const [netContentUnit, setNetContentUnit] = useState(parsedDefault.unit);
  const [productionDate, setProductionDate] = useState(
    defaultValues?.productionDate || new Date().toISOString().split("T")[0]
  );
  const [batch, setBatch] = useState(defaultValues?.batch || "");
  const [packedBy, setPackedBy] = useState(defaultValues?.packedBy || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [autoGenerateBatch, setAutoGenerateBatch] = useState(!defaultValues?.batch);

  // Producto seleccionado
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  // Cargar productos e instancia actual
  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;

      const [prodRes, instRes] = await Promise.all([
        fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/instances", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }

      if (instRes.ok) {
        const instances = await instRes.json();
        // Cookie-scoped: API returns the current instance (or all for super-admin)
        // Use the first one or find by cookie
        const cookieId = document.cookie.match(/lft-instance-id=([^;]+)/)?.[1];
        const current = cookieId
          ? instances.find((i: { id: string }) => i.id === cookieId)
          : instances[0];
        if (current) {
          setBrand(current.brandName || current.name || "");
          setDestinations(current.destinations || []);
          setPackers(current.packers || []);
        }
      }
    }
    load();
  }, [getToken]);

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

    const coldChain = resolveColdChain(
      selectedProduct.refrigeratedDays,
      selectedProduct.frozenDays,
      selectedProduct.ambientDays
    );

    const expiry = buildExpiryText(
      productionDate,
      selectedProduct.refrigeratedDays,
      selectedProduct.frozenDays,
      selectedProduct.ambientDays
    );

    const netContent = netContentQty ? `${netContentQty} ${netContentUnit}` : "";
    const quantityLabel = buildQuantityLabel(netContent, selectedProduct.servingSize);

    const qrData = batch
      ? `https://labelfoodtrack.com/t/${encodeURIComponent(batch)}`
      : "";

    onPreviewChange({
      brand,
      productName: selectedProduct.name,
      netContent: quantityLabel,
      productionDate,
      batch,
      coldChain,
      expiryRefrigerated: expiry.refrigerated,
      expiryFrozen: expiry.frozen,
      destination,
      packedBy,
      ingredients: selectedProduct.ingredients || "",
      allergens: selectedProduct.allergens || "",
      storage: selectedProduct.storage || "",
      usage: selectedProduct.usage || "",
      qrData,
    });
  }, [selectedProduct, netContentQty, netContentUnit, productionDate, batch, packedBy, destination, brand, onPreviewChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const qrData = batch
        ? `https://labelfoodtrack.com/t/${encodeURIComponent(batch)}`
        : "";

      const netContent = netContentQty ? `${netContentQty} ${netContentUnit}` : "";

      await onSave({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        brand,
        netContent,
        origin: "",
        productionDate,
        batch,
        packedBy,
        destination,
        qrData,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleccion de producto */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b pb-1">Producto</h3>
        <div>
          <Label htmlFor="productId">Producto *</Label>
          <Select
            id="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </Select>
        </div>

        {selectedProduct && (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <p><strong>Categoria:</strong> {selectedProduct.category || "N/A"}</p>
            <p><strong>Conservacion:</strong> Ref. {selectedProduct.refrigeratedDays}d / Cong. {selectedProduct.frozenDays}d / Amb. {selectedProduct.ambientDays}d</p>
            {selectedProduct.ingredients && (
              <p className="truncate"><strong>Ingredientes:</strong> {selectedProduct.ingredients}</p>
            )}
          </div>
        )}
      </section>

      {/* Datos de la etiqueta */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b pb-1">Datos de etiqueta</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="netContentQty">Contenido neto</Label>
            <div className="flex gap-1.5">
              <Input
                id="netContentQty"
                type="number"
                min="0"
                step="any"
                placeholder="500"
                value={netContentQty}
                onChange={(e) => setNetContentQty(e.target.value)}
                className="flex-1"
              />
              <Select
                id="netContentUnit"
                value={netContentUnit}
                onChange={(e) => setNetContentUnit(e.target.value)}
                className="w-24"
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
          <div>
            <Label htmlFor="productionDate">Fecha produccion *</Label>
            <Input
              id="productionDate"
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="batch">Lote</Label>
            {selectedProduct?.batchAbbr && (
              <button
                type="button"
                onClick={() => {
                  setAutoGenerateBatch(!autoGenerateBatch);
                  if (!autoGenerateBatch && selectedProduct.batchAbbr) {
                    setBatch(generateBatch(selectedProduct.batchAbbr, productionDate));
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                {autoGenerateBatch ? "Manual" : "Auto-generar"}
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
            className={autoGenerateBatch ? "bg-slate-50" : ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="packedBy">Empacado por</Label>
            <Select
              id="packedBy"
              value={packedBy}
              onChange={(e) => setPackedBy(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {packers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="destination">Destino</Label>
            <Select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      {/* Boton guardar */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={saving || !productId}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Guardar cambios" : "Guardar etiqueta"}
        </Button>
      </div>
    </form>
  );
}
