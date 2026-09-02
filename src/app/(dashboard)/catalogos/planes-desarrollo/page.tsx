import { requirePageModule } from "@/server/auth/page-guard";
import { PlansManager } from "@/components/plans-manager";

export default async function PlanesDesarrolloPage() {
  await requirePageModule("catalogos");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Planes de Desarrollo</h1>
        <p className="text-[var(--muted)]">
          Importa archivos markdown para definir las fases que se generarán en los Proyectos.
        </p>
      </div>
      <PlansManager />
    </div>
  );
}
