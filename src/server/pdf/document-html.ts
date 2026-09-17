import {
  breakDownIvaIncluded,
  CONTRACT_TYPE_LABELS,
  formatMoney,
  type ClientFiscalData,
} from "@/shared/commercial";
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

type QuoteLineItem = {
  title: string;
  detail: string;
  typeLabel: string;
  recurring: boolean;
  totalCents: number;
  periodSuffix?: string;
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

function recurringPeriodSuffix(periodicityName: string) {
  const normalized = periodicityName.toLowerCase();
  if (normalized.includes("mensual")) return "/ mes";
  if (normalized.includes("anual")) return "/ año";
  if (normalized.includes("trimestral")) return "/ trimestre";
  if (normalized.includes("semanal")) return "/ semana";
  return `/ ${normalized}`;
}

function buildQuoteLineItems(quote: QuoteDoc): QuoteLineItem[] {
  const items: QuoteLineItem[] = [
    {
      title: quote.serviceName,
      detail: quote.description,
      typeLabel: "Pago único",
      recurring: false,
      totalCents: quote.price,
    },
  ];

  for (const item of quote.subscriptionItems ?? []) {
    items.push({
      title: item.subscriptionTemplateName,
      detail: item.description,
      typeLabel: item.periodicityName,
      recurring: true,
      totalCents: item.price,
      periodSuffix: recurringPeriodSuffix(item.periodicityName),
    });
  }

  return items;
}

function formatLineTotal(item: QuoteLineItem) {
  const amount = formatMoney(item.totalCents);
  if (!item.recurring || !item.periodSuffix) return amount;
  return `${amount} ${item.periodSuffix}`;
}

function renderQuoteLineItemsTable(items: QuoteLineItem[]) {
  const rows = items
    .map((item, index) => {
      const { netCents, ivaCents } = breakDownIvaIncluded(item.totalCents);
      const typeClass = item.recurring ? "quote-line-type quote-line-type-recurring" : "quote-line-type";

      return `<tr>
        <td class="quote-line-num">${index + 1}</td>
        <td class="quote-line-desc">
          <strong>${escapeHtml(item.title)}</strong>
          ${item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ""}
        </td>
        <td class="quote-line-type-cell"><span class="${typeClass}">${escapeHtml(item.typeLabel)}</span></td>
        <td class="quote-line-money">${escapeHtml(formatMoney(netCents))}</td>
        <td class="quote-line-money">${escapeHtml(formatMoney(ivaCents))}</td>
        <td class="quote-line-money quote-line-total">${escapeHtml(formatLineTotal(item))}</td>
      </tr>`;
    })
    .join("");

  const implementation = items.find((item) => !item.recurring);
  const subscriptions = items.filter((item) => item.recurring);

  const footerRows: string[] = [];

  if (implementation) {
    footerRows.push(`<tr class="quote-lines-foot-row">
      <td colspan="5">Implementación (pago único, IVA incluido)</td>
      <td class="quote-line-money">${escapeHtml(formatMoney(implementation.totalCents))}</td>
    </tr>`);
  }

  for (const group of groupSubscriptionsByPeriod(subscriptions)) {
    footerRows.push(`<tr class="quote-lines-foot-row">
      <td colspan="5">Suscripciones recurrentes · ${escapeHtml(group.label)} (IVA incluido)</td>
      <td class="quote-line-money">${escapeHtml(formatMoney(group.totalCents))} ${escapeHtml(group.periodSuffix)}</td>
    </tr>`);
  }

  return `<div class="quote-lines-wrap">
    <table class="quote-lines-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Descripción</th>
          <th>Tipo</th>
          <th>Precio</th>
          <th>IVA</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      ${footerRows.length > 0 ? `<tfoot>${footerRows.join("")}</tfoot>` : ""}
    </table>
    <p class="quote-lines-note">Precios capturados con IVA incluido (16%). El desglose por partida se muestra en la tabla.</p>
  </div>`;
}

function groupSubscriptionsByPeriod(items: QuoteLineItem[]) {
  const groups = new Map<string, { label: string; periodSuffix: string; totalCents: number }>();

  for (const item of items) {
    const key = item.typeLabel;
    const existing = groups.get(key);
    if (existing) {
      existing.totalCents += item.totalCents;
      continue;
    }
    groups.set(key, {
      label: item.typeLabel,
      periodSuffix: item.periodSuffix ?? "",
      totalCents: item.totalCents,
    });
  }

  return [...groups.values()];
}

function renderQuoteSummary(quote: QuoteDoc, items: QuoteLineItem[]) {
  const client = quote.client;
  const clientMeta = [client.contact, client.phone, client.email].filter(Boolean).join(" · ");
  const implementation = items.find((item) => !item.recurring);
  const subscriptionGroups = groupSubscriptionsByPeriod(items.filter((item) => item.recurring));

  const summaryLines: string[] = [];

  if (implementation) {
    summaryLines.push(`<p class="quote-summary-line">
      <span>Implementación</span>
      <strong>${escapeHtml(formatMoney(implementation.totalCents))}</strong>
    </p>`);
  }

  for (const group of subscriptionGroups) {
    summaryLines.push(`<p class="quote-summary-line">
      <span>Suscripciones · ${escapeHtml(group.label)}</span>
      <strong>${escapeHtml(formatMoney(group.totalCents))} ${escapeHtml(group.periodSuffix)}</strong>
    </p>`);
  }

  return `<div class="quote-summary">
    <div class="quote-summary-main">
      <p class="quote-kicker">Cliente</p>
      <h2 class="quote-client-name">${escapeHtml(client.name)}</h2>
      ${clientMeta ? `<p class="quote-client-meta">${escapeHtml(clientMeta)}</p>` : ""}
    </div>
    <div class="quote-summary-total">
      <p class="quote-kicker">Resumen</p>
      ${summaryLines.join("")}
    </div>
  </div>`;
}

export function renderQuoteHtml(quote: QuoteDoc) {
  const lineItems = buildQuoteLineItems(quote);

  const summary = renderQuoteSummary(quote, lineItems);

  const clientSection = `
    <section class="quote-section">
      <h2 class="quote-section-head"><span class="quote-section-title">Datos del cliente</span></h2>
      <div class="quote-section-body">${renderQuoteFieldGrid(clientRows(quote.client))}</div>
    </section>`;

  const partidasSection = `
    <section class="quote-section">
      <h2 class="quote-section-head"><span class="quote-section-title">Partidas</span></h2>
      <div class="quote-section-body quote-section-body-table">${renderQuoteLineItemsTable(lineItems)}</div>
    </section>`;

  const commercialFields: [string, string][] = [
    ["Vendedor", quote.sellerName],
    ["Tiempo de entrega", quote.deliveryTime || "—"],
    quote.paymentConditionName ? ["Condiciones de pago", quote.paymentConditionName] : null,
    quote.termsConditionName ? ["Términos", quote.termsConditionName] : null,
    quote.observations ? ["Observaciones", quote.observations] : null,
  ].filter(Boolean) as [string, string][];

  const commercialSection = `
    <section class="quote-section">
      <h2 class="quote-section-head"><span class="quote-section-title">Condiciones comerciales</span></h2>
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

  const body = `<div class="quote-doc">${summary}${clientSection}${partidasSection}${commercialSection}</div>`;

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
