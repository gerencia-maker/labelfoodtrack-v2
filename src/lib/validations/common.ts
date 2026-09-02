import { z } from "zod";

export const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

export const optionalDateString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "La fecha no es valida");

export function toOptionalDate(value?: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
