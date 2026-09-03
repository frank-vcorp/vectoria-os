import { requirePageModule } from "@/server/auth/page-guard";
import { SubscriptionsManager } from "@/components/subscriptions-manager";

export default async function SuscripcionesPage() {
  await requirePageModule("suscripciones");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suscripciones</h1>
        <p className="text-[var(--muted)] mt-1">Activación, ciclos y pagos recurrentes</p>
      </div>
      <SubscriptionsManager />
    </div>
  );
}
