import Link from "next/link";
import { requirePageModule } from "@/server/auth/page-guard";
import { BanksManager } from "@/components/banks-manager";
import { PageHeader } from "@/components/page-header";

export default async function CatalogosBancosPage() {
  await requirePageModule("bancos");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos"
        description="Catálogo de cuentas bancarias para movimientos y saldos."
        actions={
          <Link href="/catalogos" className="btn btn-ghost text-sm">
            ← Catálogos
          </Link>
        }
      />
      <BanksManager listFirst />
    </div>
  );
}
