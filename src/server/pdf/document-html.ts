import { CONTRACT_TYPE_LABELS, formatMoney } from "@/shared/commercial";
import type { ClientFiscalData } from "@/shared/commercial";
import {
  escapeHtml,
  renderCompactListTable,
  renderDocumentBlock,
  renderKeyValueTable,
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

export function renderQuoteHtml(quote: QuoteDoc) {
  const clientBlock = renderDocumentBlock("Datos del cliente", renderKeyValueTable(clientRows(quote.client)));

  const implementationRows: [string, string][] = [
    ["Vendedor", quote.sellerName],
    ["Servicio", quote.serviceName],
    ["Descripción", quote.description],
    ["Precio de implementación", formatMoney(quote.price)],
  ];
  const implementationBlock = renderDocumentBlock(
    "Implementación",
    renderKeyValueTable(implementationRows),
  );

  const subscriptions =
    quote.subscriptionItems && quote.subscriptionItems.length > 0
      ? renderDocumentBlock(
          "Suscripciones",
          renderCompactListTable(
            ["Concepto", "Descripción", "Precio"],
            quote.subscriptionItems.map((item) => ({
              name: item.subscriptionTemplateName,
              detail: item.description,
              price: `${formatMoney(item.price)} · ${item.periodicityName}`,
            })),
          ),
        )
      : "";

  const commercialRows = [
    ["Tiempo de entrega", quote.deliveryTime || "—"],
    quote.paymentConditionName ? ["Condiciones de pago", quote.paymentConditionName] : null,
    quote.termsConditionName ? ["Términos y condiciones", quote.termsConditionName] : null,
    quote.observations ? ["Observaciones", quote.observations] : null,
    quote.opportunityFolio ? ["Oportunidad", quote.opportunityFolio] : null,
    ["Estatus", quote.status],
  ].filter(Boolean) as [string, string][];

  const termsBody = quote.termsText
    ? `${renderKeyValueTable(commercialRows)}<p class="doc-terms">${escapeHtml(quote.termsText)}</p>`
    : renderKeyValueTable(commercialRows);

  const commercialBlock = renderDocumentBlock("Condiciones comerciales", termsBody);

  const body = `${clientBlock}${implementationBlock}${subscriptions}${commercialBlock}`;

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
