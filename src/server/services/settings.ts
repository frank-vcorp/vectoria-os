import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { systemSettings } from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export const OPERATIONAL_TIMEZONE_KEY = "operational_timezone";
export const DEFAULT_OPERATIONAL_TIMEZONE = "America/Mexico_City";

export async function getOperationalTimezone() {
  const db = getDb();
  const [row] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, OPERATIONAL_TIMEZONE_KEY))
    .limit(1);
  return row?.value ?? DEFAULT_OPERATIONAL_TIMEZONE;
}

export async function setOperationalTimezone(timezone: string, userId?: string) {
  const db = getDb();
  const trimmed = timezone.trim();
  if (!trimmed) throw new Error("INVALID_TIMEZONE");

  await db
    .insert(systemSettings)
    .values({ key: OPERATIONAL_TIMEZONE_KEY, value: trimmed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: trimmed, updatedAt: new Date() },
    });

  await writeAudit({
    entity: "system_setting",
    entityId: OPERATIONAL_TIMEZONE_KEY,
    action: "update",
    userId,
    payload: { value: trimmed },
  });

  return trimmed;
}

export async function ensureDefaultSettings() {
  const db = getDb();
  await db
    .insert(systemSettings)
    .values({ key: OPERATIONAL_TIMEZONE_KEY, value: DEFAULT_OPERATIONAL_TIMEZONE })
    .onConflictDoNothing();
}
