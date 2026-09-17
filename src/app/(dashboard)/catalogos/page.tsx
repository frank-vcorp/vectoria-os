import { requirePageModule } from "@/server/auth/page-guard";
import { getRoleModules } from "@/server/services/permissions";
import { CatalogsManager } from "@/components/catalogs-manager";
import type { RoleKey } from "@/shared/modules";

export default async function CatalogosPage() {
  const user = await requirePageModule("catalogos");
  const modules = await getRoleModules(user.role as RoleKey);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
        <p className="text-[var(--muted)]">
          Servicios, suscripciones, periodicidades, condiciones de pago, tiempos de entrega, términos, ingresos, egresos, proveedores y bancos.
        </p>
      </div>
      <CatalogsManager isAdmin={user.role === "administrador"} canManageBanks={modules.includes("bancos")} />
    </div>
  );
}
