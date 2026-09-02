import { requirePageModule } from "@/server/auth/page-guard";
import { UsersManager } from "@/components/users-manager";

export default async function UsuariosPage() {
  await requirePageModule("usuarios_roles");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-[var(--muted)]">Administra cuentas y roles del sistema.</p>
      </div>
      <UsersManager />
    </div>
  );
}
