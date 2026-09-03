import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogPaymentConditions,
  catalogPeriodicities,
  catalogServices,
  clients,
  opportunities,
  quotes,
  users,
} from "@/server/db/schema";
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
    .innerJoin(users, eq(quotes.sellerId, users.id))
    .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
    .leftJoin(catalogPeriodicities, eq(quotes.periodicityId, catalogPeriodicities.id))
    .leftJoin(catalogPaymentConditions, eq(quotes.paymentConditionId, catalogPaymentConditions.id))
    .where(eq(quotes.id, id))
    .limit(1);
  return row ?? null;
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

  const contractType = params.contractType ?? service.contractType;
  const periodicityId =
    contractType === "suscripcion"
      ? (params.periodicityId ?? service.periodicityId)
      : null;
  if (contractType === "suscripcion" && !periodicityId) {
    throw new Error("PERIODICITY_REQUIRED");
  }

  const folio = await nextFolio("cotizacion");
  const price = params.price ?? service.basePrice;

  const [quote] = await db
    .insert(quotes)
    .values({
      folio,
      clientId: opp.clientId,
      opportunityId: opp.id,
      sellerId: opp.sellerId,
      serviceId: opp.serviceId,
      description: opp.description,
      contractType,
      periodicityId,
      price,
      deliveryTime: params.deliveryTime.trim(),
      paymentConditionId: params.paymentConditionId,
      observations: params.observations?.trim() || null,
      status: "cotizada",
      createdBy: params.userId ?? null,
      updatedBy: params.userId ?? null,
    })
    .returning({ id: quotes.id, folio: quotes.folio, status: quotes.status });

  await markOpportunityQuoted(opp.id, params.userId);

  await writeAudit({
    entity: "quote",
    entityId: quote.id,
    action: "create",
    userId: params.userId,
    payload: { folio: quote.folio, opportunityId: opp.id },
  });

  return quote;
}

/** Datos heredados para el formulario de conversión. */
export async function getQuotePrefillFromOpportunity(opportunityId: string) {
  const opp = await getOpportunityById(opportunityId);
  if (!opp) throw new Error("NOT_FOUND");

  const db = getDb();
  const [service] = await db
    .select()
    .from(catalogServices)
    .where(eq(catalogServices.id, opp.serviceId))
    .limit(1);

  return {
    opportunity: opp,
    service: service
      ? {
          contractType: service.contractType,
          periodicityId: service.periodicityId,
          basePrice: service.basePrice,
        }
      : null,
  };
}
