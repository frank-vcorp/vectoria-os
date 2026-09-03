"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoneyInput } from "@/components/money-input";
import {
  QuoteSubscriptionLinesEditor,
  QuoteSubscriptionLinesReadonly,
  type PeriodicityOption,
  type QuoteSubscriptionLineForm,
  type SubscriptionTemplateOption,
  toSubscriptionItemPayload,
} from "@/components/quote-subscription-lines";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
} from "@/components/entity-detail-layout";
import { QUOTE_STATUS_LABELS, formatMoney, type QuoteStatus } from "@/shared/commercial";

type SubscriptionItem = {
  id: string;
  subscriptionTemplateId: string;
  subscriptionTemplateName: string;
  description: string;
  price: number;
  periodicityId: string;
  periodicityName: string;
};

type QuoteDetail = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  opportunityId: string | null;
  opportunityFolio: string | null;
  serviceOrderId: string | null;
  serviceOrderFolio: string | null;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  price: number;
  deliveryTime: string;
  paymentConditionId: string;
  paymentConditionName: string | null;
  observations: string | null;
  status: QuoteStatus;
  createdAt: string;
  subscriptionItems: SubscriptionItem[];
};

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string };
type CatalogOption = { id: string; name: string };

function itemsToLines(items: SubscriptionItem[]): QuoteSubscriptionLineForm[] {
  return items.map((item) => ({
    key: item.id,
    subscriptionTemplateId: item.subscriptionTemplateId,
    description: item.description,
    price: item.price,
    periodicityId: item.periodicityId,
  }));
}

export function QuoteDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [subscriptionTemplates, setSubscriptionTemplates] = useState<SubscriptionTemplateOption[]>([]);
  const [periodicities, setPeriodicities] = useState<PeriodicityOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [showAuthorize, setShowAuthorize] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    description: "",
    price: 0,
    deliveryTime: "",
    paymentConditionId: "",
    observations: "",
  });
  const [subscriptionLines, setSubscriptionLines] = useState<QuoteSubscriptionLineForm[]>([]);

  async function load() {
    const res = await fetch(`/api/quotes/${id}`);
    if (res.status === 404) {
      router.replace("/cotizaciones");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setQuote(data.quote);
      setForm({
        clientId: data.quote.clientId,
        serviceId: data.quote.serviceId,
        description: data.quote.description,
        price: data.quote.price,
        deliveryTime: data.quote.deliveryTime,
        paymentConditionId: data.quote.paymentConditionId,
        observations: data.quote.observations ?? "",
      });
      setSubscriptionLines(itemsToLines(data.quote.subscriptionItems ?? []));
    }
    setLoading(false);
  }

  async function loadCatalogs() {
    const [catRes, clientsRes, meRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
      fetch("/api/clients"),
      fetch("/api/auth/me"),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setSubscriptionTemplates(data.subscriptionTemplates ?? []);
      setPeriodicities(data.periodicities ?? []);
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: CatalogOption & { status: string }) => p.status === "activo"),
      );
    }
    if (clientsRes.ok) setClients((await clientsRes.json()).clients);
    if (meRes.ok) setIsAdmin((await meRes.json()).user?.role === "administrador");
  }

  useEffect(() => {
    void Promise.all([load(), loadCatalogs()]);
  }, [id]);

  const canEdit = quote?.status === "cotizada";

  async function patchQuote(body: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return null;
    }
    return res.json();
  }

  async function onServiceChange(serviceId: string) {
    setForm((f) => ({ ...f, serviceId }));
    if (!serviceId) return;
    const res = await fetch(`/api/quotes?prefillService=${serviceId}`);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, serviceId, price: data.basePrice ?? f.price }));
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const result = await patchQuote({
      action: "update",
      id,
      ...form,
      observations: form.observations || null,
      subscriptionItems: toSubscriptionItemPayload(subscriptionLines),
    });
    if (result) {
      setEditing(false);
      await load();
    }
  }

  async function authorize(e: React.FormEvent) {
    e.preventDefault();
    if (!deliveryDate) return;
    const result = await patchQuote({ action: "authorize", id, deliveryDate });
    if (result?.order) {
      setShowAuthorize(false);
      router.push(`/ordenes-servicio/${result.order.id}`);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!quote) return <p className="text-sm text-[var(--danger)]">Cotización no encontrada</p>;

  return (
    <EntityDetailLayout
      backHref="/cotizaciones"
      backLabel="Cotizaciones"
      folio={quote.folio}
      title={quote.clientName}
      statusBadge={<span className="badge">{QUOTE_STATUS_LABELS[quote.status]}</span>}
      actions={
        <>
          <a href={`/api/quotes/${id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Imprimir PDF
          </a>
          {canEdit && !editing && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => setShowAuthorize(true)}>
                Autorizar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void patchQuote({ action: "reject", id }).then(() => load())}
              >
                Rechazar
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void patchQuote({ action: "cancel", id }).then(() => load())}
                >
                  Cancelar
                </button>
              )}
            </>
          )}
        </>
      }
    >
      {editing ? (
        <DetailSection title="Editar cotización">
          <form className="space-y-3" onSubmit={(e) => void saveEdit(e)}>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
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
              value={form.serviceId}
              onChange={(e) => void onServiceChange(e.target.value)}
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
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <MoneyInput
                label="Precio servicio principal (MXN)"
                valueCents={form.price}
                onChangeCents={(price) => setForm({ ...form, price })}
                required
              />
              <label className="text-sm block">
                <span className="text-[var(--muted)]">Tiempo de entrega</span>
                <input
                  type="text"
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
                {paymentConditions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="Observaciones"
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <QuoteSubscriptionLinesEditor
              lines={subscriptionLines}
              onChange={setSubscriptionLines}
              templates={subscriptionTemplates}
              periodicities={periodicities}
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
        <>
          <DetailSection title="Servicio principal">
            <DetailGrid>
              <DetailField
                label="Cliente"
                value={
                  <Link href={`/clientes/${quote.clientId}`} className="underline">
                    {quote.clientName}
                  </Link>
                }
              />
              <DetailField label="Vendedor" value={quote.sellerName} />
              <DetailField label="Servicio" value={quote.serviceName} />
              <DetailField label="Descripción" value={quote.description} />
              <DetailField label="Precio" value={formatMoney(quote.price)} />
              <DetailField label="Tiempo de entrega" value={quote.deliveryTime} />
              <DetailField label="Condiciones de pago" value={quote.paymentConditionName} />
              <DetailField label="Observaciones" value={quote.observations} />
              <DetailField label="Fecha" value={new Date(quote.createdAt).toLocaleString("es-MX")} />
              {quote.opportunityFolio && quote.opportunityId && (
                <DetailField
                  label="Oportunidad"
                  value={
                    <Link href={`/oportunidades/${quote.opportunityId}`} className="underline font-mono text-xs">
                      {quote.opportunityFolio}
                    </Link>
                  }
                />
              )}
              {quote.serviceOrderFolio && quote.serviceOrderId && (
                <DetailField
                  label="Orden de servicio"
                  value={
                    <Link href={`/ordenes-servicio/${quote.serviceOrderId}`} className="underline font-mono text-xs">
                      {quote.serviceOrderFolio}
                    </Link>
                  }
                />
              )}
            </DetailGrid>
          </DetailSection>
          <QuoteSubscriptionLinesReadonly items={quote.subscriptionItems} />
        </>
      )}

      {error && !editing && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {showAuthorize && (
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
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAuthorize(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Autorizar y crear OS
              </button>
            </div>
          </form>
        </div>
      )}
    </EntityDetailLayout>
  );
}
