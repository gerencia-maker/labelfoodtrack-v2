import { z } from "zod";

const shortText = z.string().trim().max(120);
const listSchema = z.array(shortText.min(1)).max(100).transform((items) => [...new Set(items)]);

const instanceFields = {
  name: shortText.min(1),
  brandName: shortText.nullable().optional(),
  logoUrl: z.url().max(2_048).nullable().optional(),
  plan: z.enum(["BASIC", "ENTERPRISE"]),
  activo: z.boolean(),
  destinations: listSchema,
  packers: listSchema,
};

export const createInstanceSchema = z
  .object({
    name: instanceFields.name,
    brandName: instanceFields.brandName,
    logoUrl: instanceFields.logoUrl,
    plan: instanceFields.plan.default("BASIC"),
    destinations: instanceFields.destinations.default([]),
    packers: instanceFields.packers.default([]),
  })
  .strict();

export const updateInstanceSchema = z
  .object({
    name: instanceFields.name.optional(),
    brandName: instanceFields.brandName,
    logoUrl: instanceFields.logoUrl,
    plan: instanceFields.plan.optional(),
    activo: instanceFields.activo.optional(),
    destinations: instanceFields.destinations.optional(),
    packers: instanceFields.packers.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios para aplicar");

