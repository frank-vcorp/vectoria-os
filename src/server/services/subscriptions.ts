import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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
import { getClientById } from "@/server/services/clients";
import { isFiscalComplete } from "@/server/services/invoices";
import { writeAudit } from "@/server/services/audit";
import { createIncomeFromSubscriptionPayment, deleteIncomeBySource } from "@/server/services/financial-incomes";
import { nextFolio } from "@/server/services/folios";

import { getOperationalTimezone } from "@/server/services/settings";
import {
  dueDateAfterPeriodEnd,
  monthEndInTimezone,
  monthStartInTimezone,
} from "@/server/services/operational-dates";

async function operationalMonthEnd(ref: Date): Promise<Date> {
  const tz = await getOperationalTimezone();
  return monthEndInTimezone(ref, tz);
}

async function operationalDueDate(periodEnd: Date): Promise<Date> {
  const tz = await getOperationalTimezone();
  return dueDateAfterPeriodEnd(periodEnd, tz);
}

async function operationalMonthStart(ref: Date): Promise<Date> {
  const tz = await getOperationalTimezone();
  return monthStartInTimezone(ref, tz);
}

const SERVICE_STATUS_TRANSITIONS: Record<SubscriptionServiceStatus, SubscriptionServiceStatus[]> = {
  pendiente_activacion: ["activa", "cancelada"],
  activa: ["pausada", "cancelada"],
  pausada: ["activa", "cancelada"],
  cancelada: [],
};

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
        incomeCategoryId: null,
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
  const periodStart = await operationalMonthStart(now);
  const periodEnd = await operationalMonthEnd(periodStart);
  const dueDate = await operationalDueDate(periodEnd);

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
  let cursor = last ? new Date(last.periodEnd) : await operationalMonthEnd(now);
  const horizon = await operationalMonthEnd(new Date(now.getFullYear(), now.getMonth() + targetMonths, 1));

  while (existing.length < targetMonths || cursor < horizon) {
    const nextStart = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const periodStart = await operationalMonthStart(nextStart);
    const periodEnd = await operationalMonthEnd(periodStart);
    const dueDate = await operationalDueDate(periodEnd);

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
  const current = await getSubscriptionById(params.id);
  if (!current) throw new Error("NOT_FOUND");

  if (params.serviceStatus) {
    const allowed = SERVICE_STATUS_TRANSITIONS[current.serviceStatus] ?? [];
    if (!allowed.includes(params.serviceStatus)) throw new Error("INVALID_TRANSITION");
    if (params.serviceStatus === "activa") {
      await activateSubscription({ id: params.id, userId: params.userId });
      if (params.billingStatus || params.autoInvoice !== undefined) {
        return updateSubscriptionStatus({
          id: params.id,
          billingStatus: params.billingStatus,
          autoInvoice: params.autoInvoice,
          userId: params.userId,
        });
      }
      return getSubscriptionById(params.id);
    }
  }

  if (
    params.billingStatus === "suspendida_adeudo" &&
    current.billingStatus !== "vencida"
  ) {
    throw new Error("INVALID_BILLING_STATUS");
  }

  if (params.autoInvoice === true) {
    const client = await getClientById(current.clientId);
    if (!isFiscalComplete(client?.fiscalData)) throw new Error("FISCAL_INCOMPLETE");
    if (!client?.email?.trim()) throw new Error("EMAIL_REQUIRED");
  }

  const db = getDb();
  const updates: Partial<typeof subscriptions.$inferInsert> = { updatedAt: new Date() };
  const serviceStatusToSet = params.serviceStatus;
  if (serviceStatusToSet) {
    updates.serviceStatus = serviceStatusToSet;
  }
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

  return getSubscriptionById(params.id);
}

export async function getSubscriptionFinancialSummary(subscriptionId: string) {
  const cycles = await listSubscriptionCycles(subscriptionId);
  const payments = await listSubscriptionPayments(subscriptionId);
  const now = new Date();

  let overdueBalance = 0;
  let totalPending = 0;
  let overdueCount = 0;

  for (const c of cycles) {
    const balance = c.amount - c.paidAmount;
    if (balance <= 0) continue;
    totalPending += balance;
    if (c.dueDate < now && c.status !== "pagado") {
      overdueBalance += balance;
      overdueCount += 1;
    }
  }

  const upcoming = cycles
    .filter((c) => c.periodStart > now && c.amount > c.paidAmount)
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())[0];

  return {
    overdueBalance,
    totalPending,
    overdueCount,
    lastPayment: payments[0] ?? null,
    nextCut: upcoming?.periodStart ?? null,
  };
}

export async function listSubscriptions(filters?: { q?: string; view?: string }) {
  const db = getDb();
  const conditions = [];

  const q = filters?.q?.trim();
  if (q) {
    const term = `%${q}%`;
    conditions.push(or(ilike(subscriptions.folio, term), ilike(clients.name, term)));
  }

  const view = filters?.view ?? "attention";
  if (view === "attention") {
    conditions.push(
      or(
        eq(subscriptions.billingStatus, "vencida"),
        eq(subscriptions.billingStatus, "suspendida_adeudo"),
      ),
    );
  } else if (view !== "all") {
    conditions.push(eq(subscriptions.serviceStatus, view as SubscriptionServiceStatus));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
    .where(whereClause)
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

async function reversePaymentFromCycles(subscriptionId: string, amount: number) {
  const db = getDb();
  const cycles = await db
    .select()
    .from(subscriptionCycles)
    .where(eq(subscriptionCycles.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionCycles.dueDate));

  let remaining = amount;
  for (const cycle of cycles) {
    if (remaining <= 0) break;
    if (cycle.paidAmount <= 0) continue;
    const revert = Math.min(remaining, cycle.paidAmount);
    const newPaid = cycle.paidAmount - revert;
    const newStatus = newPaid >= cycle.amount ? "pagado" : "pendiente";
    await db
      .update(subscriptionCycles)
      .set({ paidAmount: newPaid, status: newStatus })
      .where(eq(subscriptionCycles.id, cycle.id));
    remaining -= revert;
  }
}

export async function addSubscriptionPayment(params: {
  subscriptionId: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  isConvenio?: boolean;
  userId?: string;
}) {
  const sub = await getSubscriptionById(params.subscriptionId);
  if (!sub) throw new Error("NOT_FOUND");

  const cycles = await listSubscriptionCycles(params.subscriptionId);
  const totalPending = cycles.reduce(
    (sum, c) => sum + Math.max(0, c.amount - c.paidAmount),
    0,
  );
  if (!params.isConvenio && params.amount > totalPending) {
    throw new Error("PAYMENT_EXCEEDS_BALANCE");
  }

  const concept = `Pago suscripción ${sub.folio}`;
  const db = getDb();
  const [payment] = await db
    .insert(subscriptionPayments)
    .values({
      subscriptionId: params.subscriptionId,
      concept,
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
      concept,
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

export async function deleteSubscriptionPayment(params: {
  subscriptionId: string;
  paymentId: string;
  userId?: string;
}) {
  const db = getDb();
  const [payment] = await db
    .select()
    .from(subscriptionPayments)
    .where(
      and(
        eq(subscriptionPayments.id, params.paymentId),
        eq(subscriptionPayments.subscriptionId, params.subscriptionId),
      ),
    )
    .limit(1);
  if (!payment) throw new Error("NOT_FOUND");

  if (!payment.isConvenio) {
    await reversePaymentFromCycles(params.subscriptionId, payment.amount);
    await deleteIncomeBySource("subscription_payment", payment.id);
  }

  await db.delete(subscriptionPayments).where(eq(subscriptionPayments.id, payment.id));
  await updateBillingStatus(params.subscriptionId);

  await writeAudit({
    entity: "subscription_payment",
    entityId: payment.id,
    action: "cancel",
    userId: params.userId,
    payload: { subscriptionId: params.subscriptionId, amount: payment.amount },
  });
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

export async function createSubscriptionFromServiceOrder(params: {
  serviceOrderId: string;
  subscriptionTemplateId: string;
  description: string;
  price: number;
  periodicityId: string;
  userId?: string;
}) {
  const db = getDb();
  const [os] = await db
    .select({ clientId: serviceOrders.clientId })
    .from(serviceOrders)
    .where(eq(serviceOrders.id, params.serviceOrderId))
    .limit(1);

  if (!os) throw new Error("NOT_FOUND");

  return createSubscriptionsFromQuoteItems({
    serviceOrderId: params.serviceOrderId,
    clientId: os.clientId,
    items: [
      {
        subscriptionTemplateId: params.subscriptionTemplateId,
        description: params.description,
        price: params.price,
        periodicityId: params.periodicityId,
      },
    ],
    userId: params.userId,
  }).then((rows) => rows[0]);
}

export async function activateAllPendingSubscriptions(params: {
  serviceOrderId: string;
  userId?: string;
}) {
  const subs = await listSubscriptionsByServiceOrder(params.serviceOrderId);
  const pending = subs.filter((s) => s.serviceStatus === "pendiente_activacion");
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const sub of pending) {
    try {
      await activateSubscription({ id: sub.id, userId: params.userId });
      results.push({ id: sub.id, ok: true });
    } catch (e) {
      results.push({ id: sub.id, ok: false, error: e instanceof Error ? e.message : "ERROR" });
    }
  }

  return results;
}

export async function listSubscriptionsByServiceOrder(serviceOrderId: string) {
  const db = getDb();
  return db.select().from(subscriptions).where(eq(subscriptions.serviceOrderId, serviceOrderId));
}
