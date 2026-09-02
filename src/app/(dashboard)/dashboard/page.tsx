import { requirePageModule } from "@/server/auth/page-guard";

export default async function DashboardPage() {
  await requirePageModule("clientes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-[var(--muted)] mt-1">
          Fase 1 — Base del sistema, usuarios y catálogos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h2 className="font-medium">Usuarios y roles</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Administra cuentas, roles y permisos por módulo (Discovery §17).
          </p>
        </div>
        <div className="card">
          <h2 className="font-medium">Catálogos</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Servicios, periodicidades, condiciones de pago, ingresos, egresos y proveedores (Discovery §16).
          </p>
        </div>
        <div className="card">
          <h2 className="font-medium">Auditoría</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Registro mínimo de creación, modificación y cancelación (Discovery §2).
          </p>
        </div>
      </div>
    </div>
  );
}
