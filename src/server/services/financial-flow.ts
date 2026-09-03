import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  bankAccounts,
  catalogIncomeCategories,
  catalogServices,
  clients,
  financialExpenses,
  financialIncomes,
  quotes,
  serviceOrderPayments,
  serviceOrders,
  subscriptionCycles,
  subscriptions,
} from "@/server/db/schema";

export type FinancialMovement = {
  id: string;
  date: Date;
  type: "ingreso" | "egreso";
  concept: string;
  category: string | null;
  bank: string;
  amount: number;
  sourceType: string | null;
  sourceId: string | null;
  reference: string | null;
};

export async function getBankBalances() {
  const db = getDb();
  const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.status, "activa"));

  const balances = await Promise.all(
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

      return {
        id: account.id,
        name: account.name,
        bank: account.bank,
        initialBalance: account.initialBalance,
        balance,
      };
    }),
  );

  return balances;
}

export async function getFinancialMovements(filters?: {
  from?: Date;
  to?: Date;
  type?: "ingreso" | "egreso" | "ambos";
  bankAccountId?: string;
  categoryId?: string;
}) {
  const db = getDb();
  const movements: FinancialMovement[] = [];

  const incomes = await db
    .select({
      id: financialIncomes.id,
      date: financialIncomes.incomeDate,
      concept: financialIncomes.concept,
      amount: financialIncomes.amount,
      sourceType: financialIncomes.sourceType,
      sourceId: financialIncomes.sourceId,
      category: catalogIncomeCategories.name,
      bank: bankAccounts.name,
      categoryId: financialIncomes.categoryId,
      bankAccountId: financialIncomes.bankAccountId,
    })
    .from(financialIncomes)
    .innerJoin(bankAccounts, eq(financialIncomes.bankAccountId, bankAccounts.id))
    .leftJoin(catalogIncomeCategories, eq(financialIncomes.categoryId, catalogIncomeCategories.id));

  for (const row of incomes) {
    movements.push({
      id: row.id,
      date: row.date,
      type: "ingreso",
      concept: row.concept,
      category: row.category,
      bank: row.bank,
      amount: row.amount,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      reference: row.sourceId,
    });
  }

  const expenses = await db
    .select({
      id: financialExpenses.id,
      date: financialExpenses.expenseDate,
      concept: financialExpenses.concept,
      amount: financialExpenses.amount,
      sourceType: financialExpenses.sourceType,
      sourceId: financialExpenses.sourceId,
      category: sql<string | null>`null`,
      bank: bankAccounts.name,
      bankAccountId: financialExpenses.bankAccountId,
    })
    .from(financialExpenses)
    .innerJoin(bankAccounts, eq(financialExpenses.bankAccountId, bankAccounts.id));

  for (const row of expenses) {
    movements.push({
      id: row.id,
      date: row.date,
      type: "egreso",
      concept: row.concept,
      category: row.category,
      bank: row.bank,
      amount: row.amount,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      reference: row.sourceId,
    });
  }

  return movements
    .filter((m) => {
      if (filters?.from && m.date < filters.from) return false;
      if (filters?.to && m.date > filters.to) return false;
      if (filters?.type && filters.type !== "ambos" && m.type !== filters.type) return false;
      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getMonthlyFlow(year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);
  const movements = await getFinancialMovements({ from, to, type: "ambos" });

  const income = movements.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const expense = movements.filter((m) => m.type === "egreso").reduce((s, m) => s + m.amount, 0);

  return { income, expense, net: income - expense, movements };
}

export async function getMonthlySales(year: number, month: number) {
  const db = getDb();
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);

  const authorizedQuotes = await db
    .select({
      folio: quotes.folio,
      price: quotes.price,
      clientName: clients.name,
      serviceName: catalogServices.name,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
    .where(sql`${quotes.status} = 'autorizada' AND ${quotes.createdAt} >= ${from} AND ${quotes.createdAt} <= ${to}`);

  const total = authorizedQuotes.reduce((s, q) => s + q.price, 0);
  return { total, quotes: authorizedQuotes };
}

export async function getAccountsReceivable() {
  const db = getDb();

  const osRows = await db
    .select({
      id: serviceOrders.id,
      folio: serviceOrders.folio,
      clientName: clients.name,
      price: serviceOrders.price,
      totalPaid: sql<number>`coalesce(sum(${serviceOrderPayments.amount}), 0)`,
    })
    .from(serviceOrders)
    .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
    .leftJoin(serviceOrderPayments, eq(serviceOrderPayments.serviceOrderId, serviceOrders.id))
    .where(eq(serviceOrders.status, "creada"))
    .groupBy(serviceOrders.id, serviceOrders.folio, clients.name, serviceOrders.price);

  const osReceivable = osRows
    .map((r) => ({
      type: "os" as const,
      id: r.id,
      folio: r.folio,
      clientName: r.clientName,
      balance: r.price - Number(r.totalPaid),
    }))
    .filter((r) => r.balance > 0);

  const now = new Date();
  const cycleRows = await db
    .select({
      id: subscriptionCycles.id,
      subscriptionId: subscriptions.id,
      folio: subscriptions.folio,
      clientName: clients.name,
      amount: subscriptionCycles.amount,
      paidAmount: subscriptionCycles.paidAmount,
      dueDate: subscriptionCycles.dueDate,
      status: subscriptionCycles.status,
    })
    .from(subscriptionCycles)
    .innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
    .innerJoin(clients, eq(subscriptions.clientId, clients.id))
    .where(sql`${subscriptionCycles.status} != 'pagado'`);

  const subscriptionReceivable = cycleRows
    .filter((c) => c.amount > c.paidAmount && c.dueDate <= now)
    .map((c) => ({
      type: "subscription" as const,
      id: c.subscriptionId,
      cycleId: c.id,
      folio: c.folio,
      clientName: c.clientName,
      balance: c.amount - c.paidAmount,
      dueDate: c.dueDate,
    }));

  return {
    os: osReceivable,
    subscriptions: subscriptionReceivable,
    totalOs: osReceivable.reduce((s, r) => s + r.balance, 0),
    totalSubscriptions: subscriptionReceivable.reduce((s, r) => s + r.balance, 0),
  };
}
