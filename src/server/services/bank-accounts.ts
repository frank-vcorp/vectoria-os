import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { bankAccounts } from "@/server/db/schema";

export async function listBankAccounts() {
  const db = getDb();
  return db.select().from(bankAccounts).orderBy(bankAccounts.name);
}

export async function ensureDefaultBankAccount(): Promise<string> {
  const db = getDb();
  const [existing] = await db.select().from(bankAccounts).limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(bankAccounts)
    .values({ name: "Cuenta principal", isFiscal: true, initialBalance: 0 })
    .returning({ id: bankAccounts.id });
  return created.id;
}

export async function getBankAccountById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
  return row ?? null;
}
