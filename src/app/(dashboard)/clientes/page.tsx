import { requirePageModule } from "@/server/auth/page-guard";
import { ClientsManager } from "@/components/clients-manager";

export default async function ClientesPage() {
  await requirePageModule("clientes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-[var(--muted)] mt-1">Alta, edición y datos fiscales (Discovery §4)</p>
      </div>
      <ClientsManager />
    </div>
  );
}
