import { requirePageModule } from "@/server/auth/page-guard";
import { CatalogsManager } from "@/components/catalogs-manager";

export default async function CatalogosPage() {
  await requirePageModule("catalogos");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
        <p className="text-[var(--muted)]">Servicios, periodicidades, condiciones de pago, ingresos, egresos y proveedores.</p>
      </div>
      <CatalogsManager />
    </div>
  );
}
