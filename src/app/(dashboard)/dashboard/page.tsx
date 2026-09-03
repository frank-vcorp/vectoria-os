import Link from "next/link";
import { requirePageModule } from "@/server/auth/page-guard";

export default async function DashboardPage() {
  await requirePageModule("clientes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-[var(--muted)] mt-1">Fase 2 — Clientes y Oportunidades</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/clientes" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Clientes</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Alta, edición, contacto y datos fiscales con carga rápida (Discovery §4).
          </p>
        </Link>
        <Link href="/oportunidades" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Oportunidades</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Servicio, descripción, bitácora y conversión a cotización (Discovery §5).
          </p>
        </Link>
        <Link href="/cotizaciones" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Cotizaciones</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Herencia desde oportunidades. Flujo completo en Fase 3.
          </p>
        </Link>
      </div>
    </div>
  );
}
