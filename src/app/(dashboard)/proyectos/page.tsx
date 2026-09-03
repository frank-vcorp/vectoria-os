import { requirePageModule } from "@/server/auth/page-guard";
import { ProjectsManager } from "@/components/projects-manager";

export default async function ProyectosPage() {
  await requirePageModule("proyectos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <p className="text-[var(--muted)] mt-1">Seguimiento de fases e importación de plan de desarrollo</p>
      </div>
      <ProjectsManager />
    </div>
  );
}
