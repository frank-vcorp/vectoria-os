import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { ensureDefaultBankAccount, listBankAccounts } from "@/server/services/bank-accounts";

export async function GET() {
  try {
    const user = await requireUser();
    await requireModule(user, "ordenes_servicio", "read");
    await ensureDefaultBankAccount();
    const accounts = await listBankAccounts();
    return NextResponse.json({ accounts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
