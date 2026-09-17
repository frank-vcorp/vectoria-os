import { CONTRACT_TYPE_LABELS, QUOTE_STATUS_LABELS, formatMoney, type QuoteStatus } from "@/shared/commercial";
import type { ClientFiscalData } from "@/shared/commercial";
import {
  escapeHtml,
  quoteDocumentStyles,
  renderKeyValueTable,
  renderQuoteFieldGrid,
  wrapPrintableDocument,
} from "@/shared/document-letterhead";

type QuoteSubscriptionDoc = {
  subscriptionTemplateName: string;
  description: string;
  price: number;
  periodicityName: string;
};

type QuoteClientDoc = {
  folio?: string | null;
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  fiscalData?: ClientFiscalData | null;
};

type QuoteDoc = {
  folio: string;
  sellerName: string;
  serviceName: string;
  description: string;
  price: number;
  deliveryTime: string;
  paymentConditionName?: string | null;
  termsConditionName?: string | null;
  termsText?: string | null;
  observations?: string | null;
  status: string;
  opportunityFolio?: string | null;
  createdAt: Date;
  client: QuoteClientDoc;
  subscriptionItems?: QuoteSubscriptionDoc[];
};

type ServiceOrderDoc = {
  folio: string;
  clientName: string;
  sellerName: string;
  serviceName: string;
  description: string;
  contractType: string;
  periodicityName?: string | null;
  price: number;
  paymentConditionName?: string | null;
  deliveryDate: Date;
  observations?: string | null;
  status: string;
  quoteFolio?: string | null;
  totalPaid?: number;
  balance?: number;
};

function clientRows(client: QuoteClientDoc): [string, string][] {
  const fiscal = client.fiscalData;
  return [
    client.folio ? ["Folio cliente", client.folio] : null,
    ["Nombre", client.name],
    client.contact ? ["Contacto", client.contact] : null,
    client.phone ? ["Celular", client.phone] : null,
    client.email ? ["Correo", client.email] : null,
    fiscal?.rfc ? ["RFC", fiscal.rfc] : null,
    fiscal?.razonSocial ? ["Razón social", fiscal.razonSocial] : null,
    fiscal?.regimenFiscal ? ["Régimen fiscal", fiscal.regimenFiscal] : null,
    fiscal?.codigoPostal ? ["Código postal", fiscal.codigoPostal] : null,
    fiscal?.usoCfdi ? ["Uso CFDI", fiscal.usoCfdi] : null,
  ].filter(Boolean) as [string, string][];
}

function quoteStatusLabel(status: string) {
  return QUOTE_STATUS_LABELS[status as QuoteStatus] ?? status;
}

function renderQuoteSubscriptions(items: QuoteSubscriptionDoc[]) {
  return `<div class="quote-sub-grid">${items
    .map(
      (item) => `<article class="quote-sub-card">
        <div>
          <strong>${escapeHtml(item.subscriptionTemplateName)}</strong>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="quote-sub-price">
          ${escapeHtml(formatMoney(item.price))}
          <span class="quote-sub-period">${escapeHtml(item.periodicityName)}</span>
        </div>
      </article>`,
    )
    .join("")}</div>`;
}

export function renderQuoteHtml(quote: QuoteDoc) {
  const client = quote.client;
  const clientMeta = [client.contact, client.phone, client.email].filter(Boolean).join(" · ");
  const subscriptionTotal = (quote.subscriptionItems ?? []).reduce((sum, item) => sum + item.price, 0);

  const summary = `
    <div class="quote-summary">
      <div class="quote-summary-main">
        <p class="quote-kicker">Cliente</p>
        <h2 class="quote-client-name">${escapeHtml(client.name)}</h2>
        ${clientMeta ? `<p class="quote-client-meta">${escapeHtml(clientMeta)}</p>` : ""}
      </div>
      <div class="quote-summary-total">
        <p class="quote-kicker">Implementación</p>
        <p class="quote-total-amount">${escapeHtml(formatMoney(quote.price))}</p>
        ${subscriptionTotal > 0 ? `<p class="quote-total-note">+ ${escapeHtml(formatMoney(subscriptionTotal))} en suscripciones</p>` : ""}
      </div>
    </div>`;

  const clientSection = `
    <section class="quote-section">
      <h2 class="quote-section-head"><span class="quote-section-title">Datos del cliente</span></h2>
      <div class="quote-section-body">${renderQuoteFieldGrid(clientRows(client))}</div>
    </section>`;

  const implementationSection = `
    <section class="quote-section">
      <h2 class="quote-section-head"><span class="quote-section-title">Implementación</span></h2>
      <div class="quote-section-body">
        <div class="quote-implementation">
          <div class="quote-implementation-copy">
            <p class="quote-service-name">${escapeHtml(quote.serviceName)}</p>
            <p class="quote-description">${escapeHtml(quote.description)}</p>
            <p class="quote-meta-line">Vendedor: ${escapeHtml(quote.sellerName)}</p>
          </div>
          <div class="quote-price-card">
            <p class="quote-kicker">Precio</p>
            <p class="quote-total-amount">${escapeHtml(formatMoney(quote.price))}</p>
          </div>
        </div>
      </div>
    </section>`;

  const subscriptionsSection =
    quote.subscriptionItems && quote.subscriptionItems.length > 0
      ? `<section class="quote-section">
          <h2 class="quote-section-head"><span class="quote-section-title">Suscripciones</span></h2>
          <div class="quote-section-body">${renderQuoteSubscriptions(quote.subscriptionItems)}</div>
        </section>`
      : "";

  const commercialFields: [string, string][] = [
    ["Tiempo de entrega", quote.deliveryTime || "—"],
    quote.paymentConditionName ? ["Condiciones de pago", quote.paymentConditionName] : null,
    quote.termsConditionName ? ["Términos", quote.termsConditionName] : null,
    quote.opportunityFolio ? ["Oportunidad", quote.opportunityFolio] : null,
    quote.observations ? ["Observaciones", quote.observations] : null,
  ].filter(Boolean) as [string, string][];

  const commercialSection = `
    <section class="quote-section">
      <h2 class="quote-section-head">
        <span class="quote-section-title">Condiciones comerciales</span>
        <span class="quote-status">${escapeHtml(quoteStatusLabel(quote.status))}</span>
      </h2>
      <div class="quote-section-body">
        <div class="quote-commercial-grid">${commercialFields
          .map(
            ([label, value]) => `<div class="quote-field">
              <span class="quote-field-label">${escapeHtml(label)}</span>
              <span class="quote-field-value">${escapeHtml(value)}</span>
            </div>`,
          )
          .join("")}</div>
        ${
          quote.termsText
            ? `<div class="quote-terms-box">
                <p class="quote-terms-title">${escapeHtml(quote.termsConditionName ?? "Términos y condiciones")}</p>
                ${escapeHtml(quote.termsText)}
              </div>`
            : ""
        }
      </div>
    </section>`;

  const body = `<div class="quote-doc">${summary}${clientSection}${implementationSection}${subscriptionsSection}${commercialSection}</div>`;

  return wrapPrintableDocument({
    title: "Cotización",
    pageTitle: `Cotización ${quote.folio}`,
    docLabel: "Folio",
    docNumber: quote.folio,
    dateLabel: "Fecha de emisión",
    dateText: new Date(quote.createdAt).toLocaleDateString("es-MX"),
    body,
    extraStyles: quoteDocumentStyles(),
    bodyClass: "quote-doc-body",
  });
}

export function renderServiceOrderHtml(order: ServiceOrderDoc) {
  const contractLabel =
    CONTRACT_TYPE_LABELS[order.contractType as keyof typeof CONTRACT_TYPE_LABELS] ?? order.contractType;

  const rows = [
    ["Cliente", order.clientName],
    ["Vendedor", order.sellerName],
    ["Servicio", order.serviceName],
    ["Descripción", order.description],
    ["Tipo de contratación", contractLabel],
    order.periodicityName ? ["Periodicidad", order.periodicityName] : null,
    ["Precio", formatMoney(order.price)],
    order.paymentConditionName ? ["Condiciones de pago", order.paymentConditionName] : null,
    ["Fecha de entrega", new Date(order.deliveryDate).toLocaleDateString("es-MX")],
    order.observations ? ["Observaciones", order.observations] : null,
    order.quoteFolio ? ["Cotización", order.quoteFolio] : null,
    ["Estatus", order.status],
    order.totalPaid !== undefined ? ["Total pagado", formatMoney(order.totalPaid)] : null,
    order.balance !== undefined ? ["Saldo pendiente", formatMoney(order.balance)] : null,
  ].filter(Boolean) as [string, string][];

  const body = `
    <h2 class="doc-section-title">Detalle de la orden</h2>
    ${renderKeyValueTable(rows)}
  `;

  return wrapPrintableDocument({
    title: "Orden de Servicio",
    pageTitle: `Orden de Servicio ${order.folio}`,
    docLabel: "Folio",
    docNumber: order.folio,
    dateLabel: "Fecha de entrega",
    dateText: new Date(order.deliveryDate).toLocaleDateString("es-MX"),
    body,
  });
}
