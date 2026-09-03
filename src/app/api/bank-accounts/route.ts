import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule, userCanReadModule } from "@/server/auth/session";
import {
  createBankAccount,
  ensureDefaultBankAccount,
  listActiveBankAccounts,
  listBankAccountsWithBalance,
  updateBankAccount,
} from "@/server/services/bank-accounts";

export async function GET() {
  try {
    const user = await requireUser();
    await ensureDefaultBankAccount();

    if (await userCanReadModule(user, "bancos")) {
      const accounts = await listBankAccountsWithBalance();
      return NextResponse.json({ accounts });
    }

    const canPay =
      (await userCanReadModule(user, "ordenes_servicio")) ||
      (await userCanReadModule(user, "suscripciones")) ||
      (await userCanReadModule(user, "cuentas_pagar")) ||
      (await userCanReadModule(user, "ingresos_egresos"));

    if (!canPay) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const accounts = await listActiveBankAccounts();
    return NextResponse.json({ accounts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.object({
  name: z.string().min(1),
  bank: z.string().optional().nullable(),
  isFiscal: z.boolean(),
  initialBalance: z.number().int(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "bancos", "write");
    const body = postSchema.parse(await request.json());
    const account = await createBankAccount({ ...body, bank: body.bank ?? null, userId: user.id });
    return NextResponse.json({ account }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  bank: z.string().optional().nullable(),
  isFiscal: z.boolean().optional(),
  initialBalance: z.number().int().optional(),
  status: z.enum(["activa", "inactiva"]).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "bancos", "write");
    const body = patchSchema.parse(await request.json());
    const { id, ...data } = body;
    const account = await updateBankAccount({ id, ...data, userId: user.id });
    return NextResponse.json({ account });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
