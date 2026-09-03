CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"seller_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text NOT NULL,
	"contract_type" text NOT NULL,
	"periodicity_id" uuid,
	"price" integer DEFAULT 0 NOT NULL,
	"payment_condition_id" uuid,
	"delivery_date" timestamp with time zone NOT NULL,
	"observations" text,
	"status" text DEFAULT 'creada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "service_orders_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_fiscal" boolean DEFAULT true NOT NULL,
	"initial_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_order_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "financial_incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"income_date" timestamp with time zone NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_periodicity_id_catalog_periodicities_id_fk" FOREIGN KEY ("periodicity_id") REFERENCES "public"."catalog_periodicities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_payment_condition_id_catalog_payment_conditions_id_fk" FOREIGN KEY ("payment_condition_id") REFERENCES "public"."catalog_payment_conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_payments" ADD CONSTRAINT "service_order_payments_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_payments" ADD CONSTRAINT "service_order_payments_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_incomes" ADD CONSTRAINT "financial_incomes_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_incomes" ADD CONSTRAINT "financial_incomes_category_id_catalog_income_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_income_categories"("id") ON DELETE no action ON UPDATE no action;
