import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

type AuditAction = "create" | "update" | "cancel" | "validate";

export async function writeAudit(params: {
  entity: string;
  entityId: string;
  action: AuditAction;
  userId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(auditLogs).values({
    entity: params.entity,
    entityId: params.entityId,
    action: params.action,
    userId: params.userId ?? null,
    payload: params.payload ?? null,
  });
}
