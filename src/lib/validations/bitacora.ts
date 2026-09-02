import { z } from "zod";
import { optionalDateString, optionalText } from "./common";

export const bitacoraSchema = z.object({
  productName: z.string().trim().min(1, "El nombre del producto es obligatorio").max(200),
  category: optionalText(120),
  coldChain: optionalText(100),
  processDate: optionalDateString,
  expiryRefrigerated: optionalDateString,
  expiryFrozen: optionalDateString,
  quantity: optionalText(100),
  quantityProduced: optionalText(100),
  packedBy: optionalText(200),
  destination: optionalText(200),
  batch: optionalText(100),
  traceDate: optionalDateString,
});

export type BitacoraFormData = z.infer<typeof bitacoraSchema>;
