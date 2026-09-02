import { requirePageModule } from "@/server/auth/page-guard";
import { PermissionsManager } from "@/components/permissions-manager";

export default async function PermisosPage() {
  await requirePageModule("usuarios_roles");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Permisos por rol</h1>
        <p className="text-[var(--muted)]">Configura qué módulos tiene habilitados cada rol.</p>
      </div>
      <PermissionsManager />
    </div>
  );
}
