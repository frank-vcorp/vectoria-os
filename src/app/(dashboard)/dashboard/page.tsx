import Link from "next/link";
import { requirePageUser } from "@/server/auth/page-guard";
import { getRoleModules } from "@/server/services/permissions";
import { PageHeader } from "@/components/page-header";
import { ROLE_LABELS, type ModuleKey, type RoleKey } from "@/shared/modules";

const HOME_MODULES: { href: string; module: ModuleKey; title: string; description: string }[] = [
  { href: "/clientes", module: "clientes", title: "Clientes", description: "Directorio comercial y datos fiscales" },
  { href: "/oportunidades", module: "oportunidades", title: "Oportunidades", description: "Inicio del flujo comercial" },
  { href: "/cotizaciones", module: "cotizaciones", title: "Cotizaciones", description: "Creación, autorización y envío" },
  { href: "/ordenes-servicio", module: "ordenes_servicio", title: "Órdenes de servicio", description: "Pagos, saldo e ingreso automático" },
  { href: "/proyectos", module: "proyectos", title: "Proyectos", description: "Plan de validación y fases" },
  { href: "/suscripciones", module: "suscripciones", title: "Suscripciones", description: "Ciclos, pagos y facturación" },
  { href: "/bancos", module: "bancos", title: "Bancos", description: "Cuentas y saldos" },
  { href: "/finanzas", module: "flujo_financiero", title: "Finanzas", description: "Flujo, CxC, CxP y reporte" },
  { href: "/facturacion", module: "facturacion", title: "Facturación", description: "Timbrado y envío CFDI" },
  { href: "/catalogos", module: "catalogos", title: "Catálogos", description: "Servicios, integraciones y configuración" },
  { href: "/admin/usuarios", module: "usuarios_roles", title: "Usuarios y permisos", description: "Accesos, roles y auditoría" },
];

export default async function DashboardPage() {
  const user = await requirePageUser();
  const modules = await getRoleModules(user.role as RoleKey);
  const items = HOME_MODULES.filter((c) => modules.includes(c.module));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description={`${user.name} · ${ROLE_LABELS[user.role as RoleKey] ?? user.role}`}
      />

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No hay módulos asignados a su rol.</p>
      ) : (
        <div className="module-list">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="module-list-item">
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <span className="module-list-arrow" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
