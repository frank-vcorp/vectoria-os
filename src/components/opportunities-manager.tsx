"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuickAddField } from "@/components/quick-add-field";
import { OPPORTUNITY_STATUS_LABELS, type OpportunityStatus } from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = {
  id: string;
  name: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId: string | null;
  basePrice: number;
};
type PeriodicityOption = { id: string; name: string };
type PaymentOption = { id: string; name: string };

type OpportunityRow = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
};

type LogEntry = { id: string; note: string; userName: string | null; createdAt: string };

const STATUS_LABELS = OPPORTUNITY_STATUS_LABELS;

export function OpportunitiesManager() {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [periodicities, setPeriodicities] = useState<PeriodicityOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ clientId: "", serviceId: "", description: "" });

  const [logFor, setLogFor] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logNote, setLogNote] = useState("");

  const [quoteFor, setQuoteFor] = useState<OpportunityRow | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    deliveryTime: "",
    paymentConditionId: "",
    price: 0,
    contractType: "por_evento" as "por_evento" | "suscripcion",
    periodicityId: "",
    observations: "",
  });

  async function loadCatalogs() {
    const res = await fetch("/api/catalogs?type=all");
    if (!res.ok) return;
    const data = await res.json();
    setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
    setPeriodicities(data.periodicities ?? []);
    setPaymentConditions(
      (data.paymentConditions ?? []).filter((p: PaymentOption & { status: string }) => p.status === "activo"),
    );
  }

  async function loadClients() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
    }
  }

  async function loadOpportunities() {
    const res = await fetch("/api/opportunities");
    if (res.ok) {
      const data = await res.json();
      setOpportunities(data.opportunities);
    }
    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([loadCatalogs(), loadClients(), loadOpportunities()]);
  }, []);

  async function quickAddClient(name: string) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("No se pudo crear el cliente");
    const { client } = await res.json();
    await loadClients();
    setForm((f) => ({ ...f, clientId: client.id }));
  }

  async function createOpportunity(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear");
      return;
    }
    setForm({ clientId: "", serviceId: "", description: "" });
    await loadOpportunities();
  }

  async function setStatus(id: string, status: OpportunityStatus) {
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, status }),
    });
    await loadOpportunities();
  }

  async function openLog(opp: OpportunityRow) {
    setLogFor(opp.id);
    const res = await fetch(`/api/opportunities?logFor=${opp.id}`);
    if (res.ok) {
      const data = await res.json();
      setLogEntries(data.log);
    }
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logFor || !logNote.trim()) return;
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", id: logFor, note: logNote }),
    });
    setLogNote("");
    await openLog({ id: logFor } as OpportunityRow);
  }

  async function openQuoteModal(opp: OpportunityRow) {
    setError("");
    const res = await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prefill_quote", id: opp.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error");
      return;
    }
    const { service } = await res.json();
    setQuoteFor(opp);
    setQuoteForm({
      deliveryTime: "",
      paymentConditionId: paymentConditions[0]?.id ?? "",
      price: service?.basePrice ?? 0,
      contractType: service?.contractType ?? "por_evento",
      periodicityId: service?.periodicityId ?? "",
      observations: "",
    });
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!quoteFor) return;
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: quoteFor.id,
        deliveryTime: quoteForm.deliveryTime,
        paymentConditionId: quoteForm.paymentConditionId,
        price: quoteForm.price,
        contractType: quoteForm.contractType,
        periodicityId:
          quoteForm.contractType === "suscripcion" ? quoteForm.periodicityId || null : null,
        observations: quoteForm.observations || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear cotización");
      return;
    }
    setQuoteFor(null);
    await loadOpportunities();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form className="card space-y-3" onSubmit={(e) => void createOpportunity(e)}>
        <h2 className="font-medium">Nueva oportunidad</h2>
        <div className="space-y-2">
          <label className="text-sm block">
            <span className="text-[var(--muted)]">Cliente</span>
            <div className="flex gap-2 mt-1">
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.folio} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <QuickAddField placeholder="Carga rápida: nombre del cliente" onAdd={quickAddClient} />
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
            placeholder="Descripción *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={3}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
        <p className="text-xs text-[var(--muted)]">El vendedor se asigna automáticamente al usuario que crea la oportunidad.</p>
        {error && !quoteFor && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Crear oportunidad
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Servicio</th>
              <th className="py-2 pr-2">Vendedor</th>
              <th className="py-2 pr-2">Estatus</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="py-2 pr-2 font-mono text-xs">{o.folio}</td>
                <td className="py-2 pr-2">{o.clientName}</td>
                <td className="py-2 pr-2 max-w-xs truncate" title={o.description}>
                  {o.serviceName}
                </td>
                <td className="py-2 pr-2">{o.sellerName}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{STATUS_LABELS[o.status]}</span>
                </td>
                <td className="py-2 flex flex-wrap gap-1">
                  {o.status === "abierta" && (
                    <>
                      <button type="button" className="btn btn-primary text-xs" onClick={() => void openQuoteModal(o)}>
                        Cotizar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => void setStatus(o.id, "no_interesado")}
                      >
                        No interesado
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-ghost text-xs" onClick={() => void openLog(o)}>
                    Bitácora
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logFor && (
        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Bitácora</h3>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setLogFor(null)}>
              Cerrar
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {logEntries.map((e) => (
              <li key={e.id} className="border-b border-[var(--border)] pb-2">
                <p>{e.note}</p>
                <p className="text-xs text-[var(--muted)]">
                  {e.userName ?? "—"} · {new Date(e.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {logEntries.length === 0 && <p className="text-[var(--muted)]">Sin entradas</p>}
          </ul>
          <form className="flex gap-2" onSubmit={(e) => void addLog(e)}>
            <input
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="Nueva nota…"
              required
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button type="submit" className="btn btn-primary">
              Agregar
            </button>
          </form>
        </div>
      )}

      {quoteFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form className="card max-w-lg w-full space-y-3" onSubmit={(e) => void createQuote(e)}>
            <h3 className="font-medium">Crear cotización desde {quoteFor.folio}</h3>
            <p className="text-sm text-[var(--muted)]">
              Heredado: {quoteFor.clientName} · {quoteFor.serviceName} · {quoteFor.description}
            </p>
            <select
              value={quoteForm.contractType}
              onChange={(e) =>
                setQuoteForm({
                  ...quoteForm,
                  contractType: e.target.value as "por_evento" | "suscripcion",
                })
              }
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="por_evento">Por evento</option>
              <option value="suscripcion">Suscripción</option>
            </select>
            {quoteForm.contractType === "suscripcion" && (
              <select
                value={quoteForm.periodicityId}
                onChange={(e) => setQuoteForm({ ...quoteForm, periodicityId: e.target.value })}
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <option value="">Periodicidad…</option>
                {periodicities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="number"
              min={0}
              value={quoteForm.price}
              onChange={(e) => setQuoteForm({ ...quoteForm, price: Number(e.target.value) })}
              placeholder="Precio"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <input
              value={quoteForm.deliveryTime}
              onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })}
              placeholder="Tiempo de entrega *"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <select
              value={quoteForm.paymentConditionId}
              onChange={(e) => setQuoteForm({ ...quoteForm, paymentConditionId: e.target.value })}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="">Condiciones de pago…</option>
              {paymentConditions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <textarea
              value={quoteForm.observations}
              onChange={(e) => setQuoteForm({ ...quoteForm, observations: e.target.value })}
              placeholder="Observaciones (opcional)"
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => setQuoteFor(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Crear cotización
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="text-sm text-[var(--muted)]">
        Cotizaciones creadas:{" "}
        <Link href="/cotizaciones" className="underline">
          ver listado
        </Link>
      </p>
    </div>
  );
}
