import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import type { ClientFiscalData, OpportunityStatus, QuoteStatus } from "@/shared/commercial";

// --- Auth & users ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<(typeof import("@/shared/modules").ROLES)[number]>().notNull(),
  status: text("status").$type<"activo" | "inactivo">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roleModulePermissions = pgTable(
  "role_module_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: text("role").notNull(),
    module: text("module").notNull(),
    canRead: boolean("can_read").notNull().default(false),
    canWrite: boolean("can_write").notNull().default(false),
  },
  (t) => [uniqueIndex("role_module_unique").on(t.role, t.module)],
);

// --- Folio counters ---

export const folioCounters = pgTable(
  "folio_counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entity: text("entity").notNull(),
    lastNumber: integer("last_number").notNull().default(0),
  },
  (t) => [uniqueIndex("folio_entity_unique").on(t.entity)],
);

// --- Catálogos ---

export const catalogServices = pgTable("catalog_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contractType: text("contract_type").$type<"por_evento" | "suscripcion">().notNull(),
  periodicityId: uuid("periodicity_id"),
  basePrice: integer("base_price").notNull().default(0),
  status: text("status").$type<"activo" | "inactivo">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogPeriodicities = pgTable("catalog_periodicities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  intervalMonths: integer("interval_months").notNull(),
  status: text("status").$type<"activo" | "cancelado">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogPaymentConditions = pgTable("catalog_payment_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").$type<"activo" | "cancelado">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogIncomeCategories = pgTable("catalog_income_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogExpenseCategories = pgTable("catalog_expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogProviders = pgTable("catalog_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Clientes ---

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  fiscalData: jsonb("fiscal_data").$type<ClientFiscalData | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// --- Oportunidades ---

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => catalogServices.id),
  description: text("description").notNull(),
  status: text("status").$type<OpportunityStatus>().notNull().default("abierta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const opportunityLogEntries = pgTable("opportunity_log_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Cotizaciones (mínimo Fase 2; Fase 3 completa flujo) ---

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => catalogServices.id),
  description: text("description").notNull(),
  contractType: text("contract_type").$type<"por_evento" | "suscripcion">().notNull(),
  periodicityId: uuid("periodicity_id").references(() => catalogPeriodicities.id),
  price: integer("price").notNull().default(0),
  deliveryTime: text("delivery_time").notNull(),
  paymentConditionId: uuid("payment_condition_id").references(() => catalogPaymentConditions.id),
  observations: text("observations"),
  status: text("status").$type<QuoteStatus>().notNull().default("cotizada"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// --- Plan de Desarrollo (importable) ---

export const developmentPlans = pgTable("development_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sourceFileName: text("source_file_name"),
  version: text("version"),
  status: text("status").$type<"activo" | "inactivo">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

export const developmentPlanPhases = pgTable("development_plan_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => developmentPlans.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  includes: text("includes").notNull(),
  validationCriteria: text("validation_criteria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Audit log ---

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").$type<"create" | "update" | "cancel" | "validate">().notNull(),
  userId: uuid("user_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type DevelopmentPlanPhase = typeof developmentPlanPhases.$inferSelect;
