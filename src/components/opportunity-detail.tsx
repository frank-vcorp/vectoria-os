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
  RelatedTable,
} from "@/components/entity-detail-layout";
import {
  OPPORTUNITY_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  formatMoney,
  type OpportunityStatus,
} from "@/shared/commercial";

type OpportunityDetail = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  clientFolio: string;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
};

type LogEntry = { id: string; note: string; userName: string | null; createdAt: string };
type QuoteSummary = { id: string; folio: string; status: string; price: number; createdAt: string };

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string };
type PaymentOption = { id: string; name: string };
type PeriodicityOption = { id: string; name: string };

export function OpportunityDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<PaymentOption[]>([]);
  const [periodicities, setPeriodicities] = useState<PeriodicityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [logNote, setLogNote] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const [editForm, setEditForm] = useState({ clientId: "", serviceId: "", description: "" });
  const [quoteForm, setQuoteForm] = useState({
    deliveryTime: "",
    paymentConditionId: "",
    price: 0,
    contractType: "por_evento" as "por_evento" | "suscripcion",
    periodicityId: "",
    observations: "",
  });

  async function load() {
    const res = await fetch(`/api/opportunities/${id}`);
    if (res.status === 404) {
      router.replace("/oportunidades");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setOpportunity(data.opportunity);
      setLog(data.log);
      setQuotes(data.quotes);
      setEditForm({
        clientId: data.opportunity.clientId,
        serviceId: data.opportunity.serviceId,
        description: data.opportunity.description,
      });
    }
    setLoading(false);
  }

  async function loadCatalogs() {
    const [catRes, clientsRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
      fetch("/api/clients"),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: PaymentOption & { status: string }) => p.status === "activo"),
      );
      setPeriodicities(data.periodicities ?? []);
      if (data.paymentConditions?.[0]) {
        setQuoteForm((f) => ({ ...f, paymentConditionId: data.paymentConditions[0].id }));
      }
    }
    if (clientsRes.ok) setClients((await clientsRes.json()).clients);
  }

  useEffect(() => {
    void Promise.all([load(), loadCatalogs()]);
  }, [id]);

  const canEdit = opportunity?.status === "abierta";

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, ...editForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setEditing(false);
    await load();
  }

  async function setStatus(status: OpportunityStatus) {
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, status }),
    });
    await load();
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logNote.trim()) return;
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", id, note: logNote }),
    });
    setLogNote("");
    await load();
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: id,
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
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    setShowQuote(false);
    router.push(`/cotizaciones/${data.quote.id}`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!opportunity) return <p className="text-sm text-[var(--danger)]">Oportunidad no encontrada</p>;

  return (
    <EntityDetailLayout
      backHref="/oportunidades"
      backLabel="Oportunidades"
      folio={opportunity.folio}
      title={opportunity.clientName}
      statusBadge={<span className="badge">{OPPORTUNITY_STATUS_LABELS[opportunity.status]}</span>}
      actions={
        <>
          {canEdit && !editing && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => setShowQuote(true)}>
                Cotizar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void setStatus("no_interesado")}
              >
                No interesado
              </button>
            </>
          )}
        </>
      }
    >
      {editing ? (
        <DetailSection title="Editar oportunidad">
          <form className="space-y-3" onSubmit={(e) => void saveEdit(e)}>
            <select
              value={editForm.clientId}
              onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.folio} — {c.name}
                </option>
              ))}
            </select>
            <select
              value={editForm.serviceId}
              onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value })}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              required
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </DetailSection>
      ) : (
        <DetailSection title="Información">
          <DetailGrid>
            <DetailField
              label="Cliente"
              value={
                <Link href={`/clientes/${opportunity.clientId}`} className="underline">
                  {opportunity.clientFolio} — {opportunity.clientName}
                </Link>
              }
            />
            <DetailField label="Vendedor" value={opportunity.sellerName} />
            <DetailField label="Servicio" value={opportunity.serviceName} />
            <DetailField
              label="Fecha"
              value={new Date(opportunity.createdAt).toLocaleString("es-MX")}
            />
            <DetailField label="Descripción" value={opportunity.description} />
          </DetailGrid>
        </DetailSection>
      )}

      <DetailSection title="Bitácora">
        <ul className="space-y-2 text-sm">
          {log.map((e) => (
            <li key={e.id} className="border-b border-[var(--border)] pb-2">
              <p>{e.note}</p>
              <p className="text-xs text-[var(--muted)]">
                {e.userName ?? "—"} · {new Date(e.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {log.length === 0 && <p className="text-[var(--muted)]">Sin entradas</p>}
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
      </DetailSection>

      <DetailSection title="Cotizaciones generadas">
        <RelatedTable
          emptyMessage="Sin cotizaciones"
          columns={[
            { key: "folio", label: "Folio" },
            { key: "price", label: "Precio" },
            { key: "status", label: "Estatus" },
            { key: "date", label: "Fecha" },
          ]}
          rows={quotes.map((q) => ({
            id: q.id,
            cells: {
              folio: (
                <Link href={`/cotizaciones/${q.id}`} className="underline font-mono text-xs">
                  {q.folio}
                </Link>
              ),
              price: formatMoney(q.price),
              status: QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS] ?? q.status,
              date: new Date(q.createdAt).toLocaleDateString("es-MX"),
            },
          }))}
        />
      </DetailSection>

      {showQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form className="card max-w-lg w-full space-y-3" onSubmit={(e) => void createQuote(e)}>
            <h3 className="font-medium">Crear cotización</h3>
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
            <MoneyInput
              label="Precio (MXN)"
              valueCents={quoteForm.price}
              onChangeCents={(price) => setQuoteForm({ ...quoteForm, price })}
              required
            />
            <label className="text-sm block">
              <span className="text-[var(--muted)]">Fecha de entrega</span>
              <input
                type="date"
                value={quoteForm.deliveryTime}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })}
                required
                className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
            </label>
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
              <button type="button" className="btn btn-ghost" onClick={() => setShowQuote(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Crear cotización
              </button>
            </div>
          </form>
        </div>
      )}
    </EntityDetailLayout>
  );
}
