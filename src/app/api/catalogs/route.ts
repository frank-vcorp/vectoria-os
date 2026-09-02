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
} from "@/server/services/catalogs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos");
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
  z.object({
    type: z.literal("service"),
    name: z.string().min(1),
    contractType: z.enum(["por_evento", "suscripcion"]),
    periodicityId: z.string().uuid().nullable().optional(),
    basePrice: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("payment_condition"), name: z.string().min(1), description: z.string().optional() }),
  z.object({ type: z.literal("income"), name: z.string().min(1) }),
  z.object({ type: z.literal("expense"), name: z.string().min(1) }),
  z.object({ type: z.literal("provider"), name: z.string().min(1) }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos");
    const body = createSchema.parse(await request.json());

    let item: unknown;
    switch (body.type) {
      case "periodicity":
        item = await createPeriodicity(body.name, body.intervalMonths);
        break;
      case "service":
        item = await createService(body);
        break;
      case "payment_condition":
        item = await createPaymentCondition(body.name, body.description);
        break;
      case "income":
        item = await createIncomeCategory(body.name);
        break;
      case "expense":
        item = await createExpenseCategory(body.name);
        break;
      case "provider":
        item = await createProvider(body.name);
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
