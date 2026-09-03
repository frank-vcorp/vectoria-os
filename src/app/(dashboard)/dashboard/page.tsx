import Link from "next/link";
import { requirePageUser } from "@/server/auth/page-guard";
import { getRoleModules } from "@/server/services/permissions";
import { ROLE_LABELS, type ModuleKey, type RoleKey } from "@/shared/modules";

const HOME_CARDS: { href: string; module: ModuleKey; title: string; description: string }[] = [
  {
    href: "/clientes",
    module: "clientes",
    title: "Clientes",
    description: "Directorio comercial y datos fiscales.",
  },
  {
    href: "/oportunidades",
    module: "oportunidades",
    title: "Oportunidades",
    description: "Inicio del flujo comercial.",
  },
  {
    href: "/cotizaciones",
    module: "cotizaciones",
    title: "Cotizaciones",
    description: "Creación, autorización, PDF y envío por correo.",
  },
  {
    href: "/ordenes-servicio",
    module: "ordenes_servicio",
    title: "Órdenes de Servicio",
    description: "Pagos, saldo e ingreso automático.",
  },
  {
    href: "/proyectos",
    module: "proyectos",
    title: "Proyectos",
    description: "Plan de Validación funcional y fases.",
  },
  {
    href: "/suscripciones",
    module: "suscripciones",
    title: "Suscripciones",
    description: "Ciclos, pagos y facturación.",
  },
  {
    href: "/finanzas",
    module: "flujo_financiero",
    title: "Finanzas",
    description: "Saldos, flujo, CxC y reporte.",
  },
  {
    href: "/facturacion",
    module: "facturacion",
    title: "Facturación",
    description: "Timbrado, envío y facturas automáticas.",
  },
  {
    href: "/catalogos",
    module: "catalogos",
    title: "Catálogos",
    description: "Servicios, categorías e integraciones.",
  },
];

export default async function DashboardPage() {
  const user = await requirePageUser();
  const modules = await getRoleModules(user.role as RoleKey);
  const cards = HOME_CARDS.filter((c) => modules.includes(c.module));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-[var(--muted)] mt-1">
          Bienvenido, {user.name}. Rol: {ROLE_LABELS[user.role as RoleKey] ?? user.role}.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No hay módulos asignados a su rol.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="card hover:border-[var(--accent)] transition-colors">
              <h2 className="font-medium">{card.title}</h2>
              <p className="text-sm text-[var(--muted)] mt-2">{card.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
