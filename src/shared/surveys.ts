export const SURVEY_OPERATION_TYPES = ["SER", "DIS", "MAN", "PRY", "CIT", "LOG"] as const;
export type SurveyOperationType = (typeof SURVEY_OPERATION_TYPES)[number];

export const SURVEY_OPERATION_LABELS: Record<SurveyOperationType, string> = {
  SER: "Servicios",
  DIS: "Comercial / distribución",
  MAN: "Manufactura / transformación",
  PRY: "Proyectos",
  CIT: "Atención por citas / expediente",
  LOG: "Logística / transporte",
};

export const SURVEY_STATUSES = ["borrador", "en_captura", "finalizado"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  borrador: "Borrador",
  en_captura: "En captura",
  finalizado: "Finalizado",
};

export const SECTION_PROGRESS = [
  "sin_revisar",
  "en_captura",
  "revisada",
  "con_pendientes",
  "no_aplica",
] as const;
export type SectionProgress = (typeof SECTION_PROGRESS)[number];

export const SECTION_PROGRESS_LABELS: Record<SectionProgress, string> = {
  sin_revisar: "Sin revisar",
  en_captura: "En captura",
  revisada: "Revisada",
  con_pendientes: "Con pendientes",
  no_aplica: "No aplica",
};

export const APPLICABILITY = ["por_confirmar", "aplica", "no_aplica"] as const;
export type Applicability = (typeof APPLICABILITY)[number];

export const APPLICABILITY_LABELS: Record<Applicability, string> = {
  por_confirmar: "Por confirmar",
  aplica: "Aplica",
  no_aplica: "No aplica",
};

export const TEMPLATE_VERSION = "1.0";

export const SURVEY_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const SURVEY_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export const SURVEY_ATTACHMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.gif,.xls,.xlsx,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type FieldPending = {
  marked: boolean;
  what?: string;
  who?: string;
  note?: string;
};

export type FlowBlock = {
  id: string;
  label: string;
  source: "template" | "custom";
};

export type FieldAnswer = {
  text?: string;
  choice?: string | null;
  selected?: string[];
  other?: string;
  software?: string;
  fileName?: string;
  rows?: Record<string, string>[];
  extraNotes?: Record<string, string>;
  flowBlocks?: FlowBlock[];
  flowNotes?: string;
  pending?: FieldPending;
};

export type SurveyAnswers = {
  fields: Record<string, FieldAnswer>;
};

export type SectionStateMap = Record<string, { status: SectionProgress }>;

export type ArchivedOperation = {
  type: SurveyOperationType;
  templateVersion: string;
  answers: SurveyAnswers;
  archivedAt: string;
};

export type QuoteLinkHistory = {
  quoteId: string;
  quoteFolio: string;
  clientId: string;
  clientName: string;
  changedAt: string;
};

export function emptyAnswers(): SurveyAnswers {
  return { fields: {} };
}

export function isExclusiveChoice(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "no" || normalized === "ninguno" || normalized === "no condiciona";
}

export function hasFieldContent(answer: FieldAnswer | undefined): boolean {
  if (!answer) return false;
  if (answer.text?.trim()) return true;
  if (answer.choice?.trim()) return true;
  if (answer.other?.trim()) return true;
  if (answer.software?.trim()) return true;
  if (answer.fileName?.trim()) return true;
  if (answer.selected && answer.selected.length > 0) return true;
  if (answer.rows?.some((row) => Object.values(row).some((value) => value.trim()))) return true;
  if (answer.extraNotes && Object.values(answer.extraNotes).some((value) => value.trim())) return true;
  if (answer.flowBlocks?.some((block) => block.label.trim())) return true;
  if (answer.flowNotes?.trim()) return true;
  if (answer.pending?.marked) return true;
  return false;
}

export function hasInterviewContent(answers: SurveyAnswers) {
  return Object.entries(answers.fields).some(([fieldId, answer]) => {
    if (fieldId.startsWith("header.")) return false;
    return hasFieldContent(answer);
  });
}

export function hasOperationContent(answers: SurveyAnswers) {
  return Object.entries(answers.fields).some(([fieldId, answer]) => {
    if (!fieldId.startsWith("op.")) return false;
    return hasFieldContent(answer);
  });
}

export function toggleChecklistValue(selected: string[], value: string, exclusiveValues: string[] = []) {
  const exclusive = new Set(["No", "Ninguno", "No condiciona", ...exclusiveValues]);
  const isOn = selected.includes(value);
  if (isOn) return selected.filter((item) => item !== value);
  if (exclusive.has(value)) return [value];
  return [...selected.filter((item) => !exclusive.has(item)), value];
}
