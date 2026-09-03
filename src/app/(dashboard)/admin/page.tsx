import Link from "next/link";
import { requirePageAnyModule } from "@/server/auth/page-guard";
import { getRoleModules } from "@/server/services/permissions";
import { BrandChevron } from "@/components/brand-chevron";
import { PageHeader } from "@/components/page-header";
import type { ModuleKey, RoleKey } from "@/shared/modules";

const ADMIN_ITEMS: { href: string; module: ModuleKey; title: string; description: string }[] = [
  {
    href: "/admin/usuarios",
    module: "usuarios_roles",
    title: "Usuarios",
    description: "Cuentas, roles y acceso al sistema",
  },
  {
    href: "/admin/permisos",
    module: "usuarios_roles",
    title: "Permisos",
    description: "Módulos habilitados por rol",
  },
  {
    href: "/admin/auditoria",
    module: "usuarios_roles",
    title: "Auditoría",
    description: "Registro de cambios y cancelaciones",
  },
  {
    href: "/catalogos",
    module: "catalogos",
    title: "Catálogos",
    description: "Servicios, integraciones y configuración",
  },
];

export default async function AdminDashboardPage() {
  const user = await requirePageAnyModule(["usuarios_roles", "catalogos"]);
  const modules = await getRoleModules(user.role as RoleKey);
  const items = ADMIN_ITEMS.filter((item) => modules.includes(item.module));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración"
        description="Usuarios, permisos, auditoría y catálogos del sistema"
      />

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No hay secciones de administración disponibles.</p>
      ) : (
        <div className="module-list">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="module-list-item">
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <span className="module-list-arrow" aria-hidden>
                <BrandChevron />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
