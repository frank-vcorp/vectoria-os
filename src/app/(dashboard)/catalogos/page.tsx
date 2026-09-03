import { requirePageModule } from "@/server/auth/page-guard";
import { CatalogsManager } from "@/components/catalogs-manager";

export default async function CatalogosPage() {
  const user = await requirePageModule("catalogos");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
        <p className="text-[var(--muted)]">
          Servicios, suscripciones, periodicidades, condiciones de pago, ingresos, egresos y proveedores.
        </p>
      </div>
      <CatalogsManager isAdmin={user.role === "administrador"} />
    </div>
  );
}
