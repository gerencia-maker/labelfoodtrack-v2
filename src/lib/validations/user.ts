import { z } from "zod";
import { getAllPermisosWithActions } from "@/lib/permissions";

const allowedPermissions = new Set<string>(getAllPermisosWithActions());

const roleSchema = z.enum(["ADMIN", "EDITOR", "VIEWER"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
const permissionSchema = z
  .string()
  .max(64)
  .refine((permission) => allowedPermissions.has(permission), "Permiso no reconocido");

const commonFields = {
  name: z.string().trim().min(1).max(120),
  role: roleSchema,
  permisos: z.array(permissionSchema).max(100).default([]),
  ubicacion: z.string().trim().max(120).nullable().optional(),
};

export const createUserSchema = z
  .object({
    email: z.email().trim().toLowerCase().max(254),
    password: z.string().min(12).max(128),
    ...commonFields,
    instanceId: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: commonFields.name.optional(),
    role: roleSchema.optional(),
    permisos: z.array(permissionSchema).max(100).optional(),
    ubicacion: commonFields.ubicacion,
    status: statusSchema.optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios para aplicar");

export function isActiveAdmin(user: {
  role: string;
  status: string;
  activo: boolean;
}): boolean {
  return user.role === "ADMIN" && user.status === "ACTIVE" && user.activo;
}

