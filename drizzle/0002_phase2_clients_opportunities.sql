CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"phone" text,
	"email" text,
	"fiscal_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "clients_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'abierta' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "opportunities_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "opportunity_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"user_id" uuid,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" text NOT NULL,
	"client_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"seller_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text NOT NULL,
	"contract_type" text NOT NULL,
	"periodicity_id" uuid,
	"price" integer DEFAULT 0 NOT NULL,
	"delivery_time" text NOT NULL,
	"payment_condition_id" uuid,
	"observations" text,
	"status" text DEFAULT 'cotizada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "quotes_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_log_entries" ADD CONSTRAINT "opportunity_log_entries_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_log_entries" ADD CONSTRAINT "opportunity_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_periodicity_id_catalog_periodicities_id_fk" FOREIGN KEY ("periodicity_id") REFERENCES "public"."catalog_periodicities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_payment_condition_id_catalog_payment_conditions_id_fk" FOREIGN KEY ("payment_condition_id") REFERENCES "public"."catalog_payment_conditions"("id") ON DELETE no action ON UPDATE no action;
