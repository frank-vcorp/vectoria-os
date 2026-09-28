/** Convierte Date local a YYYY-MM-DD (input type=date). */
export function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type ParsedDeliveryTime =
  | { mode: "business"; days: number }
  | { mode: "calendar"; days: number };

/** Interpreta textos del catálogo, p. ej. "30 días hábiles" o "45 días". */
export function parseDeliveryTimeLabel(label: string | null | undefined): ParsedDeliveryTime | null {
  const normalized = (label ?? "").trim().toLowerCase();
  if (!normalized || /convenir|definir|negociar|por\s+definir/.test(normalized)) return null;

  const business = normalized.match(/(\d+)\s*d[ií]as?\s*h[aá]biles?/);
  if (business) return { mode: "business", days: Number(business[1]) };

  const calendar = normalized.match(/(\d+)\s*d[ií]as?\s*(?:naturales|corridos)?/);
  if (calendar) return { mode: "calendar", days: Number(calendar[1]) };

  return null;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Suma días hábiles (lun–vie) sin contar la fecha de inicio. */
export function addBusinessDays(start: Date, businessDays: number): Date {
  const result = new Date(start);
  result.setHours(0, 0, 0, 0);
  let remaining = businessDays;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
}

/** Suma días naturales sin contar la fecha de inicio. */
export function addCalendarDays(start: Date, days: number): Date {
  const result = new Date(start);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

/** Fecha de entrega sugerida al autorizar, a partir del tiempo de la cotización. */
export function suggestDeliveryDateFromTimeLabel(
  deliveryTimeLabel: string | null | undefined,
  startDate: Date = new Date(),
): string | null {
  const parsed = parseDeliveryTimeLabel(deliveryTimeLabel);
  if (!parsed) return null;
  const due =
    parsed.mode === "business"
      ? addBusinessDays(startDate, parsed.days)
      : addCalendarDays(startDate, parsed.days);
  return toIsoDateLocal(due);
}
