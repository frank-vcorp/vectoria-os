import type { ModuleKey } from "@/shared/modules";

export type NavItem = {
  href: string;
  module: ModuleKey;
  label: string;
  /** Atajo móvil en barra inferior */
  mobilePrimary?: boolean;
};

export type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

/** Inicio usa permiso de clientes pero no es un módulo separado */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "general",
    title: "General",
    items: [{ href: "/dashboard", module: "clientes", label: "Inicio", mobilePrimary: true }],
  },
  {
    id: "comercial",
    title: "Comercial",
    items: [
      { href: "/clientes", module: "clientes", label: "Clientes", mobilePrimary: true },
      { href: "/oportunidades", module: "oportunidades", label: "Oportunidades" },
      { href: "/cotizaciones", module: "cotizaciones", label: "Cotizaciones", mobilePrimary: true },
      { href: "/levantamientos", module: "levantamientos", label: "Levantamientos" },
      { href: "/ordenes-servicio", module: "ordenes_servicio", label: "Órdenes de servicio" },
    ],
  },
  {
    id: "operacion",
    title: "Operación",
    items: [
      { href: "/proyectos", module: "proyectos", label: "Proyectos" },
      { href: "/suscripciones", module: "suscripciones", label: "Suscripciones" },
    ],
  },
  {
    id: "finanzas",
    title: "Finanzas",
    items: [
      { href: "/movimientos", module: "ingresos_egresos", label: "Movimientos", mobilePrimary: true },
      { href: "/finanzas", module: "flujo_financiero", label: "Finanzas" },
      { href: "/facturacion", module: "facturacion", label: "Facturación" },
    ],
  },
  {
    id: "admin",
    title: "Administración",
    items: [{ href: "/admin", module: "usuarios_roles", label: "Administración" }],
  },
];

const ADMIN_HUB_MODULES: ModuleKey[] = ["usuarios_roles", "catalogos"];

export function filterNavGroups(groups: NavGroup[], allowedModules: ModuleKey[]) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/dashboard") return true;
        if (item.href === "/admin") {
          return ADMIN_HUB_MODULES.some((module) => allowedModules.includes(module));
        }
        return allowedModules.includes(item.module);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function flattenNavItems(groups: NavGroup[]) {
  return groups.flatMap((g) => g.items);
}
