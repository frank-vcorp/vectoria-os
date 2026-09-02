import { eq, asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  catalogPeriodicities,
  catalogPaymentConditions,
  catalogIncomeCategories,
  catalogExpenseCategories,
  catalogProviders,
} from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export async function listPeriodicities() {
  const db = getDb();
  return db.select().from(catalogPeriodicities).orderBy(asc(catalogPeriodicities.name));
}

export async function listServices() {
  const db = getDb();
  return db.select().from(catalogServices).orderBy(asc(catalogServices.name));
}

export async function listPaymentConditions() {
  const db = getDb();
  return db.select().from(catalogPaymentConditions).orderBy(asc(catalogPaymentConditions.name));
}

export async function listIncomeCategories() {
  const db = getDb();
  return db.select().from(catalogIncomeCategories).orderBy(asc(catalogIncomeCategories.name));
}

export async function listExpenseCategories() {
  const db = getDb();
  return db.select().from(catalogExpenseCategories).orderBy(asc(catalogExpenseCategories.name));
}

export async function listProviders() {
  const db = getDb();
  return db.select().from(catalogProviders).orderBy(asc(catalogProviders.name));
}

export async function createPeriodicity(name: string, intervalMonths: number, userId?: string) {
  const db = getDb();
  const [row] = await db
    .insert(catalogPeriodicities)
    .values({ name, intervalMonths })
    .returning();
  await writeAudit({ entity: "catalog_periodicity", entityId: row.id, action: "create", userId });
  return row;
}

export async function createService(
  params: {
    name: string;
    contractType: "por_evento" | "suscripcion";
    periodicityId?: string | null;
    basePrice: number;
  },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db.insert(catalogServices).values(params).returning();
  await writeAudit({ entity: "catalog_service", entityId: row.id, action: "create", userId });
  return row;
}

export async function createPaymentCondition(name: string, description?: string, userId?: string) {
  const db = getDb();
  const [row] = await db
    .insert(catalogPaymentConditions)
    .values({ name, description: description ?? null })
    .returning();
  await writeAudit({ entity: "catalog_payment_condition", entityId: row.id, action: "create", userId });
  return row;
}

export async function createIncomeCategory(name: string, userId?: string) {
  const db = getDb();
  const [row] = await db.insert(catalogIncomeCategories).values({ name }).returning();
  await writeAudit({ entity: "catalog_income", entityId: row.id, action: "create", userId });
  return row;
}

export async function createExpenseCategory(name: string, userId?: string) {
  const db = getDb();
  const [row] = await db.insert(catalogExpenseCategories).values({ name }).returning();
  await writeAudit({ entity: "catalog_expense", entityId: row.id, action: "create", userId });
  return row;
}

export async function createProvider(name: string, userId?: string) {
  const db = getDb();
  const [row] = await db.insert(catalogProviders).values({ name }).returning();
  await writeAudit({ entity: "catalog_provider", entityId: row.id, action: "create", userId });
  return row;
}

export async function updatePeriodicity(
  id: string,
  data: { name?: string; intervalMonths?: number; status?: "activo" | "cancelado" },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .update(catalogPeriodicities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogPeriodicities.id, id))
    .returning();
  const action = data.status === "cancelado" ? "cancel" : "update";
  await writeAudit({ entity: "catalog_periodicity", entityId: id, action, userId, payload: data });
  return row;
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    contractType?: "por_evento" | "suscripcion";
    periodicityId?: string | null;
    basePrice?: number;
    status?: "activo" | "inactivo";
  },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .update(catalogServices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogServices.id, id))
    .returning();
  const action = data.status === "inactivo" ? "cancel" : "update";
  await writeAudit({ entity: "catalog_service", entityId: id, action, userId, payload: data });
  return row;
}

export async function updatePaymentCondition(
  id: string,
  data: { name?: string; description?: string | null; status?: "activo" | "cancelado" },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .update(catalogPaymentConditions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogPaymentConditions.id, id))
    .returning();
  const action = data.status === "cancelado" ? "cancel" : "update";
  await writeAudit({ entity: "catalog_payment_condition", entityId: id, action, userId, payload: data });
  return row;
}

export async function updateIncomeCategory(id: string, name: string, userId?: string) {
  const db = getDb();
  const [row] = await db
    .update(catalogIncomeCategories)
    .set({ name })
    .where(eq(catalogIncomeCategories.id, id))
    .returning();
  await writeAudit({ entity: "catalog_income", entityId: id, action: "update", userId, payload: { name } });
  return row;
}

export async function updateExpenseCategory(id: string, name: string, userId?: string) {
  const db = getDb();
  const [row] = await db
    .update(catalogExpenseCategories)
    .set({ name })
    .where(eq(catalogExpenseCategories.id, id))
    .returning();
  await writeAudit({ entity: "catalog_expense", entityId: id, action: "update", userId, payload: { name } });
  return row;
}

export async function updateProvider(id: string, name: string, userId?: string) {
  const db = getDb();
  const [row] = await db
    .update(catalogProviders)
    .set({ name })
    .where(eq(catalogProviders.id, id))
    .returning();
  await writeAudit({ entity: "catalog_provider", entityId: id, action: "update", userId, payload: { name } });
  return row;
}
