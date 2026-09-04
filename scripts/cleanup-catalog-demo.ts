import "./load-env";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogPaymentConditions,
  catalogPeriodicities,
  catalogSubscriptionTemplates,
  quoteSubscriptionItems,
  quotes,
  serviceOrders,
} from "@/server/db/schema";

const DEMO_PAYMENT_NAMES = ["50% anticipo / 50% entrega", "100% anticipo"];
const DEMO_PERIODICITY_NAMES = ["Mensual", "Bimestral", "Trimestral", "Semestral", "Anual"];
const DEMO_SUBSCRIPTION_NAMES = ["Soporte mensual", "Hosting y mantenimiento"];

function normName(name: string) {
  return name.trim().toLowerCase();
}

async function dedupePaymentConditions() {
  const db = getDb();
  const rows = await db
    .select()
    .from(catalogPaymentConditions)
    .orderBy(catalogPaymentConditions.createdAt);

  const keepByName = new Map<string, string>();
  const removeIds: string[] = [];

  for (const row of rows) {
    const key = normName(row.name);
    const keepId = keepByName.get(key);
    if (!keepId) {
      keepByName.set(key, row.id);
      continue;
    }
    removeIds.push(row.id);
    await db.update(quotes).set({ paymentConditionId: keepId }).where(eq(quotes.paymentConditionId, row.id));
    await db
      .update(serviceOrders)
      .set({ paymentConditionId: keepId })
      .where(eq(serviceOrders.paymentConditionId, row.id));
  }

  if (removeIds.length > 0) {
    await db.delete(catalogPaymentConditions).where(inArray(catalogPaymentConditions.id, removeIds));
  }

  console.log(`Condiciones de pago: ${removeIds.length} duplicados eliminados`);
}

async function dedupePeriodicities() {
  const db = getDb();
  const rows = await db
    .select()
    .from(catalogPeriodicities)
    .orderBy(catalogPeriodicities.createdAt);

  const keepByKey = new Map<string, string>();
  const removeIds: string[] = [];

  for (const row of rows) {
    const key = `${normName(row.name)}:${row.intervalMonths}`;
    const keepId = keepByKey.get(key);
    if (!keepId) {
      keepByKey.set(key, row.id);
      continue;
    }
    removeIds.push(row.id);
    await db.update(serviceOrders).set({ periodicityId: keepId }).where(eq(serviceOrders.periodicityId, row.id));
    await db
      .update(quoteSubscriptionItems)
      .set({ periodicityId: keepId })
      .where(eq(quoteSubscriptionItems.periodicityId, row.id));
  }

  if (removeIds.length > 0) {
    await db.delete(catalogPeriodicities).where(inArray(catalogPeriodicities.id, removeIds));
  }

  console.log(`Periodicidades: ${removeIds.length} duplicados eliminados`);
}

async function removeDemoPaymentConditions() {
  const db = getDb();
  const rows = await db
    .select({ id: catalogPaymentConditions.id })
    .from(catalogPaymentConditions)
    .where(inArray(catalogPaymentConditions.name, DEMO_PAYMENT_NAMES));

  if (rows.length === 0) {
    console.log("Condiciones de pago demo: ninguna");
    return;
  }

  const ids = rows.map((r) => r.id);
  await db.update(quotes).set({ paymentConditionId: null }).where(inArray(quotes.paymentConditionId, ids));
  await db
    .update(serviceOrders)
    .set({ paymentConditionId: null })
    .where(inArray(serviceOrders.paymentConditionId, ids));
  await db.delete(catalogPaymentConditions).where(inArray(catalogPaymentConditions.id, ids));
  console.log(`Condiciones de pago demo: ${ids.length} eliminadas`);
}

async function removeDemoSubscriptions() {
  const db = getDb();
  const rows = await db
    .select({ id: catalogSubscriptionTemplates.id })
    .from(catalogSubscriptionTemplates)
    .where(inArray(catalogSubscriptionTemplates.name, DEMO_SUBSCRIPTION_NAMES));

  if (rows.length === 0) {
    console.log("Suscripciones demo: ninguna");
    return;
  }

  const ids = rows.map((r) => r.id);
  await db.delete(catalogSubscriptionTemplates).where(inArray(catalogSubscriptionTemplates.id, ids));
  console.log(`Suscripciones demo: ${ids.length} eliminadas`);
}

async function removeDemoPeriodicities() {
  const db = getDb();
  const rows = await db
    .select({ id: catalogPeriodicities.id })
    .from(catalogPeriodicities)
    .where(inArray(catalogPeriodicities.name, DEMO_PERIODICITY_NAMES));

  if (rows.length === 0) {
    console.log("Periodicidades demo: ninguna");
    return;
  }

  const ids = rows.map((r) => r.id);
  await db.update(serviceOrders).set({ periodicityId: null }).where(inArray(serviceOrders.periodicityId, ids));
  await db.delete(catalogPeriodicities).where(inArray(catalogPeriodicities.id, ids));
  console.log(`Periodicidades demo: ${ids.length} eliminadas`);
}

async function main() {
  await dedupePaymentConditions();
  await dedupePeriodicities();
  await removeDemoSubscriptions();
  await removeDemoPaymentConditions();
  await removeDemoPeriodicities();
  console.log("Limpieza de catálogo demo completada");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
