import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  bankAccounts,
  catalogPaymentConditions,
  catalogPeriodicities,
  catalogServices,
  clients,
  quotes,
  serviceOrderPayments,
  serviceOrders,
  users,
} from "@/server/db/schema";
import type { ServiceOrderStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { createIncomeFromOsPayment } from "@/server/services/financial-incomes";
import { nextFolio } from "@/server/services/folios";
import { createProjectFromServiceOrder } from "@/server/services/projects";
import { createSubscriptionsFromQuoteItems } from "@/server/services/subscriptions";
import { listQuoteSubscriptionItems, getQuoteById, setQuoteStatus } from "@/server/services/quotes";

type CreateOsInput = {
  clientId: string;
  quoteId?: string | null;
  sellerId: string;
  serviceId: string;
  description: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId?: string | null;
  price: number;
  paymentConditionId?: string | null;
  deliveryDate: Date;
  observations?: string | null;
  programmerId?: string | null;
  userId?: string;
};

async function insertServiceOrder(input: CreateOsInput) {
  const db = getDb();
  if (input.contractType === "suscripcion" && !input.periodicityId) {
    throw new Error("PERIODICITY_REQUIRED");
  }

  const folio = await nextFolio("orden_servicio");
  const [order] = await db
    .insert(serviceOrders)
    .values({
      folio,
      clientId: input.clientId,
      quoteId: input.quoteId ?? null,
      sellerId: input.sellerId,
      serviceId: input.serviceId,
      description: input.description.trim(),
      contractType: input.contractType,
      periodicityId: input.contractType === "suscripcion" ? input.periodicityId : null,
      price: input.price,
      paymentConditionId: input.paymentConditionId ?? null,
      deliveryDate: input.deliveryDate,
      observations: input.observations?.trim() || null,
      programmerId: input.programmerId ?? null,
      status: "creada",
      createdBy: input.userId ?? null,
      updatedBy: input.userId ?? null,
    })
    .returning({ id: serviceOrders.id, folio: serviceOrders.folio, status: serviceOrders.status });

  await writeAudit({
    entity: "service_order",
    entityId: order.id,
    action: "create",
    userId: input.userId,
    payload: { folio: order.folio, quoteId: input.quoteId },
  });

  return order;
}

export async function createServiceOrderFromQuote(params: {
  quoteId: string;
  deliveryDate: Date;
  programmerId?: string | null;
  userId?: string;
}) {
  const quote = await getQuoteById(params.quoteId);
  if (!quote) throw new Error("NOT_FOUND");
  if (quote.status !== "cotizada") throw new Error("INVALID_STATUS");

  const db = getDb();
  const [existing] = await db
    .select({ id: serviceOrders.id })
    .from(serviceOrders)
    .where(eq(serviceOrders.quoteId, params.quoteId))
    .limit(1);
  if (existing) throw new Error("OS_EXISTS");

  const order = await insertServiceOrder({
    clientId: quote.clientId,
    quoteId: quote.id,
    sellerId: quote.sellerId,
    serviceId: quote.serviceId,
    description: quote.description,
    contractType: "por_evento",
    periodicityId: null,
    price: quote.price,
    paymentConditionId: quote.paymentConditionId,
    deliveryDate: params.deliveryDate,
    observations: quote.observations,
    programmerId: params.programmerId ?? null,
    userId: params.userId,
  });

  const subscriptionItems = quote.subscriptionItems ?? (await listQuoteSubscriptionItems(params.quoteId));
  if (subscriptionItems.length > 0) {
    await createSubscriptionsFromQuoteItems({
      serviceOrderId: order.id,
      clientId: quote.clientId,
      items: subscriptionItems.map((item) => ({
        subscriptionTemplateId: item.subscriptionTemplateId,
        description: item.description,
        price: item.price,
        periodicityId: item.periodicityId,
      })),
      userId: params.userId,
    });
  }

  try {
    await createProjectFromServiceOrder({
      serviceOrderId: order.id,
      programmerId: params.programmerId ?? null,
      userId: params.userId,
    });
  } catch (e) {
    if (!(e instanceof Error && e.message === "NO_PROJECT")) throw e;
  }

  await setQuoteStatus(params.quoteId, "autorizada", params.userId);
  return order;
}

export async function createServiceOrderDirect(params: CreateOsInput) {
  return insertServiceOrder(params);
}

export async function listServiceOrders() {
  const db = getDb();
  return db
    .select({
      id: serviceOrders.id,
      folio: serviceOrders.folio,
      clientId: serviceOrders.clientId,
      clientName: clients.name,
      quoteId: serviceOrders.quoteId,
      quoteFolio: quotes.folio,
      sellerName: users.name,
      serviceName: catalogServices.name,
      price: serviceOrders.price,
      deliveryDate: serviceOrders.deliveryDate,
      status: serviceOrders.status,
      createdAt: serviceOrders.createdAt,
    })
    .from(serviceOrders)
    .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
    .leftJoin(quotes, eq(serviceOrders.quoteId, quotes.id))
    .innerJoin(users, eq(serviceOrders.sellerId, users.id))
    .innerJoin(catalogServices, eq(serviceOrders.serviceId, catalogServices.id))
    .orderBy(desc(serviceOrders.createdAt));
}

export async function getServiceOrderById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: serviceOrders.id,
      folio: serviceOrders.folio,
      clientId: serviceOrders.clientId,
      clientName: clients.name,
      quoteId: serviceOrders.quoteId,
      quoteFolio: quotes.folio,
      sellerId: serviceOrders.sellerId,
      sellerName: users.name,
      serviceId: serviceOrders.serviceId,
      serviceName: catalogServices.name,
      description: serviceOrders.description,
      contractType: serviceOrders.contractType,
      periodicityId: serviceOrders.periodicityId,
      periodicityName: catalogPeriodicities.name,
      price: serviceOrders.price,
      paymentConditionId: serviceOrders.paymentConditionId,
      paymentConditionName: catalogPaymentConditions.name,
      deliveryDate: serviceOrders.deliveryDate,
      observations: serviceOrders.observations,
      programmerId: serviceOrders.programmerId,
      status: serviceOrders.status,
      createdAt: serviceOrders.createdAt,
    })
    .from(serviceOrders)
    .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
    .leftJoin(quotes, eq(serviceOrders.quoteId, quotes.id))
    .innerJoin(users, eq(serviceOrders.sellerId, users.id))
    .innerJoin(catalogServices, eq(serviceOrders.serviceId, catalogServices.id))
    .leftJoin(catalogPeriodicities, eq(serviceOrders.periodicityId, catalogPeriodicities.id))
    .leftJoin(catalogPaymentConditions, eq(serviceOrders.paymentConditionId, catalogPaymentConditions.id))
    .where(eq(serviceOrders.id, id))
    .limit(1);
  return row ?? null;
}

export async function getServiceOrderPaymentSummary(serviceOrderId: string) {
  const db = getDb();
  const [totals] = await db
    .select({ totalPaid: sql<number>`coalesce(sum(${serviceOrderPayments.amount}), 0)` })
    .from(serviceOrderPayments)
    .where(eq(serviceOrderPayments.serviceOrderId, serviceOrderId));

  const order = await getServiceOrderById(serviceOrderId);
  if (!order) throw new Error("NOT_FOUND");

  const totalPaid = Number(totals?.totalPaid ?? 0);
  const balance = order.price - totalPaid;
  const paymentType = totalPaid >= order.price ? "pago_total" : totalPaid > 0 ? "abono" : "sin_pago";

  return { total: order.price, totalPaid, balance, paymentType };
}

export async function listServiceOrderPayments(serviceOrderId: string) {
  const db = getDb();
  return db
    .select({
      id: serviceOrderPayments.id,
      concept: serviceOrderPayments.concept,
      amount: serviceOrderPayments.amount,
      paymentDate: serviceOrderPayments.paymentDate,
      bankAccountName: bankAccounts.name,
    })
    .from(serviceOrderPayments)
    .innerJoin(bankAccounts, eq(serviceOrderPayments.bankAccountId, bankAccounts.id))
    .where(eq(serviceOrderPayments.serviceOrderId, serviceOrderId))
    .orderBy(desc(serviceOrderPayments.paymentDate));
}

export async function addServiceOrderPayment(params: {
  serviceOrderId: string;
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  userId?: string;
}) {
  const order = await getServiceOrderById(params.serviceOrderId);
  if (!order) throw new Error("NOT_FOUND");
  if (order.status === "cancelada") throw new Error("INVALID_STATUS");

  const db = getDb();
  const [payment] = await db
    .insert(serviceOrderPayments)
    .values({
      serviceOrderId: params.serviceOrderId,
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      paymentDate: params.paymentDate,
      createdBy: params.userId ?? null,
    })
    .returning({ id: serviceOrderPayments.id });

  await createIncomeFromOsPayment({
    concept: params.concept.trim(),
    amount: params.amount,
    bankAccountId: params.bankAccountId,
    paymentDate: params.paymentDate,
    paymentId: payment.id,
    userId: params.userId,
  });

  await writeAudit({
    entity: "service_order_payment",
    entityId: payment.id,
    action: "create",
    userId: params.userId,
    payload: { serviceOrderId: params.serviceOrderId, amount: params.amount },
  });

  return payment;
}

export async function updateServiceOrderStatus(params: {
  id: string;
  status: ServiceOrderStatus;
  userId?: string;
  isAdmin?: boolean;
}) {
  if (params.status === "cancelada" && !params.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const db = getDb();
  const [order] = await db
    .update(serviceOrders)
    .set({
      status: params.status,
      updatedAt: new Date(),
      updatedBy: params.userId ?? null,
    })
    .where(eq(serviceOrders.id, params.id))
    .returning({ id: serviceOrders.id, folio: serviceOrders.folio, status: serviceOrders.status });

  if (!order) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "service_order",
    entityId: order.id,
    action: params.status === "cancelada" ? "cancel" : "update",
    userId: params.userId,
    payload: { status: params.status },
  });

  return order;
}
