export const MODULES = [
  "clientes",
  "oportunidades",
  "cotizaciones",
  "ordenes_servicio",
  "proyectos",
  "suscripciones",
  "bancos",
  "ingresos_egresos",
  "cuentas_pagar",
  "flujo_financiero",
  "reporte_financiero",
  "facturacion",
  "catalogos",
  "usuarios_roles",
] as const;

export type ModuleKey = (typeof MODULES)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  clientes: "Clientes",
  oportunidades: "Oportunidades",
  cotizaciones: "Cotizaciones",
  ordenes_servicio: "Órdenes de Servicio",
  proyectos: "Proyectos",
  suscripciones: "Suscripciones",
  bancos: "Bancos / Cuentas",
  ingresos_egresos: "Ingresos y Egresos",
  cuentas_pagar: "Cuentas por Pagar",
  flujo_financiero: "Flujo Financiero",
  reporte_financiero: "Reporte Financiero",
  facturacion: "Facturación",
  catalogos: "Catálogos",
  usuarios_roles: "Usuarios y Roles",
};

export const ROLES = ["administrador", "vendedor", "programador"] as const;
export type RoleKey = (typeof ROLES)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  administrador: "Administrador",
  vendedor: "Vendedor",
  programador: "Programador",
};

/** Accesos por defecto según Discovery §17 */
export const DEFAULT_ROLE_MODULES: Record<RoleKey, ModuleKey[]> = {
  administrador: [...MODULES],
  vendedor: [
    "clientes",
    "oportunidades",
    "cotizaciones",
    "ordenes_servicio",
    "proyectos",
    "suscripciones",
  ],
  programador: ["proyectos", "ordenes_servicio"],
};

export const FOLIO_PREFIXES = {
  cliente: "CLI",
  oportunidad: "OPO",
  cotizacion: "COT",
  orden_servicio: "OS",
  proyecto: "PRY",
  suscripcion: "SUS",
  cuenta_pagar: "CXP",
  factura: "FAC",
} as const;

export type FolioEntity = keyof typeof FOLIO_PREFIXES;

export type ModuleAccess = {
  canRead: boolean;
  canWrite: boolean;
};

export type RolePermissions = Record<ModuleKey, ModuleAccess>;

/** Permisos por defecto según Discovery §17 (lectura + escritura en módulos asignados). */
export function defaultPermissionsForRole(role: RoleKey): RolePermissions {
  const allowed = new Set(DEFAULT_ROLE_MODULES[role]);
  return Object.fromEntries(
    MODULES.map((m) => [m, { canRead: allowed.has(m), canWrite: allowed.has(m) }]),
  ) as RolePermissions;
}
