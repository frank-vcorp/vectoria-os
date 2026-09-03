import { getOperationalTimezone } from "@/server/services/settings";

export function datePartsInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Convierte fecha/hora local en una zona horaria a instante UTC. */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  for (let i = 0; i < 2; i++) {
    const parts = datePartsInTimezone(new Date(utc), timeZone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second, ms);
    utc += desired - asUtc;
  }
  return new Date(utc);
}

export function monthEndInTimezone(ref: Date, timeZone: string): Date {
  const { year, month } = datePartsInTimezone(ref, timeZone);
  const lastDay = new Date(year, month, 0).getDate();
  return zonedLocalToUtc(year, month, lastDay, 23, 59, 59, 999, timeZone);
}

export function monthStartInTimezone(ref: Date, timeZone: string): Date {
  const { year, month } = datePartsInTimezone(ref, timeZone);
  return zonedLocalToUtc(year, month, 1, 0, 0, 0, 0, timeZone);
}

export function dueDateAfterPeriodEnd(periodEnd: Date, timeZone: string): Date {
  const { year, month } = datePartsInTimezone(periodEnd, timeZone);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return zonedLocalToUtc(nextYear, nextMonth, 5, 23, 59, 59, 999, timeZone);
}

export async function getOperationalMonthRange(year: number, month: number) {
  const timeZone = await getOperationalTimezone();
  const from = zonedLocalToUtc(year, month, 1, 0, 0, 0, 0, timeZone);
  const lastDay = new Date(year, month, 0).getDate();
  const to = zonedLocalToUtc(year, month, lastDay, 23, 59, 59, 999, timeZone);
  return { from, to, timeZone };
}

export async function operationalNow(): Promise<{ now: Date; timeZone: string }> {
  const timeZone = await getOperationalTimezone();
  return { now: new Date(), timeZone };
}
