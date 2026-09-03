import { requirePageModule } from "@/server/auth/page-guard";
import { ServiceOrdersManager } from "@/components/service-orders-manager";

export default async function OrdenesServicioPage() {
  await requirePageModule("ordenes_servicio");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Órdenes de Servicio</h1>
        <p className="text-[var(--muted)] mt-1">
          Creación desde cotización o directa, pagos y saldo (Discovery §7)
        </p>
      </div>
      <ServiceOrdersManager />
    </div>
  );
}
