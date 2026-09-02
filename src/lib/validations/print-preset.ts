import { z } from "zod";

const toNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
  z.number()
);

export const printPresetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  widthMm: toNumber.pipe(z.number().min(10).max(500)),
  heightMm: toNumber.pipe(z.number().min(10).max(500)),
  marginTop: toNumber.pipe(z.number().min(0).max(50)),
  marginRight: toNumber.pipe(z.number().min(0).max(50)),
  marginBottom: toNumber.pipe(z.number().min(0).max(50)),
  marginLeft: toNumber.pipe(z.number().min(0).max(50)),
  orientation: z.enum(["portrait", "landscape"]),
  dpi: toNumber.pipe(z.number().int().min(72).max(1200)),
  fontSize: toNumber.pipe(z.number().min(0).max(50)),
  printScale: toNumber.pipe(z.number().int().min(50).max(200)),
  stockType: z.string().trim().max(100).nullable().optional(),
}).superRefine((data, ctx) => {
  const pageWidth = data.orientation === "landscape"
    ? Math.max(data.widthMm, data.heightMm)
    : Math.min(data.widthMm, data.heightMm);
  const pageHeight = data.orientation === "landscape"
    ? Math.min(data.widthMm, data.heightMm)
    : Math.max(data.widthMm, data.heightMm);

  if (data.marginLeft + data.marginRight > pageWidth - 5) {
    ctx.addIssue({
      code: "custom",
      message: "Los margenes horizontales dejan menos de 5 mm imprimibles",
      path: ["marginRight"],
    });
  }
  if (data.marginTop + data.marginBottom > pageHeight - 5) {
    ctx.addIssue({
      code: "custom",
      message: "Los margenes verticales dejan menos de 5 mm imprimibles",
      path: ["marginBottom"],
    });
  }
});

export type PrintPresetFormData = z.infer<typeof printPresetSchema>;
