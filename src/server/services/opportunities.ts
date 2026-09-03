import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  clients,
  opportunities,
  opportunityLogEntries,
  users,
} from "@/server/db/schema";
import type { OpportunityStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";

export async function listOpportunities() {
  const db = getDb();
  return db
    .select({
      id: opportunities.id,
      folio: opportunities.folio,
      clientId: opportunities.clientId,
      clientName: clients.name,
      clientFolio: clients.folio,
      sellerId: opportunities.sellerId,
      sellerName: users.name,
      serviceId: opportunities.serviceId,
      serviceName: catalogServices.name,
      description: opportunities.description,
      status: opportunities.status,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
    })
    .from(opportunities)
    .innerJoin(clients, eq(opportunities.clientId, clients.id))
    .innerJoin(users, eq(opportunities.sellerId, users.id))
    .innerJoin(catalogServices, eq(opportunities.serviceId, catalogServices.id))
    .orderBy(desc(opportunities.createdAt));
}

export async function getOpportunityById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: opportunities.id,
      folio: opportunities.folio,
      clientId: opportunities.clientId,
      clientName: clients.name,
      sellerId: opportunities.sellerId,
      sellerName: users.name,
      serviceId: opportunities.serviceId,
      serviceName: catalogServices.name,
      description: opportunities.description,
      status: opportunities.status,
      createdAt: opportunities.createdAt,
    })
    .from(opportunities)
    .innerJoin(clients, eq(opportunities.clientId, clients.id))
    .innerJoin(users, eq(opportunities.sellerId, users.id))
    .innerJoin(catalogServices, eq(opportunities.serviceId, catalogServices.id))
    .where(eq(opportunities.id, id))
    .limit(1);
  return row ?? null;
}

export async function createOpportunity(params: {
  clientId: string;
  serviceId: string;
  description: string;
  sellerId: string;
  userId?: string;
}) {
  const db = getDb();
  const folio = await nextFolio("oportunidad");

  const [opp] = await db
    .insert(opportunities)
    .values({
      folio,
      clientId: params.clientId,
      sellerId: params.sellerId,
      serviceId: params.serviceId,
      description: params.description.trim(),
      status: "abierta",
      createdBy: params.userId ?? null,
      updatedBy: params.userId ?? null,
    })
    .returning({
      id: opportunities.id,
      folio: opportunities.folio,
      status: opportunities.status,
    });

  await writeAudit({
    entity: "opportunity",
    entityId: opp.id,
    action: "create",
    userId: params.userId,
    payload: { folio: opp.folio },
  });

  return opp;
}

export async function updateOpportunity(params: {
  id: string;
  clientId?: string;
  serviceId?: string;
  description?: string;
  status?: OpportunityStatus;
  userId?: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select({ status: opportunities.status })
    .from(opportunities)
    .where(eq(opportunities.id, params.id))
    .limit(1);

  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status === "cotizada" && params.status !== "cotizada") {
    throw new Error("LOCKED");
  }

  const updates: Partial<typeof opportunities.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: params.userId ?? null,
  };
  if (params.clientId) updates.clientId = params.clientId;
  if (params.serviceId) updates.serviceId = params.serviceId;
  if (params.description !== undefined) updates.description = params.description.trim();
  if (params.status) updates.status = params.status;

  const [opp] = await db
    .update(opportunities)
    .set(updates)
    .where(eq(opportunities.id, params.id))
    .returning({ id: opportunities.id, folio: opportunities.folio, status: opportunities.status });

  await writeAudit({
    entity: "opportunity",
    entityId: opp.id,
    action: "update",
    userId: params.userId,
    payload: params.status ? { status: params.status } : undefined,
  });

  return opp;
}

export async function listOpportunityLog(opportunityId: string) {
  const db = getDb();
  return db
    .select({
      id: opportunityLogEntries.id,
      note: opportunityLogEntries.note,
      createdAt: opportunityLogEntries.createdAt,
      userName: users.name,
    })
    .from(opportunityLogEntries)
    .leftJoin(users, eq(opportunityLogEntries.userId, users.id))
    .where(eq(opportunityLogEntries.opportunityId, opportunityId))
    .orderBy(desc(opportunityLogEntries.createdAt));
}

export async function addOpportunityLog(params: {
  opportunityId: string;
  note: string;
  userId?: string;
}) {
  const db = getDb();
  const [entry] = await db
    .insert(opportunityLogEntries)
    .values({
      opportunityId: params.opportunityId,
      userId: params.userId ?? null,
      note: params.note.trim(),
    })
    .returning({
      id: opportunityLogEntries.id,
      note: opportunityLogEntries.note,
      createdAt: opportunityLogEntries.createdAt,
    });

  return entry;
}

export async function markOpportunityQuoted(opportunityId: string, userId?: string) {
  return updateOpportunity({ id: opportunityId, status: "cotizada", userId });
}
