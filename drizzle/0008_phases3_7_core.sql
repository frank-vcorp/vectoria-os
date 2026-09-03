ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "programmer_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_programmer_id_users_id_fk" FOREIGN KEY ("programmer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "bank" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'activa' NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"service_order_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text NOT NULL,
	"programmer_id" uuid,
	"delivery_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'en_progreso' NOT NULL,
	"plan_source_file_name" text,
	"plan_imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_folio_unique" UNIQUE("folio"),
	CONSTRAINT "projects_service_order_id_unique" UNIQUE("service_order_id")
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_programmer_id_users_id_fk" FOREIGN KEY ("programmer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"phase_number" integer NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"includes" text NOT NULL,
	"validation_criteria" text,
	"status" text DEFAULT 'bloqueada' NOT NULL,
	"started_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"validation_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"service_order_id" uuid NOT NULL,
	"subscription_template_id" uuid,
	"description" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"periodicity_id" uuid NOT NULL,
	"income_category_id" uuid,
	"service_status" text DEFAULT 'pendiente_activacion' NOT NULL,
	"billing_status" text DEFAULT 'al_corriente' NOT NULL,
	"auto_invoice" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp with time zone,
	"reactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_folio_unique" UNIQUE("folio")
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscription_template_id_catalog_subscription_templates_id_fk" FOREIGN KEY ("subscription_template_id") REFERENCES "public"."catalog_subscription_templates"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_periodicity_id_catalog_periodicities_id_fk" FOREIGN KEY ("periodicity_id") REFERENCES "public"."catalog_periodicities"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_income_category_id_catalog_income_categories_id_fk" FOREIGN KEY ("income_category_id") REFERENCES "public"."catalog_income_categories"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscription_cycles" ADD CONSTRAINT "subscription_cycles_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"is_convenio" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"expense_date" timestamp with time zone NOT NULL,
	"category_id" uuid,
	"source_type" text,
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "financial_expenses" ADD CONSTRAINT "financial_expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "financial_expenses" ADD CONSTRAINT "financial_expenses_category_id_catalog_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_expense_categories"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts_payable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"provider_id" uuid,
	"concept" text NOT NULL,
	"category_id" uuid,
	"amount" integer NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_payable_folio_unique" UNIQUE("folio")
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_provider_id_catalog_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."catalog_providers"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_category_id_catalog_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_expense_categories"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts_payable_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_payable_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_account_payable_id_accounts_payable_id_fk" FOREIGN KEY ("account_payable_id") REFERENCES "public"."accounts_payable"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"send_status" text DEFAULT 'pendiente' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"source_type" text,
	"source_id" uuid,
	"facturapi_id" text,
	"pdf_url" text,
	"xml_url" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_folio_unique" UNIQUE("folio")
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
