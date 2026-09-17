"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField, FormSectionBlock } from "@/components/form-panel";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { QuoteClientPreview } from "@/components/quote-client-preview";
import { QuoteCommercialFields } from "@/components/quote-commercial-fields";
import { SearchableSelect } from "@/components/searchable-select";
import type { ClientFiscalData } from "@/shared/commercial";
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
import { SURVEY_OPERATION_LABELS, SURVEY_STATUS_LABELS, type SurveyOperationType, type SurveyStatus } from "@/shared/surveys";

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
  clientFolio?: string | null;
  clientContact?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientFiscalData?: ClientFiscalData | null;
  opportunityId: string | null;
  opportunityFolio: string | null;
  serviceOrderId: string | null;
  serviceOrderFolio: string | null;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  price: number;
  deliveryTimeId: string | null;
  deliveryTime: string;
  paymentConditionId: string;
  paymentConditionName: string | null;
  termsConditionId: string | null;
  termsConditionName: string | null;
  termsText: string | null;
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
  const [deliveryTimes, setDeliveryTimes] = useState<CatalogOption[]>([]);
  const [termsConditions, setTermsConditions] = useState<{ id: string; name: string; body?: string | null }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [showAuthorize, setShowAuthorize] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [programmerId, setProgrammerId] = useState("");
  const [programmers, setProgrammers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    description: "",
    price: 0,
    deliveryTimeId: "",
    paymentConditionId: "",
    termsConditionId: "",
    observations: "",
  });
  const [subscriptionLines, setSubscriptionLines] = useState<QuoteSubscriptionLineForm[]>([]);
  const [surveys, setSurveys] = useState<
    { id: string; folio: string; operationType: SurveyOperationType; status: SurveyStatus }[]
  >([]);

  async function load() {
    setError("");
    const res = await fetch(`/api/quotes/${id}`);
    if (res.status === 404) {
      router.replace("/cotizaciones");
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? `No se pudo cargar la cotización (${res.status})`);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setQuote(data.quote);
      setSendEmail(data.quote.clientEmail ?? "");
      setForm({
        clientId: data.quote.clientId,
        serviceId: data.quote.serviceId,
        description: data.quote.description,
        price: data.quote.price,
        deliveryTimeId: data.quote.deliveryTimeId ?? "",
        paymentConditionId: data.quote.paymentConditionId,
        termsConditionId: data.quote.termsConditionId ?? "",
        observations: data.quote.observations ?? "",
      });
      setSubscriptionLines(itemsToLines(data.quote.subscriptionItems ?? []));
      const surveyRes = await fetch(`/api/surveys?quoteId=${id}`);
      if (surveyRes.ok) setSurveys((await surveyRes.json()).surveys ?? []);
    }
    setLoading(false);
  }

  async function loadCatalogs() {
    const [catRes, clientsRes, meRes, progRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
      fetch("/api/clients"),
      fetch("/api/auth/me"),
      fetch("/api/service-orders?programmers=1"),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setSubscriptionTemplates(data.subscriptionTemplates ?? []);
      setPeriodicities(data.periodicities ?? []);
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: CatalogOption & { status: string }) => p.status === "activo"),
      );
      setDeliveryTimes(
        (data.deliveryTimes ?? []).filter((d: CatalogOption & { status: string }) => d.status === "activo"),
      );
      setTermsConditions(
        (data.termsConditions ?? []).filter((t: { status: string }) => t.status === "activo"),
      );
    }
    if (clientsRes.ok) setClients((await clientsRes.json()).clients);
    if (meRes.ok) setIsAdmin((await meRes.json()).user?.role === "administrador");
    if (progRes.ok) setProgrammers((await progRes.json()).programmers ?? []);
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
    if (!deliveryDate || !programmerId) return;
    const result = await patchQuote({ action: "authorize", id, deliveryDate, programmerId });
    if (result?.order) {
      setShowAuthorize(false);
      router.push(`/ordenes-servicio/${result.order.id}`);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!quote) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-[var(--danger)]">
          {error || "Cotización no encontrada"}
        </p>
        <Link href="/cotizaciones" className="text-sm text-[var(--accent)] hover:underline">
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  return (
    <EntityDetailLayout
      backHref="/cotizaciones"
      backLabel="Cotizaciones"
      folio={quote.folio}
      title={quote.clientName}
      statusBadge={<span className="badge">{QUOTE_STATUS_LABELS[quote.status]}</span>}
      actions={
        <>
          <Link href={`/levantamientos?quoteId=${id}`} className="btn btn-ghost">
            Crear levantamiento
          </Link>
          <a href={`/api/quotes/${id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Imprimir PDF
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void patchQuote({ action: "send_pdf", id, email: sendEmail || undefined })}
          >
            Enviar PDF por correo
          </button>
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
          <form className="space-y-4" onSubmit={(e) => void saveEdit(e)}>
            <FormSectionBlock title="Cliente">
              <FormField label="Cliente *">
                <SearchableSelect
                  className="w-full"
                  value={form.clientId}
                  onChange={(clientId) => setForm({ ...form, clientId })}
                  required
                  placeholder="Cliente…"
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.folio} — ${c.name}`,
                    keywords: `${c.folio} ${c.name}`,
                  }))}
                />
              </FormField>
            </FormSectionBlock>
            <QuoteClientPreview clientId={form.clientId} />
            <FormSectionBlock title="Implementación">
              <FormField label="Servicio *">
                <SearchableSelect
                  className="w-full"
                  value={form.serviceId}
                  onChange={(serviceId) => void onServiceChange(serviceId)}
                  required
                  placeholder="Servicio…"
                  options={services.map((s) => ({ value: s.id, label: s.name }))}
                />
              </FormField>
              <FormField label="Descripción *">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                />
              </FormField>
              <MoneyInput
                label="Precio de implementación (MXN) *"
                valueCents={form.price}
                onChangeCents={(price) => setForm({ ...form, price })}
                required
              />
            </FormSectionBlock>
            <QuoteSubscriptionLinesEditor
              lines={subscriptionLines}
              onChange={setSubscriptionLines}
              templates={subscriptionTemplates}
              periodicities={periodicities}
            />
            <QuoteCommercialFields
              deliveryTimeId={form.deliveryTimeId}
              paymentConditionId={form.paymentConditionId}
              termsConditionId={form.termsConditionId}
              observations={form.observations}
              onChange={(patch) => setForm({ ...form, ...patch })}
              deliveryTimes={deliveryTimes}
              paymentConditions={paymentConditions}
              termsConditions={termsConditions}
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
          <DetailSection title="Datos del cliente">
            <DetailGrid>
              <DetailField
                label="Cliente"
                value={
                  <Link href={`/clientes/${quote.clientId}`} className="underline">
                    {quote.clientName}
                  </Link>
                }
              />
              <DetailField label="Folio cliente" value={quote.clientFolio} />
              <DetailField label="Contacto" value={quote.clientContact} />
              <DetailField label="Celular" value={quote.clientPhone} />
              <DetailField label="Correo" value={quote.clientEmail} />
              <DetailField label="RFC" value={quote.clientFiscalData?.rfc} />
              <DetailField label="Razón social" value={quote.clientFiscalData?.razonSocial} />
              <DetailField label="Régimen fiscal" value={quote.clientFiscalData?.regimenFiscal} />
            </DetailGrid>
          </DetailSection>
          <DetailSection title="Implementación">
            <DetailGrid>
              <DetailField label="Vendedor" value={quote.sellerName} />
              <DetailField label="Servicio" value={quote.serviceName} />
              <DetailField label="Descripción" value={quote.description} />
              <DetailField label="Precio" value={formatMoney(quote.price)} />
            </DetailGrid>
          </DetailSection>
          <QuoteSubscriptionLinesReadonly items={quote.subscriptionItems} />
          <DetailSection title="Condiciones comerciales">
            <DetailGrid>
              <DetailField label="Tiempo de entrega" value={quote.deliveryTime} />
              <DetailField label="Condiciones de pago" value={quote.paymentConditionName} />
              <DetailField label="Términos y condiciones" value={quote.termsConditionName} />
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
            {quote.termsText && (
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm whitespace-pre-wrap">
                {quote.termsText}
              </div>
            )}
          </DetailSection>
          <DetailSection title="Levantamientos">
            {surveys.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Sin levantamientos. La entrevista es opcional.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {surveys.map((item) => (
                  <li key={item.id}>
                    <Link href={`/levantamientos/${item.id}`} className="underline font-mono text-xs">
                      {item.folio}
                    </Link>{" "}
                    · {SURVEY_OPERATION_LABELS[item.operationType]} · {SURVEY_STATUS_LABELS[item.status]}
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      )}

      {error && !editing && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {showAuthorize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form className="card max-w-md w-full space-y-3" onSubmit={(e) => void authorize(e)}>
            <h3 className="font-medium">Autorizar cotización → crear OS</h3>
            <p className="text-sm text-[var(--muted)]">Indica la fecha de entrega para la Orden de Servicio.</p>
            <DateInput
              className="w-full"
              value={deliveryDate}
              onChange={setDeliveryDate}
              required
            />
            <SearchableSelect
              className="w-full"
              value={programmerId}
              onChange={setProgrammerId}
              required
              placeholder="Programador *"
              options={programmers.map((p) => ({ value: p.id, label: p.name }))}
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
