"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "@/lib/validations/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEdit?: boolean;
}

export function ProductForm({ defaultValues, onSubmit, isEdit }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      code: "",
      name: "",
      refrigeratedDays: 0,
      frozenDays: 0,
      ambientDays: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Datos basicos */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Datos basicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="code">Codigo *</Label>
            <Input id="code" placeholder="R-01" {...register("code")} />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>
          <div>
            <Label htmlFor="batchAbbr">Abreviatura lote</Label>
            <Input id="batchAbbr" placeholder="PP0046" {...register("batchAbbr")} />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" placeholder="Carnicos" {...register("category")} />
          </div>
        </div>

        <div>
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input id="name" placeholder="Aji Rancherito" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sede">Sede</Label>
            <Input id="sede" placeholder="ALZATE" {...register("sede")} />
          </div>
          <div>
            <Label htmlFor="packaging">Envasado</Label>
            <Input id="packaging" placeholder="Bolsa sellada" {...register("packaging")} />
          </div>
        </div>
      </section>

      {/* Tiempos de conservacion */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Tiempos de conservacion (dias)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="refrigeratedDays">Refrigeracion</Label>
            <Input id="refrigeratedDays" type="number" min="0" {...register("refrigeratedDays")} />
          </div>
          <div>
            <Label htmlFor="frozenDays">Congelacion</Label>
            <Input id="frozenDays" type="number" min="0" {...register("frozenDays")} />
          </div>
          <div>
            <Label htmlFor="ambientDays">Ambiente</Label>
            <Input id="ambientDays" type="number" min="0" {...register("ambientDays")} />
          </div>
        </div>
      </section>

      {/* Ingredientes y alergenos */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Ingredientes y alergenos</h3>
        <div>
          <Label htmlFor="ingredients">Ingredientes</Label>
          <Textarea
            id="ingredients"
            placeholder="Harina integral, agua, LEVADURA, sal marina, semillas"
            {...register("ingredients")}
          />
          <p className="mt-1 text-xs text-slate-400">
            Ordena de mayor a menor proporcion. Usa MAYUSCULAS para alergenos.
          </p>
        </div>
        <div>
          <Label htmlFor="allergens">Alergenos</Label>
          <Input id="allergens" placeholder="gluten, frutos secos" {...register("allergens")} />
        </div>
      </section>

      {/* Conservacion y uso */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Conservacion y uso</h3>
        <div>
          <Label htmlFor="storage">Instrucciones de conservacion</Label>
          <Input id="storage" placeholder="Mantener en lugar fresco y seco" {...register("storage")} />
        </div>
        <div>
          <Label htmlFor="usage">Modo de uso</Label>
          <Textarea id="usage" placeholder="Se recomienda su uso para..." {...register("usage")} />
        </div>
      </section>

      {/* Nutricion */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Informacion nutricional (por 100g)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="calories">Calorias (kcal)</Label>
            <Input id="calories" type="number" step="0.1" min="0" {...register("calories")} />
          </div>
          <div>
            <Label htmlFor="energyKj">Energia (kJ)</Label>
            <Input id="energyKj" type="number" step="0.1" min="0" {...register("energyKj")} />
          </div>
          <div>
            <Label htmlFor="fat">Grasa total (g)</Label>
            <Input id="fat" type="number" step="0.1" min="0" {...register("fat")} />
          </div>
          <div>
            <Label htmlFor="saturatedFat">Grasa saturada (g)</Label>
            <Input id="saturatedFat" type="number" step="0.1" min="0" {...register("saturatedFat")} />
          </div>
          <div>
            <Label htmlFor="carbs">Carbohidratos (g)</Label>
            <Input id="carbs" type="number" step="0.1" min="0" {...register("carbs")} />
          </div>
          <div>
            <Label htmlFor="sugars">Azucares (g)</Label>
            <Input id="sugars" type="number" step="0.1" min="0" {...register("sugars")} />
          </div>
          <div>
            <Label htmlFor="fiber">Fibra (g)</Label>
            <Input id="fiber" type="number" step="0.1" min="0" {...register("fiber")} />
          </div>
          <div>
            <Label htmlFor="protein">Proteina (g)</Label>
            <Input id="protein" type="number" step="0.1" min="0" {...register("protein")} />
          </div>
          <div>
            <Label htmlFor="sodium">Sodio (mg)</Label>
            <Input id="sodium" type="number" step="0.1" min="0" {...register("sodium")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="servingSize">Tamano porcion (g)</Label>
            <Input id="servingSize" type="number" step="0.1" min="0" {...register("servingSize")} />
          </div>
          <div>
            <Label htmlFor="servingsPerContainer">Porciones por envase</Label>
            <Input id="servingsPerContainer" type="number" step="0.1" min="0" {...register("servingsPerContainer")} />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
