import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { SERVICE_ORDER_STATUSES } from "@/shared/commercial";
import { getQuotePrefillFromService } from "@/server/services/quotes";
import {
  addServiceOrderPayment,
  createServiceOrderDirect,
  deleteServiceOrderPayment,
  getServiceOrderById,
  getServiceOrderPaymentSummary,
  listServiceOrderPayments,
  listServiceOrders,
  updateServiceOrderStatus,
  updateServiceOrderDetails,
} from "@/server/services/service-orders";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";
import { listActiveProgrammers } from "@/server/services/users";
import { getProjectByServiceOrderId } from "@/server/services/projects";
import { sendServiceOrderPdfEmail } from "@/server/services/email";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const programmers = searchParams.get("programmers");

    if (programmers === "1") {
      await requireModule(user, "ordenes_servicio", "read");
      const programmersList = await listActiveProgrammers();
      return NextResponse.json({ programmers: programmersList });
    }

    await requireModule(user, "ordenes_servicio", "read");
    const id = searchParams.get("id");
    const search = searchParams.get("search") ?? undefined;
    const paymentsFor = searchParams.get("paymentsFor");

    if (paymentsFor) {
      const [payments, summary] = await Promise.all([
        listServiceOrderPayments(paymentsFor),
        getServiceOrderPaymentSummary(paymentsFor),
      ]);
      return NextResponse.json({ payments, summary });
    }

    if (id) {
      const order = await getServiceOrderById(id);
      if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const [summary, project] = await Promise.all([
        getServiceOrderPaymentSummary(id),
        getProjectByServiceOrderId(id),
      ]);
      return NextResponse.json({ order, summary, project });
    }

    const orders = await listServiceOrders(user.role === "programador" ? user.id : undefined, search);
    return NextResponse.json({ orders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.object({
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  description: z.string().min(1),
  contractType: z.enum(["por_evento", "suscripcion"]),
  periodicityId: z.string().uuid().nullable().optional(),
  price: z.number().int().nonnegative(),
  paymentConditionId: z.string().uuid().optional().nullable(),
  deliveryDate: z.string().min(1),
  observations: z.string().optional().nullable(),
  programmerId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "ordenes_servicio", "write");
    const body = createSchema.parse(await request.json());
    const order = await createServiceOrderDirect({
      ...body,
      paymentConditionId: body.paymentConditionId ?? null,
      sellerId: user.id,
      deliveryDate: new Date(body.deliveryDate),
      userId: user.id,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "PERIODICITY_REQUIRED" || msg === "PROGRAMMER_REQUIRED"
        ? 409
        : msg === "UNAUTHORIZED"
          ? 401
          : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    id: z.string().uuid(),
    status: z.enum(SERVICE_ORDER_STATUSES),
  }),
  z.object({
    action: z.literal("payment"),
    id: z.string().uuid(),
    amount: z.number().int().positive(),
    bankAccountId: z.string().uuid().optional(),
    paymentDate: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete_payment"),
    id: z.string().uuid(),
    paymentId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("prefill_service"),
    serviceId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("send_pdf"),
    id: z.string().uuid(),
    email: z.string().email().optional(),
  }),
  z.object({
    action: z.literal("update_details"),
    id: z.string().uuid(),
    programmerId: z.string().uuid(),
    deliveryDate: z.string().min(1),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await request.json());

    if (body.action === "prefill_service") {
      await requireModule(user, "ordenes_servicio", "read");
      const prefill = await getQuotePrefillFromService(body.serviceId);
      return NextResponse.json(prefill);
    }

    await requireModule(user, "ordenes_servicio", "write");

    if (body.action === "payment") {
      const bankAccountId = body.bankAccountId ?? (await ensureDefaultBankAccount());
      const payment = await addServiceOrderPayment({
        serviceOrderId: body.id,
        amount: body.amount,
        bankAccountId,
        paymentDate: new Date(body.paymentDate),
        userId: user.id,
      });
      const summary = await getServiceOrderPaymentSummary(body.id);
      return NextResponse.json({ payment, summary });
    }

    if (body.action === "delete_payment") {
      await deleteServiceOrderPayment({
        serviceOrderId: body.id,
        paymentId: body.paymentId,
        userId: user.id,
      });
      const [payments, summary] = await Promise.all([
        listServiceOrderPayments(body.id),
        getServiceOrderPaymentSummary(body.id),
      ]);
      return NextResponse.json({ payments, summary });
    }

    if (body.action === "send_pdf") {
      const order = await getServiceOrderById(body.id);
      if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const clientEmail = order.clientEmail;
      const to = body.email ?? clientEmail;
      if (!to) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 409 });
      await sendServiceOrderPdfEmail({ to, folio: order.folio, clientName: order.clientName });
      return NextResponse.json({ sent: true });
    }

    if (body.action === "update_details") {
      const order = await updateServiceOrderDetails({
        id: body.id,
        programmerId: body.programmerId,
        deliveryDate: new Date(body.deliveryDate),
        userId: user.id,
      });
      return NextResponse.json({ order });
    }

    const order = await updateServiceOrderStatus({
      id: body.id,
      status: body.status,
      userId: user.id,
      isAdmin: user.role === "administrador",
    });
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND"
        ? 404
        : msg === "INVALID_STATUS" || msg === "FORBIDDEN" || msg === "PAYMENT_EXCEEDS_BALANCE"
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
