import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";
import {
  addAccountPayablePayment,
  createAccountPayable,
  getAccountPayableById,
  getAccountsPayableSummary,
  listAccountPayablePayments,
  listAccountsPayable,
} from "@/server/services/accounts-payable";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cuentas_pagar", "read");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const payable = await getAccountPayableById(id);
      if (!payable) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const payments = await listAccountPayablePayments(id);
      return NextResponse.json({ payable, payments });
    }

    const [payables, summary] = await Promise.all([listAccountsPayable(), getAccountsPayableSummary()]);
    return NextResponse.json({ payables, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.object({
  providerId: z.string().uuid().nullable().optional(),
  concept: z.string().min(1),
  categoryId: z.string().uuid().nullable().optional(),
  amount: z.number().int().positive(),
  dueDate: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cuentas_pagar", "write");
    const body = postSchema.parse(await request.json());
    const payable = await createAccountPayable({
      ...body,
      providerId: body.providerId ?? null,
      categoryId: body.categoryId ?? null,
      dueDate: new Date(body.dueDate),
      userId: user.id,
    });
    return NextResponse.json({ payable }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.object({
  action: z.literal("payment"),
  id: z.string().uuid(),
  concept: z.string().min(1),
  amount: z.number().int().positive(),
  bankAccountId: z.string().uuid().optional(),
  paymentDate: z.string().min(1),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cuentas_pagar", "write");
    const body = patchSchema.parse(await request.json());
    const bankAccountId = body.bankAccountId ?? (await ensureDefaultBankAccount());
    const payment = await addAccountPayablePayment({
      accountPayableId: body.id,
      concept: body.concept,
      amount: body.amount,
      bankAccountId,
      paymentDate: new Date(body.paymentDate),
      userId: user.id,
    });
    const payable = await getAccountPayableById(body.id);
    const payments = await listAccountPayablePayments(body.id);
    return NextResponse.json({ payment, payable, payments });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
