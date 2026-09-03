import { requirePageModule } from "@/server/auth/page-guard";
import { OpportunitiesManager } from "@/components/opportunities-manager";

export default async function OportunidadesPage() {
  await requirePageModule("oportunidades");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        <p className="text-[var(--muted)] mt-1">Flujo comercial inicial y conversión a cotización (Discovery §5)</p>
      </div>
      <OpportunitiesManager />
    </div>
  );
}
