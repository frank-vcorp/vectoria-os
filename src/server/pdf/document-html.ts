import { CONTRACT_TYPE_LABELS, formatMoney } from "@/shared/commercial";

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

function baseHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; }
    .meta { color: #555; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; vertical-align: top; }
    th { width: 35%; color: #444; font-weight: 600; }
    .sub-card { border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; }
    @media print { body { margin: 1rem; } .no-print { display: none; } }
  </style>
</head>
<body>
  ${body}
  <p class="no-print" style="margin-top:2rem">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </p>
</body>
</html>`;
}

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
      ? `<h2>Suscripciones propuestas</h2>${quote.subscriptionItems
          .map(
            (item) => `<div class="sub-card">
              <strong>${escapeHtml(item.subscriptionTemplateName)}</strong>
              <p>${escapeHtml(item.description)}</p>
              <p>${escapeHtml(formatMoney(item.price))} · ${escapeHtml(item.periodicityName)}</p>
            </div>`,
          )
          .join("")}`
      : "";

  const body = `
    <h1>Cotización ${quote.folio}</h1>
    <p class="meta">VectorIA · ${new Date(quote.createdAt).toLocaleDateString("es-MX")}</p>
    <h2>Servicio principal</h2>
    <table>${mainRows.map(([k, v]) => `<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
    ${subscriptions}
  `;
  return baseHtml(`Cotización ${quote.folio}`, body);
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
    <h1>Orden de Servicio ${order.folio}</h1>
    <p class="meta">VectorIA · ${new Date(order.deliveryDate).toLocaleDateString("es-MX")}</p>
    <table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
  `;
  return baseHtml(`OS ${order.folio}`, body);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
