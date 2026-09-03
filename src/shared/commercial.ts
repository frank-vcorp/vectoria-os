export type ClientFiscalData = {
  rfc?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  codigoPostal?: string;
  usoCfdi?: string;
};

export type QuoteSubscriptionItemInput = {
  subscriptionTemplateId: string;
  description: string;
  price: number;
  periodicityId: string;
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

export const PROJECT_STATUSES = ["en_progreso", "terminado", "cancelado"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PHASE_STATUSES = ["bloqueada", "disponible", "en_validacion", "validada"] as const;
export type ProjectPhaseStatus = (typeof PROJECT_PHASE_STATUSES)[number];

export const SUBSCRIPTION_SERVICE_STATUSES = [
  "pendiente_activacion",
  "activa",
  "pausada",
  "cancelada",
] as const;
export type SubscriptionServiceStatus = (typeof SUBSCRIPTION_SERVICE_STATUSES)[number];

export const SUBSCRIPTION_BILLING_STATUSES = ["al_corriente", "vencida", "suspendida_adeudo"] as const;
export type SubscriptionBillingStatus = (typeof SUBSCRIPTION_BILLING_STATUSES)[number];

export const SUBSCRIPTION_CYCLE_STATUSES = ["pendiente", "pagado", "vencido"] as const;
export type SubscriptionCycleStatus = (typeof SUBSCRIPTION_CYCLE_STATUSES)[number];

export const INVOICE_STATUSES = ["borrador", "timbrada", "cancelada", "error"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_SEND_STATUSES = ["pendiente", "enviado", "error"] as const;
export type InvoiceSendStatus = (typeof INVOICE_SEND_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  en_progreso: "En progreso",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

export const PROJECT_PHASE_STATUS_LABELS: Record<ProjectPhaseStatus, string> = {
  bloqueada: "Bloqueada",
  disponible: "Disponible",
  en_validacion: "En validación",
  validada: "Validada",
};

export const SUBSCRIPTION_SERVICE_STATUS_LABELS: Record<SubscriptionServiceStatus, string> = {
  pendiente_activacion: "Pendiente activación",
  activa: "Activa",
  pausada: "Pausada",
  cancelada: "Cancelada",
};

export const SUBSCRIPTION_BILLING_STATUS_LABELS: Record<SubscriptionBillingStatus, string> = {
  al_corriente: "Al corriente",
  vencida: "Vencida",
  suspendida_adeudo: "Suspendida por adeudo",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  borrador: "Borrador",
  timbrada: "Timbrada",
  cancelada: "Cancelada",
  error: "Error",
};

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
