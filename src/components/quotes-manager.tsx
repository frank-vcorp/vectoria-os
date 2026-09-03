"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickAddClient } from "@/components/quick-add-client";
import { FormField, FormPanel } from "@/components/form-panel";
import { MoneyInput } from "@/components/money-input";
import {
  QuoteSubscriptionLinesEditor,
  type PeriodicityOption,
  type QuoteSubscriptionLineForm,
  type SubscriptionTemplateOption,
  toSubscriptionItemPayload,
} from "@/components/quote-subscription-lines";
import { ListSearchInput } from "@/components/list-search-input";
import { SearchableSelect } from "@/components/searchable-select";
import {
  QUOTE_STATUS_LABELS,
  formatMoney,
  type QuoteStatus,
} from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string; basePrice?: number };
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
  const [subscriptionTemplates, setSubscriptionTemplates] = useState<SubscriptionTemplateOption[]>([]);
  const [periodicities, setPeriodicities] = useState<PeriodicityOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  async function loadCatalogs() {
    const res = await fetch("/api/catalogs?type=all");
    if (res.ok) {
      const data = await res.json();
      setServices(
        (data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"),
      );
      setSubscriptionTemplates(data.subscriptionTemplates ?? []);
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

  async function loadQuotes(q = search) {
    const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
    const res = await fetch(`/api/quotes${params}`);
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
      setForm((f) => ({ ...f, serviceId, price: data.basePrice ?? f.price }));
    }
  }

  async function createDirect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "direct",
        ...form,
        observations: form.observations || null,
        subscriptionItems: toSubscriptionItemPayload(subscriptionLines),
      }),
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
      <form onSubmit={(e) => void createDirect(e)}>
        <FormPanel
          title="Nueva cotización directa"
          description="Crea una cotización sin pasar por oportunidad."
          actions={
            <button type="submit" className="btn btn-primary">
              Crear cotización
            </button>
          }
        >
          <FormField label="Cliente *">
            <SearchableSelect
              className="w-full"
              value={form.clientId}
              onChange={(clientId) => setForm({ ...form, clientId })}
              required
              placeholder="Seleccionar…"
              options={clients.map((c) => ({
                value: c.id,
                label: `${c.folio} — ${c.name}`,
                keywords: `${c.folio} ${c.name}`,
              }))}
            />
          </FormField>
          <QuickAddClient onCreated={handleQuickAddClient} />
          <FormField label="Servicio principal *">
            <SearchableSelect
              className="w-full"
              value={form.serviceId}
              onChange={(serviceId) => void onServiceChange(serviceId)}
              required
              placeholder="Seleccionar…"
              options={services.map((s) => ({ value: s.id, label: s.name }))}
            />
          </FormField>
          <FormField label="Descripción *">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={2}
            />
          </FormField>
          <div className="form-grid cols-2">
            <MoneyInput
              label="Precio servicio principal (MXN)"
              valueCents={form.price}
              onChangeCents={(price) => setForm({ ...form, price })}
              required
            />
            <FormField label="Tiempo de entrega *">
              <input
                type="text"
                placeholder="Ej. 15 días hábiles"
                value={form.deliveryTime}
                onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Condiciones de pago *" className="md:col-span-2">
              <SearchableSelect
                className="w-full"
                value={form.paymentConditionId}
                onChange={(paymentConditionId) => setForm({ ...form, paymentConditionId })}
                required
                placeholder="Seleccionar…"
                options={paymentConditions.map((p) => ({ value: p.id, label: p.name }))}
              />
            </FormField>
          </div>
          <FormField label="Observaciones">
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={2}
            />
          </FormField>
          <QuoteSubscriptionLinesEditor
            lines={subscriptionLines}
            onChange={setSubscriptionLines}
            templates={subscriptionTemplates}
            periodicities={periodicities}
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </FormPanel>
      </form>

      <div className="card space-y-3 overflow-x-auto">
        <ListSearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => {
            setLoading(true);
            void loadQuotes(search);
          }}
        />
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
