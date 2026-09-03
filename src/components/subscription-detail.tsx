"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
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
  clientId: string;
  clientName: string;
  serviceOrderId: string;
  serviceOrderFolio: string;
  templateName: string | null;
  description: string;
  price: number;
  periodicityName: string;
  incomeCategoryName: string | null;
  serviceStatus: SubscriptionServiceStatus;
  billingStatus: SubscriptionBillingStatus;
  autoInvoice: boolean;
  activatedAt: string | null;
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
  isConvenio: boolean;
};

type Summary = {
  overdueBalance: number;
  totalPending: number;
  overdueCount: number;
  lastPayment: Payment | null;
  nextCut: string | null;
};

type BankOption = { id: string; name: string };

export function SubscriptionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoicedCycles, setInvoicedCycles] = useState<Record<string, boolean>>({});
  const [payForm, setPayForm] = useState({
    concept: "Pago suscripción",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    isConvenio: false,
  });

  async function loadBanks() {
    const res = await fetch("/api/bank-accounts");
    if (res.ok) {
      const accounts = (await res.json()).accounts ?? [];
      setBanks(accounts.map((a: BankOption) => ({ id: a.id, name: a.name })));
      if (accounts[0]?.id) {
        setPayForm((f) => ({ ...f, bankAccountId: f.bankAccountId || accounts[0].id }));
      }
    }
  }

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
    setSummary(data.summary ?? null);
    const cycleList: Cycle[] = data.cycles ?? [];
    const invoiced: Record<string, boolean> = {};
    await Promise.all(
      cycleList.map(async (c) => {
        const r = await fetch(`/api/invoices?cycleId=${c.id}`);
        if (r.ok) invoiced[c.id] = Boolean((await r.json()).stamped);
      }),
    );
    setInvoicedCycles(invoiced);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([load(), loadBanks()]);
  }, [id]);

  async function patchStatus(body: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    await load();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id, ...payForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    await load();
  }

  async function createCycleInvoice(cycleId: string) {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "from_cycle", cycleId }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    router.push(`/facturacion/${data.invoice.id}`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!sub) return <p className="text-sm text-[var(--danger)]">Suscripción no encontrada</p>;

  const canPause = sub.serviceStatus === "activa";
  const canCancel = ["pendiente_activacion", "activa", "pausada"].includes(sub.serviceStatus);
  const canReactivate = sub.serviceStatus === "pausada";
  const canActivate = sub.serviceStatus === "pendiente_activacion";
  const canSuspendBilling = sub.billingStatus === "vencida";

  return (
    <EntityDetailLayout
      backHref="/suscripciones"
      backLabel="Suscripciones"
      folio={sub.folio}
      title={sub.description}
      statusBadge={
        <div className="flex gap-2">
          <span className="badge">{SUBSCRIPTION_SERVICE_STATUS_LABELS[sub.serviceStatus]}</span>
          <span className="badge">{SUBSCRIPTION_BILLING_STATUS_LABELS[sub.billingStatus]}</span>
        </div>
      }
    >
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <DetailSection title="Datos">
        <DetailGrid>
          <DetailField
            label="Cliente"
            value={
              <Link href={`/clientes/${sub.clientId}`} className="text-[var(--accent)]">
                {sub.clientName}
              </Link>
            }
          />
          <DetailField
            label="OS"
            value={
              <Link href={`/ordenes-servicio/${sub.serviceOrderId}`} className="text-[var(--accent)]">
                {sub.serviceOrderFolio}
              </Link>
            }
          />
          <DetailField label="Plantilla" value={sub.templateName ?? "—"} />
          <DetailField label="Precio" value={formatMoney(sub.price)} />
          <DetailField label="Periodicidad" value={sub.periodicityName} />
          <DetailField label="Categoría ingreso" value={sub.incomeCategoryName ?? "—"} />
          <DetailField
            label="Activación"
            value={sub.activatedAt ? new Date(sub.activatedAt).toLocaleDateString("es-MX") : "—"}
          />
        </DetailGrid>

        <label className="flex items-center gap-2 text-sm mt-4">
          <input
            type="checkbox"
            checked={sub.autoInvoice}
            disabled={sub.serviceStatus === "cancelada"}
            onChange={(e) =>
              void patchStatus({ action: "update_status", id, autoInvoice: e.target.checked })
            }
          />
          Facturación automática
        </label>

        <div className="flex gap-2 flex-wrap mt-4">
          {canActivate && (
            <button type="button" className="btn-primary text-sm" onClick={() => void patchStatus({ action: "activate", id })}>
              Activar
            </button>
          )}
          {canReactivate && (
            <button type="button" className="btn-primary text-sm" onClick={() => void patchStatus({ action: "activate", id })}>
              Reactivar
            </button>
          )}
          {canPause && (
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => void patchStatus({ action: "update_status", id, serviceStatus: "pausada" })}
            >
              Pausar
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => void patchStatus({ action: "update_status", id, serviceStatus: "cancelada" })}
            >
              Cancelar
            </button>
          )}
          {canSuspendBilling && (
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() =>
                void patchStatus({ action: "update_status", id, billingStatus: "suspendida_adeudo" })
              }
            >
              Suspender por adeudo
            </button>
          )}
        </div>
      </DetailSection>

      {summary && (
        <DetailSection title="Resumen financiero">
          <DetailGrid>
            <DetailField label="Saldo vencido" value={formatMoney(summary.overdueBalance)} />
            <DetailField label="Total pendiente" value={formatMoney(summary.totalPending)} />
            <DetailField label="Ciclos adeudados" value={String(summary.overdueCount)} />
            <DetailField
              label="Último pago"
              value={
                summary.lastPayment
                  ? `${formatMoney(summary.lastPayment.amount)} — ${new Date(summary.lastPayment.paymentDate).toLocaleDateString("es-MX")}`
                  : "—"
              }
            />
            <DetailField
              label="Próximo corte"
              value={summary.nextCut ? new Date(summary.nextCut).toLocaleDateString("es-MX") : "—"}
            />
          </DetailGrid>
        </DetailSection>
      )}

      <DetailSection title="Ciclos">
        <div className="space-y-2">
          {cycles.map((c) => {
            const balance = c.amount - c.paidAmount;
            return (
              <div key={c.id} className="flex justify-between gap-2 text-sm border-b border-[var(--border)] py-2 flex-wrap items-center">
                <span>
                  {new Date(c.periodStart).toLocaleDateString("es-MX")} —{" "}
                  {new Date(c.periodEnd).toLocaleDateString("es-MX")}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    {formatMoney(c.paidAmount)} / {formatMoney(c.amount)} — saldo {formatMoney(balance)} — vence{" "}
                    {new Date(c.dueDate).toLocaleDateString("es-MX")} ({c.status})
                  </span>
                  {invoicedCycles[c.id] ? (
                    <span className="badge text-xs">Facturado</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => void createCycleInvoice(c.id)}
                    >
                      Facturar ciclo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {cycles.length === 0 && <p className="text-sm text-[var(--muted)]">Sin ciclos generados.</p>}
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
          <SearchableSelect
            className="w-full"
            value={payForm.bankAccountId}
            onChange={(bankAccountId) => setPayForm({ ...payForm, bankAccountId })}
            required
            placeholder="Cuenta bancaria…"
            options={banks.map((b) => ({ value: b.id, label: b.name }))}
          />
          <DateInput
            className="w-full"
            value={payForm.paymentDate}
            onChange={(paymentDate) => setPayForm({ ...payForm, paymentDate })}
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={payForm.isConvenio}
              onChange={(e) => setPayForm({ ...payForm, isConvenio: e.target.checked })}
            />
            Aplicar convenio de pago
          </label>
          <button type="submit" className="btn-primary">
            Registrar pago
          </button>
        </form>
        {payments.map((p) => (
          <div key={p.id} className="text-sm py-1">
            {p.concept} — {formatMoney(p.amount)} — {new Date(p.paymentDate).toLocaleDateString("es-MX")} (
            {p.bankAccountName})
            {p.isConvenio ? " — Convenio" : ""}
          </div>
        ))}
      </DetailSection>
    </EntityDetailLayout>
  );
}
