import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs, users } from "@/server/db/schema";

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

export async function listAuditLogs(limit = 100) {
  const db = getDb();
  return db
    .select({
      id: auditLogs.id,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      userId: auditLogs.userId,
      userName: users.name,
      payload: auditLogs.payload,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
