import { z } from "zod";
import { optionalDateString, optionalText } from "./common";

export const labelSchema = z.object({
  productId: z.string().trim().min(1, "Selecciona un producto").max(64),
  productName: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  brand: optionalText(200),
  category: optionalText(120),
  netContent: optionalText(100),
  origin: optionalText(200),
  productionDate: optionalDateString,
  batch: optionalText(100),
  coldChain: optionalText(100),
  packedBy: optionalText(200),
  destination: optionalText(200),
  expiryRefrigerated: optionalDateString,
  expiryFrozen: optionalDateString,
  quantityProduced: optionalText(100),
});

export type LabelFormData = z.infer<typeof labelSchema>;
