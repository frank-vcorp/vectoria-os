import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { clients, invoices } from "@/server/db/schema";
import type { InvoiceSendStatus, InvoiceStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";
import { sendInvoiceEmail } from "@/server/services/email";
import { stampInvoiceWithFacturapi } from "@/server/services/facturapi";

export async function createInvoiceDraft(params: {
  clientId: string;
  subtotal: number;
  total: number;
  sourceType?: string;
  sourceId?: string;
  userId?: string;
}) {
  const db = getDb();
  const folio = await nextFolio("factura");
  const [invoice] = await db
    .insert(invoices)
    .values({
      folio,
      clientId: params.clientId,
      status: "borrador",
      sendStatus: "pendiente",
      subtotal: params.subtotal,
      total: params.total,
      sourceType: params.sourceType ?? null,
      sourceId: params.sourceId ?? null,
    })
    .returning({ id: invoices.id, folio: invoices.folio, status: invoices.status });

  await writeAudit({
    entity: "invoice",
    entityId: invoice.id,
    action: "create",
    userId: params.userId,
    payload: { folio: invoice.folio },
  });

  return invoice;
}

export async function listInvoices() {
  const db = getDb();
  return db
    .select({
      id: invoices.id,
      folio: invoices.folio,
      clientName: clients.name,
      status: invoices.status,
      sendStatus: invoices.sendStatus,
      total: invoices.total,
      sourceType: invoices.sourceType,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: invoices.id,
      folio: invoices.folio,
      clientId: invoices.clientId,
      clientName: clients.name,
      status: invoices.status,
      sendStatus: invoices.sendStatus,
      subtotal: invoices.subtotal,
      total: invoices.total,
      sourceType: invoices.sourceType,
      sourceId: invoices.sourceId,
      facturapiId: invoices.facturapiId,
      pdfUrl: invoices.pdfUrl,
      xmlUrl: invoices.xmlUrl,
      errorMessage: invoices.errorMessage,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id))
    .limit(1);
  return row ?? null;
}

export async function stampInvoice(params: { id: string; userId?: string }) {
  const db = getDb();
  const invoice = await getInvoiceById(params.id);
  if (!invoice) throw new Error("NOT_FOUND");
  if (invoice.status === "timbrada") throw new Error("ALREADY_STAMPED");

  try {
    const result = await stampInvoiceWithFacturapi({
      folio: invoice.folio,
      clientId: invoice.clientId,
      total: invoice.total,
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

  const db = getDb();
  try {
    await sendInvoiceEmail({
      to: params.email,
      clientName: invoice.clientName,
      folio: invoice.folio,
      pdfUrl: invoice.pdfUrl,
    });

    const [updated] = await db
      .update(invoices)
      .set({ sendStatus: "enviado", updatedAt: new Date() })
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
