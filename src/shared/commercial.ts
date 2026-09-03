export type ClientFiscalData = {
  rfc?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  codigoPostal?: string;
  usoCfdi?: string;
};

export const OPPORTUNITY_STATUSES = ["abierta", "cotizada", "no_interesado"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const QUOTE_STATUSES = ["cotizada", "rechazada", "autorizada", "cancelada"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  abierta: "Abierta",
  cotizada: "Cotizada",
  no_interesado: "No interesado",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  cotizada: "Cotizada",
  rechazada: "Rechazada",
  autorizada: "Autorizada",
  cancelada: "Cancelada",
};

export const SERVICE_ORDER_STATUSES = ["creada", "entregada", "cancelada"] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  creada: "Creada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const CONTRACT_TYPE_LABELS = {
  por_evento: "Por evento",
  suscripcion: "Suscripción",
} as const;

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDeliveryDate(value: string): string {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX");
  }
  return value;
}
