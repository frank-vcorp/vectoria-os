import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  clients,
  opportunities,
  quotes,
  serviceOrders,
} from "@/server/db/schema";
import type { ClientFiscalData } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";

export async function listClients(search?: string) {
  const db = getDb();
  const q = db
    .select({
      id: clients.id,
      folio: clients.folio,
      name: clients.name,
      contact: clients.contact,
      phone: clients.phone,
      email: clients.email,
      fiscalData: clients.fiscalData,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .orderBy(desc(clients.createdAt));

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    return q.where(or(ilike(clients.folio, term), ilike(clients.name, term)));
  }
  return q;
}

export async function getClientById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return row ?? null;
}

export async function createClient(params: {
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  fiscalData?: ClientFiscalData | null;
  userId?: string;
}) {
  const db = getDb();
  const folio = await nextFolio("cliente");

  const [client] = await db
    .insert(clients)
    .values({
      folio,
      name: params.name.trim(),
      contact: params.contact?.trim() || null,
      phone: params.phone?.trim() || null,
      email: params.email?.trim().toLowerCase() || null,
      fiscalData: params.fiscalData ?? null,
      createdBy: params.userId ?? null,
      updatedBy: params.userId ?? null,
    })
    .returning({
      id: clients.id,
      folio: clients.folio,
      name: clients.name,
      contact: clients.contact,
      phone: clients.phone,
      email: clients.email,
      fiscalData: clients.fiscalData,
    });

  await writeAudit({
    entity: "client",
    entityId: client.id,
    action: "create",
    userId: params.userId,
    payload: { folio: client.folio },
  });

  return client;
}

export async function updateClient(params: {
  id: string;
  name?: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  fiscalData?: ClientFiscalData | null;
  userId?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof clients.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: params.userId ?? null,
  };

  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.contact !== undefined) updates.contact = params.contact?.trim() || null;
  if (params.phone !== undefined) updates.phone = params.phone?.trim() || null;
  if (params.email !== undefined) updates.email = params.email?.trim().toLowerCase() || null;
  if (params.fiscalData !== undefined) updates.fiscalData = params.fiscalData;

  const [client] = await db
    .update(clients)
    .set(updates)
    .where(eq(clients.id, params.id))
    .returning({
      id: clients.id,
      folio: clients.folio,
      name: clients.name,
      contact: clients.contact,
      phone: clients.phone,
      email: clients.email,
      fiscalData: clients.fiscalData,
    });

  if (!client) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "client",
    entityId: client.id,
    action: "update",
    userId: params.userId,
  });

  return client;
}

export async function getClientRelatedRecords(clientId: string) {
  const db = getDb();
  const [opps, quotesList, orders] = await Promise.all([
    db
      .select({
        id: opportunities.id,
        folio: opportunities.folio,
        status: opportunities.status,
        serviceName: catalogServices.name,
        createdAt: opportunities.createdAt,
      })
      .from(opportunities)
      .innerJoin(catalogServices, eq(opportunities.serviceId, catalogServices.id))
      .where(eq(opportunities.clientId, clientId))
      .orderBy(desc(opportunities.createdAt)),
    db
      .select({
        id: quotes.id,
        folio: quotes.folio,
        status: quotes.status,
        price: quotes.price,
        serviceName: catalogServices.name,
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
      .where(eq(quotes.clientId, clientId))
      .orderBy(desc(quotes.createdAt)),
    db
      .select({
        id: serviceOrders.id,
        folio: serviceOrders.folio,
        status: serviceOrders.status,
        price: serviceOrders.price,
        createdAt: serviceOrders.createdAt,
      })
      .from(serviceOrders)
      .where(eq(serviceOrders.clientId, clientId))
      .orderBy(desc(serviceOrders.createdAt)),
  ]);
  return { opportunities: opps, quotes: quotesList, serviceOrders: orders };
}

/** Opciones para selectores (carga rápida). */
export async function listClientOptions() {
  const db = getDb();
  return db
    .select({ id: clients.id, folio: clients.folio, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));
}
