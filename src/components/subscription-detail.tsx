"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoneyInput } from "@/components/money-input";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
} from "@/components/entity-detail-layout";
import {
  SUBSCRIPTION_BILLING_STATUS_LABELS,
  SUBSCRIPTION_SERVICE_STATUS_LABELS,
  formatMoney,
  type SubscriptionBillingStatus,
  type SubscriptionServiceStatus,
} from "@/shared/commercial";

type Subscription = {
  id: string;
  folio: string;
  clientName: string;
  serviceOrderId: string;
  serviceOrderFolio: string;
  description: string;
  price: number;
  periodicityName: string;
  serviceStatus: SubscriptionServiceStatus;
  billingStatus: SubscriptionBillingStatus;
  autoInvoice: boolean;
};

type Cycle = {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
};

type Payment = {
  id: string;
  concept: string;
  amount: number;
  paymentDate: string;
  bankAccountName: string;
};

export function SubscriptionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payForm, setPayForm] = useState({
    concept: "Pago suscripción",
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const res = await fetch(`/api/subscriptions?id=${id}`);
    if (res.status === 404) {
      router.replace("/suscripciones");
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setSub(data.subscription);
    setCycles(data.cycles ?? []);
    setPayments(data.payments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function activate() {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", id }),
    });
    await load();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id, ...payForm }),
    });
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!sub) return <p className="text-sm text-[var(--danger)]">Suscripción no encontrada</p>;

  return (
    <EntityDetailLayout
      backHref="/suscripciones"
      backLabel="Suscripciones"
      folio={sub.folio}
      title={sub.description}
      statusBadge={<span className="badge">{SUBSCRIPTION_SERVICE_STATUS_LABELS[sub.serviceStatus]}</span>}
    >
      <DetailSection title="Datos">
        <DetailGrid>
          <DetailField label="Cliente" value={sub.clientName} />
          <DetailField
            label="OS"
            value={
              <Link href={`/ordenes-servicio/${sub.serviceOrderId}`} className="text-[var(--accent)]">
                {sub.serviceOrderFolio}
              </Link>
            }
          />
          <DetailField label="Precio" value={formatMoney(sub.price)} />
          <DetailField label="Periodicidad" value={sub.periodicityName} />
          <DetailField label="Cobranza" value={SUBSCRIPTION_BILLING_STATUS_LABELS[sub.billingStatus]} />
        </DetailGrid>
        {sub.serviceStatus === "pendiente_activacion" && (
          <button type="button" className="btn-primary mt-4" onClick={() => void activate()}>
            Activar suscripción
          </button>
        )}
      </DetailSection>

      <DetailSection title="Ciclos">
        <div className="space-y-2">
          {cycles.map((c) => (
            <div key={c.id} className="flex justify-between text-sm border-b border-[var(--border)] py-2">
              <span>
                {new Date(c.periodStart).toLocaleDateString("es-MX")} —{" "}
                {new Date(c.periodEnd).toLocaleDateString("es-MX")}
              </span>
              <span>
                {formatMoney(c.paidAmount)} / {formatMoney(c.amount)} — vence{" "}
                {new Date(c.dueDate).toLocaleDateString("es-MX")} ({c.status})
              </span>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Pagos">
        <form className="card space-y-3 mb-4" onSubmit={(e) => void addPayment(e)}>
          <input
            value={payForm.concept}
            onChange={(e) => setPayForm({ ...payForm, concept: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            required
          />
          <MoneyInput
            valueCents={payForm.amount}
            onChangeCents={(amount) => setPayForm({ ...payForm, amount })}
          />
          <input
            type="date"
            value={payForm.paymentDate}
            onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            required
          />
          <button type="submit" className="btn-primary">
            Registrar pago
          </button>
        </form>
        {payments.map((p) => (
          <div key={p.id} className="text-sm py-1">
            {p.concept} — {formatMoney(p.amount)} — {new Date(p.paymentDate).toLocaleDateString("es-MX")} ({p.bankAccountName})
          </div>
        ))}
      </DetailSection>
    </EntityDetailLayout>
  );
}
