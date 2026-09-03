import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  cancelQuote,
  createQuoteDirect,
  createQuoteFromOpportunity,
  getQuoteById,
  getQuotePrefillFromService,
  listQuotes,
  rejectQuote,
  updateQuote,
} from "@/server/services/quotes";
import { createServiceOrderFromQuote } from "@/server/services/service-orders";
import { sendQuotePdfEmail } from "@/server/services/email";

const subscriptionItemSchema = z.object({
  subscriptionTemplateId: z.string().uuid(),
  description: z.string().min(1),
  price: z.number().int().nonnegative(),
  periodicityId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "read");
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("prefillService");

    if (serviceId) {
      const prefill = await getQuotePrefillFromService(serviceId);
      return NextResponse.json(prefill);
    }

    const search = searchParams.get("search") ?? undefined;
    const quotes = await listQuotes(search);
    return NextResponse.json({ quotes });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}

const directSchema = z.object({
  mode: z.literal("direct"),
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  description: z.string().min(1),
  price: z.number().int().nonnegative(),
  deliveryTime: z.string().min(1),
  paymentConditionId: z.string().uuid(),
  observations: z.string().optional().nullable(),
  subscriptionItems: z.array(subscriptionItemSchema).optional().default([]),
});

const fromOpportunitySchema = z.object({
  mode: z.literal("opportunity").optional(),
  opportunityId: z.string().uuid(),
  deliveryTime: z.string().min(1),
  paymentConditionId: z.string().uuid(),
  price: z.number().int().nonnegative().optional(),
  observations: z.string().optional().nullable(),
  subscriptionItems: z.array(subscriptionItemSchema).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "write");
    const body = await request.json();

    if (body.mode === "direct") {
      const parsed = directSchema.parse(body);
      const quote = await createQuoteDirect({
        ...parsed,
        sellerId: user.id,
        userId: user.id,
      });
      return NextResponse.json({ quote }, { status: 201 });
    }

    const parsed = fromOpportunitySchema.parse(body);
    const quote = await createQuoteFromOpportunity({ ...parsed, userId: user.id });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND" || msg === "SERVICE_NOT_FOUND"
        ? 404
        : msg === "INVALID_STATUS"
          ? 409
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
    clientId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
    description: z.string().min(1).optional(),
    price: z.number().int().nonnegative().optional(),
    deliveryTime: z.string().min(1).optional(),
    paymentConditionId: z.string().uuid().optional(),
    observations: z.string().nullable().optional(),
    subscriptionItems: z.array(subscriptionItemSchema).optional(),
  }),
  z.object({ action: z.literal("reject"), id: z.string().uuid() }),
  z.object({ action: z.literal("cancel"), id: z.string().uuid() }),
  z.object({
    action: z.literal("authorize"),
    id: z.string().uuid(),
    deliveryDate: z.string().min(1),
    programmerId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("send_pdf"),
    id: z.string().uuid(),
    email: z.string().email().optional(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await request.json());

    if (body.action === "authorize") {
      await requireModule(user, "cotizaciones", "write");
      await requireModule(user, "ordenes_servicio", "write");
      const order = await createServiceOrderFromQuote({
        quoteId: body.id,
        deliveryDate: new Date(body.deliveryDate),
        programmerId: body.programmerId ?? null,
        userId: user.id,
      });
      return NextResponse.json({ order });
    }

    await requireModule(user, "cotizaciones", "write");

    if (body.action === "reject") {
      const quote = await rejectQuote(body.id, user.id);
      return NextResponse.json({ quote });
    }

    if (body.action === "cancel") {
      const quote = await cancelQuote(body.id, user.id, user.role === "administrador");
      return NextResponse.json({ quote });
    }

    if (body.action === "send_pdf") {
      const quote = await getQuoteById(body.id);
      if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const to = body.email ?? quote.clientEmail;
      if (!to) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 409 });
      await sendQuotePdfEmail({ to, folio: quote.folio, clientName: quote.clientName });
      return NextResponse.json({ sent: true });
    }

    const { action: _, id, ...data } = body;
    const quote = await updateQuote({ id, ...data, userId: user.id });
    return NextResponse.json({ quote });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND"
        ? 404
        : msg === "LOCKED" || msg === "INVALID_STATUS" || msg === "OS_EXISTS" || msg === "HAS_OS" || msg === "PROGRAMMER_REQUIRED"
          ? 409
          : msg === "FORBIDDEN"
            ? 403
            : msg === "UNAUTHORIZED"
              ? 401
              : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
