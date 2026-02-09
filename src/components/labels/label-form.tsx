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

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_PRODUCTS: Product[] = [
  { id: "1", code: "R-01", name: "AJI RANCHERITO", batchAbbr: "PP0003", category: "COCINA INTERMEDIA", sede: null, ingredients: "Aji topito, vinagre, sal, ajo, aceite vegetal", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Condimento para acompañar platos.", packaging: null, refrigeratedDays: 4, frozenDays: 90, ambientDays: 0, servingSize: 30 },
  { id: "2", code: "R-02", name: "CHIMICHURRI", batchAbbr: "PP0021", category: "COCINA INTERMEDIA", sede: null, ingredients: "Perejil, ajo, oregano, aceite de oliva, vinagre, sal, aji", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para acompañar carnes a la parrilla.", packaging: null, refrigeratedDays: 8, frozenDays: 60, ambientDays: 0, servingSize: 30 },
  { id: "3", code: "R-03", name: "SALSA TARTARA", batchAbbr: "PP0056", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mayonesa, pepinillos, alcaparras, cebolla, perejil, limon, sal", allergens: "Huevo", storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para acompañar pescados y mariscos.", packaging: null, refrigeratedDays: 2, frozenDays: 30, ambientDays: 0, servingSize: 30 },
  { id: "4", code: "R-04", name: "VINAGRETA DE LA CASA", batchAbbr: "PP0057", category: "COCINA INTERMEDIA", sede: null, ingredients: "Aceite vegetal, vinagre, mostaza, miel, sal, pimienta", allergens: "Mostaza", storage: "Conservar refrigerado (0-4°C)", usage: "Aderezo para ensaladas.", packaging: null, refrigeratedDays: 4, frozenDays: 60, ambientDays: 0, servingSize: 30 },
  { id: "5", code: "R-05", name: "VINAGRETA DE MORA", batchAbbr: "PP0220", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mora, aceite vegetal, vinagre, azucar, sal", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Aderezo para ensaladas.", packaging: null, refrigeratedDays: 15, frozenDays: 90, ambientDays: 0, servingSize: 30 },
  { id: "6", code: "R-06", name: "SALSA BURGUER", batchAbbr: "PP0206", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mayonesa, ketchup, mostaza, pepinillos, cebolla, especias", allergens: "Huevo, Mostaza", storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para hamburguesas.", packaging: null, refrigeratedDays: 20, frozenDays: 60, ambientDays: 0, servingSize: 30 },
  { id: "7", code: "R-07", name: "PANDEQUESO", batchAbbr: "PQ01", category: "PANADERIA", sede: null, ingredients: "Harina de maiz, queso costeño, almidon de yuca, huevos, mantequilla, sal", allergens: "Gluten, Lacteos, Huevo", storage: "Conservar refrigerado (0-4°C)", usage: "Listo para hornear. Hornear a 200°C por 15-20 min.", packaging: null, refrigeratedDays: 5, frozenDays: 30, ambientDays: 2, servingSize: 60 },
  { id: "8", code: "R-08", name: "AREPA DE BOYACA", batchAbbr: "AB01", category: "PANADERIA", sede: null, ingredients: "Maiz pelao, cuajada fresca, mantequilla, azucar, sal", allergens: "Lacteos", storage: "Conservar refrigerado (0-4°C)", usage: "Calentar en sarten o plancha por ambos lados.", packaging: null, refrigeratedDays: 7, frozenDays: 60, ambientDays: 3, servingSize: 120 },
  { id: "9", code: "R-09", name: "ALMOJABANA", batchAbbr: "AL01", category: "PANADERIA", sede: null, ingredients: "Almidon de yuca, cuajada, harina de maiz, huevos, azucar, sal", allergens: "Lacteos, Huevo, Gluten", storage: "Conservar refrigerado (0-4°C)", usage: "Hornear a 180°C por 20-25 min.", packaging: null, refrigeratedDays: 4, frozenDays: 30, ambientDays: 2, servingSize: 70 },
  { id: "10", code: "R-10", name: "EMPANADA DE CARNE", batchAbbr: "EM01", category: "FRITOS", sede: null, ingredients: "Masa: harina de maiz, agua, sal, achiote. Relleno: carne molida, papa, cebolla, comino, ajo", allergens: "Gluten", storage: "Conservar congelado (-18°C)", usage: "Freir en aceite caliente (180°C) por 4-5 min.", packaging: null, refrigeratedDays: 3, frozenDays: 45, ambientDays: 1, servingSize: 100 },
  { id: "11", code: "R-11", name: "BUÑUELO", batchAbbr: "BU01", category: "FRITOS", sede: null, ingredients: "Queso costeño, almidon de yuca, harina de maiz, huevos, azucar, polvo de hornear", allergens: "Lacteos, Huevo, Gluten", storage: "Conservar a temperatura ambiente", usage: "Freir en aceite a 160°C por 6-8 min.", packaging: null, refrigeratedDays: 3, frozenDays: 30, ambientDays: 1, servingSize: 50 },
  { id: "12", code: "R-12", name: "QUESO CAMPESINO", batchAbbr: "QS01", category: "LACTEOS", sede: null, ingredients: "Leche pasteurizada, cuajo, sal, cloruro de calcio", allergens: "Lacteos", storage: "Conservar refrigerado (2-6°C). No congelar.", usage: "Consumo directo. Ideal para acompañar arepas y pan.", packaging: null, refrigeratedDays: 15, frozenDays: 90, ambientDays: 0, servingSize: 30 },
  { id: "13", code: "R-13", name: "YOGURT NATURAL", batchAbbr: "YG01", category: "LACTEOS", sede: null, ingredients: "Leche entera pasteurizada, cultivos lacticos", allergens: "Lacteos", storage: "Conservar refrigerado (2-6°C)", usage: "Consumo directo.", packaging: null, refrigeratedDays: 21, frozenDays: 0, ambientDays: 0, servingSize: 200 },
];

export function LabelForm({ onPreviewChange, onSave, defaultValues, isEdit }: LabelFormProps) {
  const { getToken, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>(DEMO_MODE ? DEMO_PRODUCTS : []);
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
    if (DEMO_MODE) return;
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
