import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

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
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type DevelopmentPlanPhase = typeof developmentPlanPhases.$inferSelect;
