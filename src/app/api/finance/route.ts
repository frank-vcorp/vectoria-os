import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";
import { createExpense, listExpenses } from "@/server/services/financial-expenses";
import { createManualIncome, listFinancialIncomes } from "@/server/services/financial-incomes";
import {
  getAccountsReceivable,
  getBankBalances,
  getFinancialMovements,
  getMonthlyFlow,
  getMonthlySales,
  summarizeMovements,
} from "@/server/services/financial-flow";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "balances";
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

    if (view === "balances") {
      await requireModule(user, "bancos", "read");
      const balances = await getBankBalances();
      return NextResponse.json({ balances });
    }

    if (view === "movements" || view === "report") {
      await requireModule(user, "reporte_financiero", "read");
      const typeParam = searchParams.get("type") ?? "ambos";
      const bankAccountId = searchParams.get("bankAccountId") ?? undefined;
      const categoryId = searchParams.get("categoryId") ?? undefined;
      const fromParam = searchParams.get("from");
      const toParam = searchParams.get("to");

      let from: Date | undefined;
      let to: Date | undefined;
      if (fromParam && toParam) {
        from = new Date(fromParam);
        to = new Date(toParam);
        to.setHours(23, 59, 59, 999);
      } else {
        from = new Date(year, month - 1, 1);
        to = new Date(year, month, 0, 23, 59, 59, 999);
      }

      const movements = await getFinancialMovements({
        from,
        to,
        type: typeParam === "ingreso" || typeParam === "egreso" ? typeParam : "ambos",
        bankAccountId,
        categoryId,
      });
      const totals = summarizeMovements(movements);
      return NextResponse.json({
        movements: movements.map((m) => ({
          ...m,
          date: m.date.toISOString(),
        })),
        totals,
        year,
        month,
      });
    }

    if (view === "flow") {
      await requireModule(user, "flujo_financiero", "read");
      const flow = await getMonthlyFlow(year, month);
      return NextResponse.json({ flow, year, month });
    }

    if (view === "sales") {
      await requireModule(user, "flujo_financiero", "read");
      const sales = await getMonthlySales(year, month);
      return NextResponse.json({ sales, year, month });
    }

    if (view === "receivable") {
      await requireModule(user, "flujo_financiero", "read");
      const receivable = await getAccountsReceivable();
      return NextResponse.json({ receivable });
    }

    await requireModule(user, "ingresos_egresos", "read");
    const [incomes, expenses] = await Promise.all([listFinancialIncomes(), listExpenses()]);
    return NextResponse.json({ incomes, expenses });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("income"),
    concept: z.string().min(1),
    amount: z.number().int().positive(),
    bankAccountId: z.string().uuid().optional(),
    incomeDate: z.string().min(1),
    categoryId: z.string().uuid().nullable().optional(),
  }),
  z.object({
    type: z.literal("expense"),
    concept: z.string().min(1),
    amount: z.number().int().positive(),
    bankAccountId: z.string().uuid().optional(),
    expenseDate: z.string().min(1),
    categoryId: z.string().uuid().nullable().optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "ingresos_egresos", "write");
    const body = postSchema.parse(await request.json());
    const bankAccountId = body.bankAccountId ?? (await ensureDefaultBankAccount());

    if (body.type === "income") {
      const income = await createManualIncome({
        concept: body.concept,
        amount: body.amount,
        bankAccountId,
        incomeDate: new Date(body.incomeDate),
        categoryId: body.categoryId ?? null,
        userId: user.id,
      });
      return NextResponse.json({ income }, { status: 201 });
    }

    const expense = await createExpense({
      concept: body.concept,
      amount: body.amount,
      bankAccountId,
      expenseDate: new Date(body.expenseDate),
      categoryId: body.categoryId ?? null,
      userId: user.id,
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
