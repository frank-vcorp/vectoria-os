import { CONTRACT_TYPE_LABELS, formatMoney } from "@/shared/commercial";
import {
  renderCompactListTable,
  renderKeyValueTable,
  wrapPrintableDocument,
} from "@/shared/document-letterhead";

type QuoteSubscriptionDoc = {
  subscriptionTemplateName: string;
  description: string;
  price: number;
  periodicityName: string;
};

type QuoteDoc = {
  folio: string;
  clientName: string;
  sellerName: string;
  serviceName: string;
  description: string;
  price: number;
  deliveryTime: string;
  paymentConditionName?: string | null;
  observations?: string | null;
  status: string;
  opportunityFolio?: string | null;
  createdAt: Date;
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

export function renderQuoteHtml(quote: QuoteDoc) {
  const mainRows = [
    ["Cliente", quote.clientName],
    ["Vendedor", quote.sellerName],
    ["Servicio principal", quote.serviceName],
    ["Descripción", quote.description],
    ["Precio del servicio principal", formatMoney(quote.price)],
    ["Tiempo de entrega", quote.deliveryTime || "—"],
    quote.paymentConditionName ? ["Condiciones de pago", quote.paymentConditionName] : null,
    quote.observations ? ["Observaciones", quote.observations] : null,
    quote.opportunityFolio ? ["Oportunidad", quote.opportunityFolio] : null,
    ["Estatus", quote.status],
  ].filter(Boolean) as [string, string][];

  const subscriptions =
    quote.subscriptionItems && quote.subscriptionItems.length > 0
      ? `<h2 class="doc-section-title">Suscripciones propuestas</h2>${renderCompactListTable(
          ["Concepto", "Descripción", "Precio"],
          quote.subscriptionItems.map((item) => ({
            name: item.subscriptionTemplateName,
            detail: item.description,
            price: `${formatMoney(item.price)} · ${item.periodicityName}`,
          })),
        )}`
      : "";

  const body = `
    <h2 class="doc-section-title">Servicio principal</h2>
    ${renderKeyValueTable(mainRows)}
    ${subscriptions}
  `;

  return wrapPrintableDocument({
    title: "Cotización",
    pageTitle: `Cotización ${quote.folio}`,
    docLabel: "Folio",
    docNumber: quote.folio,
    dateLabel: "Fecha de emisión",
    dateText: new Date(quote.createdAt).toLocaleDateString("es-MX"),
    body,
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
