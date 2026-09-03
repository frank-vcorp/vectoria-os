import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { bankAccounts, catalogExpenseCategories, financialExpenses } from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export async function createExpense(params: {
  concept: string;
  amount: number;
  bankAccountId: string;
  expenseDate: Date;
  categoryId?: string | null;
  userId?: string;
}) {
  const db = getDb();
  const [expense] = await db
    .insert(financialExpenses)
    .values({
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      expenseDate: params.expenseDate,
      categoryId: params.categoryId ?? null,
      sourceType: "manual",
      sourceId: null,
      createdBy: params.userId ?? null,
    })
    .returning({ id: financialExpenses.id });

  await writeAudit({
    entity: "financial_expense",
    entityId: expense.id,
    action: "create",
    userId: params.userId,
    payload: { amount: params.amount },
  });

  return expense;
}

export async function listExpenses(filters?: { from?: Date; to?: Date }) {
  const db = getDb();
  const rows = await db
    .select({
      id: financialExpenses.id,
      concept: financialExpenses.concept,
      amount: financialExpenses.amount,
      expenseDate: financialExpenses.expenseDate,
      categoryName: catalogExpenseCategories.name,
      bankAccountName: bankAccounts.name,
      sourceType: financialExpenses.sourceType,
    })
    .from(financialExpenses)
    .innerJoin(bankAccounts, eq(financialExpenses.bankAccountId, bankAccounts.id))
    .leftJoin(catalogExpenseCategories, eq(financialExpenses.categoryId, catalogExpenseCategories.id))
    .orderBy(desc(financialExpenses.expenseDate));

  return rows.filter((r) => {
    if (filters?.from && r.expenseDate < filters.from) return false;
    if (filters?.to && r.expenseDate > filters.to) return false;
    return true;
  });
}
