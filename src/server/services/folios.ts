import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { folioCounters } from "@/server/db/schema";
import { FOLIO_PREFIXES, type FolioEntity } from "@/shared/modules";

export async function nextFolio(entity: FolioEntity): Promise<string> {
  const db = getDb();
  const prefix = FOLIO_PREFIXES[entity];

  const [row] = await db
    .insert(folioCounters)
    .values({ entity, lastNumber: 1 })
    .onConflictDoUpdate({
      target: folioCounters.entity,
      set: { lastNumber: sql`${folioCounters.lastNumber} + 1` },
    })
    .returning();

  const num = row.lastNumber.toString().padStart(6, "0");
  return `${prefix}-${num}`;
}

export async function peekFolio(entity: FolioEntity): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(folioCounters)
    .where(eq(folioCounters.entity, entity))
    .limit(1);

  const next = (row?.lastNumber ?? 0) + 1;
  return `${FOLIO_PREFIXES[entity]}-${next.toString().padStart(6, "0")}`;
}
