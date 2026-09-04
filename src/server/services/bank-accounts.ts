import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { bankAccounts, financialExpenses, financialIncomes } from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export async function listBankAccounts() {
  const db = getDb();
  return db.select().from(bankAccounts).orderBy(bankAccounts.name);
}

export async function listBankAccountsWithBalance() {
  const accounts = await listBankAccounts();
  const db = getDb();

  return Promise.all(
    accounts.map(async (account) => {
      const [incomeTotal] = await db
        .select({ total: sql<number>`coalesce(sum(${financialIncomes.amount}), 0)` })
        .from(financialIncomes)
        .where(eq(financialIncomes.bankAccountId, account.id));

      const [expenseTotal] = await db
        .select({ total: sql<number>`coalesce(sum(${financialExpenses.amount}), 0)` })
        .from(financialExpenses)
        .where(eq(financialExpenses.bankAccountId, account.id));

      const balance =
        account.initialBalance + Number(incomeTotal?.total ?? 0) - Number(expenseTotal?.total ?? 0);

      return { ...account, balance };
    }),
  );
}

export async function ensureDefaultBankAccount(): Promise<string> {
  const db = getDb();
  const [existing] = await db.select().from(bankAccounts).limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(bankAccounts)
    .values({ name: "Cuenta principal", isFiscal: true, initialBalance: 0, status: "activa" })
    .returning({ id: bankAccounts.id });
  return created.id;
}

export async function getBankAccountById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
  return row ?? null;
}

export async function listActiveBankAccounts() {
  const db = getDb();
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.status, "activa"))
    .orderBy(bankAccounts.name);
}

export async function createBankAccount(params: {
  name: string;
  isFiscal: boolean;
  initialBalance: number;
  userId?: string;
}) {
  const db = getDb();
  const [account] = await db
    .insert(bankAccounts)
    .values({
      name: params.name.trim(),
      isFiscal: params.isFiscal,
      initialBalance: params.initialBalance,
      status: "activa",
    })
    .returning();

  await writeAudit({
    entity: "bank_account",
    entityId: account.id,
    action: "create",
    userId: params.userId,
    payload: { name: account.name },
  });

  return account;
}

export async function updateBankAccount(params: {
  id: string;
  name?: string;
  isFiscal?: boolean;
  initialBalance?: number;
  status?: "activa" | "inactiva";
  userId?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof bankAccounts.$inferInsert> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.isFiscal !== undefined) updates.isFiscal = params.isFiscal;
  if (params.initialBalance !== undefined) updates.initialBalance = params.initialBalance;
  if (params.status !== undefined) updates.status = params.status;

  const [account] = await db
    .update(bankAccounts)
    .set(updates)
    .where(eq(bankAccounts.id, params.id))
    .returning();

  if (!account) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "bank_account",
    entityId: account.id,
    action: "update",
    userId: params.userId,
    payload: updates,
  });

  return account;
}
