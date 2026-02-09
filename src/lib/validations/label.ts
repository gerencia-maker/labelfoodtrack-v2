import { z } from "zod";

export const labelSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  productName: z.string().min(1, "El nombre es obligatorio"),
  brand: z.string().nullable().optional(),
  netContent: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  productionDate: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  packedBy: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
});

export type LabelFormData = z.infer<typeof labelSchema>;
