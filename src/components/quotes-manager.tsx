"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuickAddClient } from "@/components/quick-add-client";
import { MoneyInput } from "@/components/money-input";
import {
  QUOTE_STATUS_LABELS,
  formatMoney,
  type QuoteStatus,
} from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = {
  id: string;
  name: string;
  basePrice: number;
};
type CatalogOption = { id: string; name: string };

type QuoteRow = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  opportunityId: string | null;
  opportunityFolio: string | null;
  serviceOrderId: string | null;
  serviceOrderFolio: string | null;
  serviceName: string;
  price: number;
  deliveryTime: string;
  status: QuoteStatus;
};

export function QuotesManager() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [periodicities, setPeriodicities] = useState<CatalogOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorizeId, setAuthorizeId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");

  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    description: "",
    contractType: "por_evento" as "por_evento" | "suscripcion",
    periodicityId: "",
    price: 0,
    deliveryTime: "",
    paymentConditionId: "",
    observations: "",
  });

  async function loadCatalogs() {
    const [catRes, meRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
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
    if (meRes.ok) {
      const me = await meRes.json();
      setIsAdmin(me.user?.role === "administrador");
    }
  }

  async function loadClients() {
    const res = await fetch("/api/clients");
    if (res.ok) setClients((await res.json()).clients);
  }

  async function loadQuotes() {
    const res = await fetch("/api/quotes");
    if (res.ok) setQuotes((await res.json()).quotes);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([loadCatalogs(), loadClients(), loadQuotes()]);
  }, []);

  async function handleQuickAddClient(client: { id: string }) {
    await loadClients();
    setForm((f) => ({ ...f, clientId: client.id }));
  }

  async function onServiceChange(serviceId: string) {
    setForm((f) => ({ ...f, serviceId }));
    if (!serviceId) return;
    const res = await fetch(`/api/quotes?prefillService=${serviceId}`);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({
        ...f,
        serviceId,
        price: data.basePrice ?? 0,
      }));
    }
  }

  async function createDirect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "direct", ...form, observations: form.observations || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error");
      return;
    }
    setForm({
      clientId: "",
      serviceId: "",
      description: "",
      contractType: "por_evento",
      periodicityId: "",
      price: 0,
      deliveryTime: "",
      paymentConditionId: "",
      observations: "",
    });
    await loadQuotes();
  }

  async function patchQuote(body: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error");
      return false;
    }
    await loadQuotes();
    return true;
  }

  async function authorize(e: React.FormEvent) {
    e.preventDefault();
    if (!authorizeId || !deliveryDate) return;
    const ok = await patchQuote({ action: "authorize", id: authorizeId, deliveryDate });
    if (ok) {
      setAuthorizeId(null);
      setDeliveryDate("");
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form className="card space-y-3" onSubmit={(e) => void createDirect(e)}>
        <h2 className="font-medium">Nueva cotización directa</h2>
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
            value={form.deliveryTime}
            onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
            placeholder="Tiempo de entrega *"
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <select
            value={form.paymentConditionId}
            onChange={(e) => setForm({ ...form, paymentConditionId: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 md:col-span-2"
          >
            <option value="">Condiciones de pago…</option>
            {paymentConditions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Crear cotización
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Servicio</th>
              <th className="py-2 pr-2">Precio</th>
              <th className="py-2 pr-2">Estatus</th>
              <th className="py-2 pr-2">Relaciones</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="py-2 pr-2 font-mono text-xs">{q.folio}</td>
                <td className="py-2 pr-2">{q.clientName}</td>
                <td className="py-2 pr-2">{q.serviceName}</td>
                <td className="py-2 pr-2">{formatMoney(q.price)}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{QUOTE_STATUS_LABELS[q.status]}</span>
                </td>
                <td className="py-2 pr-2 text-xs space-y-1">
                  {q.opportunityFolio && (
                    <div>
                      OP:{" "}
                      <Link href="/oportunidades" className="underline">
                        {q.opportunityFolio}
                      </Link>
                    </div>
                  )}
                  {q.serviceOrderFolio && (
                    <div>
                      OS:{" "}
                      <Link href="/ordenes-servicio" className="underline">
                        {q.serviceOrderFolio}
                      </Link>
                    </div>
                  )}
                </td>
                <td className="py-2 flex flex-wrap gap-1">
                  <a
                    href={`/api/quotes/${q.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost text-xs"
                  >
                    PDF
                  </a>
                  {q.status === "cotizada" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        onClick={() => setAuthorizeId(q.id)}
                      >
                        Autorizar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => void patchQuote({ action: "reject", id: q.id })}
                      >
                        Rechazar
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-ghost text-xs"
                          onClick={() => void patchQuote({ action: "cancel", id: q.id })}
                        >
                          Cancelar
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {authorizeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form className="card max-w-md w-full space-y-3" onSubmit={(e) => void authorize(e)}>
            <h3 className="font-medium">Autorizar cotización → crear OS</h3>
            <p className="text-sm text-[var(--muted)]">Indica la fecha de entrega para la Orden de Servicio.</p>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => setAuthorizeId(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Autorizar y crear OS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
