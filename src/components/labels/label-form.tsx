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

export function LabelForm({ onPreviewChange, onSave, defaultValues, isEdit }: LabelFormProps) {
  const { getToken, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [productId, setProductId] = useState(defaultValues?.productId || "");
  const [netContent, setNetContent] = useState(defaultValues?.netContent || "");
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

  // Cargar productos
  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    }
    load();
  }, [getToken]);

  // Marca de la instancia (simplificado - se usa el nombre del producto como fallback)
  const brand = "RANCHERITO"; // TODO: obtener de instance.brandName

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
  }, [selectedProduct, netContent, productionDate, batch, packedBy, destination, brand, onPreviewChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const qrData = batch
        ? `https://labelfoodtrack.com/t/${encodeURIComponent(batch)}`
        : "";

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
            <Label htmlFor="netContent">Contenido neto</Label>
            <Input
              id="netContent"
              placeholder="500 g"
              value={netContent}
              onChange={(e) => setNetContent(e.target.value)}
            />
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
              <option value="Nuestra cocina intermedia Alzate Norena S.A.S">NCI Alzate</option>
              <option value="Centro de acopio">Centro de acopio</option>
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
              <option value="ALZATE">ALZATE</option>
              <option value="MIRANORTE">MIRANORTE</option>
              <option value="NM">NM</option>
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
