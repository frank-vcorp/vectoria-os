import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  clients,
  invoices,
  serviceOrders,
  subscriptionCycles,
  subscriptions,
} from "@/server/db/schema";
import type { ClientFiscalData, InvoiceSendStatus, InvoiceStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { getClientById } from "@/server/services/clients";
import { nextFolio } from "@/server/services/folios";
import { sendInvoiceEmail } from "@/server/services/email";
import { stampInvoiceWithFacturapi } from "@/server/services/facturapi";
import { getServiceOrderById } from "@/server/services/service-orders";
import { getSubscriptionById } from "@/server/services/subscriptions";
import { folioOrClientNameFilter } from "@/server/services/list-search";

export function isFiscalComplete(data: ClientFiscalData | null | undefined) {
  if (!data) return false;
  return Boolean(
    data.rfc?.trim() &&
      data.razonSocial?.trim() &&
      data.regimenFiscal?.trim() &&
      data.codigoPostal?.trim() &&
      data.usoCfdi?.trim(),
  );
}

async function assertClientReadyForInvoice(clientId: string) {
  const client = await getClientById(clientId);
  if (!client) throw new Error("NOT_FOUND");
  if (!isFiscalComplete(client.fiscalData)) throw new Error("FISCAL_INCOMPLETE");
  return client;
}

export async function getStampedInvoiceForCycle(cycleId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: invoices.id, folio: invoices.folio, status: invoices.status })
    .from(invoices)
    .where(and(eq(invoices.cycleId, cycleId), eq(invoices.status, "timbrada")))
    .limit(1);
  return row ?? null;
}

export async function createInvoiceDraft(params: {
  clientId: string;
  concept: string;
  subtotal: number;
  total: number;
  sourceType?: string;
  sourceId?: string;
  cycleId?: string | null;
  userId?: string;
}) {
  if (params.cycleId) {
    const existing = await getStampedInvoiceForCycle(params.cycleId);
    if (existing) throw new Error("CYCLE_ALREADY_INVOICED");
  }

  await assertClientReadyForInvoice(params.clientId);

  const db = getDb();
  const folio = await nextFolio("factura");
  const [invoice] = await db
    .insert(invoices)
    .values({
      folio,
      clientId: params.clientId,
      concept: params.concept.trim(),
      status: "borrador",
      sendStatus: "pendiente",
      subtotal: params.subtotal,
      total: params.total,
      sourceType: params.sourceType ?? "manual",
      sourceId: params.sourceId ?? null,
      cycleId: params.cycleId ?? null,
    })
    .returning({ id: invoices.id, folio: invoices.folio, status: invoices.status });

  await writeAudit({
    entity: "invoice",
    entityId: invoice.id,
    action: "create",
    userId: params.userId,
    payload: { folio: invoice.folio, sourceType: params.sourceType },
  });

  return invoice;
}

export async function createInvoiceFromServiceOrder(params: {
  serviceOrderId: string;
  concept?: string;
  amount?: number;
  userId?: string;
}) {
  const order = await getServiceOrderById(params.serviceOrderId);
  if (!order) throw new Error("NOT_FOUND");

  const amount = params.amount ?? order.price;
  const concept = params.concept?.trim() || `${order.serviceName} — ${order.folio}`;

  return createInvoiceDraft({
    clientId: order.clientId,
    concept,
    subtotal: amount,
    total: amount,
    sourceType: "service_order",
    sourceId: params.serviceOrderId,
    userId: params.userId,
  });
}

export async function createInvoiceFromSubscriptionCycle(params: {
  cycleId: string;
  sourceType?: string;
  userId?: string;
}) {
  const db = getDb();
  const [row] = await db
    .select({
      cycleId: subscriptionCycles.id,
      amount: subscriptionCycles.amount,
      periodStart: subscriptionCycles.periodStart,
      periodEnd: subscriptionCycles.periodEnd,
      subscriptionId: subscriptions.id,
      clientId: subscriptions.clientId,
      description: subscriptions.description,
      folio: subscriptions.folio,
    })
    .from(subscriptionCycles)
    .innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
    .where(eq(subscriptionCycles.id, params.cycleId))
    .limit(1);

  if (!row) throw new Error("NOT_FOUND");

  const periodLabel = `${row.periodStart.toLocaleDateString("es-MX")} — ${row.periodEnd.toLocaleDateString("es-MX")}`;
  const concept = `${row.description} (${row.folio}) — ${periodLabel}`;

  return createInvoiceDraft({
    clientId: row.clientId,
    concept,
    subtotal: row.amount,
    total: row.amount,
    sourceType: params.sourceType ?? "subscription_cycle",
    sourceId: params.cycleId,
    cycleId: params.cycleId,
    userId: params.userId,
  });
}

import { getOperationalTimezone } from "@/server/services/settings";
import { datePartsInTimezone, zonedLocalToUtc } from "@/server/services/operational-dates";

async function cycleEligibleForAutoInvoice(periodEnd: Date, now: Date) {
  const tz = await getOperationalTimezone();
  const { year, month } = datePartsInTimezone(periodEnd, tz);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const eligible = zonedLocalToUtc(nextYear, nextMonth, 1, 0, 0, 0, 0, tz);
  return now >= eligible;
}

export async function processAutoSubscriptionInvoices(params?: { userId?: string }) {
  const db = getDb();
  const activeSubs = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.autoInvoice, true), eq(subscriptions.serviceStatus, "activa")));

  const now = new Date();
  const results: { cycleId: string; ok: boolean; invoiceId?: string; error?: string }[] = [];

  for (const sub of activeSubs) {
    const full = await getSubscriptionById(sub.id);
    if (!full) continue;
    const client = await getClientById(full.clientId);
    if (!client?.email?.trim() || !isFiscalComplete(client.fiscalData)) continue;

    const cycles = await db
      .select()
      .from(subscriptionCycles)
      .where(eq(subscriptionCycles.subscriptionId, sub.id));

    for (const cycle of cycles) {
      if (!(await cycleEligibleForAutoInvoice(cycle.periodEnd, now))) continue;
      const stamped = await getStampedInvoiceForCycle(cycle.id);
      if (stamped) {
        results.push({ cycleId: cycle.id, ok: true, invoiceId: stamped.id });
        continue;
      }

      try {
        const draft = await createInvoiceFromSubscriptionCycle({
          cycleId: cycle.id,
          sourceType: "auto_subscription",
          userId: params?.userId,
        });
        await stampInvoice({ id: draft.id, userId: params?.userId });
        try {
          await sendInvoice({ id: draft.id, userId: params?.userId });
        } catch {
          // Timbrada pero envío falló — queda en error de envío
        }
        results.push({ cycleId: cycle.id, ok: true, invoiceId: draft.id });
      } catch (e) {
        results.push({
          cycleId: cycle.id,
          ok: false,
          error: e instanceof Error ? e.message : "ERROR",
        });
      }
    }
  }

  return results;
}

export async function updateInvoiceDraft(params: {
  id: string;
  concept?: string;
  total?: number;
  userId?: string;
}) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) throw new Error("NOT_FOUND");
  if (invoice.status !== "borrador") throw new Error("NOT_EDITABLE");

  const db = getDb();
  const updates: Partial<typeof invoices.$inferInsert> = { updatedAt: new Date() };
  if (params.concept !== undefined) updates.concept = params.concept.trim();
  if (params.total !== undefined) {
    updates.total = params.total;
    updates.subtotal = params.total;
  }

  const [updated] = await db
    .update(invoices)
    .set(updates)
    .where(eq(invoices.id, params.id))
    .returning({ id: invoices.id });

  if (!updated) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "invoice",
    entityId: params.id,
    action: "update",
    userId: params.userId,
    payload: updates,
  });

  return getInvoiceById(params.id);
}

export async function listInvoices(search?: string) {
  const db = getDb();
  const base = db
    .select({
      id: invoices.id,
      folio: invoices.folio,
      clientName: clients.name,
      concept: invoices.concept,
      status: invoices.status,
      sendStatus: invoices.sendStatus,
      total: invoices.total,
      sourceType: invoices.sourceType,
      sourceId: invoices.sourceId,
      cycleId: invoices.cycleId,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id));

  const filter = folioOrClientNameFilter(search, invoices.folio, clients.name);
  if (filter) return base.where(filter).orderBy(desc(invoices.createdAt));
  return base.orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: invoices.id,
      folio: invoices.folio,
      clientId: invoices.clientId,
      clientName: clients.name,
      clientEmail: clients.email,
      clientFiscalData: clients.fiscalData,
      concept: invoices.concept,
      status: invoices.status,
      sendStatus: invoices.sendStatus,
      subtotal: invoices.subtotal,
      total: invoices.total,
      sourceType: invoices.sourceType,
      sourceId: invoices.sourceId,
      cycleId: invoices.cycleId,
      subscriptionId: subscriptions.id,
      subscriptionFolio: subscriptions.folio,
      facturapiId: invoices.facturapiId,
      pdfUrl: invoices.pdfUrl,
      xmlUrl: invoices.xmlUrl,
      errorMessage: invoices.errorMessage,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(subscriptionCycles, eq(invoices.cycleId, subscriptionCycles.id))
    .leftJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
    .where(eq(invoices.id, id))
    .limit(1);
  return row ?? null;
}

export async function stampInvoice(params: { id: string; userId?: string }) {
  const db = getDb();
  const invoice = await getInvoiceById(params.id);
  if (!invoice) throw new Error("NOT_FOUND");
  if (invoice.status === "timbrada") throw new Error("ALREADY_STAMPED");
  await assertClientReadyForInvoice(invoice.clientId);

  try {
    const result = await stampInvoiceWithFacturapi({
      folio: invoice.folio,
      clientId: invoice.clientId,
      total: invoice.total,
      concept: invoice.concept,
    });

    const [updated] = await db
      .update(invoices)
      .set({
        status: "timbrada",
        facturapiId: result.facturapiId,
        pdfUrl: result.pdfUrl,
        xmlUrl: result.xmlUrl,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, params.id))
      .returning({ id: invoices.id, status: invoices.status });

    await writeAudit({
      entity: "invoice",
      entityId: params.id,
      action: "update",
      userId: params.userId,
      payload: { stamped: true },
    });

    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "STAMP_ERROR";
    await db
      .update(invoices)
      .set({ status: "error", errorMessage: message, updatedAt: new Date() })
      .where(eq(invoices.id, params.id));
    throw e;
  }
}

export async function sendInvoice(params: { id: string; email?: string; userId?: string }) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) throw new Error("NOT_FOUND");
  if (invoice.status !== "timbrada") throw new Error("NOT_STAMPED");

  const to = params.email?.trim() || invoice.clientEmail?.trim();
  if (!to) throw new Error("EMAIL_REQUIRED");

  const db = getDb();
  try {
    await sendInvoiceEmail({
      to,
      clientName: invoice.clientName,
      folio: invoice.folio,
      pdfUrl: invoice.pdfUrl,
    });

    const [updated] = await db
      .update(invoices)
      .set({ sendStatus: "enviado", errorMessage: null, updatedAt: new Date() })
      .where(eq(invoices.id, params.id))
      .returning({ id: invoices.id, sendStatus: invoices.sendStatus });

    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "SEND_ERROR";
    await db
      .update(invoices)
      .set({ sendStatus: "error", errorMessage: message, updatedAt: new Date() })
      .where(eq(invoices.id, params.id));
    throw e;
  }
}

export async function retryStampInvoice(params: { id: string; userId?: string }) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) throw new Error("NOT_FOUND");
  if (invoice.status !== "error") throw new Error("INVALID_STATUS");

  const db = getDb();
  await db
    .update(invoices)
    .set({ status: "borrador", errorMessage: null, updatedAt: new Date() })
    .where(eq(invoices.id, params.id));

  return stampInvoice({ id: params.id, userId: params.userId });
}

export async function updateInvoiceStatus(params: {
  id: string;
  status?: InvoiceStatus;
  sendStatus?: InvoiceSendStatus;
  userId?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof invoices.$inferInsert> = { updatedAt: new Date() };
  if (params.status) updates.status = params.status;
  if (params.sendStatus) updates.sendStatus = params.sendStatus;

  const [invoice] = await db
    .update(invoices)
    .set(updates)
    .where(eq(invoices.id, params.id))
    .returning({ id: invoices.id, status: invoices.status, sendStatus: invoices.sendStatus });

  if (!invoice) throw new Error("NOT_FOUND");
  return invoice;
}

export async function updateClientFiscalForInvoice(params: {
  clientId: string;
  fiscalData: ClientFiscalData;
  userId?: string;
}) {
  const db = getDb();
  const [client] = await db
    .update(clients)
    .set({ fiscalData: params.fiscalData, updatedAt: new Date() })
    .where(eq(clients.id, params.clientId))
    .returning({ id: clients.id });

  if (!client) throw new Error("NOT_FOUND");
  if (!isFiscalComplete(params.fiscalData)) throw new Error("FISCAL_INCOMPLETE");

  await writeAudit({
    entity: "client",
    entityId: params.clientId,
    action: "update",
    userId: params.userId,
    payload: { fiscalData: true },
  });

  return client;
}
