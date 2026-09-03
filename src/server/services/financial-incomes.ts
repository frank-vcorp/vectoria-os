import { getDb } from "@/server/db";
import { catalogIncomeCategories, financialIncomes } from "@/server/db/schema";

export async function createIncomeFromOsPayment(params: {
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  paymentId: string;
  userId?: string;
}) {
  const db = getDb();
  const [category] = await db.select().from(catalogIncomeCategories).limit(1);

  const [income] = await db
    .insert(financialIncomes)
    .values({
      concept: params.concept,
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      incomeDate: params.paymentDate,
      sourceType: "os_payment",
      sourceId: params.paymentId,
      categoryId: category?.id ?? null,
      createdBy: params.userId ?? null,
    })
    .returning({ id: financialIncomes.id });

  return income;
}
