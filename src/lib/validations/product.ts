import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
  z.number().min(0).nullable().optional()
);

export const productSchema = z.object({
  code: z.string().min(1, "El codigo es obligatorio"),
  batchAbbr: z.string().nullable().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.string().nullable().optional(),
  sede: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  allergens: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  usage: z.string().nullable().optional(),
  packaging: z.string().nullable().optional(),
  refrigeratedDays: z.preprocess((v) => Number(v) || 0, z.number().int().min(0)),
  frozenDays: z.preprocess((v) => Number(v) || 0, z.number().int().min(0)),
  ambientDays: z.preprocess((v) => Number(v) || 0, z.number().int().min(0)),
  calories: optionalNumber,
  energyKj: optionalNumber,
  fat: optionalNumber,
  saturatedFat: optionalNumber,
  carbs: optionalNumber,
  sugars: optionalNumber,
  fiber: optionalNumber,
  protein: optionalNumber,
  sodium: optionalNumber,
  servingSize: optionalNumber,
  servingsPerContainer: optionalNumber,
});

export type ProductFormData = z.infer<typeof productSchema>;
