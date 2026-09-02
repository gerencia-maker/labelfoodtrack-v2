import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
  z.number().finite().min(0).max(1_000_000_000).nullable().optional()
);

const shelfLifeDays = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? 0 : Number(value)),
  z.number().int().min(0).max(3_650)
);

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const productSchema = z.object({
  code: z.string().trim().min(1, "El codigo es obligatorio").max(64),
  batchAbbr: optionalText(32),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  category: optionalText(120),
  sede: optionalText(120),
  ingredients: optionalText(4_000),
  allergens: optionalText(2_000),
  storage: optionalText(2_000),
  usage: optionalText(2_000),
  packaging: optionalText(500),
  refrigeratedDays: shelfLifeDays,
  frozenDays: shelfLifeDays,
  ambientDays: shelfLifeDays,
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
}).strict();

export type ProductFormData = z.infer<typeof productSchema>;
