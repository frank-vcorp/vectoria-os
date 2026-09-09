import { requirePageModule } from "@/server/auth/page-guard";
import { MovementsManager } from "@/components/movements-manager";

export default async function MovimientosPage() {
  await requirePageModule("ingresos_egresos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Movimientos</h1>
        <p className="text-[var(--muted)] mt-1">Captura de ingresos y egresos, y consulta del listado.</p>
      </div>
      <MovementsManager />
    </div>
  );
}
