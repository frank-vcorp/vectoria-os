import { Suspense } from "react";
import { requirePageModule } from "@/server/auth/page-guard";
import { SurveysManager } from "@/components/surveys-manager";

export default async function LevantamientosPage() {
  await requirePageModule("levantamientos");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Levantamientos</h1>
        <p className="text-[var(--muted)] mt-1">Entrevista opcional ligada a una cotización. No autoriza la venta ni crea OS.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Cargando…</p>}>
        <SurveysManager />
      </Suspense>
    </div>
  );
}
