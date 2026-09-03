import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  listPeriodicities,
  listServices,
  listPaymentConditions,
  listIncomeCategories,
  listExpenseCategories,
  listProviders,
  createPeriodicity,
  createService,
  createPaymentCondition,
  createIncomeCategory,
  createExpenseCategory,
  createProvider,
  updatePeriodicity,
  updateService,
  updatePaymentCondition,
  updateIncomeCategory,
  updateExpenseCategory,
  updateProvider,
} from "@/server/services/catalogs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos", "read");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "all";

    const data: Record<string, unknown> = {};
    if (type === "all" || type === "periodicities") data.periodicities = await listPeriodicities();
    if (type === "all" || type === "services") data.services = await listServices();
    if (type === "all" || type === "payment_conditions")
      data.paymentConditions = await listPaymentConditions();
    if (type === "all" || type === "income") data.incomeCategories = await listIncomeCategories();
    if (type === "all" || type === "expense") data.expenseCategories = await listExpenseCategories();
    if (type === "all" || type === "providers") data.providers = await listProviders();

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("periodicity"), name: z.string().min(1), intervalMonths: z.number().int().positive() }),
  z.object({ type: z.literal("service"), name: z.string().min(1) }),
  z.object({ type: z.literal("payment_condition"), name: z.string().min(1) }),
  z.object({ type: z.literal("income"), name: z.string().min(1) }),
  z.object({ type: z.literal("expense"), name: z.string().min(1) }),
  z.object({ type: z.literal("provider"), name: z.string().min(1) }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos", "write");
    const body = createSchema.parse(await request.json());

    let item: unknown;
    switch (body.type) {
      case "periodicity":
        item = await createPeriodicity(body.name, body.intervalMonths, user.id);
        break;
      case "service":
        item = await createService({ name: body.name }, user.id);
        break;
      case "payment_condition":
        item = await createPaymentCondition(body.name, user.id);
        break;
      case "income":
        item = await createIncomeCategory(body.name, user.id);
        break;
      case "expense":
        item = await createExpenseCategory(body.name, user.id);
        break;
      case "provider":
        item = await createProvider(body.name, user.id);
        break;
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const updateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("periodicity"),
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    intervalMonths: z.number().int().positive().optional(),
    status: z.enum(["activo", "cancelado"]).optional(),
  }),
  z.object({
    type: z.literal("service"),
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    status: z.enum(["activo", "inactivo"]).optional(),
  }),
  z.object({
    type: z.literal("payment_condition"),
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    status: z.enum(["activo", "cancelado"]).optional(),
  }),
  z.object({
    type: z.literal("income"),
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  z.object({
    type: z.literal("expense"),
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  z.object({
    type: z.literal("provider"),
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos", "write");
    const body = updateSchema.parse(await request.json());

    let item: unknown;
    switch (body.type) {
      case "periodicity": {
        const { type: _, id, ...data } = body;
        item = await updatePeriodicity(id, data, user.id);
        break;
      }
      case "service": {
        const { type: _, id, ...data } = body;
        item = await updateService(id, data, user.id);
        break;
      }
      case "payment_condition": {
        const { type: _, id, ...data } = body;
        item = await updatePaymentCondition(id, data, user.id);
        break;
      }
      case "income":
        item = await updateIncomeCategory(body.id, body.name, user.id);
        break;
      case "expense":
        item = await updateExpenseCategory(body.id, body.name, user.id);
        break;
      case "provider":
        item = await updateProvider(body.id, body.name, user.id);
        break;
    }

    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
