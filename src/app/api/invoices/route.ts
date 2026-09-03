import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  createInvoiceDraft,
  createInvoiceFromServiceOrder,
  createInvoiceFromSubscriptionCycle,
  getInvoiceById,
  getStampedInvoiceForCycle,
  listInvoices,
  processAutoSubscriptionInvoices,
  retryStampInvoice,
  sendInvoice,
  stampInvoice,
  updateClientFiscalForInvoice,
  updateInvoiceDraft,
  updateInvoiceStatus,
} from "@/server/services/invoices";

const fiscalSchema = z.object({
  rfc: z.string().optional(),
  razonSocial: z.string().optional(),
  regimenFiscal: z.string().optional(),
  codigoPostal: z.string().optional(),
  usoCfdi: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "read");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const cycleId = searchParams.get("cycleId");

    if (cycleId) {
      const stamped = await getStampedInvoiceForCycle(cycleId);
      return NextResponse.json({ stamped });
    }

    if (id) {
      const invoice = await getInvoiceById(id);
      if (!invoice) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ invoice });
    }

    const search = searchParams.get("search") ?? undefined;
    const invoices = await listInvoices(search);
    return NextResponse.json({ invoices });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("manual"),
    clientId: z.string().uuid(),
    concept: z.string().min(1),
    total: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("from_service_order"),
    serviceOrderId: z.string().uuid(),
    concept: z.string().optional(),
    amount: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("from_cycle"),
    cycleId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("save_fiscal"),
    clientId: z.string().uuid(),
    fiscalData: fiscalSchema,
  }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "write");
    const body = postSchema.parse(await request.json());

    if (body.action === "save_fiscal") {
      await updateClientFiscalForInvoice({
        clientId: body.clientId,
        fiscalData: body.fiscalData,
        userId: user.id,
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "from_service_order") {
      const invoice = await createInvoiceFromServiceOrder({
        serviceOrderId: body.serviceOrderId,
        concept: body.concept,
        amount: body.amount,
        userId: user.id,
      });
      return NextResponse.json({ invoice }, { status: 201 });
    }

    if (body.action === "from_cycle") {
      const invoice = await createInvoiceFromSubscriptionCycle({
        cycleId: body.cycleId,
        userId: user.id,
      });
      return NextResponse.json({ invoice }, { status: 201 });
    }

    const invoice = await createInvoiceDraft({
      clientId: body.clientId,
      concept: body.concept,
      subtotal: body.total,
      total: body.total,
      sourceType: "manual",
      userId: user.id,
    });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "FISCAL_INCOMPLETE" || msg === "CYCLE_ALREADY_INVOICED"
        ? 409
        : msg === "NOT_FOUND"
          ? 404
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    concept: z.string().min(1).optional(),
    total: z.number().int().positive().optional(),
  }),
  z.object({ action: z.literal("stamp"), id: z.string().uuid() }),
  z.object({ action: z.literal("retry_stamp"), id: z.string().uuid() }),
  z.object({ action: z.literal("send"), id: z.string().uuid(), email: z.string().email().optional() }),
  z.object({ action: z.literal("retry_send"), id: z.string().uuid(), email: z.string().email().optional() }),
  z.object({ action: z.literal("cancel"), id: z.string().uuid() }),
  z.object({ action: z.literal("process_auto") }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "write");
    const body = patchSchema.parse(await request.json());

    if (body.action === "update") {
      const invoice = await updateInvoiceDraft({
        id: body.id,
        concept: body.concept,
        total: body.total,
        userId: user.id,
      });
      return NextResponse.json({ invoice });
    }

    if (body.action === "stamp") {
      const invoice = await stampInvoice({ id: body.id, userId: user.id });
      return NextResponse.json({ invoice: await getInvoiceById(body.id) });
    }

    if (body.action === "retry_stamp") {
      const invoice = await retryStampInvoice({ id: body.id, userId: user.id });
      return NextResponse.json({ invoice: await getInvoiceById(body.id) });
    }

    if (body.action === "send" || body.action === "retry_send") {
      const invoice = await sendInvoice({ id: body.id, email: body.email, userId: user.id });
      return NextResponse.json({ invoice: await getInvoiceById(body.id) });
    }

    if (body.action === "process_auto") {
      const results = await processAutoSubscriptionInvoices({ userId: user.id });
      return NextResponse.json({ results });
    }

    const invoice = await updateInvoiceStatus({ id: body.id, status: "cancelada", userId: user.id });
    return NextResponse.json({ invoice });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND"
        ? 404
        : msg === "ALREADY_STAMPED" ||
            msg === "NOT_STAMPED" ||
            msg === "NOT_EDITABLE" ||
            msg === "INVALID_STATUS" ||
            msg === "FISCAL_INCOMPLETE" ||
            msg === "EMAIL_REQUIRED" ||
            msg === "FACTURAPI_DISABLED" ||
            msg === "FACTURAPI_NOT_CONFIGURED" ||
            msg === "SENDGRID_DISABLED" ||
            msg === "SENDGRID_NOT_CONFIGURED" ||
            msg.startsWith("FACTURAPI_ERROR:") ||
            msg.startsWith("SENDGRID_ERROR:")
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
