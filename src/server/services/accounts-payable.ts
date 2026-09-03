import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  accountsPayable,
  accountsPayablePayments,
  bankAccounts,
  catalogExpenseCategories,
  catalogProviders,
  financialExpenses,
} from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";

function derivePayableStatus(amount: number, paidAmount: number, dueDate: Date) {
  if (paidAmount >= amount) return "pagada" as const;
  if (paidAmount > 0) return "parcial" as const;
  if (dueDate < new Date()) return "vencida" as const;
  return "pendiente" as const;
}

export async function createAccountPayable(params: {
  providerId?: string | null;
  concept: string;
  categoryId?: string | null;
  amount: number;
  dueDate: Date;
  userId?: string;
}) {
  const db = getDb();
  const folio = await nextFolio("cuenta_pagar");
  const [row] = await db
    .insert(accountsPayable)
    .values({
      folio,
      providerId: params.providerId ?? null,
      concept: params.concept.trim(),
      categoryId: params.categoryId ?? null,
      amount: params.amount,
      dueDate: params.dueDate,
      status: derivePayableStatus(params.amount, 0, params.dueDate),
    })
    .returning({ id: accountsPayable.id, folio: accountsPayable.folio });

  await writeAudit({
    entity: "account_payable",
    entityId: row.id,
    action: "create",
    userId: params.userId,
    payload: { folio: row.folio, amount: params.amount },
  });

  return row;
}

export async function listAccountsPayable() {
  const db = getDb();
  return db
    .select({
      id: accountsPayable.id,
      folio: accountsPayable.folio,
      providerName: catalogProviders.name,
      concept: accountsPayable.concept,
      categoryName: catalogExpenseCategories.name,
      amount: accountsPayable.amount,
      paidAmount: accountsPayable.paidAmount,
      dueDate: accountsPayable.dueDate,
      status: accountsPayable.status,
      createdAt: accountsPayable.createdAt,
    })
    .from(accountsPayable)
    .leftJoin(catalogProviders, eq(accountsPayable.providerId, catalogProviders.id))
    .leftJoin(catalogExpenseCategories, eq(accountsPayable.categoryId, catalogExpenseCategories.id))
    .orderBy(desc(accountsPayable.createdAt));
}

export async function getAccountPayableById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id)).limit(1);
  return row ?? null;
}

export async function addAccountPayablePayment(params: {
  accountPayableId: string;
  concept: string;
  amount: number;
  bankAccountId: string;
  paymentDate: Date;
  userId?: string;
}) {
  const payable = await getAccountPayableById(params.accountPayableId);
  if (!payable) throw new Error("NOT_FOUND");

  const db = getDb();
  const [payment] = await db
    .insert(accountsPayablePayments)
    .values({
      accountPayableId: params.accountPayableId,
      concept: params.concept.trim(),
      amount: params.amount,
      bankAccountId: params.bankAccountId,
      paymentDate: params.paymentDate,
      createdBy: params.userId ?? null,
    })
    .returning({ id: accountsPayablePayments.id });

  const newPaid = payable.paidAmount + params.amount;
  const status = derivePayableStatus(payable.amount, newPaid, payable.dueDate);

  await db
    .update(accountsPayable)
    .set({ paidAmount: newPaid, status, updatedAt: new Date() })
    .where(eq(accountsPayable.id, params.accountPayableId));

  await db.insert(financialExpenses).values({
    concept: params.concept.trim(),
    amount: params.amount,
    bankAccountId: params.bankAccountId,
    expenseDate: params.paymentDate,
    categoryId: payable.categoryId,
    sourceType: "cxp_payment",
    sourceId: payment.id,
    createdBy: params.userId ?? null,
  });

  await writeAudit({
    entity: "account_payable_payment",
    entityId: payment.id,
    action: "create",
    userId: params.userId,
    payload: { accountPayableId: params.accountPayableId, amount: params.amount },
  });

  return payment;
}

export async function listAccountPayablePayments(accountPayableId: string) {
  const db = getDb();
  return db
    .select({
      id: accountsPayablePayments.id,
      concept: accountsPayablePayments.concept,
      amount: accountsPayablePayments.amount,
      paymentDate: accountsPayablePayments.paymentDate,
      bankAccountName: bankAccounts.name,
    })
    .from(accountsPayablePayments)
    .innerJoin(bankAccounts, eq(accountsPayablePayments.bankAccountId, bankAccounts.id))
    .where(eq(accountsPayablePayments.accountPayableId, accountPayableId))
    .orderBy(desc(accountsPayablePayments.paymentDate));
}

export async function getAccountsPayableSummary() {
  const db = getDb();
  const [totals] = await db
    .select({
      pending: sql<number>`coalesce(sum(${accountsPayable.amount} - ${accountsPayable.paidAmount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(accountsPayable)
    .where(sql`${accountsPayable.status} != 'pagada'`);

  return { pending: Number(totals?.pending ?? 0), openCount: Number(totals?.count ?? 0) };
}
