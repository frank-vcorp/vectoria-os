import { requirePageModule } from "@/server/auth/page-guard";
import { FinanceManager } from "@/components/finance-manager";

export default async function FinanzasPage() {
  await requirePageModule("flujo_financiero");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-[var(--muted)] mt-1">Saldos, flujo, cuentas por cobrar y movimientos</p>
      </div>
      <FinanceManager />
    </div>
  );
}
