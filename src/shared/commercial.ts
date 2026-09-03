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
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}
