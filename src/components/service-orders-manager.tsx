"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { QuickAddClient } from "@/components/quick-add-client";
import { MoneyInput } from "@/components/money-input";
import {
  SERVICE_ORDER_STATUS_LABELS,
  formatMoney,
  type ServiceOrderStatus,
} from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = {
  id: string;
  name: string;
  basePrice: number;
};
type CatalogOption = { id: string; name: string };
type BankOption = { id: string; name: string };

type OrderRow = {
  id: string;
  folio: string;
  clientName: string;
  quoteFolio: string | null;
  serviceName: string;
  price: number;
  deliveryDate: string;
  status: ServiceOrderStatus;
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

export function ServiceOrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [periodicities, setPeriodicities] = useState<CatalogOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    description: "",
    contractType: "por_evento" as "por_evento" | "suscripcion",
    periodicityId: "",
    price: 0,
    paymentConditionId: "",
    deliveryDate: "",
    observations: "",
  });

  const [payForm, setPayForm] = useState({
    concept: "",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  async function loadAll() {
    const [catRes, clientsRes, ordersRes, banksRes, meRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
      fetch("/api/clients"),
      fetch("/api/service-orders"),
      fetch("/api/bank-accounts"),
      fetch("/api/auth/me"),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setPeriodicities(data.periodicities ?? []);
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: CatalogOption & { status: string }) => p.status === "activo"),
      );
    }
    if (clientsRes.ok) setClients((await clientsRes.json()).clients);
    if (ordersRes.ok) setOrders((await ordersRes.json()).orders);
    if (banksRes.ok) {
      const data = await banksRes.json();
      setBanks(data.accounts);
      if (data.accounts[0]) setPayForm((f) => ({ ...f, bankAccountId: data.accounts[0].id }));
    }
    if (meRes.ok) setIsAdmin((await meRes.json()).user?.role === "administrador");
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function handleQuickAddClient(client: { id: string }) {
    await loadAll();
    setForm((f) => ({ ...f, clientId: client.id }));
  }

  async function onServiceChange(serviceId: string) {
    setForm((f) => ({ ...f, serviceId }));
    if (!serviceId) return;
    const res = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prefill_service", serviceId }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({
        ...f,
        serviceId,
        price: data.basePrice ?? 0,
      }));
    }
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, observations: form.observations || null }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setForm({
      clientId: "",
      serviceId: "",
      description: "",
      contractType: "por_evento",
      periodicityId: "",
      price: 0,
      paymentConditionId: "",
      deliveryDate: "",
      observations: "",
    });
    await loadAll();
  }

  async function expandOrder(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const res = await fetch(`/api/service-orders?paymentsFor=${id}`);
    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
      setSummary(data.summary);
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!expandedId) return;
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "payment",
        id: expandedId,
        ...payForm,
        amount: payForm.amount,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    setSummary(data.summary);
    setPayForm((f) => ({ ...f, concept: "", amount: 0 }));
    await expandOrder(expandedId);
    await loadAll();
  }

  async function setStatus(id: string, status: ServiceOrderStatus) {
    await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    });
    await loadAll();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form className="card space-y-3" onSubmit={(e) => void createOrder(e)}>
        <h2 className="font-medium">Nueva OS directa</h2>
        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          required
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        >
          <option value="">Cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.folio} — {c.name}
            </option>
          ))}
        </select>
        <QuickAddClient onCreated={handleQuickAddClient} />
        <select
          value={form.serviceId}
          onChange={(e) => void onServiceChange(e.target.value)}
          required
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        >
          <option value="">Servicio…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción *"
          required
          rows={2}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
        <div className="grid gap-2 md:grid-cols-2">
          <select
            value={form.contractType}
            onChange={(e) =>
              setForm({ ...form, contractType: e.target.value as "por_evento" | "suscripcion" })
            }
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          >
            <option value="por_evento">Por evento</option>
            <option value="suscripcion">Suscripción</option>
          </select>
          {form.contractType === "suscripcion" && (
            <select
              value={form.periodicityId}
              onChange={(e) => setForm({ ...form, periodicityId: e.target.value })}
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="">Periodicidad…</option>
              {periodicities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <MoneyInput
            label="Precio"
            valueCents={form.price}
            onChangeCents={(price) => setForm({ ...form, price })}
            required
          />
          <input
            type="date"
            value={form.deliveryDate}
            onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <select
            value={form.paymentConditionId}
            onChange={(e) => setForm({ ...form, paymentConditionId: e.target.value })}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 md:col-span-2"
          >
            <option value="">Condiciones de pago (opcional)</option>
            {paymentConditions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {error && !expandedId && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Crear OS
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Cotización</th>
              <th className="py-2 pr-2">Precio</th>
              <th className="py-2 pr-2">Entrega</th>
              <th className="py-2 pr-2">Estatus</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <Fragment key={o.id}>
                <tr className="border-b border-[var(--border)] align-top">
                  <td className="py-2 pr-2 font-mono text-xs">{o.folio}</td>
                  <td className="py-2 pr-2">{o.clientName}</td>
                  <td className="py-2 pr-2">
                    {o.quoteFolio ? (
                      <Link href="/cotizaciones" className="underline">
                        {o.quoteFolio}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-2">{formatMoney(o.price)}</td>
                  <td className="py-2 pr-2">{new Date(o.deliveryDate).toLocaleDateString("es-MX")}</td>
                  <td className="py-2 pr-2">
                    <span className="badge">{SERVICE_ORDER_STATUS_LABELS[o.status]}</span>
                  </td>
                  <td className="py-2 flex flex-wrap gap-1">
                    <a
                      href={`/api/service-orders/${o.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost text-xs"
                    >
                      PDF
                    </a>
                    <button type="button" className="btn btn-ghost text-xs" onClick={() => void expandOrder(o.id)}>
                      Pagos
                    </button>
                    {o.status === "creada" && (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => void setStatus(o.id, "entregada")}
                      >
                        Entregada
                      </button>
                    )}
                    {isAdmin && o.status !== "cancelada" && (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => void setStatus(o.id, "cancelada")}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === o.id && summary && (
                  <tr key={`${o.id}-pay`}>
                    <td colSpan={7} className="py-3 bg-[var(--surface-2)]">
                      <div className="space-y-3 px-2">
                        <p className="text-sm">
                          Total: {formatMoney(summary.total)} · Pagado: {formatMoney(summary.totalPaid)} · Saldo:{" "}
                          {formatMoney(summary.balance)} ·{" "}
                          {summary.paymentType === "pago_total"
                            ? "Pago total"
                            : summary.paymentType === "abono"
                              ? "Abono"
                              : "Sin pagos"}
                        </p>
                        <ul className="text-sm space-y-1">
                          {payments.map((p) => (
                            <li key={p.id}>
                              {p.concept} — {formatMoney(p.amount)} — {p.bankAccountName} —{" "}
                              {new Date(p.paymentDate).toLocaleDateString("es-MX")}
                            </li>
                          ))}
                          {payments.length === 0 && <li className="text-[var(--muted)]">Sin pagos</li>}
                        </ul>
                        {o.status !== "cancelada" && (
                          <form className="grid gap-2 md:grid-cols-4" onSubmit={(e) => void addPayment(e)}>
                            <input
                              value={payForm.concept}
                              onChange={(e) => setPayForm({ ...payForm, concept: e.target.value })}
                              placeholder="Concepto"
                              required
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
                            />
                            <MoneyInput
                              label="Importe"
                              valueCents={payForm.amount}
                              onChangeCents={(amount) => setPayForm({ ...payForm, amount })}
                              required
                            />
                            <select
                              value={payForm.bankAccountId}
                              onChange={(e) => setPayForm({ ...payForm, bankAccountId: e.target.value })}
                              required
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
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
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
                            />
                            <button type="submit" className="btn btn-primary md:col-span-4">
                              Registrar pago (genera ingreso)
                            </button>
                          </form>
                        )}
                        {error && expandedId === o.id && (
                          <p className="text-sm text-[var(--danger)]">{error}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
