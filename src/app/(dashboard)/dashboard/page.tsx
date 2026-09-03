import Link from "next/link";
import { requirePageModule } from "@/server/auth/page-guard";

export default async function DashboardPage() {
  await requirePageModule("clientes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-[var(--muted)] mt-1">Fase 3 — Cotizaciones y Órdenes de Servicio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/cotizaciones" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Cotizaciones</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Creación directa o desde oportunidad, autorización, rechazo, PDF (Discovery §6).
          </p>
        </Link>
        <Link href="/ordenes-servicio" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Órdenes de Servicio</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Desde cotización autorizada o directa, pagos, saldo e ingreso automático (Discovery §7).
          </p>
        </Link>
        <Link href="/oportunidades" className="card hover:border-[var(--accent)] transition-colors">
          <h2 className="font-medium">Oportunidades</h2>
          <p className="text-sm text-[var(--muted)] mt-2">Inicio del flujo comercial (Fase 2).</p>
        </Link>
      </div>
    </div>
  );
}
