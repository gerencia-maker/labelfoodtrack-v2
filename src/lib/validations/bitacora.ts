import { z } from "zod";

export const bitacoraSchema = z.object({
  productName: z.string().min(1, "El nombre del producto es obligatorio"),
  category: z.string().nullable().optional(),
  coldChain: z.string().nullable().optional(),
  processDate: z.string().nullable().optional(),
  expiryRefrigerated: z.string().nullable().optional(),
  expiryFrozen: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  quantityProduced: z.string().nullable().optional(),
  packedBy: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  traceDate: z.string().nullable().optional(),
});

export type BitacoraFormData = z.infer<typeof bitacoraSchema>;
