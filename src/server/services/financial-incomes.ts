import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { catalogIncomeCategories, financialIncomes } from "@/server/db/schema";

async function getDefaultIncomeCategoryId() {
  const db = getDb();
  const [category] = await db.select().from(catalogIncomeCategories).limit(1);
  return category?.id ?? null;
}

export async function createIncomeFromOsPayment(params: {
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  paymentId: string;
  userId?: string;
}) {
  const db = getDb();
  const categoryId = await getDefaultIncomeCategoryId();

  const [existing] = await db
    .select({ id: financialIncomes.id })
    .from(financialIncomes)
    .where(and(eq(financialIncomes.sourceType, "os_payment"), eq(financialIncomes.sourceId, params.paymentId)))
    .limit(1);
  if (existing) return existing;

  const [income] = await db
    .insert(financialIncomes)
    .values({
      concept: params.concept,
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      incomeDate: params.paymentDate,
      sourceType: "os_payment",
      sourceId: params.paymentId,
      categoryId,
      createdBy: params.userId ?? null,
    })
    .returning({ id: financialIncomes.id });

  return income;
}

export async function createIncomeFromSubscriptionPayment(params: {
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  paymentId: string;
  categoryId?: string;
  userId?: string;
}) {
  const db = getDb();
  const categoryId = params.categoryId ?? (await getDefaultIncomeCategoryId());

  const [existing] = await db
    .select({ id: financialIncomes.id })
    .from(financialIncomes)
    .where(
      and(eq(financialIncomes.sourceType, "subscription_payment"), eq(financialIncomes.sourceId, params.paymentId)),
    )
    .limit(1);
  if (existing) return existing;

  const [income] = await db
    .insert(financialIncomes)
    .values({
      concept: params.concept,
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      incomeDate: params.paymentDate,
      sourceType: "subscription_payment",
      sourceId: params.paymentId,
      categoryId,
      createdBy: params.userId ?? null,
    })
    .returning({ id: financialIncomes.id });

  return income;
}

export async function createManualIncome(params: {
  concept: string;
  amount: number;
  bankAccountId: string;
  incomeDate: Date;
  categoryId?: string | null;
  userId?: string;
}) {
  const db = getDb();
  const [income] = await db
    .insert(financialIncomes)
    .values({
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      incomeDate: params.incomeDate,
      sourceType: "manual",
      sourceId: crypto.randomUUID(),
      categoryId: params.categoryId ?? null,
      createdBy: params.userId ?? null,
    })
    .returning({ id: financialIncomes.id });

  return income;
}

export async function listFinancialIncomes(filters?: { from?: Date; to?: Date }) {
  const db = getDb();
  const rows = await db.select().from(financialIncomes);
  return rows.filter((r) => {
    if (filters?.from && r.incomeDate < filters.from) return false;
    if (filters?.to && r.incomeDate > filters.to) return false;
    return true;
  });
}
