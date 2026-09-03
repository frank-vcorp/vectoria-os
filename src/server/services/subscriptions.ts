import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  bankAccounts,
  catalogIncomeCategories,
  catalogPeriodicities,
  catalogSubscriptionTemplates,
  clients,
  serviceOrders,
  subscriptionCycles,
  subscriptionPayments,
  subscriptions,
} from "@/server/db/schema";
import type { SubscriptionBillingStatus, SubscriptionServiceStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { createIncomeFromSubscriptionPayment } from "@/server/services/financial-incomes";
import { nextFolio } from "@/server/services/folios";

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dueDateForPeriod(periodEnd: Date): Date {
  return new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 5, 23, 59, 59, 999);
}

export async function createSubscriptionsFromQuoteItems(params: {
  serviceOrderId: string;
  clientId: string;
  items: {
    subscriptionTemplateId: string;
    description: string;
    price: number;
    periodicityId: string;
  }[];
  userId?: string;
}) {
  const db = getDb();
  const created = [];

  for (const item of params.items) {
    const [template] = await db
      .select({ incomeCategoryId: catalogSubscriptionTemplates.incomeCategoryId })
      .from(catalogSubscriptionTemplates)
      .where(eq(catalogSubscriptionTemplates.id, item.subscriptionTemplateId))
      .limit(1);

    const folio = await nextFolio("suscripcion");
    const [sub] = await db
      .insert(subscriptions)
      .values({
        folio,
        clientId: params.clientId,
        serviceOrderId: params.serviceOrderId,
        subscriptionTemplateId: item.subscriptionTemplateId,
        description: item.description,
        price: item.price,
        periodicityId: item.periodicityId,
        incomeCategoryId: template?.incomeCategoryId ?? null,
        serviceStatus: "pendiente_activacion",
        billingStatus: "al_corriente",
      })
      .returning({ id: subscriptions.id, folio: subscriptions.folio });

    await writeAudit({
      entity: "subscription",
      entityId: sub.id,
      action: "create",
      userId: params.userId,
      payload: { serviceOrderId: params.serviceOrderId, folio: sub.folio },
    });

    created.push(sub);
  }

  return created;
}

export async function generateInitialCycle(subscriptionId: string, price: number) {
  const db = getDb();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = monthEnd(periodStart);
  const dueDate = dueDateForPeriod(periodEnd);

  const [cycle] = await db
    .insert(subscriptionCycles)
    .values({
      subscriptionId,
      periodStart,
      periodEnd,
      dueDate,
      amount: price,
      paidAmount: 0,
      status: "pendiente",
    })
    .returning({ id: subscriptionCycles.id });

  return cycle;
}

export async function ensureFutureCycles(subscriptionId: string) {
  const db = getDb();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub || sub.serviceStatus !== "activa") return;

  const [periodicity] = await db
    .select({ intervalMonths: catalogPeriodicities.intervalMonths })
    .from(catalogPeriodicities)
    .where(eq(catalogPeriodicities.id, sub.periodicityId))
    .limit(1);

  const existing = await db
    .select()
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionCycles.periodEnd));

  const last = existing[0];
  const now = new Date();
  const targetMonths = 3;
  let cursor = last ? new Date(last.periodEnd) : monthEnd(now);

  while (existing.length < targetMonths || cursor < monthEnd(new Date(now.getFullYear(), now.getMonth() + targetMonths, 1))) {
    const periodStart = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const periodEnd = monthEnd(periodStart);
    const dueDate = dueDateForPeriod(periodEnd);

    const dup = existing.some(
      (c) => c.periodStart.getTime() === periodStart.getTime() && c.periodEnd.getTime() === periodEnd.getTime(),
    );
    if (dup) break;

    await db.insert(subscriptionCycles).values({
      subscriptionId,
      periodStart,
      periodEnd,
      dueDate,
      amount: sub.price,
      paidAmount: 0,
      status: "pendiente",
    });

    cursor = periodEnd;
    existing.push({
      id: "",
      subscriptionId,
      periodStart,
      periodEnd,
      dueDate,
      amount: sub.price,
      paidAmount: 0,
      status: "pendiente",
      createdAt: new Date(),
    });
    if (existing.length > 12) break;
  }

  void periodicity;
}

export async function activateSubscription(params: { id: string; userId?: string }) {
  const db = getDb();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, params.id)).limit(1);
  if (!sub) throw new Error("NOT_FOUND");
  if (sub.serviceStatus !== "pendiente_activacion" && sub.serviceStatus !== "pausada") {
    throw new Error("INVALID_STATUS");
  }

  const now = new Date();
  await db
    .update(subscriptions)
    .set({
      serviceStatus: "activa",
      activatedAt: sub.activatedAt ?? now,
      reactivatedAt: sub.serviceStatus === "pausada" ? now : sub.reactivatedAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, params.id));

  const [cycleCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, params.id));

  if ((cycleCount?.count ?? 0) === 0) {
    await generateInitialCycle(params.id, sub.price);
  }

  await ensureFutureCycles(params.id);

  await writeAudit({
    entity: "subscription",
    entityId: params.id,
    action: "update",
    userId: params.userId,
    payload: { serviceStatus: "activa" },
  });
}

export async function updateSubscriptionStatus(params: {
  id: string;
  serviceStatus?: SubscriptionServiceStatus;
  billingStatus?: SubscriptionBillingStatus;
  autoInvoice?: boolean;
  userId?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof subscriptions.$inferInsert> = { updatedAt: new Date() };
  if (params.serviceStatus) updates.serviceStatus = params.serviceStatus;
  if (params.billingStatus) updates.billingStatus = params.billingStatus;
  if (params.autoInvoice !== undefined) updates.autoInvoice = params.autoInvoice;

  const [sub] = await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.id, params.id))
    .returning({ id: subscriptions.id, folio: subscriptions.folio });

  if (!sub) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "subscription",
    entityId: sub.id,
    action: "update",
    userId: params.userId,
    payload: updates,
  });

  return sub;
}

export async function listSubscriptions() {
  const db = getDb();
  return db
    .select({
      id: subscriptions.id,
      folio: subscriptions.folio,
      clientId: subscriptions.clientId,
      clientName: clients.name,
      serviceOrderId: subscriptions.serviceOrderId,
      serviceOrderFolio: serviceOrders.folio,
      description: subscriptions.description,
      price: subscriptions.price,
      periodicityName: catalogPeriodicities.name,
      serviceStatus: subscriptions.serviceStatus,
      billingStatus: subscriptions.billingStatus,
      autoInvoice: subscriptions.autoInvoice,
      activatedAt: subscriptions.activatedAt,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(clients, eq(subscriptions.clientId, clients.id))
    .innerJoin(serviceOrders, eq(subscriptions.serviceOrderId, serviceOrders.id))
    .innerJoin(catalogPeriodicities, eq(subscriptions.periodicityId, catalogPeriodicities.id))
    .orderBy(desc(subscriptions.createdAt));
}

export async function getSubscriptionById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: subscriptions.id,
      folio: subscriptions.folio,
      clientId: subscriptions.clientId,
      clientName: clients.name,
      serviceOrderId: subscriptions.serviceOrderId,
      serviceOrderFolio: serviceOrders.folio,
      subscriptionTemplateId: subscriptions.subscriptionTemplateId,
      templateName: catalogSubscriptionTemplates.name,
      description: subscriptions.description,
      price: subscriptions.price,
      periodicityId: subscriptions.periodicityId,
      periodicityName: catalogPeriodicities.name,
      incomeCategoryId: subscriptions.incomeCategoryId,
      incomeCategoryName: catalogIncomeCategories.name,
      serviceStatus: subscriptions.serviceStatus,
      billingStatus: subscriptions.billingStatus,
      autoInvoice: subscriptions.autoInvoice,
      activatedAt: subscriptions.activatedAt,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(clients, eq(subscriptions.clientId, clients.id))
    .innerJoin(serviceOrders, eq(subscriptions.serviceOrderId, serviceOrders.id))
    .innerJoin(catalogPeriodicities, eq(subscriptions.periodicityId, catalogPeriodicities.id))
    .leftJoin(catalogSubscriptionTemplates, eq(subscriptions.subscriptionTemplateId, catalogSubscriptionTemplates.id))
    .leftJoin(catalogIncomeCategories, eq(subscriptions.incomeCategoryId, catalogIncomeCategories.id))
    .where(eq(subscriptions.id, id))
    .limit(1);
  return row ?? null;
}

export async function listSubscriptionCycles(subscriptionId: string) {
  const db = getDb();
  return db
    .select()
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionCycles.periodStart));
}

export async function listSubscriptionPayments(subscriptionId: string) {
  const db = getDb();
  return db
    .select({
      id: subscriptionPayments.id,
      concept: subscriptionPayments.concept,
      amount: subscriptionPayments.amount,
      paymentDate: subscriptionPayments.paymentDate,
      isConvenio: subscriptionPayments.isConvenio,
      bankAccountName: bankAccounts.name,
    })
    .from(subscriptionPayments)
    .innerJoin(bankAccounts, eq(subscriptionPayments.bankAccountId, bankAccounts.id))
    .where(eq(subscriptionPayments.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionPayments.paymentDate));
}

async function applyPaymentToCycles(subscriptionId: string, amount: number) {
  const db = getDb();
  const cycles = await db
    .select()
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, subscriptionId))
    .orderBy(subscriptionCycles.dueDate);

  let remaining = amount;
  for (const cycle of cycles) {
    if (remaining <= 0) break;
    if (cycle.status === "pagado") continue;
    const pending = cycle.amount - cycle.paidAmount;
    if (pending <= 0) continue;

    const applied = Math.min(remaining, pending);
    const newPaid = cycle.paidAmount + applied;
    const newStatus = newPaid >= cycle.amount ? "pagado" : cycle.status;

    await db
      .update(subscriptionCycles)
      .set({ paidAmount: newPaid, status: newStatus })
      .where(eq(subscriptionCycles.id, cycle.id));

    remaining -= applied;
  }
}

export async function addSubscriptionPayment(params: {
  subscriptionId: string;
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  isConvenio?: boolean;
  userId?: string;
}) {
  const sub = await getSubscriptionById(params.subscriptionId);
  if (!sub) throw new Error("NOT_FOUND");

  const db = getDb();
  const [payment] = await db
    .insert(subscriptionPayments)
    .values({
      subscriptionId: params.subscriptionId,
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      paymentDate: params.paymentDate,
      isConvenio: params.isConvenio ?? false,
      createdBy: params.userId ?? null,
    })
    .returning({ id: subscriptionPayments.id });

  if (!params.isConvenio) {
    await applyPaymentToCycles(params.subscriptionId, params.amount);
    await createIncomeFromSubscriptionPayment({
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      paymentDate: params.paymentDate,
      paymentId: payment.id,
      categoryId: sub.incomeCategoryId ?? undefined,
      userId: params.userId,
    });
  }

  await updateBillingStatus(params.subscriptionId);

  await writeAudit({
    entity: "subscription_payment",
    entityId: payment.id,
    action: "create",
    userId: params.userId,
    payload: { subscriptionId: params.subscriptionId, amount: params.amount },
  });

  return payment;
}

async function updateBillingStatus(subscriptionId: string) {
  const db = getDb();
  const now = new Date();
  const cycles = await db
    .select()
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, subscriptionId));

  const hasOverdue = cycles.some(
    (c) => c.status !== "pagado" && c.dueDate < now && c.amount > c.paidAmount,
  );

  await db
    .update(subscriptions)
    .set({
      billingStatus: hasOverdue ? "vencida" : "al_corriente",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function listSubscriptionsByServiceOrder(serviceOrderId: string) {
  const db = getDb();
  return db.select().from(subscriptions).where(eq(subscriptions.serviceOrderId, serviceOrderId));
}
