import { requirePageModule } from "@/server/auth/page-guard";
import { BanksManager } from "@/components/banks-manager";

export default async function BancosPage() {
  await requirePageModule("bancos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bancos / Cuentas</h1>
        <p className="text-[var(--muted)] mt-1">También disponible en Catálogos. Solo nombre identificador por cuenta.</p>
      </div>
      <BanksManager listFirst />
    </div>
  );
}
