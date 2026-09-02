import { requirePageModule } from "@/server/auth/page-guard";
import { AuditManager } from "@/components/audit-manager";

export default async function AuditoriaPage() {
  await requirePageModule("usuarios_roles");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Auditoría</h1>
        <p className="text-[var(--muted)]">Registro mínimo de creación, modificación y cancelación.</p>
      </div>
      <AuditManager />
    </div>
  );
}
