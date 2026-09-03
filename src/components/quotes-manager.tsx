"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickAddClient } from "@/components/quick-add-client";
import { MoneyInput } from "@/components/money-input";
import { QUOTE_STATUS_LABELS, formatMoney, type QuoteStatus } from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string };
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
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [periodicities, setPeriodicities] = useState<CatalogOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const res = await fetch("/api/catalogs?type=all");
    if (res.ok) {
      const data = await res.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setPeriodicities(data.periodicities ?? []);
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: CatalogOption & { status: string }) => p.status === "activo"),
      );
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

  async function createDirect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "direct", ...form, observations: form.observations || null }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    router.push(`/cotizaciones/${data.quote.id}`);
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
          onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
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
            label="Precio (MXN)"
            valueCents={form.price}
            onChangeCents={(price) => setForm({ ...form, price })}
            required
          />
          <label className="text-sm block">
            <span className="text-[var(--muted)]">Fecha de entrega</span>
            <input
              type="date"
              value={form.deliveryTime}
              onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
              required
              className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
          </label>
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
                <td className="py-2 pr-2 font-mono text-xs">
                  <Link href={`/cotizaciones/${q.id}`} className="underline">
                    {q.folio}
                  </Link>
                </td>
                <td className="py-2 pr-2">
                  <Link href={`/clientes/${q.clientId}`} className="underline">
                    {q.clientName}
                  </Link>
                </td>
                <td className="py-2 pr-2">{q.serviceName}</td>
                <td className="py-2 pr-2">{formatMoney(q.price)}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{QUOTE_STATUS_LABELS[q.status]}</span>
                </td>
                <td className="py-2 pr-2 text-xs space-y-1">
                  {q.opportunityFolio && q.opportunityId && (
                    <div>
                      OP:{" "}
                      <Link href={`/oportunidades/${q.opportunityId}`} className="underline">
                        {q.opportunityFolio}
                      </Link>
                    </div>
                  )}
                  {q.serviceOrderFolio && q.serviceOrderId && (
                    <div>
                      OS:{" "}
                      <Link href={`/ordenes-servicio/${q.serviceOrderId}`} className="underline">
                        {q.serviceOrderFolio}
                      </Link>
                    </div>
                  )}
                </td>
                <td className="py-2">
                  <Link href={`/cotizaciones/${q.id}`} className="btn btn-ghost text-xs">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
