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

export async function createPeriodicity(name: string, intervalMonths: number) {
  const db = getDb();
  const [row] = await db
    .insert(catalogPeriodicities)
    .values({ name, intervalMonths })
    .returning();
  return row;
}

export async function createService(params: {
  name: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId?: string | null;
  basePrice: number;
}) {
  const db = getDb();
  const [row] = await db.insert(catalogServices).values(params).returning();
  return row;
}

export async function createPaymentCondition(name: string, description?: string) {
  const db = getDb();
  const [row] = await db
    .insert(catalogPaymentConditions)
    .values({ name, description: description ?? null })
    .returning();
  return row;
}

export async function createIncomeCategory(name: string) {
  const db = getDb();
  const [row] = await db.insert(catalogIncomeCategories).values({ name }).returning();
  return row;
}

export async function createExpenseCategory(name: string) {
  const db = getDb();
  const [row] = await db.insert(catalogExpenseCategories).values({ name }).returning();
  return row;
}

export async function createProvider(name: string) {
  const db = getDb();
  const [row] = await db.insert(catalogProviders).values({ name }).returning();
  return row;
}

export async function updateCatalogStatus(
  table: "periodicity" | "service" | "payment_condition",
  id: string,
  status: string,
) {
  const db = getDb();
  if (table === "periodicity") {
    await db.update(catalogPeriodicities).set({ status: status as "activo" | "cancelado", updatedAt: new Date() }).where(eq(catalogPeriodicities.id, id));
  } else if (table === "service") {
    await db.update(catalogServices).set({ status: status as "activo" | "inactivo", updatedAt: new Date() }).where(eq(catalogServices.id, id));
  } else {
    await db.update(catalogPaymentConditions).set({ status: status as "activo" | "cancelado", updatedAt: new Date() }).where(eq(catalogPaymentConditions.id, id));
  }
}

export async function updatePeriodicity(
  id: string,
  data: { name?: string; intervalMonths?: number; status?: "activo" | "cancelado" },
) {
  const db = getDb();
  const [row] = await db
    .update(catalogPeriodicities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogPeriodicities.id, id))
    .returning();
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
) {
  const db = getDb();
  const [row] = await db
    .update(catalogServices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogServices.id, id))
    .returning();
  return row;
}

export async function updatePaymentCondition(
  id: string,
  data: { name?: string; description?: string | null; status?: "activo" | "cancelado" },
) {
  const db = getDb();
  const [row] = await db
    .update(catalogPaymentConditions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(catalogPaymentConditions.id, id))
    .returning();
  return row;
}
