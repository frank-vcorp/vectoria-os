import Link from "next/link";
import { requirePageModule } from "@/server/auth/page-guard";
import { getRoleModules } from "@/server/services/permissions";
import { CatalogsManager } from "@/components/catalogs-manager";
import { BrandChevron } from "@/components/brand-chevron";
import type { RoleKey } from "@/shared/modules";

export default async function CatalogosPage() {
  const user = await requirePageModule("catalogos");
  const modules = await getRoleModules(user.role as RoleKey);
  const canManageBanks = modules.includes("bancos");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
        <p className="text-[var(--muted)]">
          Servicios, suscripciones, periodicidades, condiciones de pago, ingresos, egresos y proveedores.
        </p>
      </div>
      <CatalogsManager isAdmin={user.role === "administrador"} />
      {canManageBanks && (
        <div className="module-list">
          <Link href="/catalogos/bancos" className="module-list-item">
            <div>
              <h2>Bancos</h2>
              <p>Cuentas bancarias, saldos y tipo fiscal</p>
            </div>
            <span className="module-list-arrow" aria-hidden>
              <BrandChevron />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
