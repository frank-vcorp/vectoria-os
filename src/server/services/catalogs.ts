import { eq, asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  catalogPeriodicities,
  catalogPaymentConditions,
  catalogIncomeCategories,
  catalogExpenseCategories,
  catalogProviders,
  catalogSubscriptionTemplates,
} from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export async function listPeriodicities() {
  const db = getDb();
  return db.select().from(catalogPeriodicities).orderBy(asc(catalogPeriodicities.name));
}

export async function listServices() {
  const db = getDb();
  return db
    .select({
      id: catalogServices.id,
      name: catalogServices.name,
      basePrice: catalogServices.basePrice,
      incomeCategoryId: catalogServices.incomeCategoryId,
      incomeCategoryName: catalogIncomeCategories.name,
      generatesProject: catalogServices.generatesProject,
      status: catalogServices.status,
      createdAt: catalogServices.createdAt,
      updatedAt: catalogServices.updatedAt,
    })
    .from(catalogServices)
    .leftJoin(catalogIncomeCategories, eq(catalogServices.incomeCategoryId, catalogIncomeCategories.id))
    .orderBy(asc(catalogServices.name));
}

export async function listSubscriptionTemplates() {
  const db = getDb();
  return db
    .select({
      id: catalogSubscriptionTemplates.id,
      name: catalogSubscriptionTemplates.name,
      description: catalogSubscriptionTemplates.description,
      basePrice: catalogSubscriptionTemplates.basePrice,
      periodicityId: catalogSubscriptionTemplates.periodicityId,
      periodicityName: catalogPeriodicities.name,
      incomeCategoryId: catalogSubscriptionTemplates.incomeCategoryId,
      incomeCategoryName: catalogIncomeCategories.name,
      status: catalogSubscriptionTemplates.status,
      createdAt: catalogSubscriptionTemplates.createdAt,
      updatedAt: catalogSubscriptionTemplates.updatedAt,
    })
    .from(catalogSubscriptionTemplates)
    .innerJoin(catalogPeriodicities, eq(catalogSubscriptionTemplates.periodicityId, catalogPeriodicities.id))
    .leftJoin(
      catalogIncomeCategories,
      eq(catalogSubscriptionTemplates.incomeCategoryId, catalogIncomeCategories.id),
    )
    .orderBy(asc(catalogSubscriptionTemplates.name));
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
    basePrice: number;
    incomeCategoryId: string;
    generatesProject: boolean;
  },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .insert(catalogServices)
    .values({
      name: params.name,
      basePrice: params.basePrice,
      incomeCategoryId: params.incomeCategoryId,
      generatesProject: params.generatesProject,
    })
    .returning();
  await writeAudit({ entity: "catalog_service", entityId: row.id, action: "create", userId });
  return row;
}

export async function createSubscriptionTemplate(
  params: {
    name: string;
    description?: string | null;
    basePrice: number;
    periodicityId: string;
    incomeCategoryId: string;
  },
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .insert(catalogSubscriptionTemplates)
    .values({
      name: params.name,
      description: params.description?.trim() || null,
      basePrice: params.basePrice,
      periodicityId: params.periodicityId,
      incomeCategoryId: params.incomeCategoryId,
    })
    .returning();
  await writeAudit({ entity: "catalog_subscription_template", entityId: row.id, action: "create", userId });
  return row;
}

export async function createPaymentCondition(
  name: string,
  description?: string | null,
  userId?: string,
) {
  const db = getDb();
  const [row] = await db
    .insert(catalogPaymentConditions)
    .values({ name, description: description?.trim() || null })
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
    basePrice?: number;
    incomeCategoryId?: string;
    generatesProject?: boolean;
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

export async function updateSubscriptionTemplate(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    basePrice?: number;
    periodicityId?: string;
    incomeCategoryId?: string;
    status?: "activo" | "inactivo";
  },
  userId?: string,
) {
  const db = getDb();
  const updates: Partial<typeof catalogSubscriptionTemplates.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.basePrice !== undefined) updates.basePrice = data.basePrice;
  if (data.periodicityId) updates.periodicityId = data.periodicityId;
  if (data.incomeCategoryId) updates.incomeCategoryId = data.incomeCategoryId;
  if (data.status) updates.status = data.status;

  const [row] = await db
    .update(catalogSubscriptionTemplates)
    .set(updates)
    .where(eq(catalogSubscriptionTemplates.id, id))
    .returning();
  const action = data.status === "inactivo" ? "cancel" : "update";
  await writeAudit({
    entity: "catalog_subscription_template",
    entityId: id,
    action,
    userId,
    payload: data,
  });
  return row;
}

export async function updatePaymentCondition(
  id: string,
  data: { name?: string; description?: string | null; status?: "activo" | "cancelado" },
  userId?: string,
) {
  const db = getDb();
  const updates: Partial<typeof catalogPaymentConditions.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.status) updates.status = data.status;

  const [row] = await db
    .update(catalogPaymentConditions)
    .set(updates)
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
