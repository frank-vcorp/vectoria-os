import { requirePageModule } from "@/server/auth/page-guard";
import { QuotesManager } from "@/components/quotes-manager";

export default async function CotizacionesPage() {
  await requirePageModule("cotizaciones");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cotizaciones</h1>
        <p className="text-[var(--muted)] mt-1">Listado y herencia desde Oportunidades (Fase 2)</p>
      </div>
      <QuotesManager />
    </div>
  );
}
