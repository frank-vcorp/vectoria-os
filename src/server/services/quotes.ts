import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogPaymentConditions,
  catalogPeriodicities,
  catalogServices,
  clients,
  opportunities,
  quotes,
  serviceOrders,
  users,
} from "@/server/db/schema";
import type { QuoteStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";
import { getOpportunityById, markOpportunityQuoted } from "@/server/services/opportunities";

export async function listQuotes() {
  const db = getDb();
  return db
    .select({
      id: quotes.id,
      folio: quotes.folio,
      clientId: quotes.clientId,
      clientName: clients.name,
      opportunityId: quotes.opportunityId,
      opportunityFolio: opportunities.folio,
      serviceOrderId: serviceOrders.id,
      serviceOrderFolio: serviceOrders.folio,
      sellerName: users.name,
      serviceName: catalogServices.name,
      description: quotes.description,
      contractType: quotes.contractType,
      price: quotes.price,
      deliveryTime: quotes.deliveryTime,
      status: quotes.status,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .leftJoin(opportunities, eq(quotes.opportunityId, opportunities.id))
    .leftJoin(serviceOrders, eq(serviceOrders.quoteId, quotes.id))
    .innerJoin(users, eq(quotes.sellerId, users.id))
    .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
    .orderBy(desc(quotes.createdAt));
}

export async function getQuoteById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: quotes.id,
      folio: quotes.folio,
      clientId: quotes.clientId,
      clientName: clients.name,
      opportunityId: quotes.opportunityId,
      opportunityFolio: opportunities.folio,
      serviceOrderId: serviceOrders.id,
      serviceOrderFolio: serviceOrders.folio,
      sellerId: quotes.sellerId,
      sellerName: users.name,
      serviceId: quotes.serviceId,
      serviceName: catalogServices.name,
      description: quotes.description,
      contractType: quotes.contractType,
      periodicityId: quotes.periodicityId,
      periodicityName: catalogPeriodicities.name,
      price: quotes.price,
      deliveryTime: quotes.deliveryTime,
      paymentConditionId: quotes.paymentConditionId,
      paymentConditionName: catalogPaymentConditions.name,
      observations: quotes.observations,
      status: quotes.status,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .leftJoin(opportunities, eq(quotes.opportunityId, opportunities.id))
    .leftJoin(serviceOrders, eq(serviceOrders.quoteId, quotes.id))
    .innerJoin(users, eq(quotes.sellerId, users.id))
    .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
    .leftJoin(catalogPeriodicities, eq(quotes.periodicityId, catalogPeriodicities.id))
    .leftJoin(catalogPaymentConditions, eq(quotes.paymentConditionId, catalogPaymentConditions.id))
    .where(eq(quotes.id, id))
    .limit(1);
  return row ?? null;
}

export async function listQuotesByOpportunity(opportunityId: string) {
  const db = getDb();
  return db
    .select({
      id: quotes.id,
      folio: quotes.folio,
      status: quotes.status,
      price: quotes.price,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .where(eq(quotes.opportunityId, opportunityId))
    .orderBy(desc(quotes.createdAt));
}

async function insertQuote(params: {
  clientId: string;
  opportunityId?: string | null;
  sellerId: string;
  serviceId: string;
  description: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId?: string | null;
  price: number;
  deliveryTime: string;
  paymentConditionId: string;
  observations?: string | null;
  userId?: string;
}) {
  if (params.contractType === "suscripcion" && !params.periodicityId) {
    throw new Error("PERIODICITY_REQUIRED");
  }

  const folio = await nextFolio("cotizacion");
  const db = getDb();
  const [quote] = await db
    .insert(quotes)
    .values({
      folio,
      clientId: params.clientId,
      opportunityId: params.opportunityId ?? null,
      sellerId: params.sellerId,
      serviceId: params.serviceId,
      description: params.description.trim(),
      contractType: params.contractType,
      periodicityId: params.contractType === "suscripcion" ? params.periodicityId : null,
      price: params.price,
      deliveryTime: params.deliveryTime.trim(),
      paymentConditionId: params.paymentConditionId,
      observations: params.observations?.trim() || null,
      status: "cotizada",
      createdBy: params.userId ?? null,
      updatedBy: params.userId ?? null,
    })
    .returning({ id: quotes.id, folio: quotes.folio, status: quotes.status });

  await writeAudit({
    entity: "quote",
    entityId: quote.id,
    action: "create",
    userId: params.userId,
    payload: { folio: quote.folio },
  });

  return quote;
}

export async function createQuoteDirect(params: {
  clientId: string;
  serviceId: string;
  description: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId?: string | null;
  price: number;
  deliveryTime: string;
  paymentConditionId: string;
  observations?: string | null;
  sellerId: string;
  userId?: string;
}) {
  return insertQuote({ ...params, opportunityId: null });
}

export async function createQuoteFromOpportunity(params: {
  opportunityId: string;
  deliveryTime: string;
  paymentConditionId: string;
  price?: number;
  periodicityId?: string | null;
  contractType?: "por_evento" | "suscripcion";
  observations?: string | null;
  userId?: string;
}) {
  const opp = await getOpportunityById(params.opportunityId);
  if (!opp) throw new Error("NOT_FOUND");
  if (opp.status !== "abierta") throw new Error("INVALID_STATUS");

  const db = getDb();
  const [service] = await db
    .select()
    .from(catalogServices)
    .where(eq(catalogServices.id, opp.serviceId))
    .limit(1);
  if (!service) throw new Error("SERVICE_NOT_FOUND");
  if (!params.contractType) throw new Error("CONTRACT_TYPE_REQUIRED");

  const quote = await insertQuote({
    clientId: opp.clientId,
    opportunityId: opp.id,
    sellerId: opp.sellerId,
    serviceId: opp.serviceId,
    description: opp.description,
    contractType: params.contractType,
    periodicityId: params.periodicityId ?? null,
    price: params.price ?? 0,
    deliveryTime: params.deliveryTime,
    paymentConditionId: params.paymentConditionId,
    observations: params.observations,
    userId: params.userId,
  });

  await markOpportunityQuoted(opp.id, params.userId);
  return quote;
}

export async function updateQuote(params: {
  id: string;
  clientId?: string;
  serviceId?: string;
  description?: string;
  contractType?: "por_evento" | "suscripcion";
  periodicityId?: string | null;
  price?: number;
  deliveryTime?: string;
  paymentConditionId?: string;
  observations?: string | null;
  userId?: string;
}) {
  const existing = await getQuoteById(params.id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "cotizada") throw new Error("LOCKED");

  const db = getDb();
  const contractType = params.contractType ?? existing.contractType;
  const updates: Partial<typeof quotes.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: params.userId ?? null,
  };

  if (params.clientId) updates.clientId = params.clientId;
  if (params.serviceId) updates.serviceId = params.serviceId;
  if (params.description !== undefined) updates.description = params.description.trim();
  if (params.contractType) updates.contractType = params.contractType;
  if (params.price !== undefined) updates.price = params.price;
  if (params.deliveryTime !== undefined) updates.deliveryTime = params.deliveryTime.trim();
  if (params.paymentConditionId) updates.paymentConditionId = params.paymentConditionId;
  if (params.observations !== undefined) updates.observations = params.observations?.trim() || null;
  if (params.periodicityId !== undefined || params.contractType) {
    updates.periodicityId =
      contractType === "suscripcion" ? (params.periodicityId ?? existing.periodicityId) : null;
  }

  const [quote] = await db
    .update(quotes)
    .set(updates)
    .where(eq(quotes.id, params.id))
    .returning({ id: quotes.id, folio: quotes.folio, status: quotes.status });

  await writeAudit({ entity: "quote", entityId: quote.id, action: "update", userId: params.userId });
  return quote;
}

export async function setQuoteStatus(id: string, status: QuoteStatus, userId?: string) {
  const db = getDb();
  const [quote] = await db
    .update(quotes)
    .set({ status, updatedAt: new Date(), updatedBy: userId ?? null })
    .where(eq(quotes.id, id))
    .returning({ id: quotes.id, folio: quotes.folio, status: quotes.status });

  if (!quote) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "quote",
    entityId: quote.id,
    action: status === "cancelada" ? "cancel" : status === "autorizada" ? "validate" : "update",
    userId,
    payload: { status },
  });

  return quote;
}

export async function rejectQuote(id: string, userId?: string) {
  const existing = await getQuoteById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "cotizada") throw new Error("INVALID_STATUS");
  return setQuoteStatus(id, "rechazada", userId);
}

export async function cancelQuote(id: string, userId?: string, isAdmin?: boolean) {
  if (!isAdmin) throw new Error("FORBIDDEN");
  const existing = await getQuoteById(id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status === "autorizada" && existing.serviceOrderId) {
    throw new Error("HAS_OS");
  }
  if (existing.status === "cancelada") throw new Error("INVALID_STATUS");
  return setQuoteStatus(id, "cancelada", userId);
}

export async function getQuotePrefillFromOpportunity(opportunityId: string) {
  const opp = await getOpportunityById(opportunityId);
  if (!opp) throw new Error("NOT_FOUND");
  return { opportunity: opp };
}

export async function getQuotePrefillFromService(_serviceId: string) {
  return {};
}
