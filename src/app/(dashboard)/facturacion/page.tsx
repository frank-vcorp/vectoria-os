import { requirePageModule } from "@/server/auth/page-guard";
import { InvoicesManager } from "@/components/invoices-manager";

export default async function FacturacionPage() {
  await requirePageModule("facturacion");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Facturación</h1>
        <p className="text-[var(--muted)] mt-1">Borradores, timbrado Facturapi y envío por correo</p>
      </div>
      <InvoicesManager />
    </div>
  );
}
