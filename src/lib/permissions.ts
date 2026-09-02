/**
 * Permission system adapted from FOOD LOGIC MDP.
 * Modules + sub-actions for granular access control.
 */

export const PERMISOS = {
  dashboard: "dashboard",
  products: "products",
  labels: "labels",
  bitacora: "bitacora",
  configuration: "configuration",
  ai_features: "ai_features",
  export: "export",
  import: "import",
  instances: "instances",
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];

export const ALL_PERMISOS: PermisoCodigo[] = Object.values(PERMISOS);

// Sub-actions per module (modules not listed here are simple toggles)
export const MODULE_ACTIONS: Record<string, { key: string; labelKey: string }[]> = {
  products: [
    { key: "crear", labelKey: "crear" },
    { key: "editar", labelKey: "editar" },
    { key: "eliminar", labelKey: "eliminar" },
    { key: "importar", labelKey: "importar" },
    { key: "rotular", labelKey: "rotular" },
    { key: "editar_fecha", labelKey: "editarFecha" },
    { key: "editar_caducidad", labelKey: "editarCaducidad" },
    { key: "ver_rotulacion", labelKey: "verRotulacion" },
  ],
  labels: [
    { key: "crear", labelKey: "crear" },
    { key: "editar", labelKey: "editar" },
    { key: "eliminar", labelKey: "eliminar" },
    { key: "imprimir", labelKey: "imprimir" },
    { key: "duplicar", labelKey: "duplicar" },
  ],
  bitacora: [
    { key: "crear", labelKey: "crear" },
    { key: "eliminar", labelKey: "eliminar" },
    { key: "exportar", labelKey: "exportar" },
  ],
  configuration: [
    { key: "ver_cuenta", labelKey: "verCuenta" },
    { key: "cambiar_password", labelKey: "cambiarPassword" },
    { key: "editar_papel", labelKey: "editarPapel" },
    { key: "editar_unidades", labelKey: "editarUnidades" },
    { key: "exportar_datos", labelKey: "exportarDatos" },
    { key: "importar_datos", labelKey: "importarDatos" },
    { key: "editar_instancia", labelKey: "editarInstancia" },
    { key: "gestionar_usuarios", labelKey: "gestionarUsuarios" },
    { key: "sync_sheets", labelKey: "syncSheets" },
    { key: "factory_reset", labelKey: "factoryReset" },
  ],
};

// Get all sub-permission keys for a module (e.g. ["products.crear", ...])
export function getModuleSubKeys(module: string): string[] {
  const actions = MODULE_ACTIONS[module];
  if (!actions) return [];
  return actions.map((a) => `${module}.${a.key}`);
}

// Get ALL permission keys (modules + all sub-actions) for "select all"
export function getAllPermisosWithActions(): string[] {
  const all: string[] = [...ALL_PERMISOS];
  for (const [mod, actions] of Object.entries(MODULE_ACTIONS)) {
    for (const action of actions) {
      all.push(`${mod}.${action.key}`);
    }
  }
  return all;
}

// Groups for UI organization (checkboxes in user management)
export const PERMISOS_GROUPS = [
  {
    labelKey: "modules",
    permisos: [
      PERMISOS.dashboard,
      PERMISOS.products,
      PERMISOS.labels,
      PERMISOS.bitacora,
    ],
  },
  {
    labelKey: "config",
    permisos: [
      PERMISOS.configuration,
      PERMISOS.instances,
    ],
  },
  {
    labelKey: "dataOps",
    permisos: [PERMISOS.import, PERMISOS.export],
  },
  {
    labelKey: "ai",
    permisos: [PERMISOS.ai_features],
  },
];

// Maps sidebar navigation keys to permission codes
const NAV_PERMISSION_MAP: Record<string, PermisoCodigo> = {
  dashboard: PERMISOS.dashboard,
  products: PERMISOS.products,
  labels: PERMISOS.labels,
  bitacora: PERMISOS.bitacora,
  ai: PERMISOS.ai_features,
  settings: PERMISOS.configuration,
  instances: PERMISOS.instances,
};

export function hasPermission(
  rol: string,
  permisos: string[],
  permission: PermisoCodigo
): boolean {
  if (rol === "ADMIN") return true;

  // VIEWER is read-only — block write-oriented modules
  if (rol === "VIEWER") {
    const blocked: string[] = [PERMISOS.import, PERMISOS.export, PERMISOS.ai_features];
    if (blocked.includes(permission)) return false;
  }

  return permisos.includes(permission);
}

/**
 * Check if user has a specific sub-action permission within a module.
 * The module and the exact sub-permission are both required for non-admin users.
 */
export function hasActionPermission(
  rol: string,
  permisos: string[],
  module: string,
  action: string
): boolean {
  if (rol === "ADMIN") return true;

  // Must have module access first
  if (!permisos.includes(module)) return false;

  // VIEWER: read-only — block all write actions
  if (rol === "VIEWER") return false;

  const moduleActions = MODULE_ACTIONS[module];
  if (!moduleActions) return true; // Module without sub-actions

  return permisos.includes(`${module}.${action}`);
}

export function canAccessNavItem(
  rol: string,
  permisos: string[],
  navLabelKey: string
): boolean {
  const permission = NAV_PERMISSION_MAP[navLabelKey];
  if (!permission) return true;
  return hasPermission(rol, permisos, permission);
}
