import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  ClientFiscalData,
  InvoiceSendStatus,
  InvoiceStatus,
  OpportunityStatus,
  ProjectPhaseStatus,
  ProjectStatus,
  QuoteStatus,
  ServiceOrderStatus,
  SubscriptionBillingStatus,
  SubscriptionCycleStatus,
  SubscriptionServiceStatus,
} from "@/shared/commercial";

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

export const catalogPeriodicities = pgTable("catalog_periodicities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  intervalMonths: integer("interval_months").notNull(),
  status: text("status").$type<"activo" | "cancelado">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogServices = pgTable("catalog_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  basePrice: integer("base_price").notNull().default(0),
  incomeCategoryId: uuid("income_category_id").references(() => catalogIncomeCategories.id),
  generatesProject: boolean("generates_project").notNull().default(false),
  status: text("status").$type<"activo" | "inactivo">().notNull().default("activo"),
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

/** Catálogo de suscripciones / servicios recurrentes (Discovery §16.2). */
export const catalogSubscriptionTemplates = pgTable("catalog_subscription_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: integer("base_price").notNull().default(0),
  periodicityId: uuid("periodicity_id")
    .notNull()
    .references(() => catalogPeriodicities.id),
  incomeCategoryId: uuid("income_category_id").references(() => catalogIncomeCategories.id),
  status: text("status").$type<"activo" | "inactivo">().notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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

export const quoteSubscriptionItems = pgTable("quote_subscription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  subscriptionTemplateId: uuid("subscription_template_id")
    .notNull()
    .references(() => catalogSubscriptionTemplates.id),
  description: text("description").notNull(),
  price: integer("price").notNull().default(0),
  periodicityId: uuid("periodicity_id")
    .notNull()
    .references(() => catalogPeriodicities.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Órdenes de Servicio (Fase 3) ---

export const serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
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
  paymentConditionId: uuid("payment_condition_id").references(() => catalogPaymentConditions.id),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
  observations: text("observations"),
  programmerId: uuid("programmer_id").references(() => users.id),
  status: text("status").$type<ServiceOrderStatus>().notNull().default("creada"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  bank: text("bank"),
  isFiscal: boolean("is_fiscal").notNull().default(true),
  initialBalance: integer("initial_balance").notNull().default(0),
  status: text("status").$type<"activa" | "inactiva">().notNull().default("activa"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceOrderPayments = pgTable("service_order_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceOrderId: uuid("service_order_id")
    .notNull()
    .references(() => serviceOrders.id, { onDelete: "cascade" }),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

/** Ingreso financiero mínimo generado por pago de OS (Fase 3 stub; Fase 5 expande). */
export const financialIncomes = pgTable("financial_incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  incomeDate: timestamp("income_date", { withTimezone: true }).notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  categoryId: uuid("category_id").references(() => catalogIncomeCategories.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

// --- Proyectos (Fase 3) ---

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  serviceOrderId: uuid("service_order_id")
    .notNull()
    .references(() => serviceOrders.id)
    .unique(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => catalogServices.id),
  description: text("description").notNull(),
  programmerId: uuid("programmer_id").references(() => users.id),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
  status: text("status").$type<ProjectStatus>().notNull().default("en_progreso"),
  planSourceFileName: text("plan_source_file_name"),
  planImportedAt: timestamp("plan_imported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectPhases = pgTable("project_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  includes: text("includes").notNull(),
  validationCriteria: text("validation_criteria"),
  status: text("status").$type<ProjectPhaseStatus>().notNull().default("bloqueada"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  validationNotes: text("validation_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Suscripciones operativas (Fase 4) ---

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  serviceOrderId: uuid("service_order_id")
    .notNull()
    .references(() => serviceOrders.id),
  subscriptionTemplateId: uuid("subscription_template_id").references(() => catalogSubscriptionTemplates.id),
  description: text("description").notNull(),
  price: integer("price").notNull().default(0),
  periodicityId: uuid("periodicity_id")
    .notNull()
    .references(() => catalogPeriodicities.id),
  incomeCategoryId: uuid("income_category_id").references(() => catalogIncomeCategories.id),
  serviceStatus: text("service_status").$type<SubscriptionServiceStatus>().notNull().default("pendiente_activacion"),
  billingStatus: text("billing_status").$type<SubscriptionBillingStatus>().notNull().default("al_corriente"),
  autoInvoice: boolean("auto_invoice").notNull().default(false),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  reactivatedAt: timestamp("reactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionCycles = pgTable("subscription_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  amount: integer("amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  status: text("status").$type<SubscriptionCycleStatus>().notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionPayments = pgTable("subscription_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
  isConvenio: boolean("is_convenio").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

// --- Finanzas (Fase 5) ---

export const financialExpenses = pgTable("financial_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  expenseDate: timestamp("expense_date", { withTimezone: true }).notNull(),
  categoryId: uuid("category_id").references(() => catalogExpenseCategories.id),
  sourceType: text("source_type"),
  sourceId: uuid("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

export const accountsPayable = pgTable("accounts_payable", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  providerId: uuid("provider_id").references(() => catalogProviders.id),
  concept: text("concept").notNull(),
  categoryId: uuid("category_id").references(() => catalogExpenseCategories.id),
  amount: integer("amount").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: text("status").$type<"pendiente" | "parcial" | "pagada" | "vencida">().notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountsPayablePayments = pgTable("accounts_payable_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountPayableId: uuid("account_payable_id")
    .notNull()
    .references(() => accountsPayable.id),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

// --- Facturación (Fase 6) ---

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  status: text("status").$type<InvoiceStatus>().notNull().default("borrador"),
  sendStatus: text("send_status").$type<InvoiceSendStatus>().notNull().default("pendiente"),
  subtotal: integer("subtotal").notNull().default(0),
  total: integer("total").notNull().default(0),
  sourceType: text("source_type"),
  sourceId: uuid("source_id"),
  facturapiId: text("facturapi_id"),
  pdfUrl: text("pdf_url"),
  xmlUrl: text("xml_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectPhase = typeof projectPhases.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionCycle = typeof subscriptionCycles.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type DevelopmentPlanPhase = typeof developmentPlanPhases.$inferSelect;
