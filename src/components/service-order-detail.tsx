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
  CONTRACT_TYPE_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  formatMoney,
  type ServiceOrderStatus,
} from "@/shared/commercial";

type OrderDetail = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  quoteId: string | null;
  quoteFolio: string | null;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId: string | null;
  periodicityName: string | null;
  price: number;
  paymentConditionId: string | null;
  paymentConditionName: string | null;
  deliveryDate: string;
  observations: string | null;
  status: ServiceOrderStatus;
  createdAt: string;
};

type PaymentRow = {
  id: string;
  concept: string;
  amount: number;
  paymentDate: string;
  bankAccountName: string;
};

type Summary = {
  total: number;
  totalPaid: number;
  balance: number;
  paymentType: string;
};

type BankOption = { id: string; name: string };

export function ServiceOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payForm, setPayForm] = useState({
    concept: "",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [linkedSubs, setLinkedSubs] = useState<{ id: string; folio: string; description: string }[]>([]);

  async function load() {
    const [res, subsRes] = await Promise.all([
      fetch(`/api/service-orders/${id}`),
      fetch(`/api/subscriptions?serviceOrderId=${id}`),
    ]);
    if (res.status === 404) {
      router.replace("/ordenes-servicio");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setPayments(data.payments);
      setSummary(data.summary);
    }
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      setLinkedSubs(subsData.subscriptions ?? []);
    }
    setLoading(false);
  }

  async function loadBanks() {
    const [banksRes, meRes] = await Promise.all([
      fetch("/api/bank-accounts"),
      fetch("/api/auth/me"),
    ]);
    if (banksRes.ok) {
      const data = await banksRes.json();
      setBanks(data.accounts);
      if (data.accounts[0]) {
        setPayForm((f) => ({ ...f, bankAccountId: data.accounts[0].id }));
      }
    }
    if (meRes.ok) setIsAdmin((await meRes.json()).user?.role === "administrador");
  }

  useEffect(() => {
    void Promise.all([load(), loadBanks()]);
  }, [id]);

  async function setStatus(status: ServiceOrderStatus) {
    await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    });
    await load();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id, ...payForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setPayForm((f) => ({ ...f, concept: "", amount: 0 }));
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!order) return <p className="text-sm text-[var(--danger)]">Orden no encontrada</p>;

  const paymentTypeLabel =
    summary?.paymentType === "pago_total"
      ? "Pago total"
      : summary?.paymentType === "abono"
        ? "Abono"
        : "Sin pagos";

  return (
    <EntityDetailLayout
      backHref="/ordenes-servicio"
      backLabel="Órdenes de servicio"
      folio={order.folio}
      title={order.clientName}
      statusBadge={<span className="badge">{SERVICE_ORDER_STATUS_LABELS[order.status]}</span>}
      actions={
        <>
          <a
            href={`/api/service-orders/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Imprimir PDF
          </a>
          {order.status === "creada" && (
            <button type="button" className="btn btn-primary" onClick={() => void setStatus("entregada")}>
              Marcar entregada
            </button>
          )}
          {isAdmin && order.status !== "cancelada" && (
            <button type="button" className="btn btn-ghost" onClick={() => void setStatus("cancelada")}>
              Cancelar
            </button>
          )}
        </>
      }
    >
      <DetailSection title="Información">
        <DetailGrid>
          <DetailField
            label="Cliente"
            value={
              <Link href={`/clientes/${order.clientId}`} className="underline">
                {order.clientName}
              </Link>
            }
          />
          <DetailField label="Vendedor" value={order.sellerName} />
          <DetailField label="Servicio" value={order.serviceName} />
          <DetailField label="Descripción" value={order.description} />
          <DetailField label="Tipo de contrato" value={CONTRACT_TYPE_LABELS[order.contractType]} />
          {order.contractType === "suscripcion" && (
            <DetailField label="Periodicidad" value={order.periodicityName} />
          )}
          <DetailField label="Precio" value={formatMoney(order.price)} />
          <DetailField label="Condiciones de pago" value={order.paymentConditionName} />
          <DetailField
            label="Fecha de entrega"
            value={new Date(order.deliveryDate).toLocaleDateString("es-MX")}
          />
          <DetailField label="Observaciones" value={order.observations} />
          <DetailField
            label="Fecha de creación"
            value={new Date(order.createdAt).toLocaleString("es-MX")}
          />
          {order.quoteFolio && order.quoteId && (
            <DetailField
              label="Cotización"
              value={
                <Link href={`/cotizaciones/${order.quoteId}`} className="underline font-mono text-xs">
                  {order.quoteFolio}
                </Link>
              }
            />
          )}
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Pagos">
        {summary && (
          <p className="text-sm">
            Total: {formatMoney(summary.total)} · Pagado: {formatMoney(summary.totalPaid)} · Saldo:{" "}
            {formatMoney(summary.balance)} · {paymentTypeLabel}
          </p>
        )}
        <ul className="text-sm space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="border-b border-[var(--border)] pb-2">
              {p.concept} — {formatMoney(p.amount)} — {p.bankAccountName} —{" "}
              {new Date(p.paymentDate).toLocaleDateString("es-MX")}
            </li>
          ))}
          {payments.length === 0 && <li className="text-[var(--muted)]">Sin pagos registrados</li>}
        </ul>
        {order.status !== "cancelada" && (
          <form className="grid gap-2 md:grid-cols-2" onSubmit={(e) => void addPayment(e)}>
            <input
              value={payForm.concept}
              onChange={(e) => setPayForm({ ...payForm, concept: e.target.value })}
              placeholder="Concepto"
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <MoneyInput
              label="Importe (MXN)"
              valueCents={payForm.amount}
              onChangeCents={(amount) => setPayForm({ ...payForm, amount })}
              required
            />
            <select
              value={payForm.bankAccountId}
              onChange={(e) => setPayForm({ ...payForm, bankAccountId: e.target.value })}
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={payForm.paymentDate}
              onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button type="submit" className="btn btn-primary md:col-span-2">
              Registrar pago (genera ingreso)
            </button>
          </form>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </DetailSection>

      {linkedSubs.length > 0 && (
        <DetailSection title="Suscripciones vinculadas">
          <ul className="space-y-1 text-sm">
            {linkedSubs.map((s) => (
              <li key={s.id}>
                <Link href={`/suscripciones/${s.id}`} className="text-[var(--accent)] hover:underline">
                  {s.folio}
                </Link>
                {" — "}
                {s.description}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </EntityDetailLayout>
  );
}
