"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ProductFormData } from "@/lib/validations/product";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_PRODUCTS: Record<string, ProductFormData> = {
  "1": { code: "R-01", batchAbbr: "PP0003", name: "AJI RANCHERITO", category: "COCINA INTERMEDIA", sede: null, ingredients: "Aji topito, vinagre, sal, ajo, aceite vegetal", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Condimento para acompañar platos.", packaging: null, refrigeratedDays: 4, frozenDays: 90, ambientDays: 0 },
  "2": { code: "R-02", batchAbbr: "PP0021", name: "CHIMICHURRI", category: "COCINA INTERMEDIA", sede: null, ingredients: "Perejil, ajo, oregano, aceite de oliva, vinagre, sal, aji", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para acompañar carnes a la parrilla.", packaging: null, refrigeratedDays: 8, frozenDays: 60, ambientDays: 0 },
  "3": { code: "R-03", batchAbbr: "PP0056", name: "SALSA TARTARA", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mayonesa, pepinillos, alcaparras, cebolla, perejil, limon, sal", allergens: "Huevo", storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para acompañar pescados y mariscos.", packaging: null, refrigeratedDays: 2, frozenDays: 30, ambientDays: 0 },
  "4": { code: "R-04", batchAbbr: "PP0057", name: "VINAGRETA DE LA CASA", category: "COCINA INTERMEDIA", sede: null, ingredients: "Aceite vegetal, vinagre, mostaza, miel, sal, pimienta", allergens: "Mostaza", storage: "Conservar refrigerado (0-4°C)", usage: "Aderezo para ensaladas.", packaging: null, refrigeratedDays: 4, frozenDays: 60, ambientDays: 0 },
  "5": { code: "R-05", batchAbbr: "PP0220", name: "VINAGRETA DE MORA", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mora, aceite vegetal, vinagre, azucar, sal", allergens: null, storage: "Conservar refrigerado (0-4°C)", usage: "Aderezo para ensaladas.", packaging: null, refrigeratedDays: 15, frozenDays: 90, ambientDays: 0 },
  "6": { code: "R-06", batchAbbr: "PP0206", name: "SALSA BURGUER", category: "COCINA INTERMEDIA", sede: null, ingredients: "Mayonesa, ketchup, mostaza, pepinillos, cebolla, especias", allergens: "Huevo, Mostaza", storage: "Conservar refrigerado (0-4°C)", usage: "Salsa para hamburguesas.", packaging: null, refrigeratedDays: 20, frozenDays: 60, ambientDays: 0 },
  "7": { code: "R-07", batchAbbr: "PQ01", name: "PANDEQUESO", category: "PANADERIA", sede: null, ingredients: "Harina de maiz, queso costeño, almidon de yuca, huevos, mantequilla, sal", allergens: "Gluten, Lacteos, Huevo", storage: "Conservar refrigerado (0-4°C)", usage: "Listo para hornear. Hornear a 200°C por 15-20 min.", packaging: null, refrigeratedDays: 5, frozenDays: 30, ambientDays: 2 },
  "8": { code: "R-08", batchAbbr: "AB01", name: "AREPA DE BOYACA", category: "PANADERIA", sede: null, ingredients: "Maiz pelao, cuajada fresca, mantequilla, azucar, sal", allergens: "Lacteos", storage: "Conservar refrigerado (0-4°C)", usage: "Calentar en sarten o plancha por ambos lados.", packaging: null, refrigeratedDays: 7, frozenDays: 60, ambientDays: 3 },
  "9": { code: "R-09", batchAbbr: "AL01", name: "ALMOJABANA", category: "PANADERIA", sede: null, ingredients: "Almidon de yuca, cuajada, harina de maiz, huevos, azucar, sal", allergens: "Lacteos, Huevo, Gluten", storage: "Conservar refrigerado (0-4°C)", usage: "Hornear a 180°C por 20-25 min.", packaging: null, refrigeratedDays: 4, frozenDays: 30, ambientDays: 2 },
  "10": { code: "R-10", batchAbbr: "EM01", name: "EMPANADA DE CARNE", category: "FRITOS", sede: null, ingredients: "Masa: harina de maiz, agua, sal, achiote. Relleno: carne molida, papa, cebolla, comino, ajo", allergens: "Gluten", storage: "Conservar congelado (-18°C)", usage: "Freir en aceite caliente (180°C) por 4-5 min.", packaging: null, refrigeratedDays: 3, frozenDays: 45, ambientDays: 1 },
  "11": { code: "R-11", batchAbbr: "BU01", name: "BUÑUELO", category: "FRITOS", sede: null, ingredients: "Queso costeño, almidon de yuca, harina de maiz, huevos, azucar, polvo de hornear", allergens: "Lacteos, Huevo, Gluten", storage: "Conservar a temperatura ambiente", usage: "Freir en aceite a 160°C por 6-8 min.", packaging: null, refrigeratedDays: 3, frozenDays: 30, ambientDays: 1 },
  "12": { code: "R-12", batchAbbr: "QS01", name: "QUESO CAMPESINO", category: "LACTEOS", sede: null, ingredients: "Leche pasteurizada, cuajo, sal, cloruro de calcio", allergens: "Lacteos", storage: "Conservar refrigerado (2-6°C). No congelar.", usage: "Consumo directo. Ideal para acompañar arepas y pan.", packaging: null, refrigeratedDays: 15, frozenDays: 90, ambientDays: 0 },
  "13": { code: "R-13", batchAbbr: "YG01", name: "YOGURT NATURAL", category: "LACTEOS", sede: null, ingredients: "Leche entera pasteurizada, cultivos lacticos", allergens: "Lacteos", storage: "Conservar refrigerado (2-6°C)", usage: "Consumo directo.", packaging: null, refrigeratedDays: 21, frozenDays: 0, ambientDays: 0 },
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getToken, userData } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    if (DEMO_MODE) {
      const demo = DEMO_PRODUCTS[id];
      setProduct(demo || null);
      setLoading(false);
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setProduct(data);
    }
    setLoading(false);
  }, [id, getToken]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (data: ProductFormData) => {
    if (DEMO_MODE) {
      toast({ title: "Producto actualizado (demo)", variant: "success" });
      router.push("/");
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: err.error || "Error al actualizar producto", variant: "error" });
      return;
    }

    toast({ title: "Producto actualizado", variant: "success" });
    router.push("/");
  };

  const handleDelete = async () => {
    if (!confirm("Estas seguro de eliminar este producto?")) return;

    if (DEMO_MODE) {
      toast({ title: "Producto eliminado (demo)", variant: "success" });
      router.push("/");
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: err.error || "Error al eliminar", variant: "error" });
      return;
    }

    toast({ title: "Producto eliminado", variant: "success" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-slate-500">Producto no encontrado</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("edit")}</h1>
            <p className="text-sm text-slate-500">{product.name}</p>
          </div>
        </div>

        {userData?.role === "ADMIN" && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            {tc("delete")}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProductForm defaultValues={product} onSubmit={handleSubmit} isEdit />
      </div>
    </div>
  );
}
