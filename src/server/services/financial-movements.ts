import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  bankAccounts,
  catalogExpenseCategories,
  catalogIncomeCategories,
  financialExpenses,
  financialIncomes,
} from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export class MovementMutationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type LocatedMovement =
  | { kind: "income"; row: typeof financialIncomes.$inferSelect }
  | { kind: "expense"; row: typeof financialExpenses.$inferSelect };

function assertManual(sourceType: string | null) {
  if (sourceType && sourceType !== "manual") {
    throw new MovementMutationError(
      "Este movimiento proviene de un pago y solo se corrige desde su registro de origen.",
      409,
    );
  }
}

async function locateMovement(id: string): Promise<LocatedMovement | null> {
  const db = getDb();
  const [income] = await db.select().from(financialIncomes).where(eq(financialIncomes.id, id)).limit(1);
  if (income) return { kind: "income", row: income };
  const [expense] = await db.select().from(financialExpenses).where(eq(financialExpenses.id, id)).limit(1);
  if (expense) return { kind: "expense", row: expense };
  return null;
}

async function assertBankAccount(bankAccountId: string) {
  const db = getDb();
  const [account] = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);
  if (!account) throw new MovementMutationError("Cuenta inválida", 400);
}

async function assertCategory(type: "income" | "expense", categoryId: string | null) {
  if (!categoryId) return;
  const db = getDb();
  if (type === "income") {
    const [row] = await db
      .select({ id: catalogIncomeCategories.id })
      .from(catalogIncomeCategories)
      .where(eq(catalogIncomeCategories.id, categoryId))
      .limit(1);
    if (!row) throw new MovementMutationError("Categoría inválida", 400);
    return;
  }
  const [row] = await db
    .select({ id: catalogExpenseCategories.id })
    .from(catalogExpenseCategories)
    .where(eq(catalogExpenseCategories.id, categoryId))
    .limit(1);
  if (!row) throw new MovementMutationError("Categoría inválida", 400);
}

export async function updateManualMovement(params: {
  id: string;
  type: "income" | "expense";
  concept: string;
  amount: number;
  bankAccountId: string;
  date: string;
  categoryId?: string | null;
  userId?: string;
}) {
  const located = await locateMovement(params.id);
  if (!located) throw new MovementMutationError("Movimiento no encontrado", 404);
  assertManual(located.row.sourceType);

  const concept = params.concept.trim();
  if (!concept) throw new MovementMutationError("Datos inválidos", 400);
  const movementDate = new Date(params.date);
  if (Number.isNaN(movementDate.getTime())) throw new MovementMutationError("Datos inválidos", 400);

  const categoryId = params.categoryId ?? null;
  await assertBankAccount(params.bankAccountId);
  await assertCategory(params.type, categoryId);

  const db = getDb();
  const sameKind =
    (located.kind === "income" && params.type === "income") ||
    (located.kind === "expense" && params.type === "expense");

  if (sameKind && located.kind === "income") {
    const [updated] = await db
      .update(financialIncomes)
      .set({
        concept,
        amount: params.amount,
        bankAccountId: params.bankAccountId,
        incomeDate: movementDate,
        categoryId,
      })
      .where(eq(financialIncomes.id, params.id))
      .returning({ id: financialIncomes.id });
    if (!updated) throw new MovementMutationError("Movimiento no encontrado", 404);
    await writeAudit({
      entity: "financial_income",
      entityId: updated.id,
      action: "update",
      userId: params.userId,
      payload: { amount: params.amount },
    });
    return { id: updated.id, type: "income" as const };
  }

  if (sameKind && located.kind === "expense") {
    const [updated] = await db
      .update(financialExpenses)
      .set({
        concept,
        amount: params.amount,
        bankAccountId: params.bankAccountId,
        expenseDate: movementDate,
        categoryId,
      })
      .where(eq(financialExpenses.id, params.id))
      .returning({ id: financialExpenses.id });
    if (!updated) throw new MovementMutationError("Movimiento no encontrado", 404);
    await writeAudit({
      entity: "financial_expense",
      entityId: updated.id,
      action: "update",
      userId: params.userId,
      payload: { amount: params.amount },
    });
    return { id: updated.id, type: "expense" as const };
  }

  let newId = "";
  await db.transaction(async (tx) => {
    if (located.kind === "income") {
      await tx.delete(financialIncomes).where(eq(financialIncomes.id, params.id));
    } else {
      await tx.delete(financialExpenses).where(eq(financialExpenses.id, params.id));
    }

    if (params.type === "income") {
      const [income] = await tx
        .insert(financialIncomes)
        .values({
          concept,
          amount: params.amount,
          bankAccountId: params.bankAccountId,
          incomeDate: movementDate,
          sourceType: "manual",
          sourceId: crypto.randomUUID(),
          categoryId,
          createdBy: params.userId ?? null,
        })
        .returning({ id: financialIncomes.id });
      newId = income.id;
    } else {
      const [expense] = await tx
        .insert(financialExpenses)
        .values({
          concept,
          amount: params.amount,
          bankAccountId: params.bankAccountId,
          expenseDate: movementDate,
          categoryId,
          sourceType: "manual",
          sourceId: null,
          createdBy: params.userId ?? null,
        })
        .returning({ id: financialExpenses.id });
      newId = expense.id;
    }
  });

  await writeAudit({
    entity: located.kind === "income" ? "financial_income" : "financial_expense",
    entityId: params.id,
    action: "cancel",
    userId: params.userId,
    payload: { replacedBy: newId },
  });
  await writeAudit({
    entity: params.type === "income" ? "financial_income" : "financial_expense",
    entityId: newId,
    action: "create",
    userId: params.userId,
    payload: { previousId: params.id, amount: params.amount },
  });

  return { id: newId, type: params.type };
}

export async function deleteManualMovement(params: { id: string; userId?: string }) {
  const located = await locateMovement(params.id);
  if (!located) throw new MovementMutationError("Movimiento no encontrado", 404);
  assertManual(located.row.sourceType);

  const db = getDb();
  if (located.kind === "income") {
    await db.delete(financialIncomes).where(eq(financialIncomes.id, params.id));
    await writeAudit({
      entity: "financial_income",
      entityId: params.id,
      action: "cancel",
      userId: params.userId,
      payload: { amount: located.row.amount },
    });
    return;
  }

  await db.delete(financialExpenses).where(eq(financialExpenses.id, params.id));
  await writeAudit({
    entity: "financial_expense",
    entityId: params.id,
    action: "cancel",
    userId: params.userId,
    payload: { amount: located.row.amount },
  });
}
