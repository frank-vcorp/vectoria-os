import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  SUBSCRIPTION_BILLING_STATUSES,
  SUBSCRIPTION_SERVICE_STATUSES,
} from "@/shared/commercial";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";
import {
  activateSubscription,
  activateAllPendingSubscriptions,
  addSubscriptionPayment,
  createSubscriptionFromServiceOrder,
  getSubscriptionById,
  getSubscriptionFinancialSummary,
  listSubscriptionCycles,
  listSubscriptionPayments,
  listSubscriptions,
  listSubscriptionsByServiceOrder,
  updateSubscriptionStatus,
} from "@/server/services/subscriptions";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "suscripciones", "read");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const serviceOrderId = searchParams.get("serviceOrderId");
    const q = searchParams.get("q") ?? undefined;
    const view = searchParams.get("view") ?? undefined;

    if (id) {
      const subscription = await getSubscriptionById(id);
      if (!subscription) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const [cycles, payments, summary] = await Promise.all([
        listSubscriptionCycles(id),
        listSubscriptionPayments(id),
        getSubscriptionFinancialSummary(id),
      ]);
      return NextResponse.json({ subscription, cycles, payments, summary });
    }

    if (serviceOrderId) {
      const subscriptions = await listSubscriptionsByServiceOrder(serviceOrderId);
      return NextResponse.json({ subscriptions });
    }

    const subscriptions = await listSubscriptions({ q, view });
    return NextResponse.json({ subscriptions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.object({
  serviceOrderId: z.string().uuid(),
  subscriptionTemplateId: z.string().uuid(),
  description: z.string().min(1),
  price: z.number().int().nonnegative(),
  periodicityId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "suscripciones", "write");
    const body = postSchema.parse(await request.json());
    const subscription = await createSubscriptionFromServiceOrder({ ...body, userId: user.id });
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"), id: z.string().uuid() }),
  z.object({ action: z.literal("activate_all"), serviceOrderId: z.string().uuid() }),
  z.object({
    action: z.literal("update_status"),
    id: z.string().uuid(),
    serviceStatus: z.enum(SUBSCRIPTION_SERVICE_STATUSES).optional(),
    billingStatus: z.enum(SUBSCRIPTION_BILLING_STATUSES).optional(),
    autoInvoice: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("payment"),
    id: z.string().uuid(),
    concept: z.string().min(1),
    amount: z.number().int().positive(),
    bankAccountId: z.string().uuid().optional(),
    paymentDate: z.string().min(1),
    isConvenio: z.boolean().optional(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "suscripciones", "write");
    const body = patchSchema.parse(await request.json());

    if (body.action === "activate") {
      await activateSubscription({ id: body.id, userId: user.id });
      const subscription = await getSubscriptionById(body.id);
      const cycles = await listSubscriptionCycles(body.id);
      return NextResponse.json({ subscription, cycles });
    }

    if (body.action === "activate_all") {
      const results = await activateAllPendingSubscriptions({
        serviceOrderId: body.serviceOrderId,
        userId: user.id,
      });
      const subscriptions = await listSubscriptionsByServiceOrder(body.serviceOrderId);
      return NextResponse.json({ results, subscriptions });
    }

    if (body.action === "update_status") {
      const subscription = await updateSubscriptionStatus({
        id: body.id,
        serviceStatus: body.serviceStatus,
        billingStatus: body.billingStatus,
        autoInvoice: body.autoInvoice,
        userId: user.id,
      });
      return NextResponse.json({ subscription });
    }

    const bankAccountId = body.bankAccountId ?? (await ensureDefaultBankAccount());
    const payment = await addSubscriptionPayment({
      subscriptionId: body.id,
      concept: body.concept,
      amount: body.amount,
      bankAccountId,
      paymentDate: new Date(body.paymentDate),
      isConvenio: body.isConvenio,
      userId: user.id,
    });
    const [cycles, payments] = await Promise.all([
      listSubscriptionCycles(body.id),
      listSubscriptionPayments(body.id),
    ]);
    return NextResponse.json({ payment, cycles, payments });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "NOT_FOUND" ? 404 : msg === "INVALID_STATUS" || msg === "INVALID_TRANSITION" || msg === "INVALID_BILLING_STATUS" || msg === "PAYMENT_EXCEEDS_BALANCE" || msg === "FISCAL_INCOMPLETE" || msg === "EMAIL_REQUIRED" ? 409 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
