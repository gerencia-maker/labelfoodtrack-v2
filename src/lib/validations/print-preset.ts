import { z } from "zod";

const toNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
  z.number()
);

export const printPresetSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  widthMm: toNumber.pipe(z.number().min(10).max(500)),
  heightMm: toNumber.pipe(z.number().min(10).max(500)),
  marginTop: toNumber.pipe(z.number().min(0).max(50)),
  marginRight: toNumber.pipe(z.number().min(0).max(50)),
  marginBottom: toNumber.pipe(z.number().min(0).max(50)),
  marginLeft: toNumber.pipe(z.number().min(0).max(50)),
  orientation: z.enum(["portrait", "landscape"]),
  stockType: z.string().nullable().optional(),
});

export type PrintPresetFormData = z.infer<typeof printPresetSchema>;
