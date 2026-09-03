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
